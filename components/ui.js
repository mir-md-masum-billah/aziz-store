'use client';
import { useEffect } from 'react';
import { t } from '@/lib/i18n';

const P = {
  home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" /></>,
  box: <><path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></>,
  book: <><path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z" /><path d="M8 7h8M8 11h6" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>,
  wallet: <><path d="M3 7a2 2 0 0 1 2-2h13v4" /><path d="M3 7v11a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2z" /><circle cx="16.5" cy="14.5" r="1" /></>,
  plus: <path d="M12 5v14M5 12h14" />, minus: <path d="M5 12h14" />, x: <path d="M18 6 6 18M6 6l12 12" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.8a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />,
  pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  users: <><circle cx="9" cy="8" r="3.5" /><path d="M2 21a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M22 21a7 7 0 0 0-4-6.3" /></>,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  camera: <><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></>,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />,
  check: <path d="m5 12 5 5L20 7" />,
  print: <><path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></>,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  trend: <><path d="m3 17 6-6 4 4 8-8" /><path d="M15 7h6v6" /></>,
  cart: <><circle cx="9" cy="20" r="1.5" /><circle cx="18" cy="20" r="1.5" /><path d="M2 3h3l2.7 12.4a2 2 0 0 0 2 1.6h8.1a2 2 0 0 0 2-1.5L21 8H6" /></>,
  chev: <path d="m9 6 6 6-6 6" />, down: <path d="m6 9 6 6 6-6" />,
  refresh: <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16M3 12A9 9 0 0 1 18.5 5.8L21 8M21 3v5h-5M3 21v-5h5" />,
  lock: <><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
  store: <><path d="M3 9 5 3h14l2 6" /><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" /><path d="M5 12v9h14v-9M10 21v-5h4v5" /></>,
  msg: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  flame: <path d="M12 22c4 0 7-3 7-7 0-3-2-5-3-7-1 2-2 3-4 3 0-4-2-7-4-9 0 4-3 6-3 11 0 5 3 9 7 9z" />,
  bars: <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />,
  key: <><circle cx="8" cy="15" r="4" /><path d="m10.8 12.2 9.2-9.2M16 7l3 3" /></>,
  cal: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  dots: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  globe: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></>,
  shield: <path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z" />,
};
export const I = ({ n, c = 'w-5 h-5', ...p }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={c} aria-hidden="true" {...p}>{P[n]}</svg>
);

export const Thumb = ({ src, s = 44, round }) => (
  <div style={{ width: s, height: s }} className={`${round ? 'rounded-full' : 'rounded-xl'} shrink-0 overflow-hidden bg-stone-100 flex items-center justify-center text-stone-400`}>
    {src ? <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" /> : <I n={round ? 'user' : 'box'} c="w-1/2 h-1/2" />}
  </div>
);

const TONES = { green: 'bg-emerald-50 text-accent', red: 'bg-red-50 text-danger', amber: 'bg-amber-50 text-warn', blue: 'bg-sky-50 text-info', gray: 'bg-stone-100 text-stone-600' };
export const Badge = ({ tone = 'gray', children, className = '' }) => <span className={`badge ${TONES[tone]} ${className}`}>{children}</span>;

export function Stat({ label, value, sub, tone = 'gray', icon, href }) {
  const ring = { green: 'bg-emerald-100 text-accent', red: 'bg-red-100 text-danger', amber: 'bg-amber-100 text-warn', blue: 'bg-sky-100 text-info', gray: 'bg-stone-100 text-stone-600' }[tone];
  const body = (
    <div className="flex items-start gap-3">
      {icon && <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ring}`}><I n={icon} /></div>}
      <div className="min-w-0"><div className="muted">{label}</div><div className="truncate text-xl font-bold text-stone-900 sm:text-2xl">{value}</div>{sub && <div className="muted mt-0.5">{sub}</div>}</div>
    </div>
  );
  return href ? <a href={href} className="card card-hover block">{body}</a> : <div className="card">{body}</div>;
}

export const Empty = ({ icon = 'box', title, hint, children }) => (
  <div className="flex flex-col items-center py-10 text-center">
    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 text-stone-400"><I n={icon} c="w-7 h-7" /></div>
    <div className="font-semibold text-stone-700">{title}</div>{hint && <div className="muted mt-1 max-w-xs">{hint}</div>}{children && <div className="mt-4">{children}</div>}
  </div>
);

export const Skeletons = ({ n = 6, h = 'h-48', cols = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' }) => (
  <div className={`grid gap-3 ${cols}`}>{Array.from({ length: n }, (_, i) => <div key={i} className={`skel ${h}`} />)}</div>
);

export const PageHead = ({ title, sub, children }) => (
  <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
    <div><h1 className="h1">{title}</h1>{sub && <p className="muted mt-0.5 text-sm">{sub}</p>}</div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
);

export const Chips = ({ value, onChange, options, on = 'chip-on' }) => (
  <div className="scroll-x">{options.map(([v, l]) => <button key={v} type="button" onClick={() => onChange(v)} className={`chip ${value === v ? on : ''}`}>{t(l)}</button>)}</div>
);

export const SearchBox = ({ value, onChange, placeholder, className = '' }) => (
  <div className={`relative ${className}`}>
    <I n="search" c="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
    <input className="inp pl-10" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} />
  </div>
);

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return; const k = e => e.key === 'Escape' && onClose(); document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden'; return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-label={title} onClick={e => e.stopPropagation()} className={`animate-pop max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-surface p-5 shadow-2xl sm:rounded-3xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}>
        <div className="mb-4 flex items-center justify-between gap-3"><h3 className="h2">{title}</h3><button className="btn btn-soft btn-icon" onClick={onClose} aria-label={t("বন্ধ")}><I n="x" c="w-4 h-4" /></button></div>
        {children}
      </div>
    </div>
  );
}

// সাধারণ বার চার্ট (SVG নয়, শুধু div) — কোনো লাইব্রেরি লাগে না
export function BarChart({ data, fmt }) {
  const max = Math.max(1, ...data.flatMap(d => [d.sales, d.collected]));
  if (!data.length) return <Empty icon="bars" title={t("এই সময়ে কোনো লেনদেন নেই")} />;
  return (
    <div>
      <div className="flex h-40 items-end gap-1 sm:gap-1.5">
        {data.map(d => (
          <div key={d.k} className="group relative flex h-full min-w-0 flex-1 items-end justify-center gap-px" title={t("{0} • বিক্রি {1} • আদায় {2}", d.k, fmt(d.sales), fmt(d.collected))}>
            <div className="w-full max-w-[14px] rounded-t bg-emerald-600/90" style={{ height: `${Math.max(d.sales ? 3 : 0, d.sales / max * 100)}%` }} />
            <div className="w-full max-w-[14px] rounded-t bg-sky-400/90" style={{ height: `${Math.max(d.collected ? 3 : 0, d.collected / max * 100)}%` }} />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1 sm:gap-1.5">{data.map((d, i) => <div key={d.k} className="min-w-0 flex-1 truncate text-center text-[9px] text-stone-400">{data.length <= 12 || i % Math.ceil(data.length / 8) === 0 ? d.k.slice(-2) : ''}</div>)}</div>
      <div className="mt-2 flex gap-4 text-xs text-stone-500"><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-emerald-600" />{t("বিক্রি")}</span><span className="flex items-center gap-1"><i className="h-2.5 w-2.5 rounded bg-sky-400" />{t("আদায়")}</span></div>
    </div>
  );
}
