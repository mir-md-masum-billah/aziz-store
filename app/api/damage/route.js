import { connect } from '@/lib/db';
import { Product } from '@/models';
import { getUser, staff, J, E, H } from '@/lib/auth';
import { esc } from '@/lib/prod';
import { isExpired } from '@/lib/stock';

export const GET = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect();
  const q = new URL(req.url).searchParams.get('company')?.trim();
  const rx = q && new RegExp(esc(q), 'i');
  const ps = await Product.find(rx ? { $or: [{ company: rx }, { name: rx }] } : {});
  const expired = [], records = [];
  for (const p of ps) {
    for (const b of p.batches) if (isExpired(b) && b.remaining > 0)
      expired.push({ productId: p._id, name: p.name, company: p.company, unit: p.unit, image: p.image || '', batchId: b._id, remaining: b.remaining, expiry: b.expiry, cost: Math.round(b.remaining * (b.buyUnit || 0)) });
    for (const d of p.damages) if (!d.recovered)
      records.push({ ...d.toObject(), cost: d.cost ?? d.qty * (p.batches.id(d.batchId)?.buyUnit || 0), productId: p._id, name: p.name, company: p.company, unit: p.unit, image: p.image || '' });
  }
  records.sort((a, b) => new Date(b.date) - new Date(a.date) || (String(b._id) < String(a._id) ? -1 : 1));
  return J({ expired, records });
});
