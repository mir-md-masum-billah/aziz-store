'use client';
import { useState } from 'react';
import { useUI } from '@/components/Providers';
import { I } from '@/components/ui';
import { t } from '@/lib/i18n';

// ড্যামেজ রিকভার: টাকা ফেরত নাকি পণ্য বদল — সেভ করলে রেকর্ড ড্যামেজ লিস্ট থেকে সরে যায়
export default function RecoverBox({ cost, onSave, onCancel }) {
  const { toast } = useUI();
  const [kind, setKind] = useState(''), [amount, setAmount] = useState(cost ? Math.round(cost) : ''), [note, setNote] = useState(''), [busy, setBusy] = useState(false);
  const go = async () => {
    if (!kind) return toast(t("টাকা ফেরত নাকি পণ্য বদল — একটি বেছে নিন"), 'err');
    if (kind === 'money' && !(+amount > 0)) return toast(t("ফেরত পাওয়া টাকার পরিমাণ দিন"), 'err');
    setBusy(true);
    try { await onSave({ kind, amount: kind === 'money' ? +amount : 0, note }); toast(t("রিকভার সম্পন্ন")); } catch (x) { toast(x.message, 'err'); setBusy(false); }
  };
  return (
    <div className="animate-up mt-3 space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-sm">
      <div className="flex items-center gap-1.5 font-semibold text-accent"><I n="refresh" c="w-4 h-4" />{t("রিকভার — এর বদলে কী পেয়েছেন?")}</div>
      <div className="flex gap-2">
        {[['money', t("টাকা ফেরত")], ['product', t("পণ্য বদল")]].map(([k, l]) => <button key={k} type="button" onClick={() => setKind(k)} className={`chip ${kind === k ? 'chip-on' : ''}`}>{l}</button>)}
      </div>
      {kind === 'money' && <div><label className="lbl">{t("ফেরত পাওয়া টাকা")}</label><input type="number" className="inp" value={amount} onChange={e => setAmount(e.target.value)} /></div>}
      {kind && <div><label className="lbl">{t("বিবরণ (ঐচ্ছিক)")}{kind === 'product' ? t(" — কোন পণ্য/কত পিস বদল পেয়েছেন") : ''}</label><input className="inp" value={note} onChange={e => setNote(e.target.value)} /></div>}
      <div className="flex flex-wrap gap-2"><button className="btn btn-sm" disabled={busy} onClick={go}>{t("রিকভার নিশ্চিত করুন")}</button><button className="btn btn-sm btn-soft" onClick={onCancel}>{t("বাতিল")}</button></div>
      <div className="muted">{t("নিশ্চিত করলে এই ড্যামেজ রেকর্ড ড্যামেজ লিস্ট থেকে সরে যাবে।")}</div>
    </div>
  );
}
