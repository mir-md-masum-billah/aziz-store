import { Company } from '@/models';
import { stockOf, isExpired } from './stock';

export const esc = s => String(s ?? '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const DAY = 864e5;

// পাবলিকে শুধু দাম/স্টক-আছে-কি-না; ব্যাচ, কেনা-দাম, SR/DSR-এর ফোন শুধু স্টাফ দেখবে
export const pub = (p, priv) => {
  const o = p.toObject(); o.stock = stockOf(p);
  if (priv) {
    const bs = p.batches.filter(b => b.remaining > 0);
    o.expiredQty = bs.filter(isExpired).reduce((s, b) => s + b.remaining, 0);
    o.soonQty = bs.filter(b => b.expiry && !isExpired(b) && new Date(b.expiry) - Date.now() < 30 * DAY).reduce((s, b) => s + b.remaining, 0);
    o.stockCost = Math.round(bs.reduce((s, b) => s + b.remaining * (b.buyUnit || 0), 0));
  } else {
    for (const k of ['batches', 'damages', 'adjustments', 'srName', 'srPhones', 'dsrName', 'dsrPhones', 'minStock']) delete o[k];
  }
  return o;
};

export async function withLogos(arr) {
  const cs = await Company.find({ name: { $in: [...new Set(arr.map(p => p.company))] } });
  const m = {}; cs.forEach(c => (m[c.name] = c.logo));
  return arr.map(p => ({ ...p, companyLogo: m[p.company] || '' }));
}

export function mkBatch(b) {
  const base = b.cartons && b.perCarton ? b.cartons * b.perCarton : +b.qty || 0;
  const qty = base + (+b.extra || 0);
  if (!(qty > 0)) return null;
  const buyTotal = Math.max(0, +b.buyTotal || 0);
  return {
    cartons: +b.cartons || 0, perCarton: +b.perCarton || 0, extra: +b.extra || 0, qty, remaining: qty,
    buyTotal, buyUnit: buyTotal / qty,
    purchaseDate: b.purchaseDate || new Date(), mfgDate: b.mfgDate || null, expiry: b.expiry || null,
  };
}

export async function canonCompany(name, logo) {
  let c = await Company.findOne({ name: new RegExp('^' + esc(name) + '$', 'i') });
  if (!c) c = await Company.create({ name: String(name).trim(), logo: logo || '' });
  else if (logo) { c.logo = logo; await c.save(); }
  return c.name;
}
