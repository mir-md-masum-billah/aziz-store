import { connect } from '@/lib/db';
import { Product, Sale, User } from '@/models';
import { getUser, staff, isAdmin, isId, J, E, H, body } from '@/lib/auth';
import { deduct, stockOf, costOf, restore } from '@/lib/stock';

export const POST = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect(); const b = await body(req);
  if (!isId(b.buyerId) || !(await User.exists({ _id: b.buyerId, role: 'buyer' }))) return E('ক্রেতা পাওয়া যায়নি');
  if (!Array.isArray(b.items) || !b.items.length) return E('কোনো পণ্য নেই');

  // ১) আগে সব যাচাই — কিছু ভুল থাকলে কোনো স্টক কাটা যাবে না
  const rows = [], need = {};
  for (const i of b.items) {
    const q = +i.qty, pr = +i.price;
    if (!isId(i.productId) || !(q > 0) || !(pr >= 0) || i.price === '') return E('পণ্য/পরিমাণ/দাম ভুল');
    need[i.productId] = (need[i.productId] || 0) + q; rows.push({ id: String(i.productId), q, pr });
  }
  const ps = {};
  for (const id of Object.keys(need)) {
    const p = await Product.findById(id); if (!p) return E('একটি পণ্য পাওয়া যায়নি');
    if (stockOf(p) < need[id]) return E(`${p.name} এর স্টক যথেষ্ট নয় (আছে ${stockOf(p)})`);
    ps[id] = p;
  }
  // ২) তারপর কাটা
  const items = []; let total = 0; const done = [];
  for (const r of rows) {
    const p = ps[r.id]; const allocs = deduct(p, r.q); p.sold += r.q;
    items.push({ product: p._id, name: p.name, image: p.image || '', qty: r.q, unit: p.unit, price: r.pr, cost: costOf(p, allocs), allocs });
    done.push({ p, allocs, q: r.q }); total += r.q * r.pr;
  }
  const paid = Math.max(0, +b.paid || 0);
  if (paid > total) return E('নগদ টাকা মোট দামের চেয়ে বেশি হতে পারে না');
  try {
    for (const p of Object.values(ps)) await p.save();
    const s = await Sale.create({ buyer: b.buyerId, seller: u._id, items, total, paid, dueDate: b.dueDate || null, note: String(b.note || '').trim() });
    return J({ id: s._id });
  } catch (e) { // মাঝপথে ব্যর্থ হলে স্টক আগের অবস্থায়
    for (const d of done) { const p = await Product.findById(d.p._id); if (p) { restore(p, d.allocs, d.q); p.sold = Math.max(0, p.sold - d.q); await p.save(); } }
    throw e;
  }
});

// ভুল বিক্রি মুছলে স্টক ফেরত আসে (শুধু অ্যাডমিন)
export const DELETE = H(async req => {
  const u = await getUser(); if (!isAdmin(u)) return E('শুধু অ্যাডমিন মুছতে পারবে', 403); await connect();
  const id = new URL(req.url).searchParams.get('id'); if (!isId(id)) return E('পাওয়া যায়নি', 404);
  const s = await Sale.findById(id); if (!s) return E('পাওয়া যায়নি', 404);
  for (const i of s.items) {
    const p = await Product.findById(i.product); if (!p) continue;
    restore(p, i.allocs, i.qty); p.sold = Math.max(0, p.sold - i.qty); await p.save();
  }
  await s.deleteOne(); return J({ ok: 1 });
});
