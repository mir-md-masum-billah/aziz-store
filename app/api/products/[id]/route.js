import { connect } from '@/lib/db';
import { Product, Sale, Withdrawal, StockLog } from '@/models';
import { getUser, staff, isAdmin, isId, J, E, H, body } from '@/lib/auth';
import { pub, withLogos, mkBatch, canonCompany } from '@/lib/prod';
import { deduct, stockOf } from '@/lib/stock';

export const GET = H(async (req, { params }) => {
  await connect(); if (!isId(params.id)) return E('পাওয়া যায়নি', 404);
  const u = await getUser(); const p = await Product.findById(params.id); if (!p) return E('পাওয়া যায়নি', 404);
  const [o] = await withLogos([pub(p, staff(u))]);
  if (staff(u)) {
    const [ss, wd, lg] = await Promise.all([
      Sale.find({ 'items.product': p._id }).sort('-date').limit(100).populate('buyer', 'name pageNo'),
      Withdrawal.find({ product: p._id }).sort('-date -_id').limit(100),
      StockLog.find({ product: p._id }).sort('-date -_id').limit(100).select('-allocs'),
    ]);
    o.history = {
      sales: ss.map(s => { const i = s.items.find(x => String(x.product) === String(p._id)); return { date: s.date, buyer: s.buyer?.name, pageNo: s.buyer?.pageNo, qty: i?.qty || 0, price: i?.price || 0 }; }),
      withdrawals: wd, stockLogs: lg,
    };
  }
  return J(o);
});

export const PATCH = H(async (req, { params }) => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect();
  if (!isId(params.id)) return E('পাওয়া যায়নি', 404);
  const b = await body(req); const p = await Product.findById(params.id); if (!p) return E('পণ্য পাওয়া যায়নি', 404);

  if (b.action === 'restock') {
    const bt = mkBatch(b); if (!bt) return E('পরিমাণ দিন');
    p.batches.push(bt); if (+b.sellPrice > 0) p.sellPrice = +b.sellPrice; await p.save(); return J({ ok: 1 });
  }

  // বিক্রি হয়েছে কিন্তু লেখা হয়নি — স্টক কমানো (ইতিহাসে জমা, অ্যাডমিন চাইলে মুছে ফেরত আনতে পারবে)
  if (b.action === 'reduce') {
    const q = +b.qty; if (!(q > 0)) return E('পরিমাণ দিন');
    const allocs = deduct(p, q, 'sold'); if (!allocs) return E('স্টকে এত পণ্য নেই (আছে ' + stockOf(p) + ')');
    p.sold += q; await p.save();
    await StockLog.create({ product: p._id, productName: p.name, company: p.company, qty: q, unit: p.unit, note: b.note || '', date: b.date ? new Date(b.date) : new Date(), allocs, by: u.name });
    return J({ ok: 1 });
  }

  if (b.action === 'recover') {
    const d = p.damages.id(b.damageId); if (!d) return E('ড্যামেজ রেকর্ড পাওয়া যায়নি'); if (d.recovered) return E('এটা আগেই রিকভার করা হয়েছে');
    if (!['money', 'product'].includes(b.kind)) return E('টাকা ফেরত নাকি পণ্য বদল — বেছে নিন');
    if (b.kind === 'money' && !(+b.amount > 0)) return E('টাকার পরিমাণ দিন');
    d.recovered = true; d.recoveredAt = new Date(); d.recoverKind = b.kind; d.recoverAmount = b.kind === 'money' ? +b.amount : 0; d.recoverNote = b.note || '';
    await p.save(); return J({ ok: 1 });
  }

  if (b.action === 'damage') {
    let list;
    if (b.batchId) { const bt = p.batches.id(b.batchId); if (!bt) return E('ব্যাচ নেই'); list = [bt]; }
    else { const k = x => { const e = x.expiry ? +new Date(x.expiry) : 9e15; return e < Date.now() ? e - 1e16 : e; }; list = p.batches.filter(x => x.remaining > 0).sort((x, y) => k(x) - k(y)); }
    const avail = list.reduce((s, x) => s + x.remaining, 0); let want = +b.qty;
    if (!(want > 0)) { if (b.batchId) want = avail; else return E('পরিমাণ দিন'); }
    if (!avail) return E('ড্যামেজ করার মতো স্টক নেই'); if (want > avail) return E('ড্যামেজ পরিমাণ বেশি (সর্বোচ্চ ' + avail + ')');
    if (b.kind === 'অন্যান্য' && !(b.reason || '').trim()) return E('অন্যান্য হলে কারণ লিখুন');
    for (const bt of list) {
      if (want <= 0) break; const q = Math.min(bt.remaining, want); bt.remaining -= q; want -= q;
      p.damages.push({ batchId: bt._id, qty: q, cost: Math.round(q * (bt.buyUnit || 0) * 100) / 100, kind: b.kind || '', date: b.date || new Date(), reason: b.reason || '', compensation: b.compensation, compNote: b.compNote });
    }
    await p.save(); return J({ ok: 1 });
  }

  // সাধারণ তথ্য এডিট
  if (b.sellPrice !== undefined && !(+b.sellPrice >= 0)) return E('বিক্রয় মূল্য সঠিক নয়');
  if (b.name !== undefined && !String(b.name).trim()) return E('পণ্যের নাম দিন');
  if (b.companyLogo !== undefined) await canonCompany(p.company, b.companyLogo);
  for (const k of ['group', 'name', 'srName', 'srPhones', 'dsrName', 'dsrPhones', 'image', 'category', 'unit', 'sellPrice', 'tiers', 'minStock']) if (b[k] !== undefined) p[k] = b[k];
  if (b.company && b.company !== p.company) p.company = await canonCompany(b.company);
  await p.save(); return J({ ok: 1 });
});

// পণ্য মুছে ফেলা ভয়ানক কাজ — শুধু অ্যাডমিন
export const DELETE = H(async (req, { params }) => {
  const u = await getUser(); if (!isAdmin(u)) return E('শুধু অ্যাডমিন পণ্য মুছতে পারবে', 403); await connect();
  if (!isId(params.id)) return E('পাওয়া যায়নি', 404);
  await Product.findByIdAndDelete(params.id); return J({ ok: 1 });
});
