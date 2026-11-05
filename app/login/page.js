'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/client';
import { I } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function Login() {
  const [f, setF] = useState({ phone: '', password: '' }), [show, setShow] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState('');
  const go = async e => {
    e.preventDefault(); setErr(''); setBusy(true);
    try { await api('/api/auth/login', 'POST', f); location.href = '/dashboard'; } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <div className="mx-auto max-w-sm pt-4 sm:pt-12">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-card"><I n="store" c="w-7 h-7" /></div>
        <h1 className="h1">{t("স্বাগতম")}</h1><p className="muted mt-1 text-sm">{t("আপনার অ্যাকাউন্টে লগইন করুন")}</p>
      </div>
      <form onSubmit={go} className="card space-y-4">
        <div><label className="lbl" htmlFor="ph">{t("ফোন নাম্বার")}</label><input id="ph" className="inp" inputMode="tel" autoComplete="username" placeholder="01XXXXXXXXX" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} required /></div>
        <div>
          <label className="lbl" htmlFor="pw">{t("পাসওয়ার্ড (৬ অক্ষর)")}</label>
          <div className="relative">
            <input id="pw" className="inp pr-16" type={show ? 'text' : 'password'} autoComplete="current-password" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} required />
            <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-xs font-semibold text-accent hover:bg-emerald-50">{show ? t("লুকান") : t("দেখান")}</button>
          </div>
        </div>
        {err && <div role="alert" className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-danger"><I n="alert" c="w-4 h-4 shrink-0" />{err}</div>}
        <button className="btn w-full !py-3" disabled={busy}>{busy ? t("অপেক্ষা করুন…") : t("লগইন")}</button>
      </form>
      <p className="muted mt-4 text-center text-sm">{t("নতুন ক্রেতা?")} <Link href="/register" className="font-semibold text-accent hover:underline">{t("রেজিস্টার করুন")}</Link></p>
    </div>
  );
}
