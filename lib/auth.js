import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { cookies } from 'next/headers';
import { connect } from './db';
import { User } from '@/models';

export const sign = u => jwt.sign({ id: String(u._id) }, process.env.JWT_SECRET, { expiresIn: '30d' });

export async function getUser() {
  try {
    const t = cookies().get('token')?.value;
    if (!t) return null;
    const d = jwt.verify(t, process.env.JWT_SECRET);
    await connect();
    return await User.findById(d.id).select('-password');
  } catch { return null; }
}

export const staff = u => !!u && ['admin', 'seller'].includes(u.role);
export const isAdmin = u => u?.role === 'admin';
export const J = (d, s = 200) => Response.json(d, { status: s });
export const E = (m, s = 400) => Response.json({ error: m }, { status: s });
export const isId = id => mongoose.isValidObjectId(id);

// খারাপ JSON এলেও ক্র্যাশ করবে না
export const body = async req => {
  try { const b = await req.json(); return b && typeof b === 'object' ? b : {}; } catch { return {}; }
};

// প্রতিটি API রুট এটা দিয়ে মুড়ে দিলে অপ্রত্যাশিত এরর হলে সুন্দর বাংলা মেসেজ যায়
export const H = fn => async (req, ctx) => {
  try { return await fn(req, ctx); } catch (e) {
    console.error(e);
    if (e?.code === 11000) return E('এই ফোন নাম্বার আগেই ব্যবহার হয়েছে', 409);
    if (e?.name === 'CastError' || e?.name === 'ValidationError') return E('তথ্য সঠিক নয়');
    return E('সার্ভারে সমস্যা হয়েছে, আবার চেষ্টা করুন', 500);
  }
};

// বাংলা সংখ্যা → ইংরেজি, স্পেস/ড্যাশ বাদ, +880 → 0
const BN = '০১২৩৪৫৬৭৮৯';
export const normPhone = s => String(s ?? '').replace(/[০-৯]/g, d => BN.indexOf(d)).replace(/[\s\-()]/g, '').replace(/^\+?880/, '0');
export const validPhone = p => /^01[3-9]\d{8}$/.test(p);

// সহজ রেট-লিমিট (সার্ভারের মেমোরিতে) — লগইন ও আপলোড অপব্যবহার ঠেকাতে
const hits = global._rl || (global._rl = new Map());
export function limited(key, max, ms) {
  const now = Date.now(); const a = (hits.get(key) || []).filter(t => now - t < ms);
  if (a.length >= max) { hits.set(key, a); return true; }
  a.push(now); hits.set(key, a);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some(t => now - t < ms)) hits.delete(k);
  return false;
}
export const ipOf = req => (req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
