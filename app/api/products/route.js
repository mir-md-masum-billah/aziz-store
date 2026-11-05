import { connect } from '@/lib/db';
import { Product } from '@/models';
import { getUser, staff, J, E, H, body } from '@/lib/auth';
import { pub, withLogos, mkBatch, esc, canonCompany } from '@/lib/prod';

export const GET = H(async req => {
  await connect(); const sp = new URL(req.url).searchParams; const u = await getUser();
  const q = sp.get('q')?.trim(); const rx = q ? new RegExp(esc(q), 'i') : null; const cat = sp.get('category')?.trim();
  const f = {}; if (rx) f.$or = [{ name: rx }, { company: rx }, { group: rx }, { category: rx }];
  if (cat) f.category = new RegExp('^' + esc(cat) + '$', 'i');
  let c = Product.find(f);
  c = sp.get('top') ? c.sort('-sold').limit(8) : c.sort('company name').limit(400);
  return J(await withLogos((await c).map(p => pub(p, staff(u)))));
});

export const POST = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect(); const b = await body(req);
  if (!b.company || !b.name) return E('কোম্পানি ও পণ্যের নাম দিন');
  if (!(+b.sellPrice >= 0) || b.sellPrice === '') return E('বিক্রয় মূল্য দিন');
  const batch = mkBatch(b); if (!batch) return E('পরিমাণ দিন');
  const company = await canonCompany(b.company, b.companyLogo); const g = String(b.group || '').trim();
  let p = await Product.findOne({ company, name: new RegExp('^' + esc(b.name) + '$', 'i'), group: g ? new RegExp('^' + esc(g) + '$', 'i') : { $in: ['', null] } });
  const ph = a => (a || []).map(x => String(x).trim()).filter(Boolean);
  const info = { srName: b.srName, srPhones: ph(b.srPhones), dsrName: b.dsrName, dsrPhones: ph(b.dsrPhones) };
  if (p) {
    p.batches.push(batch); if (b.sellPrice) p.sellPrice = +b.sellPrice; if (b.image) p.image = b.image;
    if (info.srName || info.srPhones.length) { p.srName = info.srName; p.srPhones = info.srPhones; }
    if (info.dsrName || info.dsrPhones.length) { p.dsrName = info.dsrName; p.dsrPhones = info.dsrPhones; }
    if (+b.minStock > 0) p.minStock = +b.minStock;
  } else {
    p = new Product({ company, group: g, name: String(b.name).trim(), image: b.image, unit: b.unit || 'pcs', category: String(b.category || '').trim(), sellPrice: +b.sellPrice, minStock: Math.max(0, +b.minStock || 0), ...info, batches: [batch] });
  }
  await p.save(); return J({ id: p._id, merged: !!p.createdAt && Date.now() - +p.createdAt > 2000 });
});
