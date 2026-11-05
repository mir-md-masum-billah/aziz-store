'use client';
import { useEffect, useState } from 'react';
import { api, dt, num, UNITS, todayStr } from '@/lib/client';
import { useMe, useUI } from '@/components/Providers';
import { Empty, I, PageHead, SearchBox } from '@/components/ui';
import { t } from '@/lib/i18n';

const row = () => ({ productId: '', qty: '' });

export default function StockOut() {
  const { me, ready } = useMe(); const { toast, ask } = useUI(); const admin = me?.role === 'admin';
  const [list, setList] = useState([]), [q, setQ] = useState(''), [rows, setRows] = useState([row()]), [note, setNote] = useState(''), [date, setDate] = useState(todayStr()), [hist, setHist] = useState(null), [busy, setBusy] = useState(false);
  const loadH = () => api('/api/stockout').then(setHist).catch(() => setHist([]));
  const loadP = () => api('/api/products?q=' + encodeURIComponent(q)).then(setList).catch(() => {});
  useEffect(() => { loadH(); }, []);
  useEffect(() => { const t = setTimeout(loadP, 250); return () => clearTimeout(t); }, [q]);
  const set = (i, k, v) => setRows(r => r.map((x, j) => j === i ? { ...x, [k]: v } : x));
  const pick = id => list.find(p => p._id === id);

  const submit = async () => {
    const items = rows.filter(r => r.productId || r.qty); if (!items.length) return toast(t("পণ্য বেছে পরিমাণ লিখুন"), 'err');
    setBusy(true);
    try { await api('/api/stockout', 'POST', { items, note, date }); setRows([row()]); setNote(''); setDate(todayStr()); toast(t("স্টক কমানো হয়েছে")); loadH(); loadP(); } catch (x) { toast(x.message, 'err'); }
    setBusy(false);
  };
  const del = async h => { if (!(await ask(t("এই এন্ট্রি মুছলে স্টক আবার ফেরত যাবে। মুছবেন?"), { danger: true, yes: 'মুছুন' }))) return; try { await api('/api/stockout?id=' + h._id, 'DELETE'); toast(t("স্টক ফেরত এসেছে")); loadH(); loadP(); } catch (x) { toast(x.message, 'err'); } };

  if (ready && !['admin', 'seller'].includes(me?.role)) return <div className="card"><Empty icon="lock" title={t("অনুমতি নেই")} /></div>;
  return (
    <div className="space-y-4">
      <PageHead title={t("স্টক কমান")} sub={t("বিক্রি হয়েছে কিন্তু খাতায় লেখা হয়নি — এখানে লিখলেই স্টক থেকে কমে যাবে")} />
      <div className="card space-y-3">
        <SearchBox value={q} onChange={setQ} placeholder={t("পণ্য/কোম্পানি লিখে নিচের তালিকা ছোট করুন…")} />
        {rows.map((r, i) => {
          const p = pick(r.productId);
          return (
            <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-xl bg-stone-50 p-3">
              <div className="col-span-12 sm:col-span-7"><label className="lbl">{t("পণ্য")}</label>
                <select className="inp" value={r.productId} onChange={e => set(i, 'productId', e.target.value)}><option value="">{t("— পণ্য বাছুন —")}</option>{list.map(x => <option key={x._id} value={x._id}>{x.company} — {x.name}{x.group ? ` (${x.group})` : ''}  {t("• স্টক")} {num(x.stock)} {UNITS[x.unit]}</option>)}</select></div>
              <div className="col-span-9 sm:col-span-4"><label className="lbl">{t("কতটা বিক্রি হয়েছে")}{p ? ` (${UNITS[p.unit]})` : ''}</label><input type="number" min="0" className="inp" value={r.qty} onChange={e => set(i, 'qty', e.target.value)} /></div>
              <div className="col-span-3 sm:col-span-1">{rows.length > 1 && <button className="btn btn-danger-soft w-full" aria-label={t("সারি মুছুন")} onClick={() => setRows(rows.filter((_, j) => j !== i))}><I n="x" c="w-4 h-4" /></button>}</div>
              {p && +r.qty > p.stock && <div className="col-span-12 text-xs font-semibold text-danger">{t("স্টকে আছে মাত্র")} {num(p.stock)} {UNITS[p.unit]}</div>}
            </div>);
        })}
        <button className="btn btn-sm btn-brand-soft" onClick={() => setRows([...rows, row()])}><I n="plus" c="w-4 h-4" />{t("আরও পণ্য")}</button>
        <div className="grid gap-2 sm:grid-cols-2">
          <div><label className="lbl">{t("তারিখ")}</label><input type="date" className="inp" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div><label className="lbl">{t("নোট (ঐচ্ছিক)")}</label><input className="inp" placeholder={t("যেমন: গতকালের খুচরা বিক্রি")} value={note} onChange={e => setNote(e.target.value)} /></div>
        </div>
        <button className="btn w-full sm:w-auto" disabled={busy} onClick={submit}>{busy ? t("হচ্ছে…") : t("স্টক কমান")}</button>
      </div>

      <div className="card">
        <h2 className="h2 mb-2">{t("স্টক কমানোর ইতিহাস")}</h2>
        <div className="divide-y divide-stone-100">{(hist || []).map(h => (
          <div key={h._id} className="flex items-start justify-between gap-3 py-3 text-sm">
            <div className="min-w-0"><div><b>{h.company}</b> — {h.productName} — <b className="text-danger">−{num(h.qty)} {UNITS[h.unit]}</b></div>
              <div className="muted">{dt(h.date)}{h.by && t(" • লিখেছেন: {0}", h.by)}{h.note && ` • ${h.note}`}</div></div>
            {admin && <button className="btn btn-sm btn-danger-soft shrink-0" onClick={() => del(h)} aria-label={t("মুছুন")}><I n="trash" c="w-3.5 h-3.5" /></button>}
          </div>))}</div>
        {hist && !hist.length && <Empty icon="clock" title={t("এখনো কিছু নেই")} />}
        {hist === null && <div className="skel h-24" />}
      </div>
    </div>
  );
}
