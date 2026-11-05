'use client';
import { I } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function PhoneList({ label, name, onName, phones, onPhones }) {
  const l = phones?.length ? phones : [''];
  const set = (i, v) => { const n = [...l]; n[i] = v; onPhones(n); };
  return (
    <div className="space-y-1.5">
      <label className="lbl">{label}</label>
      <input className="inp" placeholder={t("নাম")} value={name || ''} onChange={e => onName(e.target.value)} />
      {l.map((x, i) => (
        <div key={i} className="flex gap-1.5">
          <input className="inp" inputMode="tel" placeholder={t("ফোন নাম্বার")} value={x} onChange={e => set(i, e.target.value)} />
          {l.length > 1 && <button type="button" className="btn btn-soft btn-icon" aria-label={t("মুছুন")} onClick={() => onPhones(l.filter((_, j) => j !== i))}><I n="x" c="w-4 h-4" /></button>}
          {i === l.length - 1 && <button type="button" className="btn btn-brand-soft btn-icon" aria-label={t("আরেকটি নাম্বার")} onClick={() => onPhones([...l, ''])}><I n="plus" c="w-4 h-4" /></button>}
        </div>
      ))}
    </div>
  );
}
