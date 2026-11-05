import { connect } from '@/lib/db';
import { Company, Product } from '@/models';
import { getUser, staff, J, E, H, body } from '@/lib/auth';
import { canonCompany } from '@/lib/prod';

export const GET = H(async () => {
  const u = await getUser(); if (!staff(u)) return J([]); await connect();
  const [cs, names] = await Promise.all([Company.find({}).sort('name'), Product.distinct('company')]);
  const m = new Map(); cs.forEach(c => m.set(c.name.toLowerCase(), { _id: String(c._id), name: c.name, logo: c.logo || '' }));
  names.filter(Boolean).forEach(n => { if (!m.has(n.toLowerCase())) m.set(n.toLowerCase(), { _id: n, name: n, logo: '' }); });
  return J([...m.values()].sort((a, b) => a.name.localeCompare(b.name)));
});

export const POST = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect();
  const b = await body(req); if (!b.name) return E('নাম দিন');
  return J({ name: await canonCompany(b.name, b.logo) });
});
