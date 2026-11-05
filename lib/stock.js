// মেয়াদের তারিখের দিনটা পুরো ব্যবহারযোগ্য ধরা হয় (পরের দিন থেকে মেয়াদ শেষ)
export const isExpired = b => !!b.expiry && new Date(b.expiry).getTime() + 864e5 <= Date.now();
export const live = b => b.remaining > 0 && !isExpired(b);
export const stockOf = p => p.batches.filter(live).reduce((s, b) => s + b.remaining, 0);

// কম মেয়াদের ব্যাচ আগে বিক্রি (FEFO)। পর্যাপ্ত স্টক না থাকলে false
export function deduct(p, qty, field = 'sold') {
  if (stockOf(p) < qty) return false;
  let need = qty; const allocs = [];
  const bs = p.batches.filter(live).sort((a, b) => (a.expiry ? +new Date(a.expiry) : 9e15) - (b.expiry ? +new Date(b.expiry) : 9e15));
  for (const b of bs) {
    const t = Math.min(b.remaining, need);
    b.remaining -= t; b[field] = (b[field] || 0) + t; allocs.push({ batchId: b._id, qty: t }); need -= t;
    if (!need) break;
  }
  return allocs;
}

// কোন ব্যাচ থেকে কতটা গেছে তার কেনা-দাম ধরে মোট খরচ
export const costOf = (p, allocs) => Math.round(allocs.reduce((s, a) => s + a.qty * (p.batches.id(a.batchId)?.buyUnit || 0), 0) * 100) / 100;

// ভুল এন্ট্রি মুছলে স্টক ফেরত। allocs না থাকলে (পুরনো ডেটা) সর্বশেষ ব্যাচে ফেরত যায়
export function restore(p, allocs, qty, field = 'sold') {
  if (allocs?.length) {
    for (const a of allocs) { const b = p.batches.id(a.batchId); if (b) { b.remaining += a.qty; b[field] = Math.max(0, (b[field] || 0) - a.qty); } }
  } else if (qty > 0 && p.batches.length) {
    const b = p.batches[p.batches.length - 1]; b.remaining += qty; b[field] = Math.max(0, (b[field] || 0) - qty);
  }
}
