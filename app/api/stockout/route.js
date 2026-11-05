import { connect } from '@/lib/db';
import { Product, StockLog } from '@/models';
import { getUser, staff, isAdmin, isId, J, E, H, body } from '@/lib/auth';
import { deduct, stockOf, restore } from '@/lib/stock';

// স্টক কমান: যে বিক্রি খাতায় লেখা হয়নি সেগুলো লিখলেই স্টক থেকে কমে যায় + ইতিহাসে জমা হয়
export const GET = H(async () => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect();
  return J(await StockLog.find().sort('-date -createdAt').limit(300).select('-allocs'));
});

export const POST = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect(); const b = await body(req);
  const items = (b.items || []).filter(i => i.productId || i.qty); if (!items.length) return E('কোনো পণ্য দেননি');
  const need = {};
  for (const i of items) { const q = +i.qty; if (!isId(i.productId) || !(q > 0)) return E('প্রতিটি সারিতে পণ্য ও সঠিক পরিমাণ দিন'); need[i.productId] = (need[i.productId] || 0) + q; }
  const ps = {};
  for (const id of Object.keys(need)) {
    const p = await Product.findById(id); if (!p) return E('পণ্য পাওয়া যায়নি');
    if (stockOf(p) < need[id]) return E(`${p.name} এর স্টক যথেষ্ট নয় (আছে ${stockOf(p)})`); ps[id] = p;
  }
  const date = b.date ? new Date(b.date) : new Date(); const logs = [];
  for (const i of items) {
    const p = ps[i.productId]; const q = +i.qty; const allocs = deduct(p, q); p.sold += q;
    logs.push({ product: p._id, productName: p.name, company: p.company, qty: q, unit: p.unit, note: b.note, date, allocs, by: u.name });
  }
  for (const p of Object.values(ps)) await p.save();
  await StockLog.insertMany(logs); return J({ ok: 1, count: logs.length });
});

// ভুল এন্ট্রি মুছলে স্টক আবার ফেরত আসবে (শুধু অ্যাডমিন)
export const DELETE = H(async req => {
  const u = await getUser(); if (!isAdmin(u)) return E('শুধু অ্যাডমিন মুছতে পারবে', 403); await connect();
  const id = new URL(req.url).searchParams.get('id'); if (!isId(id)) return E('পাওয়া যায়নি', 404);
  const l = await StockLog.findById(id); if (!l) return E('পাওয়া যায়নি', 404);
  const p = await Product.findById(l.product);
  if (p) { restore(p, l.allocs, l.qty); p.sold = Math.max(0, p.sold - l.qty); await p.save(); }
  await l.deleteOne(); return J({ ok: 1 });
});
