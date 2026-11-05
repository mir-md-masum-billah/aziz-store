'use client';
import { useState } from 'react';
import Link from 'next/link';
import { api, ROLES } from '@/lib/client';
import { useMe, useUI } from '@/components/Providers';
import { I, PageHead, Thumb } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function Account() {
  const { me, ready } = useMe(); const { toast } = useUI();
  const [f, setF] = useState({ oldPassword: '', newPassword: '' }), [busy, setBusy] = useState(false);
  if (!ready) return <div className="skel h-48" />;
  if (!me) return <div className="card text-center">{t("অনুগ্রহ করে")} <Link className="font-semibold text-accent underline" href="/login">{t("লগইন")}</Link>  {t("করুন")}</div>;
  const go = async e => {
    e.preventDefault(); setBusy(true);
    try { await api('/api/auth/password', 'POST', f); toast(t("পাসওয়ার্ড বদলানো হয়েছে")); setF({ oldPassword: '', newPassword: '' }); } catch (x) { toast(x.message, 'err'); }
    setBusy(false);
  };
  const out = async () => { await api('/api/auth/logout', 'POST').catch(() => {}); location.href = '/'; };
  return (
    <div className="mx-auto max-w-lg space-y-4">
      <PageHead title={t("আমার অ্যাকাউন্ট")} />
      <div className="card flex items-center gap-4">
        <Thumb src={me.photo} s={64} round />
        <div className="min-w-0 flex-1"><div className="truncate text-lg font-bold">{me.name}</div><div className="muted">{me.phone} • {ROLES[me.role]}</div></div>
        {me.role === 'buyer' && <Link href="/buyers/me" className="btn btn-sm btn-brand-soft">{t("আমার খাতা")}</Link>}
      </div>
      <form onSubmit={go} className="card space-y-3">
        <h2 className="h2 flex items-center gap-2"><I n="key" c="w-5 h-5 text-accent" />{t("পাসওয়ার্ড বদলান")}</h2>
        <div><label className="lbl">{t("পুরনো পাসওয়ার্ড")}</label><input className="inp" type="password" autoComplete="current-password" value={f.oldPassword} onChange={e => setF({ ...f, oldPassword: e.target.value })} required /></div>
        <div><label className="lbl">{t("নতুন পাসওয়ার্ড (ঠিক ৬ অক্ষর)")}</label><input className="inp" type="password" maxLength={6} autoComplete="new-password" value={f.newPassword} onChange={e => setF({ ...f, newPassword: e.target.value })} required /></div>
        <button className="btn" disabled={busy}>{busy ? t("অপেক্ষা করুন…") : t("পাসওয়ার্ড বদলান")}</button>
      </form>
      <button onClick={out} className="btn btn-danger-soft w-full"><I n="logout" c="w-4 h-4" />{t("লগআউট")}</button>
    </div>
  );
}
