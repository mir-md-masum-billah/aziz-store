'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, up, tk, num, dt, UNITS, todayStr, telHref, waHref, smsHref, printHtml, escHtml } from '@/lib/client';
import { useMe, useUI } from '@/components/Providers';
import { Badge, Chips, Empty, I, Modal, Thumb } from '@/components/ui';
import { t } from '@/lib/i18n';

const Row = ({ k, v }) => v ? <div className="text-sm"><span className="text-stone-500">{k}: </span><b className="font-semibold">{v}</b></div> : null;
const F = ({ l, children, className = '' }) => <div className={className}><label className="lbl">{l}</label>{children}</div>;

export default function Buyer({ params }) {
  const { me } = useMe(); const { toast, ask } = useUI();
  const [d, setD] = useState(null), [err, setErr] = useState(''), [cart, setCart] = useState([]), [q, setQ] = useState(''), [res, setRes] = useState([]);
  const [paid, setPaid] = useState(''), [dueDate, setDueDate] = useState(''), [note, setNote] = useState('');
  const [pay, setPay] = useState(''), [payNote, setPayNote] = useState('');
  const [sellOpen, setSellOpen] = useState(false), [payOpen, setPayOpen] = useState(false), [ed, setEd] = useState(null), [busy, setBusy] = useState(false);
  const [order, setOrder] = useState('new'), [filter, setFilter] = useState('all');
  const st = me && ['admin', 'seller'].includes(me.role), admin = me?.role === 'admin';
  const load = () => api('/api/buyers/' + params.id).then(setD).catch(e => setErr(e.message));
  useEffect(() => { load(); }, []);
  useEffect(() => { if (!q.trim()) return setRes([]); const t = setTimeout(() => api('/api/products?q=' + encodeURIComponent(q)).then(setRes).catch(() => {}), 250); return () => clearTimeout(t); }, [q]);

  // বিক্রি + পরিশোধ একই তালিকায়, সময় অনুযায়ী সাজানো
  const events = useMemo(() => {
    if (!d) return [];
    const l = [...d.sales.map(s => ({ type: 'sale', date: s.date, id: s._id, s })), ...d.payments.map(p => ({ type: 'pay', date: p.date, id: p._id, p }))].filter(e => filter === 'all' || e.type === filter);
    l.sort((a, b) => order === 'new' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date));
    return l;
  }, [d, order, filter]);

  if (err) return <div className="card"><Empty icon="lock" title={t("দেখানো যাচ্ছে না")} hint={err} /></div>;
  if (!d) return <div className="space-y-3"><div className="skel h-40" /><div className="skel h-24" /><div className="skel h-64" /></div>;
  const b = d.buyer, total = cart.reduce((s, i) => s + (+i.qty || 0) * (+i.price || 0), 0), newDue = d.due + total - (+paid || 0);
  const overLimit = b.creditLimit > 0 && newDue > b.creditLimit, badStock = cart.some(i => +i.qty > i.stock);
  const dueTone = d.due > 0 ? 'red' : 'green';

  const addToCart = p => { setCart(c => c.some(i => i._id === p._id) ? c.map(i => i._id === p._id ? { ...i, qty: (+i.qty || 0) + 1 } : i) : [...c, { ...p, qty: 1, price: p.sellPrice }]); setQ(''); setRes([]); };
  const setItem = (x, k, v) => setCart(c => c.map((i, y) => y === x ? { ...i, [k]: v } : i));
  const sell = async () => {
    if (!cart.length) return;
    if (overLimit && !(await ask(t("ক্রেডিট সীমা {0} ছাড়িয়ে যাবে (মোট বাকি হবে {1})। তবুও বিক্রি করবেন?", tk(b.creditLimit), tk(newDue)), { danger: true, yes: 'হ্যাঁ, বিক্রি করুন' }))) return;
    setBusy(true);
    try {
      await api('/api/sales', 'POST', { buyerId: b._id, items: cart.map(i => ({ productId: i._id, qty: i.qty, price: i.price })), paid: +paid || 0, dueDate: dueDate || null, note });
      setCart([]); setPaid(''); setDueDate(''); setNote(''); setSellOpen(false); toast(t("বিক্রি সংরক্ষিত হয়েছে")); load();
    } catch (x) { toast(x.message, 'err'); }
    setBusy(false);
  };
  const addPay = async () => {
    setBusy(true);
    try { await api('/api/payments', 'POST', { buyerId: b._id, amount: +pay, note: payNote }); setPay(''); setPayNote(''); setPayOpen(false); toast(t("পরিশোধ জমা হয়েছে")); load(); } catch (x) { toast(x.message, 'err'); }
    setBusy(false);
  };
  const saveEd = async () => { setBusy(true); try { await api('/api/buyers/' + b._id, 'PATCH', ed); setEd(null); toast(t("তথ্য সেভ হয়েছে")); load(); } catch (x) { toast(x.message, 'err'); } setBusy(false); };
  const changePhoto = async e => { const f = e.target.files[0]; if (!f) return; setBusy(true); try { await api('/api/buyers/' + b._id, 'PATCH', { photo: await up(f) }); load(); } catch (x) { toast(x.message, 'err'); } setBusy(false); };
  const delSale = async s => { if (await ask(t("এই বিক্রি মুছলে পণ্যের স্টক ফেরত আসবে ও বাকি কমবে। মুছবেন?"), { danger: true, yes: 'মুছুন' })) { try { await api('/api/sales?id=' + s._id, 'DELETE'); toast(t("মুছে ফেলা হয়েছে")); load(); } catch (x) { toast(x.message, 'err'); } } };
  const delPay = async p => { if (await ask(t("{0} এর এই পরিশোধ মুছবেন? বাকি আবার বাড়বে।", tk(p.amount)), { danger: true, yes: 'মুছুন' })) { try { await api('/api/payments?id=' + p._id, 'DELETE'); toast(t("মুছে ফেলা হয়েছে")); load(); } catch (x) { toast(x.message, 'err'); } } };
  const E = k => x => setEd({ ...ed, [k]: x.target.value });

  // প্রিন্টযোগ্য মেমো ও সম্পূর্ণ স্টেটমেন্ট (বর্তমান ভাষায়)
  const head = `<div class="c"><h1>${t('আজিজ আর্মি জেনারেল স্টোর')}</h1><div class="m">${t('বাকির খাতা')}</div></div><div class="hr"></div>`;
  const who = `<div><b>${escHtml(b.name)}</b>${b.pageNo ? ` • ${t('পেজ')} ${escHtml(b.pageNo)}` : ''}<br><span class="m">${escHtml(b.phone || '')} ${escHtml(b.address || '')}</span></div>`;
  const printSale = s => printHtml(t('মেমো'), `${head}${who}<h2>${t('মেমো — {0}', dt(s.date))}</h2><table><thead><tr><th>${t('পণ্য')}</th><th>${t('পরিমাণ × দর')}</th><th>${t('মূল্য')}</th></tr></thead><tbody>${s.items.map(i => `<tr><td>${escHtml(i.name)}</td><td>${num(i.qty)} ${UNITS[i.unit] || ''} × ${tk(i.price)}</td><td>${tk(i.qty * i.price)}</td></tr>`).join('')}</tbody></table><div class="hr"></div><table class="t"><tr><td>${t('মোট')}</td><td class="b">${tk(s.total)}</td></tr><tr><td>${t('নগদ')}</td><td>${tk(s.paid)}</td></tr><tr><td>${t('এই বিক্রিতে বাকি')}</td><td class="b">${tk(s.total - s.paid)}</td></tr>${s.dueDate ? `<tr><td>${t('পরিশোধের তারিখ')}</td><td>${dt(s.dueDate)}</td></tr>` : ''}<tr><td class="b">${t('মোট বাকি (এখন পর্যন্ত)')}</td><td class="b">${tk(d.due)}</td></tr></table>`);
  const printAll = () => {
    const rows = [...d.sales.map(s => ({ t: +new Date(s.date), d: s.date, a: t('কেনা ({0})', s.items.map(i => escHtml(i.name) + ' ' + num(i.qty)).join(', ')), v: tk(s.total - s.paid) })), ...d.payments.map(p => ({ t: +new Date(p.date), d: p.date, a: t('পরিশোধ') + (p.note ? ' — ' + escHtml(p.note) : ''), v: '−' + tk(p.amount) }))].sort((a, c) => a.t - c.t);
    printHtml(t('স্টেটমেন্ট'), `${head}${who}<h2>${t('লেনদেনের স্টেটমেন্ট')}</h2><table><thead><tr><th>${t('তারিখ')}</th><th>${t('বিবরণ')}</th><th>${t('বাকি/জমা')}</th></tr></thead><tbody>${rows.map(r => `<tr><td>${dt(r.d)}</td><td>${r.a}</td><td>${r.v}</td></tr>`).join('')}</tbody></table><div class="hr"></div><table class="t"><tr><td class="b">${t('মোট বাকি')}</td><td class="b">${tk(d.due)}</td></tr></table>`);
  };
  const remind = t('আসসালামু আলাইকুম {0}, আজিজ আর্মি জেনারেল স্টোরে আপনার মোট বাকি {1}।{2} সুবিধামতো পরিশোধ করার অনুরোধ রইল। ধন্যবাদ।', b.name, tk(d.due), d.overdue?.since ? t(' পরিশোধের তারিখ ছিল {0}।', dt(d.overdue.since)) : '');

  return (
    <div className="space-y-4">
      {/* প্রোফাইল */}
      <div className="card">
        <div className="flex flex-wrap items-start gap-4">
          <div className="relative">
            <Thumb src={b.photo} s={88} round />
            {st && <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-emerald-700 text-white shadow-lg" title={t("ছবি বদলান")}>{busy ? '…' : <I n="camera" c="w-4 h-4" />}<input type="file" accept="image/*" className="hidden" onChange={changePhoto} /></label>}
          </div>
          <div className="min-w-[200px] flex-1 space-y-0.5">
            <h1 className="h1">{b.name}</h1>
            <Row k={t("ফোন")} v={b.phone} /><Row k={t("বিকল্প ফোন")} v={b.altPhone} /><Row k={t("ঠিকানা")} v={b.address} /><Row k={t("দোকান/পেশা")} v={b.shopName} /><Row k={t("খাতার পেজ")} v={b.pageNo || t("নেই")} />
            {st && <><Row k={t("NID/জন্মনিবন্ধন")} v={b.nid} /><Row k={t("জামিনদার")} v={[b.guarantorName, b.guarantorPhone].filter(Boolean).join(' • ')} /><Row k={t("নোট")} v={b.note} /></>}
          </div>
          <div className={`w-full rounded-2xl p-4 text-center sm:w-auto sm:min-w-[200px] sm:text-right ${d.due > 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
            <div className="muted">{d.due > 0 ? t("মোট বাকি") : t("হিসাব")}</div>
            <div className={`text-3xl font-bold ${d.due > 0 ? 'text-danger' : 'text-accent'}`}>{d.due > 0 ? tk(d.due) : d.due < 0 ? t("অগ্রিম {0}", tk(-d.due)) : t("বাকি নেই")}</div>
            {d.overdue?.amount > 0 && <Badge tone="red" className="mt-1.5"><I n="clock" c="w-3 h-3" />{dt(d.overdue.since)}  {t("থেকে")} {tk(d.overdue.amount)}  {t("মেয়াদোত্তীর্ণ")}</Badge>}
            {b.creditLimit > 0 && <div className="muted mt-1.5">{t("সীমা")} {tk(b.creditLimit)}  {t("• বাকি সীমা")} {tk(Math.max(0, b.creditLimit - d.due))}</div>}
          </div>
        </div>
        {st && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
            {b.phone && <a className="btn btn-sm btn-brand-soft" href={telHref(b.phone)}><I n="phone" c="w-4 h-4" />{t("ফোন")}</a>}
            {b.phone && d.due > 0 && <a className="btn btn-sm btn-brand-soft" href={waHref(b.phone, remind)} target="_blank" rel="noreferrer"><I n="msg" c="w-4 h-4" />{t("WhatsApp তাগাদা")}</a>}
            {b.phone && d.due > 0 && <a className="btn btn-sm btn-soft" href={smsHref(b.phone, remind)}>{t("SMS তাগাদা")}</a>}
            <button className="btn btn-sm btn-soft" onClick={printAll}><I n="print" c="w-4 h-4" />{t("স্টেটমেন্ট প্রিন্ট")}</button>
            <button className="btn btn-sm btn-soft" onClick={() => setEd({ name: b.name || '', phone: b.phone || '', altPhone: b.altPhone || '', address: b.address || '', shopName: b.shopName || '', pageNo: b.pageNo || '', nid: b.nid || '', creditLimit: b.creditLimit || '', guarantorName: b.guarantorName || '', guarantorPhone: b.guarantorPhone || '', note: b.note || '' })}><I n="edit" c="w-4 h-4" />{t("তথ্য এডিট")}</button>
          </div>
        )}
      </div>

      {/* নতুন বিক্রি / পরিশোধ */}
      {st && (
        <div className="grid gap-3 sm:grid-cols-2">
          <button className="card card-hover flex items-center gap-3 text-left" onClick={() => setSellOpen(true)}><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-700 text-white"><I n="cart" c="w-5 h-5" /></span><span><b className="block">{t("নতুন পণ্য বিক্রি")}</b><span className="muted">{t("বাকিতে বা নগদে মেমো তৈরি করুন")}</span></span></button>
          <button className="card card-hover flex items-center gap-3 text-left" onClick={() => setPayOpen(true)}><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-600 text-white"><I n="wallet" c="w-5 h-5" /></span><span><b className="block">{t("বাকি পরিশোধ নিন")}</b><span className="muted">{t("জমা টাকা খাতায় তুলুন")}</span></span></button>
        </div>
      )}

      {/* লেনদেন */}
      <div className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="h2">{t("লেনদেনের তালিকা")} <span className="muted font-normal">({num(events.length)}{t("টি)")}</span></h2>
          <select className="inp !w-auto !py-1.5 text-xs" value={order} onChange={e => setOrder(e.target.value)}><option value="new">{t("নতুন আগে")}</option><option value="old">{t("পুরাতন আগে")}</option></select>
        </div>
        <div className="mb-3"><Chips value={filter} onChange={setFilter} options={[['all', t("সব")], ['sale', t("কেনা")], ['pay', t("পরিশোধ")]]} /></div>
        <div className="space-y-3">
          {events.map(e => e.type === 'sale' ? (() => {
            const s = e.s, due = s.total - s.paid;
            return (
              <div key={e.id} className="rounded-2xl border border-sky-100 bg-sky-50/40 p-3.5">
                <div className="flex flex-wrap items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 font-semibold"><I n="cart" c="w-4 h-4 text-info" />{t("কেনা")} <span className="muted font-normal">• {dt(s.date)}</span></div>
                  <div className="text-sm">{t("মোট")} <b>{tk(s.total)}</b>  {t("• নগদ")} {tk(s.paid)}  {t("• বাকি")} <b className={due > 0 ? 'text-danger' : 'text-accent'}>{tk(due)}</b></div>
                </div>
                <div className="mt-2.5 space-y-2">{s.items.map((i, x) => (
                  <div key={x} className="flex items-center gap-3 text-sm"><Thumb src={i.image} s={40} /><div className="min-w-0 flex-1"><div className="truncate font-medium">{i.name}</div><div className="muted">{num(i.qty)} {UNITS[i.unit]} × {tk(i.price)}</div></div><b>{tk(i.qty * i.price)}</b></div>))}</div>
                {(s.dueDate || s.note) && <div className="muted mt-2.5 flex flex-wrap gap-x-3">{s.dueDate && <span className="inline-flex items-center gap-1"><I n="clock" c="w-3 h-3" />{t("পরিশোধের তারিখ:")} <b>{dt(s.dueDate)}</b></span>}{s.note && <span>📝 {s.note}</span>}</div>}
                {st && <div className="mt-2.5 flex gap-2"><button className="btn btn-sm btn-soft" onClick={() => printSale(s)}><I n="print" c="w-3.5 h-3.5" />{t("মেমো")}</button>{admin && <button className="btn btn-sm btn-danger-soft" onClick={() => delSale(s)}><I n="trash" c="w-3.5 h-3.5" />{t("মুছুন")}</button>}</div>}
              </div>);
          })() : (
            <div key={e.id} className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5">
              <div><div className="flex items-center gap-2 font-semibold"><I n="wallet" c="w-4 h-4 text-accent" />{t("পরিশোধ")} <span className="muted font-normal">• {dt(e.p.date)}</span></div>{e.p.note && <div className="muted mt-0.5">{e.p.note}</div>}</div>
              <div className="flex items-center gap-2"><b className="text-accent">{tk(e.p.amount)}</b>{admin && <button className="btn btn-sm btn-danger-soft btn-icon !h-8 !w-8" aria-label={t("মুছুন")} onClick={() => delPay(e.p)}><I n="trash" c="w-3.5 h-3.5" /></button>}</div>
            </div>))}
          {!events.length && <Empty icon="book" title={t("এখনো কোনো লেনদেন নেই")} />}
        </div>
      </div>

      {/* বিক্রি মডাল */}
      <Modal open={sellOpen} onClose={() => setSellOpen(false)} title={t("{0} — নতুন বিক্রি", b.name)} wide>
        <div className="space-y-3">
          <div className="relative">
            <I n="search" c="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input className="inp pl-10" autoFocus placeholder={t("পণ্যের নাম লিখে খুঁজুন…")} value={q} onChange={e => setQ(e.target.value)} />
            {res.length > 0 && <div className="absolute inset-x-0 z-20 mt-1 max-h-60 overflow-auto rounded-xl border border-stone-200 bg-surface p-1 shadow-xl">{res.map(p => (
              <button key={p._id} disabled={!(p.stock > 0)} className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-emerald-50 disabled:opacity-40" onClick={() => addToCart(p)}><Thumb src={p.image} s={36} /><span className="min-w-0 flex-1"><span className="block truncate font-medium">{p.company} — {p.name}</span><span className="muted">{tk(p.sellPrice)}/{UNITS[p.unit]}  {t("• স্টক")} {num(p.stock)}</span></span></button>))}</div>}
          </div>
          {cart.map((i, x) => (
            <div key={i._id} className="rounded-xl border border-stone-200 p-3">
              <div className="flex items-center gap-3"><Thumb src={i.image} s={36} /><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{i.name}</div><div className="muted">{t("স্টক")} {num(i.stock)} {UNITS[i.unit]}</div></div><button className="btn btn-soft btn-icon" aria-label={t("বাদ দিন")} onClick={() => setCart(cart.filter((_, y) => y !== x))}><I n="x" c="w-4 h-4" /></button></div>
              <div className="mt-2 grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                <F l={t("পরিমাণ ({0})", UNITS[i.unit])}><input type="number" min="0" className="inp" value={i.qty} onChange={e => setItem(x, 'qty', e.target.value)} /></F>
                <F l={t("দর (৳)")}><input type="number" min="0" className="inp" value={i.price} onChange={e => setItem(x, 'price', e.target.value)} /></F>
                <div className="pb-2.5 text-right text-sm font-bold">{tk((+i.qty || 0) * (+i.price || 0))}</div>
              </div>
              {+i.qty > i.stock && <div className="mt-1 text-xs font-semibold text-danger">{t("স্টকে আছে মাত্র")} {num(i.stock)} {UNITS[i.unit]}</div>}
            </div>))}
          {!cart.length && <p className="muted py-2 text-center">{t("উপরে পণ্য খুঁজে যোগ করুন")}</p>}
          {cart.length > 0 && (
            <div className="space-y-3 border-t border-stone-100 pt-3">
              <div className="grid gap-2 sm:grid-cols-3">
                <F l={t("নগদ দিয়েছে (থাকলে)")}><input type="number" min="0" className="inp" value={paid} onChange={e => setPaid(e.target.value)} /></F>
                <F l={t("পরিশোধের প্রতিশ্রুত তারিখ")}><input type="date" min={todayStr()} className="inp" value={dueDate} onChange={e => setDueDate(e.target.value)} /></F>
                <F l={t("নোট")}><input className="inp" value={note} onChange={e => setNote(e.target.value)} /></F>
              </div>
              <div className="space-y-1 rounded-xl bg-stone-50 p-3 text-sm">
                <div className="flex justify-between"><span>{t("মোট")}</span><b>{tk(total)}</b></div>
                <div className="flex justify-between"><span>{t("এই বিক্রিতে বাকি")}</span><b className="text-danger">{tk(total - (+paid || 0))}</b></div>
                <div className="flex justify-between"><span>{t("মোট বাকি হবে")}</span><b className={overLimit ? 'text-danger' : ''}>{tk(newDue)}</b></div>
                {overLimit && <div className="font-semibold text-danger">{t("⚠ ক্রেডিট সীমা (")}{tk(b.creditLimit)}{t(") ছাড়াচ্ছে")}</div>}
              </div>
              <button className="btn w-full !py-3" disabled={busy || badStock || total <= 0 || (+paid || 0) > total} onClick={sell}>{busy ? t("অপেক্ষা করুন…") : t("বিক্রি নিশ্চিত করুন")}</button>
            </div>)}
        </div>
      </Modal>

      <Modal open={payOpen} onClose={() => setPayOpen(false)} title={t("বাকি পরিশোধ নিন")}>
        <div className="space-y-3">
          <div className="rounded-xl bg-stone-50 p-3 text-sm">{t("বর্তমান বাকি:")} <b className="text-danger">{tk(Math.max(0, d.due))}</b></div>
          <F l={t("জমা টাকা (৳)")}><input type="number" min="0" className="inp" autoFocus value={pay} onChange={e => setPay(e.target.value)} /></F>
          {d.due > 0 && <button className="chip" onClick={() => setPay(String(d.due))}>{t("পুরো বাকি (")}{tk(d.due)})</button>}
          <F l={t("নোট (ঐচ্ছিক)")}><input className="inp" value={payNote} onChange={e => setPayNote(e.target.value)} /></F>
          <button className="btn w-full" disabled={busy || !(+pay > 0)} onClick={addPay}>{t("জমা নিন")}</button>
        </div>
      </Modal>

      <Modal open={!!ed} onClose={() => setEd(null)} title={t("ক্রেতার তথ্য এডিট")} wide>
        {ed && <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2">
          <F l={t("নাম")}><input className="inp" value={ed.name} onChange={E('name')} /></F>
          <F l={t("ফোন নাম্বার")}><input className="inp" inputMode="tel" value={ed.phone} onChange={E('phone')} /></F>
          <F l={t("বিকল্প ফোন")}><input className="inp" value={ed.altPhone} onChange={E('altPhone')} /></F>
          <F l={t("ঠিকানা")}><input className="inp" placeholder={t("গ্রাম/মহল্লা, থানা, জেলা")} value={ed.address} onChange={E('address')} /></F>
          <F l={t("দোকানের নাম / পেশা")}><input className="inp" value={ed.shopName} onChange={E('shopName')} /></F>
          <F l={t("খাতার পেজ নাম্বার")}><input className="inp" value={ed.pageNo} onChange={E('pageNo')} /></F>
          <F l={t("NID / জন্মনিবন্ধন নাম্বার")}><input className="inp" value={ed.nid} onChange={E('nid')} /></F>
          <F l={t("সর্বোচ্চ বাকির সীমা (৳)")}><input type="number" min="0" className="inp" value={ed.creditLimit} onChange={E('creditLimit')} /></F>
          <F l={t("জামিনদার/রেফারেন্সের নাম")}><input className="inp" value={ed.guarantorName} onChange={E('guarantorName')} /></F>
          <F l={t("জামিনদারের ফোন")}><input className="inp" value={ed.guarantorPhone} onChange={E('guarantorPhone')} /></F>
          <F l={t("নোট (যেমন: মাসের শেষে টাকা দেয়)")} className="sm:col-span-2"><input className="inp" value={ed.note} onChange={E('note')} /></F>
        </div><button className="btn w-full" disabled={busy} onClick={saveEd}>{t("সেভ করুন")}</button></div>}
      </Modal>
    </div>
  );
}
