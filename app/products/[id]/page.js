'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, up, tk, num, dt, UNITS, DAMAGE_KINDS, newest, todayStr, isExp, telHref } from '@/lib/client';
import { useMe, useUI } from '@/components/Providers';
import PhoneList from '@/components/PhoneList';
import RestockFields, { calc } from '@/components/RestockFields';
import RecoverBox from '@/components/RecoverBox';
import { Badge, Empty, I, Modal, Stat } from '@/components/ui';
import { t } from '@/lib/i18n';

const RS = { cartons: '', perCarton: '', cartonPrice: '', extra: '', qty: '', buyTotal: '', sellPrice: '', purchaseDate: todayStr(), mfgDate: '', expiry: '' };
// সার্ভারের মতোই: মেয়াদ শেষ আগে, তারপর কম মেয়াদের ব্যাচ আগে
const order = bs => { const k = x => { const e = x.expiry ? +new Date(x.expiry) : 9e15; return e < Date.now() ? e - 1e16 : e; }; return bs.filter(x => x.remaining > 0).sort((a, b) => k(a) - k(b)); };
const F = ({ l, children, className = '' }) => <div className={className}><label className="lbl">{l}</label>{children}</div>;
const Contact = ({ label, name, phones }) => (name || phones?.length > 0) ? (
  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"><span className="badge bg-stone-100 text-stone-600">{label}</span><b>{name}</b>
    {(phones || []).map(x => <a key={x} href={telHref(x)} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-accent hover:bg-emerald-100"><I n="phone" c="w-3 h-3" />{x}</a>)}</div>
) : null;

export default function ProductPage({ params }) {
  const { me } = useMe(); const { toast, ask } = useUI();
  const [p, setP] = useState(null), [err, setErr] = useState(''), [e, setE] = useState(null), [dm, setDm] = useState(null), [rs, setRs] = useState(null), [rd, setRd] = useState(null);
  const [kindF, setKindF] = useState(''), [rc, setRc] = useState(null), [busy, setBusy] = useState(false), [upl, setUpl] = useState(false), [tab, setTab] = useState('batch');
  const st = me && ['admin', 'seller'].includes(me.role), admin = me?.role === 'admin';
  const load = () => api('/api/products/' + params.id).then(setP).catch(x => setErr(x.message));
  useEffect(() => { load(); }, []);
  // ড্যামেজ তালিকা থেকে ?expired=1 দিয়ে এলে ফর্ম নিজেই খুলবে
  useEffect(() => { if (p && st && p.batches && new URLSearchParams(location.search).get('expired') === '1' && !dm) { openDm({ kind: 'মেয়াদ শেষ' }); history.replaceState(null, '', location.pathname); } }, [p, st]);

  const U = p ? UNITS[p.unit] : '';
  const batches = p?.batches || [], allDmg = p?.damages || [], damages = allDmg.filter(x => !x.recovered);
  const totalRem = batches.reduce((s, b) => s + b.remaining, 0);
  const expiredRem = batches.filter(isExp).reduce((s, b) => s + b.remaining, 0);
  const bdate = id => dt(batches.find(b => b._id === id)?.purchaseDate);

  const openDm = (o = {}) => { const exp = o.kind === 'মেয়াদ শেষ' && !o.batchId ? expiredRem : ''; setDm({ batchId: '', kind: '', qty: exp || '', date: todayStr(), reason: '', compensation: '', compNote: '', ...o }); };
  const pickKind = k => { const n = { ...dm, kind: k }; if (k === 'মেয়াদ শেষ' && !dm.batchId && expiredRem > 0) n.qty = expiredRem; setDm(n); };
  const dmLoss = useMemo(() => {
    if (!dm || !p) return 0; let want = +dm.qty || 0, c = 0;
    for (const b of dm.batchId ? batches.filter(b => b._id === dm.batchId) : order([...batches])) { if (want <= 0) break; const q = Math.min(want, b.remaining); c += q * (b.buyUnit || 0); want -= q; }
    return c;
  }, [dm, p]);
  const dmMax = dm ? (dm.batchId ? batches.find(b => b._id === dm.batchId)?.remaining || 0 : totalRem) : 0;

  if (err) return <div className="card"><Empty icon="search" title={t("পণ্যটি পাওয়া যায়নি")} hint={err}><Link href="/" className="btn">{t("হোম পেজ")}</Link></Empty></div>;
  if (!p) return <div className="space-y-3"><div className="skel h-64" /><div className="skel h-40" /></div>;

  const rsS = k => x => setRs({ ...rs, [k]: x.target.value });
  const act = (body, done, msg) => async () => {
    setBusy(true);
    try { await api('/api/products/' + p._id, 'PATCH', body()); done(); toast(msg); load(); } catch (x) { toast(x.message, 'err'); }
    setBusy(false);
  };
  const ph = a => (a || []).map(x => String(x).trim()).filter(Boolean);
  const save = act(() => ({ name: e.name, company: e.company, companyLogo: e.companyLogo, group: e.group, category: e.category, unit: e.unit, image: e.image, srName: e.srName, srPhones: ph(e.srPhones), dsrName: e.dsrName, dsrPhones: ph(e.dsrPhones), sellPrice: +e.sellPrice, minStock: +e.minStock || 0, tiers: (e.tiers || []).filter(t => t.qty && t.price).map(t => ({ qty: +t.qty, price: +t.price })) }), () => setE(null), 'তথ্য সেভ হয়েছে');
  const dmg = act(() => ({ action: 'damage', ...dm }), () => setDm(null), 'ড্যামেজ লিস্টে যোগ হয়েছে');
  const restock = act(() => ({ action: 'restock', ...rs, buyTotal: rs.perCarton ? calc(rs).total : +rs.buyTotal }), () => setRs(null), 'স্টকে যোগ হয়েছে');
  const reduce = act(() => ({ action: 'reduce', ...rd }), () => setRd(null), 'স্টক কমানো হয়েছে');
  const recover = d => async r => { await api('/api/products/' + p._id, 'PATCH', { action: 'recover', damageId: d._id, ...r }); setRc(null); load(); };
  const openRs = () => { const l = batches[batches.length - 1], pc = l?.perCarton || '', cp = l && pc ? +((l.buyUnit || 0) * pc).toFixed(2) : ''; setRs({ ...RS, perCarton: pc, cartonPrice: cp, lastCartonPrice: cp, sellPrice: p.sellPrice || '' }); };
  const openEdit = () => setE({ ...p, minStock: p.minStock || '', srPhones: p.srPhones?.length ? p.srPhones : [''], dsrPhones: p.dsrPhones?.length ? p.dsrPhones : [''], tiers: p.tiers || [] });
  const del = async () => { if (await ask(t("“{0}” পণ্যটি সম্পূর্ণ মুছে ফেলবেন? এটা ফেরানো যাবে না।", p.name), { danger: true, yes: 'মুছুন' })) { try { await api('/api/products/' + p._id, 'DELETE'); location.href = '/products'; } catch (x) { toast(x.message, 'err'); } } };
  const pickImg = k => async x => { const f = x.target.files[0]; if (!f) return; setUpl(true); try { const url = await up(f); setE(v => ({ ...v, [k]: url })); } catch (z) { toast(z.message, 'err'); } setUpl(false); };

  const ev = st ? [
    ...batches.map(b => ({ d: b.purchaseDate || b.addedAt, c: 'bg-emerald-500', t: t('কেনা: {0} {1} — {2} (একক {3})', num(b.qty), U, tk(b.buyTotal), tk((b.buyUnit || 0).toFixed(2))) })),
    ...(p.history?.sales || []).map(s => ({ d: s.date, c: 'bg-sky-500', t: t('বিক্রি: {0} {1} × {2} — {3}{4}', num(s.qty), U, tk(s.price), s.buyer || '', s.pageNo ? t(' (পেজ {0})', s.pageNo) : '') })),
    ...(p.history?.withdrawals || []).map(w => ({ d: w.date, c: 'bg-orange-500', t: t('উত্তোলন: {0} {1} — {2}', num(w.qty), U, w.name) })),
    ...(p.history?.stockLogs || []).map(l => ({ d: l.date, c: 'bg-stone-400', t: t('স্টক কমানো (খাতায় লেখা হয়নি): {0} {1}{2}', num(l.qty), U, l.note ? ' — ' + l.note : '') })),
    ...(p.adjustments || []).map(a => ({ d: a.createdAt || a.date, c: 'bg-stone-400', t: t('স্টক কমানো (পুরনো এন্ট্রি): {0} {1}{2}', num(a.qty), U, a.note ? ' — ' + a.note : '') })),
    ...allDmg.map(x => ({ d: x.date, c: 'bg-red-500', t: t('ড্যামেজ: {0} {1}{2} ({3} এর ব্যাচ){4}', num(x.qty), U, x.kind ? ` [${t(x.kind)}]` : '', bdate(x.batchId), x.reason ? ' — ' + x.reason : '') })),
    ...allDmg.filter(x => x.recovered).map(x => ({ d: x.recoveredAt, c: 'bg-teal-500', t: t('রিকভার: {0} {1} ড্যামেজের বদলে {2}{3}', num(x.qty), U, x.recoverKind === 'money' ? t('টাকা ফেরত {0}', tk(x.recoverAmount)) : t('পণ্য বদল'), x.recoverNote ? ' — ' + x.recoverNote : '') })),
  ].sort((a, b) => new Date(b.d) - new Date(a.d)) : [];
  const dmgRows = [...damages].filter(x => !kindF || (x.kind || 'অন্যান্য') === kindF).sort(newest());
  const dmgQty = damages.reduce((s, x) => s + x.qty, 0), dmgLoss = damages.reduce((s, x) => s + (x.cost ?? x.qty * (batches.find(b => b._id === x.batchId)?.buyUnit || 0)), 0);
  const low = st && p.stock > 0 && p.minStock > 0 && p.stock <= p.minStock;
  const stockVal = batches.filter(b => b.remaining > 0).reduce((s, b) => s + b.remaining * (b.buyUnit || 0), 0);

  return (
    <div className="space-y-4">
      <Link href={st ? '/products' : '/'} className="inline-flex items-center gap-1 text-sm font-semibold text-stone-500 hover:text-accent"><I n="chev" c="w-4 h-4 rotate-180" />{t("পেছনে")}</Link>

      <div className="card flex flex-col gap-5 sm:flex-row">
        <div className="aspect-square w-full shrink-0 overflow-hidden rounded-2xl bg-stone-100 sm:w-56">
          {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : <div className="flex h-full w-full items-center justify-center text-stone-300"><I n="box" c="h-16 w-16" /></div>}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex items-center gap-2 text-sm text-stone-500">{p.companyLogo && <img src={p.companyLogo} alt="" className="h-8 w-8 object-contain" />}<span>{p.company}{p.group && t(" • গ্রুপ: {0}", p.group)}{p.category && ` • ${p.category}`}</span></div>
          <h1 className="h1">{p.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-3xl font-bold text-accent">{tk(p.sellPrice)}<span className="ml-1 text-sm font-medium text-stone-400">/ {U}</span></span>
            {p.stock > 0 ? <Badge tone="green">{t("স্টকে আছে:")} {num(p.stock)} {U}</Badge> : <Badge tone="red">{t("স্টক শেষ")}</Badge>}
            {low && <Badge tone="amber">{t("স্টক কম (সীমা")} {num(p.minStock)})</Badge>}
          </div>
          {p.tiers?.length > 0 && <div className="rounded-xl bg-stone-50 p-3 text-sm"><b>{t("দামের তালিকা")}</b>{p.tiers.map((t, i) => <div key={i} className="mt-0.5 flex justify-between"><span>{num(t.qty)} {U}</span><b>{tk(t.price)}</b></div>)}</div>}
          {st && <div className="space-y-1.5"><Contact label="SR" name={p.srName} phones={p.srPhones} /><Contact label="DSR" name={p.dsrName} phones={p.dsrPhones} /></div>}
          {st && (
            <div className="flex flex-wrap gap-2 pt-1">
              <button className="btn btn-sm" onClick={openRs}><I n="plus" c="w-4 h-4" />{t("নতুন কেনা")}</button>
              <button className="btn btn-sm btn-soft" onClick={() => setRd({ qty: '', date: todayStr(), note: '' })}><I n="minus" c="w-4 h-4" />{t("স্টক কমান")}</button>
              <button className="btn btn-sm btn-danger-soft" onClick={() => openDm()}><I n="alert" c="w-4 h-4" />{t("ড্যামেজ")}</button>
              <button className="btn btn-sm btn-soft" onClick={openEdit}><I n="edit" c="w-4 h-4" />{t("এডিট")}</button>
              {admin && <button className="btn btn-sm btn-danger-soft" onClick={del}><I n="trash" c="w-4 h-4" />{t("মুছুন")}</button>}
            </div>
          )}
        </div>
      </div>

      {st && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label={t("বর্তমান স্টক")} value={`${num(p.stock)} ${U}`} icon="box" tone="blue" />
            <Stat label={t("স্টকের মূল্য (কেনা-দামে)")} value={tk(Math.round(stockVal))} icon="wallet" tone="green" />
            <Stat label={t("মোট বিক্রি")} value={`${num(p.sold)} ${U}`} icon="trend" tone="gray" />
            <Stat label={t("ড্যামেজ ক্ষতি")} value={tk(Math.round(dmgLoss))} sub={`${num(dmgQty)} ${U}`} icon="alert" tone={dmgQty ? 'red' : 'gray'} />
          </div>

          {expiredRem > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-sm text-danger"><I n="clock" c="w-5 h-5" /><span><b>{num(expiredRem)} {U}</b>  {t("মেয়াদ উত্তীর্ণ — ড্যামেজ এন্ট্রি করা হয়নি")}</span></div>
              <button className="btn btn-danger btn-sm" onClick={() => openDm({ kind: 'মেয়াদ শেষ' })}>{t("ড্যামেজ করুন")}</button>
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto">{[['batch', t("কেনার ব্যাচ")], ['dmg', t("ড্যামেজ ({0})", num(damages.length))], ['hist', t("কেনাবেচার ইতিহাস")]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`chip ${tab === k ? 'chip-on' : ''}`}>{l}</button>)}</div>

          {tab === 'batch' && (
            <div className="card overflow-x-auto !p-0">
              <table className="tbl whitespace-nowrap">
                <thead><tr><th>{t("কেনা")}</th><th>{t("উৎপাদন")}</th><th>{t("মেয়াদ")}</th><th>{t("কেনা পরিমাণ")}</th><th>{t("বিক্রি")}</th><th>{t("উত্তোলন")}</th><th>{t("ড্যামেজ")}</th><th>{t("বাকি")}</th><th>{t("কেনা/একক")}</th><th>{t("মোট কেনা")}</th><th /></tr></thead>
                <tbody>{[...batches].sort((a, b) => new Date(b.purchaseDate || b.addedAt) - new Date(a.purchaseDate || a.addedAt) || (String(b._id) < String(a._id) ? -1 : 1)).map(b => {
                  const ex = isExp(b), dq = damages.filter(d => d.batchId === b._id).reduce((s, d) => s + d.qty, 0);
                  return (
                    <tr key={b._id} className={ex && b.remaining > 0 ? '!bg-red-50' : ''}>
                      <td>{dt(b.purchaseDate || b.addedAt)}</td><td>{dt(b.mfgDate) || '-'}</td>
                      <td>{dt(b.expiry) || '-'}{ex && <Badge tone="red" className="ml-1">{t("শেষ")}</Badge>}</td>
                      <td>{num(b.qty)}{b.cartons > 0 && <span className="muted"> ({num(b.cartons)}  {t("কার্টুন")}{b.extra ? ` + ${num(b.extra)}` : ''})</span>}</td>
                      <td>{num(b.sold || 0)}</td><td>{num(b.withdrawn || 0)}</td><td>{num(dq)}</td><td><b>{num(b.remaining)}</b></td>
                      <td>{tk((b.buyUnit || 0).toFixed(2))}</td><td>{tk(b.buyTotal)}</td>
                      <td>{b.remaining > 0 && <button className="btn btn-sm btn-soft" onClick={() => openDm({ batchId: b._id, qty: b.remaining, kind: ex ? 'মেয়াদ শেষ' : '' })}>{t("ড্যামেজ")}</button>}</td>
                    </tr>);
                })}</tbody>
              </table>
            </div>
          )}

          {tab === 'dmg' && (
            <div className="card">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="muted">{t("মোট")} {num(dmgQty)} {U}  {t("• ক্ষতি")} <b className="text-danger">{tk(Math.round(dmgLoss))}</b></div>
                {damages.length > 0 && <select className="inp !w-auto !py-1.5 text-xs" value={kindF} onChange={x => setKindF(x.target.value)}><option value="">{t("সব কারণ")}</option>{DAMAGE_KINDS.map(k => <option key={k} value={k}>{t(k)}</option>)}</select>}
              </div>
              <div className="divide-y divide-stone-100">{dmgRows.map(d => (
                <div key={d._id} className="py-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <div>{d.kind && <Badge tone="red" className="mr-1.5">{t(d.kind)}</Badge>}{d.reason || (!d.kind && t("কারণ নেই"))} <span className="muted">({bdate(d.batchId)}  {t("তারিখে কেনা ব্যাচ)")}</span>{d.compensation && <div className="muted mt-0.5">{d.compensation === 'money' ? t("টাকা ফেরত") : t("পণ্য বদল")}: {d.compNote}</div>}</div>
                    <div className="shrink-0 text-right"><b>{num(d.qty)} {U}</b><div className="muted">{dt(d.date)}</div><button className="btn btn-sm btn-brand-soft mt-1" onClick={() => setRc(rc === d._id ? null : d._id)}><I n="refresh" c="w-3.5 h-3.5" />{t("রিকভার")}</button></div>
                  </div>
                  {rc === d._id && <RecoverBox cost={d.cost} onSave={recover(d)} onCancel={() => setRc(null)} />}
                </div>))}</div>
              {!dmgRows.length && <Empty icon="check" title={t("কোনো ড্যামেজ নেই")} />}
            </div>
          )}

          {tab === 'hist' && (
            <div className="card">
              {ev.length ? <ol className="relative space-y-3 border-l-2 border-stone-100 pl-5">{ev.map((x, i) => (
                <li key={i} className="relative text-sm"><i className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-surface ${x.c}`} /><div className="muted">{dt(x.d)}</div><div>{x.t}</div></li>))}</ol> : <Empty icon="clock" title={t("কোনো ইতিহাস নেই")} />}
            </div>
          )}
        </>
      )}

      {/* --- মডাল ফর্মগুলো --- */}
      <Modal open={!!rs} onClose={() => setRs(null)} title={t("নতুন পণ্য কেনা (স্টকে যোগ)")} wide>
        {rs && <><div className="grid gap-3 sm:grid-cols-2"><RestockFields f={rs} s={rsS} /></div><button className="btn mt-4 w-full" disabled={busy} onClick={restock}>{t("স্টকে যোগ করুন")}</button></>}
      </Modal>

      <Modal open={!!rd} onClose={() => setRd(null)} title={t("স্টক কমান")}>
        {rd && <div className="space-y-3">
          <p className="muted">{t("বিক্রি হয়েছে কিন্তু খাতায় লেখা হয়নি — এখানে লিখলে স্টক থেকে কমবে ও ইতিহাসে জমা থাকবে।")}</p>
          <F l={t("কতটি বিক্রি হয়েছে ({0})", U)}><input type="number" min="0" className="inp" autoFocus value={rd.qty} onChange={x => setRd({ ...rd, qty: x.target.value })} /></F>
          <F l={t("তারিখ")}><input type="date" className="inp" value={rd.date} onChange={x => setRd({ ...rd, date: x.target.value })} /></F>
          <F l={t("নোট (ঐচ্ছিক)")}><input className="inp" value={rd.note} onChange={x => setRd({ ...rd, note: x.target.value })} /></F>
          <div className="rounded-xl bg-stone-50 p-3 text-sm">{t("বর্তমান স্টক:")} <b>{num(p.stock)} {U}</b>{+rd.qty > 0 && <>  {t("→ কমার পর:")} <b className={p.stock - rd.qty < 0 ? 'text-danger' : ''}>{num(p.stock - rd.qty)} {U}</b></>}</div>
          <button className="btn btn-danger w-full" disabled={busy} onClick={reduce}>{t("স্টক কমান")}</button>
        </div>}
      </Modal>

      <Modal open={!!dm} onClose={() => setDm(null)} title={t("ড্যামেজ এন্ট্রি")} wide>
        {dm && <div className="space-y-4">
          <div><label className="lbl">{t("কেন ড্যামেজ হলো? (একটি বেছে নিন)")}</label><div className="flex flex-wrap gap-1.5">{DAMAGE_KINDS.map(k => <button key={k} type="button" onClick={() => pickKind(k)} className={`chip ${dm.kind === k ? 'chip-on-red' : ''}`}>{t(k)}</button>)}</div></div>
          <div className="grid gap-3 sm:grid-cols-2">
            <F l={t("কোন ব্যাচ থেকে")}><select className="inp" value={dm.batchId} onChange={x => setDm({ ...dm, batchId: x.target.value, qty: x.target.value ? batches.find(b => b._id === x.target.value)?.remaining : dm.qty })}><option value="">{t("স্বয়ংক্রিয় (মেয়াদ শেষ/কম মেয়াদ আগে)")}</option>{batches.filter(b => b.remaining > 0).map(b => <option key={b._id} value={b._id}>{dt(b.purchaseDate || b.addedAt)}  {t("এর ব্যাচ — বাকি")} {num(b.remaining)}{isExp(b) ? t(" (মেয়াদ শেষ)") : ''}</option>)}</select></F>
            <F l={t("পরিমাণ ({0}) — সর্বোচ্চ {1}", U, num(dmMax))}><input type="number" min="0" className="inp" value={dm.qty} onChange={x => setDm({ ...dm, qty: x.target.value })} /></F>
            <F l={t("তারিখ")}><input type="date" className="inp" value={dm.date} onChange={x => setDm({ ...dm, date: x.target.value })} /></F>
            <F l={t("বিস্তারিত কারণ{0}", dm.kind === 'অন্যান্য' ? ' (আবশ্যক)' : ' (ঐচ্ছিক)')}><input className="inp" placeholder={t("যেমন: গুদামের পেছনে ইঁদুর ঢুকেছিল")} value={dm.reason} onChange={x => setDm({ ...dm, reason: x.target.value })} /></F>
            <F l={t("বিনিময়")}><select className="inp" value={dm.compensation} onChange={x => setDm({ ...dm, compensation: x.target.value })}><option value="">{t("কিছু পাইনি")}</option><option value="money">{t("টাকা ফেরত")}</option><option value="product">{t("পণ্য বদল")}</option></select></F>
            <F l={t("বিনিময়ের বিবরণ")}><input className="inp" value={dm.compNote} onChange={x => setDm({ ...dm, compNote: x.target.value })} /></F>
          </div>
          <div className="rounded-xl bg-stone-50 p-3 text-sm">{t("মোট স্টক (মেয়াদ শেষসহ):")} <b>{num(totalRem)} {U}</b>{+dm.qty > 0 && <>  {t("• আনুমানিক ক্ষতি:")} <b className="text-danger">{tk(Math.round(dmLoss))}</b></>}</div>
          <button className="btn btn-danger w-full" disabled={busy} onClick={dmg}>{t("ড্যামেজ লিস্টে যোগ করুন")}</button>
        </div>}
      </Modal>

      <Modal open={!!e} onClose={() => setE(null)} title={t("পণ্যের তথ্য এডিট")} wide>
        {e && <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <F l={t("পণ্যের নাম")}><input className="inp" value={e.name} onChange={x => setE({ ...e, name: x.target.value })} /></F>
            <F l={t("কোম্পানি")}><input className="inp" value={e.company} onChange={x => setE({ ...e, company: x.target.value })} /></F>
            <F l={t("গ্রুপ (ঐচ্ছিক)")}><input className="inp" value={e.group || ''} onChange={x => setE({ ...e, group: x.target.value })} /></F>
            <F l={t("ক্যাটাগরি")}><input className="inp" value={e.category || ''} onChange={x => setE({ ...e, category: x.target.value })} /></F>
            <F l={t("বিক্রয় মূল্য (প্রতি একক)")}><input type="number" min="0" className="inp" value={e.sellPrice} onChange={x => setE({ ...e, sellPrice: x.target.value })} /></F>
            <F l={t("স্টক কম সতর্কতা (এর নিচে নামলে)")}><input type="number" min="0" className="inp" placeholder={t("০ = বন্ধ")} value={e.minStock} onChange={x => setE({ ...e, minStock: x.target.value })} /></F>
            <F l={t("কোম্পানির লোগো")}><div className="flex items-center gap-2">{e.companyLogo && <img src={e.companyLogo} alt="" className="h-10 w-10 object-contain" />}<input type="file" accept="image/*" onChange={pickImg('companyLogo')} /></div></F>
            <F l={t("পণ্যের ছবি")}><div className="flex items-center gap-2">{e.image && <img src={e.image} alt="" className="h-10 w-10 rounded-lg object-cover" />}<input type="file" accept="image/*" onChange={pickImg('image')} /></div></F>
            <PhoneList label={t("এস আর (SR)")} name={e.srName} onName={v => setE({ ...e, srName: v })} phones={e.srPhones} onPhones={v => setE({ ...e, srPhones: v })} />
            <PhoneList label={t("ডি এস আর (DSR)")} name={e.dsrName} onName={v => setE({ ...e, dsrName: v })} phones={e.dsrPhones} onPhones={v => setE({ ...e, dsrPhones: v })} />
          </div>
          <div><label className="lbl">{t("দামের তালিকা (যেমন ১ কেজি = ১২০, ২ কেজি = ২৩৫)")}</label>
            {(e.tiers || []).map((tier, i) => <div key={i} className="mb-1.5 flex gap-2"><input type="number" className="inp" placeholder={t("পরিমাণ")} value={tier.qty} onChange={x => { const n = [...e.tiers]; n[i] = { ...tier, qty: x.target.value }; setE({ ...e, tiers: n }); }} /><input type="number" className="inp" placeholder={t("দাম")} value={tier.price} onChange={x => { const n = [...e.tiers]; n[i] = { ...tier, price: x.target.value }; setE({ ...e, tiers: n }); }} /><button className="btn btn-soft btn-icon" aria-label={t("মুছুন")} onClick={() => setE({ ...e, tiers: e.tiers.filter((_, j) => j !== i) })}><I n="x" c="w-4 h-4" /></button></div>)}
            <button className="btn btn-sm btn-brand-soft" onClick={() => setE({ ...e, tiers: [...(e.tiers || []), { qty: '', price: '' }] })}><I n="plus" c="w-4 h-4" />{t("দামের ধাপ")}</button></div>
          <button className="btn w-full" disabled={busy || upl} onClick={save}>{upl ? t("ছবি আপলোড হচ্ছে…") : t("সেভ করুন")}</button>
        </div>}
      </Modal>
    </div>
  );
}
