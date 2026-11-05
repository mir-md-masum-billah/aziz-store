'use client';
import { useEffect, useMemo, useState } from 'react';
import { api, up, tk, num, UNITS, todayStr, downloadCsv } from '@/lib/client';
import { useMe, useUI } from '@/components/Providers';
import PhoneList from '@/components/PhoneList';
import BatchFields from '@/components/BatchFields';
import ProductCard from '@/components/ProductCard';
import Suggest from '@/components/Suggest';
import { Chips, Empty, I, PageHead, SearchBox, Skeletons, Stat } from '@/components/ui';
import { t } from '@/lib/i18n';

const blank = () => ({ company: '', companyLogo: '', group: '', name: '', srName: '', srPhones: [''], dsrName: '', dsrPhones: [''], unit: 'pcs', image: '', category: '', cartons: '', perCarton: '', extra: '', qty: '', buyTotal: '', sellPrice: '', minStock: '', purchaseDate: todayStr(), mfgDate: '', expiry: '' });
const STOCK = [['', 'সব'], ['low', 'স্টক কম'], ['out', 'স্টক শেষ'], ['exp', 'মেয়াদ সমস্যা']];

export default function Products() {
  const { me, ready } = useMe(); const { toast } = useUI();
  const [list, setList] = useState(null), [q, setQ] = useState(''), [f, setF] = useState(blank), [co, setCo] = useState([]), [cats, setCats] = useState([]);
  const [show, setShow] = useState(false), [cat, setCat] = useState(''), [sf, setSf] = useState(''), [busy, setBusy] = useState(false), [upl, setUpl] = useState('');

  const load = () => api('/api/products?q=' + encodeURIComponent(q)).then(setList).catch(e => { toast(e.message, 'err'); setList([]); });
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [q]);
  useEffect(() => { if (new URLSearchParams(location.search).get('new') === '1') setShow(true); }, []);
  useEffect(() => { api('/api/categories').then(setCats).catch(() => {}); if (show) api('/api/companies').then(setCo).catch(() => {}); }, [show]);

  const s = k => e => setF({ ...f, [k]: e.target.value });
  const known = co.find(c => c.name.toLowerCase() === f.company.trim().toLowerCase()), logo = f.companyLogo || known?.logo;
  const pickImg = k => async e => { const file = e.target.files[0]; if (!file) return; setUpl(k); try { setF(x => ({ ...x, [k]: '' })); const url = await up(file); setF(x => ({ ...x, [k]: url })); } catch (x) { toast(x.message, 'err'); } setUpl(''); };
  const add = async e => {
    e.preventDefault(); setBusy(true);
    try { await api('/api/products', 'POST', f); toast(t("পণ্য সংরক্ষিত হয়েছে")); setF(blank()); setShow(false); load(); } catch (x) { toast(x.message, 'err'); }
    setBusy(false);
  };

  const shown = useMemo(() => (list || []).filter(p => (!cat || (p.category || '').toLowerCase() === cat.toLowerCase()) && (
    !sf || (sf === 'out' && !(p.stock > 0)) || (sf === 'low' && p.stock > 0 && p.minStock > 0 && p.stock <= p.minStock) || (sf === 'exp' && (p.expiredQty > 0 || p.soonQty > 0)))), [list, cat, sf]);
  const stockCost = shown.reduce((a, p) => a + (p.stockCost || 0), 0);
  const exportCsv = () => downloadCsv(`${t('পণ্য-তালিকা')}-${todayStr()}.csv`, [['কোম্পানি', 'গ্রুপ', 'পণ্য', 'ক্যাটাগরি', 'একক', 'স্টক', 'বিক্রয় মূল্য', 'স্টকের কেনা-মূল্য'], ...shown.map(p => [p.company, p.group, p.name, p.category, UNITS[p.unit], p.stock, p.sellPrice, p.stockCost])]);

  if (ready && !['admin', 'seller'].includes(me?.role)) return <div className="card"><Empty icon="lock" title={t("অনুমতি নেই")} hint={t("এই পেজ শুধু অ্যাডমিন ও বিক্রেতার জন্য")} /></div>;

  return (
    <div className="space-y-4">
      <PageHead title={t("পণ্য ও স্টক")} sub={list && t("{0}টি পণ্য", num(shown.length))}>
        <button className="btn btn-soft btn-sm" onClick={exportCsv} disabled={!shown.length}><I n="download" c="w-4 h-4" />CSV</button>
        <button className="btn" onClick={() => setShow(!show)}><I n={show ? 'x' : 'plus'} c="w-4 h-4" />{show ? t("বন্ধ করুন") : t("নতুন পণ্য / স্টক")}</button>
      </PageHead>

      {show && (
        <form onSubmit={add} className="card animate-up grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="muted rounded-xl bg-emerald-50 px-3 py-2 text-accent sm:col-span-2 lg:col-span-3">{t("💡 আগের পণ্য হলে কোম্পানি ও নাম হুবহু মিললে নতুন ব্যাচ হিসেবে স্টকে যোগ হবে।")}</div>
          <Suggest label={t("কোম্পানির নাম *")} value={f.company} onChange={v => setF({ ...f, company: v })} items={co} />
          <div><label className="lbl">{t("কোম্পানির লোগো")}</label><div className="flex items-center gap-2">{logo && <img src={logo} alt="" className="h-10 w-10 rounded-lg border object-contain" />}<input type="file" accept="image/*" onChange={pickImg('companyLogo')} /></div>{upl === 'companyLogo' && <div className="muted mt-1">{t("আপলোড হচ্ছে…")}</div>}</div>
          <div><label className="lbl">{t("গ্রুপের নাম (ঐচ্ছিক)")}</label><input className="inp" value={f.group} onChange={s('group')} /></div>
          <div><label className="lbl">{t("পণ্যের নাম *")}</label><input className="inp" value={f.name} onChange={s('name')} required /></div>
          <div><label className="lbl">{t("বিক্রির একক")}</label><select className="inp" value={f.unit} onChange={s('unit')}>{Object.entries(UNITS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
          <Suggest label={t("ক্যাটাগরি")} placeholder={t("তেল, ডিম, চাল…")} value={f.category} onChange={v => setF({ ...f, category: v })} items={cats.map(n => ({ name: n }))} />
          <PhoneList label={t("এস আর (SR)")} name={f.srName} onName={v => setF({ ...f, srName: v })} phones={f.srPhones} onPhones={v => setF({ ...f, srPhones: v })} />
          <PhoneList label={t("ডি এস আর (DSR)")} name={f.dsrName} onName={v => setF({ ...f, dsrName: v })} phones={f.dsrPhones} onPhones={v => setF({ ...f, dsrPhones: v })} />
          <div><label className="lbl">{t("পণ্যের ছবি")}</label><input type="file" accept="image/*" onChange={pickImg('image')} />{upl === 'image' && <div className="muted mt-1">{t("আপলোড হচ্ছে…")}</div>}{f.image && <img src={f.image} alt="" className="mt-2 h-16 w-16 rounded-xl object-cover" />}</div>
          <BatchFields f={f} s={s} />
          <div className="sm:col-span-2 lg:col-span-3"><button className="btn w-full sm:w-auto" disabled={busy || !!upl}>{busy ? t("সংরক্ষণ হচ্ছে…") : t("সংরক্ষণ করুন")}</button></div>
        </form>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label={t("দেখানো পণ্যের স্টক-মূল্য (কেনা-দামে)")} value={tk(stockCost)} icon="box" tone="blue" />
      </div>

      <div className="space-y-3">
        <SearchBox value={q} onChange={setQ} placeholder={t("পণ্য, কোম্পানি বা ক্যাটাগরি খুঁজুন…")} />
        <Chips value={sf} onChange={setSf} options={STOCK} on="chip-on" />
        {cats.length > 0 && <Chips value={cat} onChange={setCat} options={[['', t("সব ক্যাটাগরি")], ...cats.map(c => [c, c])]} />}
      </div>

      {list === null ? <Skeletons n={10} /> : shown.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{shown.map(p => <ProductCard key={p._id} p={p} />)}</div>
      ) : <div className="card"><Empty icon="box" title={t("কোনো পণ্য নেই")} hint={t("উপরের “নতুন পণ্য / স্টক” বাটন দিয়ে যোগ করুন")} /></div>}
    </div>
  );
}
