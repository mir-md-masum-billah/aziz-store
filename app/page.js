'use client';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/client';
import ProductCard from '@/components/ProductCard';
import { Chips, Empty, I, SearchBox, Skeletons } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function Home() {
  const [top, setTop] = useState([]), [all, setAll] = useState(null), [cats, setCats] = useState([]);
  const [q, setQ] = useState(''), [cat, setCat] = useState(''), [sort, setSort] = useState('name'), [inStock, setInStock] = useState(false);

  useEffect(() => { api('/api/products?top=1').then(setTop).catch(() => {}); api('/api/categories').then(setCats).catch(() => {}); }, []);
  useEffect(() => {
    const t = setTimeout(() => api(`/api/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`).then(setAll).catch(() => setAll([])), 300);
    return () => clearTimeout(t);
  }, [q, cat]);

  const list = useMemo(() => {
    let l = (all || []).filter(p => !inStock || p.stock > 0);
    if (sort === 'low') l = [...l].sort((a, b) => a.sellPrice - b.sellPrice);
    if (sort === 'high') l = [...l].sort((a, b) => b.sellPrice - a.sellPrice);
    return l;
  }, [all, sort, inStock]);
  const hot = top.filter(p => p.sold > 0 && p.stock > 0);

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 p-6 text-white shadow-card sm:p-10">
        <div className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10" />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur"><I n="store" c="w-3.5 h-3.5" />{t("বিশ্বস্ত পাড়ার দোকান")}</span>
          <h1 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">{t("আজিজ আর্মি জেনারেল স্টোর")}</h1>
          <p className="mt-2 text-white/90">{t("সব ধরনের মুদি ও জেনারেল পণ্য — সঠিক দামে, সবসময়।")}</p>
          <div className="relative mt-5 max-w-md">
            <I n="search" c="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <input className="w-full rounded-2xl border-0 bg-surface py-3.5 pl-12 pr-4 text-sm text-stone-800 shadow-lg placeholder:text-stone-400 focus:outline-none focus:ring-4 focus:ring-white/30" placeholder={t("পণ্য বা কোম্পানির নাম খুঁজুন…")} value={q} onChange={e => setQ(e.target.value)} />
          </div>
        </div>
      </section>

      {hot.length > 0 && !q && !cat && (
        <section>
          <h2 className="h2 mb-3 flex items-center gap-2"><I n="flame" c="w-5 h-5 text-orange-500" />{t("বেশি বিক্রি হচ্ছে")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">{hot.slice(0, 4).map(p => <ProductCard key={p._id} p={p} />)}</div>
        </section>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="h2">{t("সব পণ্য")} {all && <span className="muted font-normal">({list.length}{t("টি)")}</span>}</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setInStock(!inStock)} className={`chip ${inStock ? 'chip-on' : ''}`}>{t("শুধু স্টকে আছে")}</button>
            <select className="inp !w-auto !py-1.5 text-xs" value={sort} onChange={e => setSort(e.target.value)} aria-label={t("সাজান")}>
              <option value="name">{t("নাম অনুযায়ী")}</option><option value="low">{t("দাম: কম → বেশি")}</option><option value="high">{t("দাম: বেশি → কম")}</option>
            </select>
          </div>
        </div>
        {cats.length > 0 && <div className="mb-4"><Chips value={cat} onChange={setCat} options={[['', t("সব")], ...cats.map(c => [c, c])]} /></div>}
        {all === null ? <Skeletons n={10} /> : list.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">{list.map(p => <ProductCard key={p._id} p={p} />)}</div>
        ) : <div className="card"><Empty icon="search" title={t("কোনো পণ্য পাওয়া যায়নি")} hint={t("অন্য নামে বা অন্য ক্যাটাগরিতে খুঁজে দেখুন")} /></div>}
      </section>
    </div>
  );
}
