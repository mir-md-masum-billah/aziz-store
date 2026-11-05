import bcrypt from 'bcryptjs';
import { connect } from '@/lib/db';
import { User, Sale, Payment } from '@/models';
import { getUser, isAdmin, isId, J, E, H, body, normPhone, validPhone } from '@/lib/auth';

export const PATCH = H(async (req, { params }) => {
  const u = await getUser(); if (!isAdmin(u)) return E('অনুমতি নেই', 403); await connect();
  if (!isId(params.id)) return E('পাওয়া যায়নি', 404);
  const b = await body(req); const s = {};
  for (const k of ['name', 'pageNo', 'photo']) if (b[k] !== undefined) s[k] = String(b[k]).trim();
  if (b.phone !== undefined) { s.phone = normPhone(b.phone); if (!validPhone(s.phone)) return E('সঠিক মোবাইল নাম্বার দিন'); }
  if (b.role !== undefined) {
    if (!['buyer', 'seller', 'admin'].includes(b.role)) return E('ধরন সঠিক নয়');
    if (String(u._id) === params.id && b.role !== 'admin') return E('নিজের অ্যাডমিন অধিকার সরানো যাবে না');
    s.role = b.role;
  }
  if (b.password) { if (String(b.password).length !== 6) return E('পাসওয়ার্ড ৬ অক্ষরের হতে হবে'); s.password = await bcrypt.hash(String(b.password), 10); }
  await User.findByIdAndUpdate(params.id, s); return J({ ok: 1 });
});

export const DELETE = H(async (req, { params }) => {
  const u = await getUser(); if (!isAdmin(u)) return E('অনুমতি নেই', 403); await connect();
  if (!isId(params.id)) return E('পাওয়া যায়নি', 404);
  if (String(u._id) === params.id) return E('নিজেকে মুছা যাবে না');
  // বাকির হিসাব আছে এমন ক্রেতাকে ভুলে মুছে ফেললে খাতা হারিয়ে যাবে — আটকানো হলো
  const [hasS, hasP] = await Promise.all([Sale.exists({ buyer: params.id }), Payment.exists({ buyer: params.id })]);
  if ((hasS || hasP) && new URL(req.url).searchParams.get('force') !== '1') return E('এই ক্রেতার লেনদেনের হিসাব আছে। মুছলে হিসাবও হারাবে — নিশ্চিত হলে আবার চেষ্টা করুন', 409);
  await User.findByIdAndDelete(params.id);
  if (hasS || hasP) { await Sale.deleteMany({ buyer: params.id }); await Payment.deleteMany({ buyer: params.id }); }
  return J({ ok: 1 });
});
