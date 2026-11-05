import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connect } from '@/lib/db';
import { User } from '@/models';
import { sign, getUser, J, E, H, body, normPhone, validPhone, limited, ipOf } from '@/lib/auth';

const brief = u => ({ id: u._id, name: u.name, role: u.role, photo: u.photo || '', phone: u.phone, pageNo: u.pageNo || '' });
const withCookie = u => {
  const r = NextResponse.json({ user: brief(u) });
  r.cookies.set('token', sign(u), { httpOnly: true, path: '/', maxAge: 2592000, sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
  return r;
};

export const GET = H(async (req, { params }) => {
  if (params.action !== 'me') return E('?', 404);
  const u = await getUser();
  return J({ user: u ? brief(u) : null });
});

export const POST = H(async (req, { params }) => {
  await connect(); const b = await body(req); const a = params.action;

  if (a === 'logout') { const r = NextResponse.json({ ok: 1 }); r.cookies.set('token', '', { maxAge: 0, path: '/' }); return r; }

  if (a === 'register') {
    if (limited('reg:' + ipOf(req), 10, 3600e3)) return E('অনেকবার চেষ্টা হয়েছে, কিছুক্ষণ পরে আবার করুন', 429);
    const phone = normPhone(b.phone), name = String(b.name || '').trim(), password = String(b.password || '');
    if (!name || !phone || !b.photo) return E('নাম, ফোন নাম্বার ও ছবি দিতে হবে');
    if (!validPhone(phone)) return E('সঠিক মোবাইল নাম্বার দিন (যেমন 01712345678)');
    if (password.length !== 6) return E('পাসওয়ার্ড অবশ্যই ৬ অক্ষরের হতে হবে');
    if (await User.findOne({ phone })) return E('এই ফোন নাম্বার আগেই নিবন্ধিত');
    const u = await User.create({ name, phone, photo: String(b.photo), pageNo: String(b.pageNo || '').trim(), address: String(b.address || '').trim(), role: 'buyer', password: await bcrypt.hash(password, 10) });
    return withCookie(u);
  }

  if (a === 'login') {
    const phone = normPhone(b.phone), password = String(b.password || '');
    if (limited('login:' + ipOf(req) + phone, 8, 15 * 60e3)) return E('অনেকবার ভুল হয়েছে, ১৫ মিনিট পরে চেষ্টা করুন', 429);
    let u = await User.findOne({ phone });
    // প্রথমবার: .env-এর ADMIN_PHONE/ADMIN_PASSWORD দিয়ে অ্যাডমিন তৈরি
    if (!u && process.env.ADMIN_PHONE && phone === normPhone(process.env.ADMIN_PHONE) && password === process.env.ADMIN_PASSWORD && !(await User.exists({ role: 'admin' })))
      u = await User.create({ name: 'অ্যাডমিন', phone, role: 'admin', password: await bcrypt.hash(password, 10) });
    if (!u || !(await bcrypt.compare(password, u.password || ''))) return E('ফোন নাম্বার বা পাসওয়ার্ড ভুল', 401);
    return withCookie(u);
  }

  if (a === 'password') {
    const me = await getUser(); if (!me) return E('লগইন করুন', 401);
    const np = String(b.newPassword || '');
    if (np.length !== 6) return E('নতুন পাসওয়ার্ড ৬ অক্ষরের হতে হবে');
    const u = await User.findById(me._id);
    if (!(await bcrypt.compare(String(b.oldPassword || ''), u.password || ''))) return E('পুরনো পাসওয়ার্ড ভুল', 401);
    u.password = await bcrypt.hash(np, 10); await u.save(); return J({ ok: 1 });
  }
  return E('?', 404);
});
