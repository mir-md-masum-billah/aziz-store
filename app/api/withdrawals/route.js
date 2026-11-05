import { connect } from '@/lib/db';
import { Product, Withdrawal } from '@/models';
import { getUser, staff, isAdmin, isId, J, E, H, body } from '@/lib/auth';
import { esc } from '@/lib/prod';
import { deduct, costOf, restore } from '@/lib/stock';

export const GET = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect(); const sp = new URL(req.url).searchParams;
  if (sp.get('names')) {
    const m = new Map();
    (await Withdrawal.distinct('name')).forEach(n => { const k = String(n || '').trim(); if (k && !m.has(k.toLowerCase())) m.set(k.toLowerCase(), k); });
    return J([...m.values()].sort((a, b) => a.localeCompare(b)));
  }
  const f = {};
  if (sp.get('name')) f.name = new RegExp(esc(sp.get('name')), 'i');
  if (['cash', 'product'].includes(sp.get('kind'))) f.kind = sp.get('kind');
  if (sp.get('from') || sp.get('to')) {
    f.date = {};
    if (sp.get('from')) f.date.$gte = new Date(sp.get('from'));
    if (sp.get('to')) { const t = new Date(sp.get('to')); t.setUTCHours(23, 59, 59, 999); f.date.$lte = t; }
  }
  return J(await Withdrawal.find(f).sort('-date -_id').limit(500).select('-allocs'));
});

export const POST = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect(); const b = await body(req);
  const name = String(b.name || '').trim(); if (!name) return E('নাম দিন');
  if (!['cash', 'product'].includes(b.kind)) return E('টাকা নাকি পণ্য — বেছে নিন');
  const w = { name, kind: b.kind, note: String(b.note || '').trim(), date: b.date || new Date() };
  if (b.kind === 'cash') { if (!(+b.amount > 0)) return E('টাকার পরিমাণ দিন'); w.amount = +b.amount; }
  else {
    const p = isId(b.productId) ? await Product.findById(b.productId) : null; const q = +b.qty;
    if (!p || !(q > 0)) return E('পণ্য ও পরিমাণ দিন');
    const allocs = deduct(p, q, 'withdrawn'); if (!allocs) return E('স্টক যথেষ্ট নয়');
    await p.save();
    // খরচ = যে যে ব্যাচ থেকে নেওয়া হলো তাদের আসল কেনা-দামে
    Object.assign(w, { product: p._id, productName: p.name, qty: q, unit: p.unit, allocs, amount: costOf(p, allocs) });
  }
  await Withdrawal.create(w); return J({ ok: 1 });
});

export const PATCH = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect(); const b = await body(req); const s = {};
  if (!isId(b.id)) return E('পাওয়া যায়নি', 404);
  for (const k of ['name', 'note', 'date']) if (b[k] !== undefined) s[k] = b[k];
  if (s.name !== undefined && !String(s.name).trim()) return E('নাম দিন');
  if (b.amount !== undefined && b.kind === 'cash') { if (!(+b.amount > 0)) return E('টাকার পরিমাণ দিন'); s.amount = +b.amount; }
  await Withdrawal.findByIdAndUpdate(b.id, s); return J({ ok: 1 });
});

// মুছলে পণ্য উত্তোলনের স্টক ফেরত আসে (শুধু অ্যাডমিন)
export const DELETE = H(async req => {
  const u = await getUser(); if (!isAdmin(u)) return E('শুধু অ্যাডমিন মুছতে পারবে', 403); await connect();
  const id = new URL(req.url).searchParams.get('id'); if (!isId(id)) return E('পাওয়া যায়নি', 404);
  const w = await Withdrawal.findById(id); if (!w) return E('পাওয়া যায়নি', 404);
  if (w.kind === 'product' && w.product) { const p = await Product.findById(w.product); if (p) { restore(p, w.allocs, w.qty, 'withdrawn'); await p.save(); } }
  await w.deleteOne(); return J({ ok: 1 });
});
