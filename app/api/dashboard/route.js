import { connect } from '@/lib/db';
import { Product, Sale, Payment, Withdrawal, User } from '@/models';
import { getUser, staff, J, E, H } from '@/lib/auth';
import { isExpired } from '@/lib/stock';
import { overdue } from '@/lib/ledger';

const DH = 6 * 3600e3; // বাংলাদেশ UTC+6
const dayStart = t => { const x = new Date(+t + DH); x.setUTCHours(0, 0, 0, 0); return new Date(+x - DH); };
const key = (t, monthly) => new Date(+t + DH).toISOString().slice(0, monthly ? 7 : 10);

export const GET = H(async req => {
  const u = await getUser(); if (!staff(u)) return E('অনুমতি নেই', 403); await connect();
  const range = new URL(req.url).searchParams.get('range') || 'month';
  const now = new Date(), t0 = dayStart(now); let from;
  if (range === 'today') from = t0;
  else if (range === 'week') from = new Date(+t0 - 6 * 864e5);
  else if (range === 'year') { const y = new Date(+now + DH).getUTCFullYear(); from = new Date(Date.UTC(y, 0, 1) - DH); }
  else if (range === 'all') from = new Date(0);
  else { const d = new Date(+now + DH); from = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1) - DH); }
  const inR = { $gte: from, $lte: now };

  const [sales, pays, wds, products, buyersN] = await Promise.all([
    Sale.find({ date: inR }).select('total paid items date').lean(),
    Payment.find({ date: inR }).select('amount date').lean(),
    Withdrawal.find({ date: inR }).select('kind amount').lean(),
    Product.find({}).select('name company unit image minStock batches damages sold').lean(),
    User.countDocuments({ role: 'buyer' }),
  ]);

  // --- রেঞ্জের হিসাব ---
  let revenue = 0, profit = 0, covered = 0, cash = 0;
  const top = {}; const monthly = range === 'year' || range === 'all'; const series = {};
  for (const s of sales) {
    revenue += s.total; cash += s.paid;
    const k = key(s.date, monthly); (series[k] ||= { sales: 0, collected: 0 }).sales += s.total; series[k].collected += s.paid;
    for (const i of s.items) {
      const rev = i.qty * i.price; const t = (top[i.name] ||= { name: i.name, unit: i.unit, qty: 0, revenue: 0 }); t.qty += i.qty; t.revenue += rev;
      if (i.cost != null) { profit += rev - i.cost; covered += rev; }
    }
  }
  const payTotal = pays.reduce((s, x) => s + x.amount, 0);
  for (const p of pays) { const k = key(p.date, monthly); (series[k] ||= { sales: 0, collected: 0 }).collected += p.amount; }
  let dmgLoss = 0;
  for (const p of products) for (const d of p.damages || []) if (!d.recovered && d.date >= from && d.date <= now) dmgLoss += d.cost || 0;
  const wdCash = wds.filter(w => w.kind === 'cash').reduce((s, w) => s + (w.amount || 0), 0);
  const wdProd = wds.filter(w => w.kind === 'product').reduce((s, w) => s + (w.amount || 0), 0);

  // গ্রাফের জন্য ফাঁকা দিনও ভরা
  const chart = [];
  if (!monthly) { for (let t = +dayStart(from); t <= +now; t += 864e5) { const k = key(t, false); chart.push({ k, ...(series[k] || { sales: 0, collected: 0 }) }); } }
  else Object.keys(series).sort().forEach(k => chart.push({ k, ...series[k] }));

  // --- বর্তমান অবস্থা (রেঞ্জ নির্বিশেষে) ---
  let stockCost = 0, expiredValue = 0, expiredCount = 0; const low = [], out = [], soon = [];
  for (const p of products) {
    let stock = 0;
    for (const b of p.batches) {
      if (b.remaining <= 0) continue;
      if (isExpired(b)) { expiredValue += b.remaining * (b.buyUnit || 0); expiredCount++; continue; }
      stock += b.remaining; stockCost += b.remaining * (b.buyUnit || 0);
      if (b.expiry) { const days = Math.ceil((new Date(b.expiry).getTime() + 864e5 - Date.now()) / 864e5); if (days <= 30) soon.push({ _id: p._id, name: p.name, company: p.company, unit: p.unit, qty: b.remaining, days, expiry: b.expiry }); }
    }
    const brief = { _id: p._id, name: p.name, company: p.company, unit: p.unit, image: p.image || '', stock, minStock: p.minStock || 0 };
    if (stock <= 0) { if (p.sold > 0 || p.batches.length) out.push(brief); }
    else if (p.minStock > 0 && stock <= p.minStock) low.push(brief);
  }
  soon.sort((a, b) => a.days - b.days);

  // --- বাকির অবস্থা ---
  const [sAgg, pAgg] = await Promise.all([
    Sale.aggregate([{ $group: { _id: '$buyer', d: { $sum: { $subtract: ['$total', '$paid'] } } } }]),
    Payment.aggregate([{ $group: { _id: '$buyer', d: { $sum: '$amount' } } }]),
  ]);
  const due = {}; sAgg.forEach(x => (due[x._id] = (due[x._id] || 0) + x.d)); pAgg.forEach(x => (due[x._id] = (due[x._id] || 0) - x.d));
  const dueIds = Object.keys(due).filter(i => due[i] > 0); const totalDue = dueIds.reduce((s, i) => s + due[i], 0);
  const names = dueIds.length ? await User.find({ _id: { $in: dueIds } }).select('name phone pageNo photo').lean() : [];
  const nm = {}; names.forEach(x => (nm[x._id] = x));
  const topDue = dueIds.map(i => ({ ...nm[i], _id: i, due: due[i] })).filter(x => x.name).sort((a, b) => b.due - a.due).slice(0, 6);
  let overdueList = [];
  if (dueIds.length) {
    const [ds, dp] = await Promise.all([
      Sale.find({ buyer: { $in: dueIds }, dueDate: { $ne: null } }).select('buyer total paid date dueDate').lean(),
      Payment.find({ buyer: { $in: dueIds } }).select('buyer amount').lean(),
    ]);
    const gb = new Set(ds.map(x => String(x.buyer)));
    if (gb.size) {
      const all = await Sale.find({ buyer: { $in: [...gb] } }).select('buyer total paid date dueDate').lean();
      const gs = {}, gp = {}; all.forEach(x => (gs[x.buyer] ||= []).push(x)); dp.forEach(x => (gp[x.buyer] ||= []).push(x));
      overdueList = [...gb].map(i => ({ ...nm[i], _id: i, ...overdue(gs[i] || [], gp[i] || []) })).filter(x => x.amount > 0 && x.name).sort((a, b) => a.since - b.since);
    }
  }

  return J({
    range: { key: range, from },
    kpi: { count: sales.length, revenue, profit: Math.round(profit), profitCoverage: revenue ? Math.round(covered / revenue * 100) : 100, collected: cash + payTotal, newDue: Math.max(0, revenue - cash), dmgLoss: Math.round(dmgLoss), wdCash, wdProd: Math.round(wdProd) },
    snap: { totalDue, dueBuyers: dueIds.length, buyers: buyersN, products: products.length, stockCost: Math.round(stockCost), expiredValue: Math.round(expiredValue), expiredCount, outCount: out.length, lowCount: low.length },
    chart, topProducts: Object.values(top).sort((a, b) => b.revenue - a.revenue).slice(0, 6),
    topDue, overdue: overdueList.slice(0, 6), overdueCount: overdueList.length, overdueTotal: overdueList.reduce((s, x) => s + x.amount, 0),
    low: low.slice(0, 8), out: out.slice(0, 8), soon: soon.slice(0, 8), soonCount: soon.length,
  });
});
