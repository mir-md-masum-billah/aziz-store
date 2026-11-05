'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, tk, num, dt, telHref, todayStr, downloadCsv } from '@/lib/client';
import { useMe, useUI } from '@/components/Providers';
import { Badge, Chips, Empty, I, PageHead, SearchBox, Skeletons, Stat, Thumb } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function Due() {
  const { me, ready } = useMe(); const { toast } = useUI();
  const [q, setQ] = useState(''), [l, setL] = useState(null), [f, setF] = useState('all'), [sort, setSort] = useState('recent');
  useEffect(() => { const t = setTimeout(() => api('/api/buyers?q=' + encodeURIComponent(q)).then(setL).catch(e => { toast(e.message, 'err'); setL([]); }), 300); return () => clearTimeout(t); }, [q]);

  const shown = useMemo(() => {
    let r = (l || []).filter(b => f === 'all' || (f === 'due' && b.due > 0) || (f === 'over' && b.overdue > 0) || (f === 'clear' && !(b.due > 0)));
    if (sort === 'due') r = [...r].sort((a, b) => b.due - a.due);
    if (sort === 'name') r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [l, f, sort]);
  const totalDue = (l || []).reduce((s, b) => s + Math.max(0, b.due), 0), nDue = (l || []).filter(b => b.due > 0).length, nOver = (l || []).filter(b => b.overdue > 0).length;
  const exportCsv = () => downloadCsv(`${t('বাকির-তালিকা')}-${todayStr()}.csv`, [['নাম', 'ফোন', 'পেজ', 'ঠিকানা', 'মোট বাকি', 'মেয়াদোত্তীর্ণ'], ...shown.map(b => [b.name, b.phone, b.pageNo, b.address, Math.max(0, b.due), b.overdue])]);

  if (ready && !['admin', 'seller'].includes(me?.role)) return <div className="card"><Empty icon="lock" title={t("অনুমতি নেই")} /></div>;

  return (
    <div className="space-y-4">
      <PageHead title={t("বাকির খাতা")} sub={t("ক্রেতা বেছে বাকিতে বিক্রি বা পরিশোধ নিন")}>
        <button className="btn btn-sm btn-soft" onClick={exportCsv} disabled={!shown.length}><I n="download" c="w-4 h-4" />CSV</button>
      </PageHead>
      <div className="grid grid-cols-3 gap-3">
        <Stat label={t("মোট বাকি")} value={l ? tk(totalDue) : '…'} tone="red" icon="book" />
        <Stat label={t("বাকিদার")} value={l ? num(nDue) : '…'} tone="amber" icon="users" />
        <Stat label={t("তারিখ পেরিয়েছে")} value={l ? num(nOver) : '…'} tone={nOver ? 'red' : 'green'} icon="clock" />
      </div>
      <SearchBox value={q} onChange={setQ} placeholder={t("পেজ নাম্বার / ফোন / নাম / ঠিকানা দিয়ে খুঁজুন…")} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Chips value={f} onChange={setF} options={[['all', t("সবাই")], ['due', t("বাকি আছে")], ['over', t("তারিখ পেরিয়েছে")], ['clear', t("বাকি নেই")]]} />
        <select className="inp !w-auto !py-1.5 text-xs" value={sort} onChange={e => setSort(e.target.value)} aria-label={t("সাজান")}><option value="recent">{t("সর্বশেষ লেনদেন")}</option><option value="due">{t("বেশি বাকি আগে")}</option><option value="name">{t("নাম অনুযায়ী")}</option></select>
      </div>
      {l === null ? <Skeletons n={6} h="h-24" cols="sm:grid-cols-2 md:grid-cols-3" /> : shown.length ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">{shown.map(b => (
          <div key={b._id} className="card card-hover relative !p-0">
            <Link href={'/buyers/' + b._id} className="flex items-center gap-3 p-4">
              <Thumb src={b.photo} s={52} round />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-stone-900">{b.name}</div>
                <div className="muted truncate">{t("পেজ:")} {b.pageNo || '-'} • {b.phone}</div>
                {b.address && <div className="muted flex items-center gap-1 truncate"><I n="pin" c="w-3 h-3 shrink-0" />{b.address}</div>}
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={`text-sm font-bold ${b.due > 0 ? 'text-danger' : 'text-accent'}`}>{b.due > 0 ? t("বাকি {0}", tk(b.due)) : t("বাকি নেই")}</span>
                  {b.overdue > 0 && <Badge tone="red">{t("তারিখ পেরিয়েছে")}</Badge>}
                </div>
              </div>
            </Link>
            {b.phone && <a href={telHref(b.phone)} className="btn btn-brand-soft btn-icon absolute right-3 top-3" aria-label={t("ফোন করুন")}><I n="phone" c="w-4 h-4" /></a>}
          </div>))}</div>
      ) : <div className="card"><Empty icon="users" title={t("কোনো ক্রেতা পাওয়া যায়নি")} hint={t("ক্রেতারা নিজে রেজিস্টার করতে পারে, অথবা অ্যাডমিন ইউজার পেজ থেকে অ্যাকাউন্ট বানাতে পারেন")} /></div>}
    </div>
  );
}
