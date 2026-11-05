import bcrypt from 'bcryptjs';
import { connect } from '@/lib/db';
import { User } from '@/models';
import { getUser, isAdmin, J, E, H, body, normPhone, validPhone } from '@/lib/auth';

export const GET = H(async () => {
  const u = await getUser(); if (!isAdmin(u)) return E('অনুমতি নেই', 403); await connect();
  return J(await User.find().select('-password').sort('-createdAt'));
});

export const POST = H(async req => {
  const u = await getUser(); if (!isAdmin(u)) return E('অনুমতি নেই', 403); await connect(); const b = await body(req);
  const phone = normPhone(b.phone), name = String(b.name || '').trim();
  if (!name || !phone) return E('নাম ও ফোন দিন'); if (!validPhone(phone)) return E('সঠিক মোবাইল নাম্বার দিন (যেমন 01712345678)');
  if (!b.password || String(b.password).length !== 6) return E('পাসওয়ার্ড ৬ অক্ষরের হতে হবে');
  if (!['buyer', 'seller', 'admin'].includes(b.role || 'buyer')) return E('ধরন সঠিক নয়');
  if (await User.findOne({ phone })) return E('ফোন নাম্বার আগেই আছে');
  await User.create({ name, phone, role: b.role || 'buyer', pageNo: String(b.pageNo || '').trim(), photo: b.photo || '', password: await bcrypt.hash(String(b.password), 10) });
  return J({ ok: 1 });
});
