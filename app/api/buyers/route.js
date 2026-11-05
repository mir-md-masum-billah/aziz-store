import { connect } from '@/lib/db';
import { User, Sale, Payment } from '@/models';
import { getUser, staff, J, E, H } from '@/lib/auth';
import { esc } from '@/lib/prod';
import { overdue } from '@/lib/ledger';

export const GET = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect();
  const q = new URL(req.url).searchParams.get('q')?.trim();
  const rx = q && new RegExp(esc(q), 'i');
  const bs = await User.find({ role: 'buyer', ...(rx ? { $or: [{ pageNo: rx }, { phone: rx }, { name: rx }, { address: rx }, { shopName: rx }] } : {}) })
    .select('-password -note -nid').limit(500).lean();
  const ids = bs.map(x => x._id);
  const [s, p] = await Promise.all([
    Sale.aggregate([{ $match: { buyer: { $in: ids } } }, { $group: { _id: '$buyer', d: { $sum: { $subtract: ['$total', '$paid'] } }, l: { $max: '$date' } } }]),
    Payment.aggregate([{ $match: { buyer: { $in: ids } } }, { $group: { _id: '$buyer', d: { $sum: '$amount' }, l: { $max: '$date' } } }]),
  ]);
  const m = {}, last = {};
  s.forEach(x => { m[x._id] = (m[x._id] || 0) + x.d; last[x._id] = Math.max(last[x._id] || 0, +x.l); });
  p.forEach(x => { m[x._id] = (m[x._id] || 0) - x.d; last[x._id] = Math.max(last[x._id] || 0, +x.l); });

  // যাদের বাকি আছে, শুধু তাদের মেয়াদোত্তীর্ণ বাকি হিসাব
  const dueIds = ids.filter(i => (m[i] || 0) > 0);
  const od = {};
  if (dueIds.length) {
    const [ds, dp] = await Promise.all([
      Sale.find({ buyer: { $in: dueIds } }).select('buyer total paid date dueDate').lean(),
      Payment.find({ buyer: { $in: dueIds } }).select('buyer amount').lean(),
    ]);
    const gs = {}, gp = {};
    ds.forEach(x => (gs[x.buyer] ||= []).push(x)); dp.forEach(x => (gp[x.buyer] ||= []).push(x));
    dueIds.forEach(i => { od[i] = overdue(gs[i] || [], gp[i] || []); });
  }
  return J(bs.map(x => ({ ...x, due: m[x._id] || 0, lastTx: last[x._id] || 0, overdue: od[x._id]?.amount || 0, overdueSince: od[x._id]?.since || null }))
    .sort((a, b) => (b.lastTx || +new Date(b.createdAt || 0)) - (a.lastTx || +new Date(a.createdAt || 0))));
});
