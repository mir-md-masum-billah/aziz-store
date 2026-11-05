'use client';
import { useState } from 'react';

export default function Suggest({ label, value, onChange, items, placeholder }) {
  const [open, setOpen] = useState(false); const v = (value || '').trim().toLowerCase();
  const shown = items.filter(c => !v || c.name.toLowerCase().includes(v)).slice(0, 30);
  return (
    <div className="relative">
      {label && <label className="lbl">{label}</label>}
      <input className="inp" autoComplete="off" placeholder={placeholder} value={value} onChange={e => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && shown.length > 0 && (
        <ul className="animate-pop absolute left-0 right-0 z-30 mt-1 max-h-56 overflow-auto rounded-xl border border-stone-200 bg-surface p-1 shadow-xl">
          {shown.map(c => (
            <li key={c.name} className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-emerald-50" onMouseDown={e => { e.preventDefault(); onChange(c.name); setOpen(false); }}>
              {c.logo && <img src={c.logo} alt="" className="h-6 w-6 object-contain" />}{c.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
