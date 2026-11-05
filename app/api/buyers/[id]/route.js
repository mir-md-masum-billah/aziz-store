import { connect } from '@/lib/db';
import { User, Sale, Payment, Product } from '@/models';
import { getUser, staff, isId, J, E, H, body, normPhone, validPhone } from '@/lib/auth';
import { dueOf, overdue } from '@/lib/ledger';

const rid = (u, id) => (id === 'me' ? String(u._id) : id);

export const GET = H(async (req, { params }) => {
  const u = await getUser(); if (!u) return E('লগইন করুন', 401);
  const id = rid(u, params.id);
  if (!isId(id)) return E('পাওয়া যায়নি', 404);
  if (!staff(u) && String(u._id) !== id) return E('অনুমতি নেই', 403);
  await connect();
  const b = await User.findById(id).select('-password').lean(); if (!b) return E('পাওয়া যায়নি', 404);
  if (!staff(u)) delete b.note; // দোকানের ব্যক্তিগত নোট ক্রেতা দেখবে না

  let sales = (await Sale.find({ buyer: id }).sort('-date -_id')).map(x => x.toObject());
  // সেল-এর অভ্যন্তরীণ তথ্য (খরচ/ব্যাচ) ক্রেতাকে দেখানো হয় না
  sales.forEach(s => s.items.forEach(i => { delete i.cost; delete i.allocs; }));
  const pids = [...new Set(sales.flatMap(x => x.items.filter(i => !i.image && i.product).map(i => String(i.product))))];
  if (pids.length) {
    const ps = await Product.find({ _id: { $in: pids } }).select('image'); const im = {}; ps.forEach(x => (im[x._id] = x.image));
    sales = sales.map(x => ({ ...x, items: x.items.map(i => ({ ...i, image: i.image || im[i.product] || '' })) }));
  }
  const payments = await Payment.find({ buyer: id }).sort('-date -_id').lean();
  const due = dueOf(sales, payments);
  return J({ buyer: b, sales, payments, due, overdue: due > 0 ? overdue(sales, payments) : { amount: 0, since: null } });
});

export const PATCH = H(async (req, { params }) => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect();
  if (!isId(params.id)) return E('পাওয়া যায়নি', 404);
  const b = await body(req); const s = {};
  for (const k of ['name', 'photo', 'address', 'altPhone', 'shopName', 'pageNo', 'nid', 'guarantorName', 'guarantorPhone', 'note'])
    if (b[k] !== undefined) s[k] = String(b[k]).trim();
  if (b.creditLimit !== undefined) s.creditLimit = Math.max(0, +b.creditLimit || 0);
  if (b.phone !== undefined) { s.phone = normPhone(b.phone); if (!validPhone(s.phone)) return E('সঠিক মোবাইল নাম্বার দিন'); }
  if (s.name === '') return E('নাম খালি রাখা যাবে না');
  const r = await User.findOneAndUpdate({ _id: params.id, role: 'buyer' }, s);
  if (!r) return E('ক্রেতা পাওয়া যায়নি', 404);
  return J({ ok: 1 });
});
