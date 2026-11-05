'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, tk, num, dt, UNITS, todayStr, downloadCsv } from '@/lib/client';
import { useMe, useUI } from '@/components/Providers';
import Suggest from '@/components/Suggest';
import { Badge, Chips, Empty, I, Modal, PageHead, Stat } from '@/components/ui';
import { t } from '@/lib/i18n';

const F = ({ l, children, className = '' }) => <div className={className}><label className="lbl">{l}</label>{children}</div>;
const clr = { name: '', kind: '', from: '', to: '' };

export default function Withdrawals() {
  const { me, ready } = useMe(); const { toast, ask } = useUI(); const admin = me?.role === 'admin';
  const [l, setL] = useState(null), [f, setF] = useState({ name: '', kind: 'cash', amount: '', qty: '', date: todayStr(), note: '' }), [pq, setPq] = useState(''), [pr, setPr] = useState([]), [pick, setPick] = useState(null);
  const [fl, setFl] = useState(clr), [ed, setEd] = useState(null), [names, setNames] = useState([]), [busy, setBusy] = useState(false), [formOpen, setFormOpen] = useState(false);
  const loadNames = () => api('/api/withdrawals?names=1').then(setNames).catch(() => {});
  useEffect(() => { loadNames(); }, []);
  const load = () => api('/api/withdrawals?' + new URLSearchParams(Object.entries(fl).filter(([, v]) => v))).then(setL).catch(e => { toast(e.message, 'err'); setL([]); });
  useEffect(() => { load(); }, [fl]);
  useEffect(() => { if (!pq.trim()) return setPr([]); const t = setTimeout(() => api('/api/products?q=' + encodeURIComponent(pq)).then(setPr).catch(() => {}), 250); return () => clearTimeout(t); }, [pq]);

  const add = async e => {
    e.preventDefault(); setBusy(true);
    try { await api('/api/withdrawals', 'POST', { ...f, productId: pick?._id }); setF({ ...f, name: '', amount: '', qty: '', note: '' }); setPick(null); setPq(''); toast(t("উত্তোলন যোগ হয়েছে")); setFormOpen(false); load(); loadNames(); } catch (x) { toast(x.message, 'err'); }
    setBusy(false);
  };
  const save = async () => { setBusy(true); try { await api('/api/withdrawals', 'PATCH', { id: ed._id, kind: ed.kind, name: ed.name, note: ed.note, amount: ed.amount, date: ed.date }); setEd(null); toast(t("সেভ হয়েছে")); load(); loadNames(); } catch (x) { toast(x.message, 'err'); } setBusy(false); };
  const del = async w => { if (await ask(w.kind === 'product' ? t("মুছলে পণ্যের স্টক আবার ফেরত আসবে। মুছবেন?") : t("এই উত্তোলন মুছবেন?"), { danger: true, yes: 'মুছুন' })) { try { await api('/api/withdrawals?id=' + w._id, 'DELETE'); toast(t("মুছে ফেলা হয়েছে")); load(); } catch (x) { toast(x.message, 'err'); } } };
  const range = k => { const n = new Date(); const m = { today: [todayStr(), todayStr()], month: [todayStr(new Date(n.getFullYear(), n.getMonth(), 1)), todayStr()], year: [n.getFullYear() + '-01-01', todayStr()] }[k]; setFl({ ...fl, from: m[0], to: m[1] }); };
  const cash = useMemo(() => (l || []).filter(w => w.kind === 'cash').reduce((s, w) => s + w.amount, 0), [l]);
  const prod = useMemo(() => (l || []).filter(w => w.kind === 'product').reduce((s, w) => s + (w.amount || 0), 0), [l]);
  const exportCsv = () => downloadCsv(`${t('উত্তোলন')}-${todayStr()}.csv`, [['তারিখ', 'নাম', 'ধরন', 'বিবরণ', 'টাকা/খরচ', 'নোট'], ...l.map(w => [dt(w.date), w.name, w.kind === 'cash' ? 'টাকা' : 'পণ্য', w.kind === 'product' ? `${w.productName} ${w.qty} ${UNITS[w.unit]}` : '', w.amount, w.note])]);

  if (ready && !['admin', 'seller'].includes(me?.role)) return <div className="card"><Empty icon="lock" title={t("অনুমতি নেই")} /></div>;
  return (
    <div className="space-y-4">
      <PageHead title={t("উত্তোলন")} sub={t("নিজের/পরিবারের জন্য নেওয়া টাকা ও পণ্যের হিসাব")}>
        <button className="btn btn-sm btn-soft" onClick={exportCsv} disabled={!l?.length}><I n="download" c="w-4 h-4" />CSV</button>
        <button className="btn" onClick={() => setFormOpen(true)}><I n="plus" c="w-4 h-4" />{t("নতুন উত্তোলন")}</button>
      </PageHead>
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("নগদ উত্তোলন (ফিল্টার অনুযায়ী)")} value={l ? tk(cash) : '…'} tone="red" icon="wallet" />
        <Stat label={t("পণ্য উত্তোলনের খরচ")} value={l ? tk(Math.round(prod)) : '…'} tone="amber" icon="box" />
      </div>

      <div className="card space-y-3">
        <div className="grid gap-2 sm:grid-cols-4">
          <Suggest placeholder={t("নাম দিয়ে ফিল্টার")} value={fl.name} onChange={v => setFl({ ...fl, name: v })} items={names.map(n => ({ name: n }))} />
          <select className="inp" value={fl.kind} onChange={e => setFl({ ...fl, kind: e.target.value })}><option value="">{t("টাকা ও পণ্য")}</option><option value="cash">{t("শুধু টাকা")}</option><option value="product">{t("শুধু পণ্য")}</option></select>
          <input type="date" className="inp" aria-label={t("শুরুর তারিখ")} value={fl.from} onChange={e => setFl({ ...fl, from: e.target.value })} />
          <input type="date" className="inp" aria-label={t("শেষ তারিখ")} value={fl.to} onChange={e => setFl({ ...fl, to: e.target.value })} />
        </div>
        <div className="flex flex-wrap gap-2"><button className="chip" onClick={() => range('today')}>{t("আজ")}</button><button className="chip" onClick={() => range('month')}>{t("এই মাস")}</button><button className="chip" onClick={() => range('year')}>{t("এই বছর")}</button><button className="chip" onClick={() => setFl(clr)}>{t("রিসেট")}</button></div>
      </div>

      <div className="card overflow-x-auto !p-0">
        <table className="tbl"><thead><tr><th>{t("তারিখ")}</th><th>{t("নাম")}</th><th>{t("বিবরণ")}</th><th>{t("নোট")}</th><th /></tr></thead>
          <tbody>{(l || []).map(w => (
            <tr key={w._id}>
              <td className="whitespace-nowrap">{dt(w.date)}</td><td className="font-semibold">{w.name}</td>
              <td className="whitespace-nowrap">{w.kind === 'cash' ? <b className="text-danger">{tk(w.amount)}</b> : <span><Badge tone="amber" className="mr-1.5">{t("পণ্য")}</Badge>{w.productName} — {num(w.qty)} {UNITS[w.unit]}{w.amount > 0 && <span className="muted">  {t("(খরচ")} {tk(Math.round(w.amount))})</span>}</span>}</td>
              <td className="muted">{w.note}</td>
              <td className="whitespace-nowrap text-right"><button className="btn btn-sm btn-soft mr-1" onClick={() => setEd({ ...w, date: (w.date || '').slice(0, 10) })}>{t("এডিট")}</button>{admin && <button className="btn btn-sm btn-danger-soft" onClick={() => del(w)} aria-label={t("মুছুন")}><I n="trash" c="w-3.5 h-3.5" /></button>}</td>
            </tr>))}</tbody>
        </table>
        {l === null && <div className="skel m-4 h-32" />}
        {l && !l.length && <Empty icon="wallet" title={t("কোনো উত্তোলন নেই")} />}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={t("নতুন উত্তোলন")}>
        <form onSubmit={add} className="space-y-3">
          <Suggest label={t("কার নামে")} placeholder={t("নাম")} value={f.name} onChange={v => setF({ ...f, name: v })} items={names.map(n => ({ name: n }))} />
          <div className="flex gap-2">{[['cash', t("টাকা")], ['product', t("পণ্য")]].map(([k, t]) => <button key={k} type="button" className={`chip flex-1 justify-center ${f.kind === k ? 'chip-on' : ''}`} onClick={() => setF({ ...f, kind: k })}>{t}</button>)}</div>
          <F l={t("তারিখ")}><input type="date" className="inp" value={f.date} onChange={e => setF({ ...f, date: e.target.value })} /></F>
          {f.kind === 'cash' ? <F l={t("টাকার পরিমাণ (৳)")}><input type="number" min="0" className="inp" value={f.amount} onChange={e => setF({ ...f, amount: e.target.value })} /></F> : (
            <>
              <div className="relative"><label className="lbl">{t("পণ্য")}</label><input className="inp" placeholder={t("পণ্য খুঁজুন…")} value={pick ? `${pick.company} — ${pick.name}` : pq} onChange={e => { setPick(null); setPq(e.target.value); }} />
                {!pick && pr.length > 0 && <div className="absolute inset-x-0 z-20 mt-1 max-h-48 overflow-auto rounded-xl border border-stone-200 bg-surface p-1 shadow-xl">{pr.map(p => <button type="button" key={p._id} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-emerald-50" onClick={() => setPick(p)}>{p.company} — {p.name} <span className="muted">{t("(স্টক")} {num(p.stock)})</span></button>)}</div>}</div>
              <F l={t("পরিমাণ {0}", pick ? '(' + UNITS[pick.unit] + ')' : '')}><input type="number" min="0" className="inp" value={f.qty} onChange={e => setF({ ...f, qty: e.target.value })} /></F>
            </>)}
          <F l={t("নোট (ঐচ্ছিক)")}><input className="inp" value={f.note} onChange={e => setF({ ...f, note: e.target.value })} /></F>
          <button className="btn w-full" disabled={busy}>{t("যোগ করুন")}</button>
        </form>
      </Modal>

      <Modal open={!!ed} onClose={() => setEd(null)} title={t("উত্তোলন এডিট")}>
        {ed && <div className="space-y-3">
          <F l={t("তারিখ")}><input type="date" className="inp" value={ed.date} onChange={e => setEd({ ...ed, date: e.target.value })} /></F>
          <F l={t("নাম")}><input className="inp" value={ed.name} onChange={e => setEd({ ...ed, name: e.target.value })} /></F>
          {ed.kind === 'cash' ? <F l={t("টাকা")}><input type="number" className="inp" value={ed.amount} onChange={e => setEd({ ...ed, amount: e.target.value })} /></F> : <div className="muted rounded-xl bg-stone-50 p-3">{ed.productName} — {num(ed.qty)} {UNITS[ed.unit]}  {t("(পরিমাণ বদলাতে চাইলে মুছে নতুন করে দিন)")}</div>}
          <F l={t("নোট")}><input className="inp" value={ed.note || ''} onChange={e => setEd({ ...ed, note: e.target.value })} /></F>
          <button className="btn w-full" disabled={busy} onClick={save}>{t("সেভ করুন")}</button>
        </div>}
      </Modal>
    </div>
  );
}
