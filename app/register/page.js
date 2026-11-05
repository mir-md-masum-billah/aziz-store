'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, up } from '@/lib/client';
import { I, Thumb } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function Reg() {
  const [f, setF] = useState({ name: '', phone: '', password: '', pageNo: '', address: '', photo: '' }), [up_, setUp] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const s = k => e => setF({ ...f, [k]: e.target.value });
  const pick = async e => {
    const file = e.target.files[0]; if (!file) return; setUp(true); setErr('');
    try { setF({ ...f, photo: await up(file) }); } catch (x) { setErr(x.message); } setUp(false);
  };
  const go = async e => {
    e.preventDefault(); setErr(''); if (!f.photo) return setErr(t("আপনার একটি ছবি দিন"));
    setBusy(true);
    try { await api('/api/auth/register', 'POST', f); location.href = '/dashboard'; } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-md pt-2 sm:pt-8">
      <div className="mb-5 text-center"><h1 className="h1">{t("ক্রেতা হিসেবে রেজিস্টার")}</h1><p className="muted mt-1 text-sm">{t("রেজিস্টার করলে নিজের বাকির হিসাব মোবাইলেই দেখতে পারবেন")}</p></div>
      <form onSubmit={go} className="card space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative"><Thumb src={f.photo} s={72} round />
            {up_ && <div className="absolute inset-0 flex items-center justify-center rounded-full bg-surface/70 text-xs font-semibold">…</div>}
          </div>
          <label className="flex-1"><span className="lbl">{t("আপনার ছবি *")}</span><input type="file" accept="image/*" onChange={pick} /></label>
        </div>
        <div><label className="lbl">{t("আপনার নাম *")}</label><input className="inp" value={f.name} onChange={s('name')} required /></div>
        <div><label className="lbl">{t("ফোন নাম্বার *")}</label><input className="inp" inputMode="tel" placeholder="01XXXXXXXXX" value={f.phone} onChange={s('phone')} required /></div>
        <div><label className="lbl">{t("ঠিকানা (গ্রাম/মহল্লা, থানা)")}</label><input className="inp" value={f.address} onChange={s('address')} /></div>
        <div><label className="lbl">{t("খাতার পেজ নাম্বার (জানা থাকলে)")}</label><input className="inp" value={f.pageNo} onChange={s('pageNo')} /></div>
        <div><label className="lbl">{t("পাসওয়ার্ড (ঠিক ৬ অক্ষর) *")}</label><input className="inp" type="password" maxLength={6} autoComplete="new-password" value={f.password} onChange={s('password')} required /></div>
        {err && <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-danger"><I n="alert" c="w-4 h-4 shrink-0" />{err}</div>}
        <button className="btn w-full !py-3" disabled={busy || up_}>{busy ? t("অপেক্ষা করুন…") : t("রেজিস্টার")}</button>
      </form>
      <p className="muted mt-4 text-center text-sm">{t("আগেই অ্যাকাউন্ট আছে?")} <Link href="/login" className="font-semibold text-accent hover:underline">{t("লগইন করুন")}</Link></p>
    </div>
  );
}
