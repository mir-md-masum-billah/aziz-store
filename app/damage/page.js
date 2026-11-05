'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { api, tk, num, dt, UNITS, DAMAGE_KINDS, newest } from '@/lib/client';
import { useMe, useUI } from '@/components/Providers';
import RecoverBox from '@/components/RecoverBox';
import { Badge, Chips, Empty, I, PageHead, SearchBox, Stat, Thumb } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function Damage() {
  const { me, ready } = useMe(); const { toast } = useUI();
  const [rc, setRc] = useState(null), [q, setQ] = useState(''), [d, setD] = useState(null), [kind, setKind] = useState(''), [order, setOrder] = useState('new');
  const load = () => api('/api/damage?company=' + encodeURIComponent(q)).then(setD).catch(e => { toast(e.message, 'err'); setD({ expired: [], records: [] }); });
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q]);
  const recover = x => async r => { await api('/api/products/' + x.productId, 'PATCH', { action: 'recover', damageId: x._id, ...r }); setRc(null); load(); };
  const rows = useMemo(() => { const l = (d?.records || []).filter(r => !kind || (r.kind || 'অন্যান্য') === kind); l.sort(order === 'new' ? newest() : (a, b) => newest()(b, a)); return l; }, [d, kind, order]);
  const loss = rows.reduce((s, r) => s + (r.cost || 0), 0), expLoss = (d?.expired || []).reduce((s, x) => s + x.cost, 0);

  if (ready && !['admin', 'seller'].includes(me?.role)) return <div className="card"><Empty icon="lock" title={t("অনুমতি নেই")} /></div>;
  return (
    <div className="space-y-4">
      <PageHead title={t("ড্যামেজ")} sub={t("নষ্ট, মেয়াদোত্তীর্ণ ও হারানো মালের হিসাব")} />
      <div className="grid grid-cols-2 gap-3">
        <Stat label={t("মোট ড্যামেজ ক্ষতি")} value={d ? tk(Math.round(loss)) : '…'} sub={d && t("{0}টি রেকর্ড", num(rows.length))} tone="red" icon="alert" />
        <Stat label={t("মেয়াদ শেষ, এন্ট্রি বাকি")} value={d ? tk(expLoss) : '…'} sub={d && t("{0}টি ব্যাচ", num(d.expired.length))} tone={expLoss ? 'amber' : 'green'} icon="clock" />
      </div>
      <SearchBox value={q} onChange={setQ} placeholder={t("কোম্পানি বা পণ্যের নাম দিয়ে খুঁজুন…")} />

      <section className="card !border-red-200">
        <h2 className="h2 mb-3 flex items-center gap-2 text-danger"><I n="clock" c="w-5 h-5" />{t("মেয়াদ উত্তীর্ণ — ড্যামেজ এন্ট্রি বাকি (")}{num(d?.expired.length || 0)})</h2>
        <div className="divide-y divide-stone-100">{(d?.expired || []).map(x => (
          <div key={x.batchId} className="flex items-center gap-3 py-2.5 text-sm">
            <Thumb src={x.image} s={44} />
            <div className="min-w-0 flex-1"><div className="truncate font-semibold">{x.company} — {x.name}</div><div className="muted">{num(x.remaining)} {UNITS[x.unit]}  {t("• মেয়াদ ছিল")} {dt(x.expiry)}  {t("• ক্ষতি")} {tk(x.cost)}</div></div>
            <Link className="btn btn-sm btn-danger" href={'/products/' + x.productId + '?expired=1'}>{t("ড্যামেজ এন্ট্রি")}</Link>
          </div>))}</div>
        {d && !d.expired.length && <Empty icon="check" title={t("মেয়াদ উত্তীর্ণ কোনো মাল নেই")} />}
      </section>

      <section className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="h2">{t("ড্যামেজ রেকর্ড")}</h2>
          <select className="inp !w-auto !py-1.5 text-xs" value={order} onChange={e => setOrder(e.target.value)}><option value="new">{t("নতুন আগে")}</option><option value="old">{t("পুরাতন আগে")}</option></select>
        </div>
        <div className="mb-3"><Chips value={kind} onChange={setKind} on="chip-on-red" options={[['', t("সব")], ...DAMAGE_KINDS.map(k => [k, k])]} /></div>
        <div className="divide-y divide-stone-100">{rows.map(x => (
          <div key={x._id} className="py-3">
            <div className="flex items-center gap-3 text-sm">
              <Link href={'/products/' + x.productId} className="flex min-w-0 flex-1 items-center gap-3">
                <Thumb src={x.image} s={44} />
                <div className="min-w-0 flex-1"><div className="truncate font-semibold">{x.company} — {x.name}</div>
                  <div className="muted">{x.kind && <Badge tone="red" className="mr-1">{t(x.kind)}</Badge>}{x.reason || (!x.kind && t("কারণ নেই"))}{x.compensation && t(" • {0}: {1}", x.compensation === 'money' ? 'টাকা ফেরত' : 'পণ্য বদল', x.compNote || '')}</div></div>
                <div className="shrink-0 text-right"><div className="font-bold">{num(x.qty)} {UNITS[x.unit]}</div>{x.cost > 0 && <div className="text-xs font-semibold text-danger">{tk(Math.round(x.cost))}</div>}<div className="muted">{dt(x.date)}</div></div>
              </Link>
              <button className="btn btn-sm btn-brand-soft shrink-0" onClick={() => setRc(rc === x._id ? null : x._id)}><I n="refresh" c="w-3.5 h-3.5" /><span className="hidden sm:inline">{t("রিকভার")}</span></button>
            </div>
            {rc === x._id && <RecoverBox cost={x.cost} onSave={recover(x)} onCancel={() => setRc(null)} />}
          </div>))}</div>
        {d && !rows.length && <Empty icon="check" title={t("কোনো ড্যামেজ রেকর্ড নেই")} />}
      </section>
    </div>
  );
}
