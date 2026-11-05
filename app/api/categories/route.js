import { connect } from '@/lib/db';
import { Product } from '@/models';
import { J, H } from '@/lib/auth';

// ক্যাটাগরির নাম গোপন কিছু নয় — হোম পেজের ফিল্টারেও লাগে, তাই পাবলিক
export const GET = H(async () => {
  await connect();
  const m = new Map();
  (await Product.distinct('category')).filter(Boolean).forEach(n => { const k = String(n).trim(); if (k && !m.has(k.toLowerCase())) m.set(k.toLowerCase(), k); });
  return J([...m.values()].sort((a, b) => a.localeCompare(b)));
});
