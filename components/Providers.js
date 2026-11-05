'use client';
import { createContext, Fragment, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { I } from '@/components/ui';
import { t, setLang as applyLang } from '@/lib/i18n';

const MeCtx = createContext({ me: null, ready: false, refresh: () => {} });
const UICtx = createContext({ toast: () => {}, ask: async () => false });
const SetCtx = createContext({ lang: 'bn', setLang: () => {}, theme: 'light', toggleTheme: () => {} });
export const useMe = () => useContext(MeCtx);
export const useUI = () => useContext(UICtx);
export const useSettings = () => useContext(SetCtx);

const saveCookie = (k, v) => { document.cookie = `${k}=${v}; path=/; max-age=31536000; samesite=lax`; };

export default function Providers({ children, lang: initLang = 'bn', theme: initTheme = 'light' }) {
  const [lang, setLangState] = useState(initLang), [theme, setTheme] = useState(initTheme);
  applyLang(lang); // চাইল্ড কম্পোনেন্ট রেন্ডারের আগেই বর্তমান ভাষা সেট

  const changeLang = l => { applyLang(l); saveCookie('lang', l); document.documentElement.lang = l; setLangState(l); };
  const toggleTheme = () => {
    const n = theme === 'dark' ? 'light' : 'dark';
    saveCookie('theme', n); document.documentElement.classList.toggle('dark', n === 'dark'); setTheme(n);
  };

  const [me, setMe] = useState(null), [ready, setReady] = useState(false);
  const refresh = useCallback(() => fetch('/api/auth/me').then(r => r.json()).then(d => setMe(d.user || null)).catch(() => setMe(null)).finally(() => setReady(true)), []);
  useEffect(() => { refresh(); }, [refresh]);

  const [toasts, setToasts] = useState([]), [dlg, setDlg] = useState(null), id = useRef(0);
  const toast = useCallback((msg, type = 'ok') => {
    const k = ++id.current; setToasts(x => [...x, { k, msg: t(msg), type }]);
    setTimeout(() => setToasts(x => x.filter(y => y.k !== k)), type === 'err' ? 5000 : 2600);
  }, []);
  const ask = useCallback((msg, o = {}) => new Promise(res => setDlg({ msg, ...o, res })), []);
  const close = v => { dlg.res(v); setDlg(null); };

  return (
    <SetCtx.Provider value={{ lang, setLang: changeLang, theme, toggleTheme }}>
      <MeCtx.Provider value={{ me, ready, refresh }}>
        <UICtx.Provider value={{ toast, ask }}>
          {/* key বদলালে পুরো UI নতুন ভাষায় আবার আঁকা হয় */}
          <Fragment key={lang}>{children}</Fragment>
          <div className="fixed inset-x-0 bottom-20 md:bottom-6 z-[70] flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite">
            {toasts.map(x => (
              <div key={x.k} className={`animate-up pointer-events-auto flex items-center gap-2 max-w-md rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${x.type === 'err' ? 'bg-red-600 text-white' : 'bg-neutral-900 text-white ring-1 ring-white/10'}`}>
                <I n={x.type === 'err' ? 'alert' : 'check'} c="w-4 h-4 shrink-0" />{x.msg}
              </div>
            ))}
          </div>
          {dlg && (
            <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => close(false)}>
              <div role="alertdialog" className="animate-pop w-full max-w-sm rounded-2xl bg-surface p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                <p className="text-[15px] leading-relaxed">{t(dlg.msg)}</p>
                <div className="mt-5 flex justify-end gap-2">
                  <button className="btn btn-soft" onClick={() => close(false)}>{t('না')}</button>
                  <button autoFocus className={`btn ${dlg.danger ? 'btn-danger' : ''}`} onClick={() => close(true)}>{t(dlg.yes || 'হ্যাঁ')}</button>
                </div>
              </div>
            </div>
          )}
        </UICtx.Provider>
      </MeCtx.Provider>
    </SetCtx.Provider>
  );
}
