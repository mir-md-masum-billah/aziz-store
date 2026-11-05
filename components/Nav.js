'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useMe, useUI, useSettings } from '@/components/Providers';
import { api, ROLES } from '@/lib/client';
import { I, Thumb } from '@/components/ui';
import { t } from '@/lib/i18n';

const STAFF = [['/dashboard', 'ড্যাশবোর্ড', 'home'], ['/products', 'পণ্য', 'box'], ['/due', 'বাকির খাতা', 'book'], ['/damage', 'ড্যামেজ', 'alert'], ['/withdrawals', 'উত্তোলন', 'wallet'], ['/stockout', 'স্টক কমান', 'minus']];
const ADMIN = ['/admin/users', 'ইউজার', 'users'];
const BUYER = [['/buyers/me', 'আমার খাতা', 'book'], ['/', 'দোকান', 'store']];

export default function Nav() {
  const { me, ready } = useMe(); const { toast } = useUI(); const { lang, setLang, theme, toggleTheme } = useSettings(); const path = usePathname(); const [more, setMore] = useState(false);
  const staff = me && ['admin', 'seller'].includes(me.role);
  const links = staff ? [...STAFF, ...(me.role === 'admin' ? [ADMIN] : [])] : me ? BUYER : [];
  const on = h => (h === '/' ? path === '/' : path === h || path.startsWith(h + '/'));
  const out = async () => { try { await api('/api/auth/logout', 'POST'); location.href = '/'; } catch (e) { toast(e.message, 'err'); } };
  // মোবাইলের নিচের বারে প্রথম ৪টি + "আরও"
  const tabs = staff ? links.slice(0, 4) : links;
  const rest = staff ? links.slice(4) : [];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-stone-200/70 bg-surface/85 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-3 sm:px-5">
          <Link href={me ? '/dashboard' : '/'} className="flex items-center gap-2 font-bold text-stone-900">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-700 text-white"><I n="store" c="w-5 h-5" /></span>
            <span className="hidden leading-tight sm:block"><span className="block text-[15px]">{t("আজিজ আর্মি")}</span><span className="block text-[11px] font-medium text-stone-500">{t("জেনারেল স্টোর")}</span></span>
          </Link>
          <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label={t("প্রধান মেনু")}>
            {links.map(([h, l, ic]) => (
              <Link key={h} href={h} className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${on(h) ? 'bg-emerald-50 text-accent' : 'text-stone-600 hover:bg-stone-100'}`}><I n={ic} c="w-4 h-4" />{t(l)}</Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setLang(lang === 'en' ? 'bn' : 'en')} className="btn btn-soft btn-sm !h-9 gap-1 !px-2.5" aria-label={t("ভাষা বদলান")} title={t("ভাষা বদলান")}><I n="globe" c="w-4 h-4" />{lang === 'en' ? 'বাং' : 'EN'}</button>
            <button onClick={toggleTheme} className="btn btn-soft btn-icon" aria-label={theme === 'dark' ? t("লাইট মোড") : t("ডার্ক মোড")} title={theme === 'dark' ? t("লাইট মোড") : t("ডার্ক মোড")}><I n={theme === 'dark' ? 'sun' : 'moon'} c="w-4 h-4" /></button>
            {!ready ? <div className="skel h-9 w-24" /> : me ? (
              <>
                <Link href="/account" className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-3 hover:bg-stone-100" title={t("আমার অ্যাকাউন্ট")}>
                  <Thumb src={me.photo} s={32} round />
                  <span className="hidden text-left leading-tight sm:block"><span className="block text-sm font-semibold">{me.name}</span><span className="block text-[11px] text-stone-500">{ROLES[me.role]}</span></span>
                </Link>
                <button onClick={out} className="btn btn-soft btn-icon hidden md:inline-flex" aria-label={t("লগআউট")} title={t("লগআউট")}><I n="logout" c="w-4 h-4" /></button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn btn-sm btn-soft">{t("লগইন")}</Link>
                <Link href="/register" className="btn btn-sm">{t("রেজিস্টার")}</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {me && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden" aria-label={t("নিচের মেনু")}>
          <div className="mx-auto flex max-w-md">
            {tabs.map(([h, l, ic]) => (
              <Link key={h} href={h} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${on(h) ? 'text-accent' : 'text-stone-500'}`}>
                <span className={`flex h-7 w-12 items-center justify-center rounded-full transition ${on(h) ? 'bg-emerald-100' : ''}`}><I n={ic} c="w-5 h-5" /></span>{t(l).split(' ')[0]}
              </Link>
            ))}
            <button onClick={() => setMore(true)} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${more ? 'text-accent' : 'text-stone-500'}`}>
              <span className="flex h-7 w-12 items-center justify-center rounded-full"><I n="menu" c="w-5 h-5" /></span>{t("আরও")}</button>
          </div>
        </nav>
      )}

      {more && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden" onClick={() => setMore(false)}>
          <div className="animate-up absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]" onClick={e => e.stopPropagation()}>
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-stone-300" />
            <div className="grid grid-cols-3 gap-2">
              {[...rest, ['/', t("দোকান দেখুন"), 'store'], ['/account', t("অ্যাকাউন্ট"), 'user']].map(([h, l, ic]) => (
                <Link key={h} href={h} onClick={() => setMore(false)} className="flex flex-col items-center gap-1.5 rounded-2xl bg-stone-50 p-3 text-center text-xs font-semibold text-stone-700 active:bg-emerald-50"><I n={ic} c="w-6 h-6 text-accent" />{t(l)}</Link>
              ))}
            </div>
            <button onClick={out} className="btn btn-danger-soft mt-3 w-full"><I n="logout" c="w-4 h-4" />{t("লগআউট")}</button>
          </div>
        </div>
      )}
    </>
  );
}
