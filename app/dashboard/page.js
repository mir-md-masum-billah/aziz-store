'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api, tk, num, dt, UNITS, telHref, daysLeft } from '@/lib/client';
import { useMe } from '@/components/Providers';
import { Badge, BarChart, Chips, Empty, I, Stat, Thumb } from '@/components/ui';
import { t } from '@/lib/i18n';

const RANGES = [['today', 'আজ'], ['week', '৭ দিন'], ['month', 'এই মাস'], ['year', 'এই বছর'], ['all', 'সব']];
const Box = ({ title, icon, tone = 'text-accent', link, children }) => (
  <section className="card">
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="h2 flex items-center gap-2"><I n={icon} c={`w-5 h-5 ${tone}`} />{title}</h2>
      {link && <Link href={link[0]} className="text-xs font-semibold text-accent hover:underline">{link[1]} →</Link>}
    </div>{children}
  </section>
);

export default function Dash() {
  const { me, ready } = useMe();
  if (!ready) return <div className="space-y-3"><div className="skel h-10 w-56" /><div className="grid grid-cols-2 gap-3 md:grid-cols-4">{[0, 1, 2, 3].map(i => <div key={i} className="skel h-24" />)}</div></div>;
  if (!me) return <div className="card text-center">{t("অনুগ্রহ করে")} <Link className="font-semibold text-accent underline" href="/login">{t("লগইন")}</Link>  {t("করুন")}</div>;
  return me.role === 'buyer' ? <BuyerHome me={me} /> : <Staff me={me} />;
}

function BuyerHome({ me }) {
  return (
    <div className="space-y-4">
      <h1 className="h1">{t("স্বাগতম,")} {me.name}</h1>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/buyers/me" className="card card-hover flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-accent"><I n="book" c="w-6 h-6" /></span><span><b className="block">{t("আমার খাতা")}</b><span className="muted">{t("বাকির হিসাব ও লেনদেন দেখুন")}</span></span></Link>
        <Link href="/" className="card card-hover flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-info"><I n="store" c="w-6 h-6" /></span><span><b className="block">{t("পণ্যের দাম দেখুন")}</b><span className="muted">{t("আজকের দাম ও স্টকের অবস্থা")}</span></span></Link>
      </div>
    </div>
  );
}

function Staff({ me }) {
  const [range, setRange] = useState('month'), [d, setD] = useState(null), [err, setErr] = useState('');
  useEffect(() => { setD(null); api('/api/dashboard?range=' + range).then(setD).catch(e => setErr(e.message)); }, [range]);
  const k = d?.kpi, s = d?.snap;
  const hour = new Date().getHours(), hi = hour < 5 ? 'শুভ রাত্রি' : hour < 12 ? 'শুভ সকাল' : hour < 16 ? 'শুভ দুপুর' : hour < 18 ? 'শুভ বিকাল' : 'শুভ সন্ধ্যা';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><p className="muted text-sm">{t(hi)},</p><h1 className="h1">{me.name}</h1></div>
        <div className="flex flex-wrap gap-2">
          <Link href="/due" className="btn btn-sm"><I n="cart" c="w-4 h-4" />{t("বাকিতে বিক্রি")}</Link>
          <Link href="/products?new=1" className="btn btn-sm btn-brand-soft"><I n="plus" c="w-4 h-4" />{t("নতুন পণ্য/স্টক")}</Link>
          <Link href="/stockout" className="btn btn-sm btn-soft"><I n="minus" c="w-4 h-4" />{t("স্টক কমান")}</Link>
        </div>
      </div>

      {err && <div className="card text-sm text-danger">{err}</div>}

      {/* জরুরি সতর্কতা */}
      {d && (d.overdueCount > 0 || s.expiredCount > 0 || s.outCount + s.lowCount > 0) && (
        <div className="flex flex-wrap gap-2">
          {d.overdueCount > 0 && <a href="#overdue" className="badge !px-3 !py-1.5 !text-xs bg-red-50 text-danger"><I n="clock" c="w-3.5 h-3.5" />{num(d.overdueCount)}  {t("জনের বাকি পরিশোধের তারিখ পেরিয়েছে (")}{tk(d.overdueTotal)})</a>}
          {s.expiredCount > 0 && <Link href="/damage" className="badge !px-3 !py-1.5 !text-xs bg-red-50 text-danger"><I n="alert" c="w-3.5 h-3.5" />{t("মেয়াদ উত্তীর্ণ ব্যাচ")} {num(s.expiredCount)}{t("টি")}</Link>}
          {s.lowCount + s.outCount > 0 && <a href="#stock" className="badge !px-3 !py-1.5 !text-xs bg-amber-50 text-warn"><I n="box" c="w-3.5 h-3.5" />{num(s.outCount)}{t("টি শেষ,")} {num(s.lowCount)}{t("টি কম স্টক")}</a>}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label={t("মোট বাকি (ক্রেতাদের কাছে)")} value={d ? tk(s.totalDue) : '…'} sub={d && t("{0} জনের কাছে", num(s.dueBuyers))} tone="red" icon="book" href="/due" />
        <Stat label={t("গুদামে মালের মূল্য (কেনা-দামে)")} value={d ? tk(s.stockCost) : '…'} sub={d && t("{0}টি পণ্য", num(s.products))} tone="blue" icon="box" href="/products" />
        <Stat label={t("নিবন্ধিত ক্রেতা")} value={d ? num(s.buyers) : '…'} tone="gray" icon="users" href="/due" />
        <Stat label={t("মেয়াদ শেষ মালের ক্ষতি-ঝুঁকি")} value={d ? tk(s.expiredValue) : '…'} tone={d && s.expiredValue > 0 ? 'red' : 'green'} icon="alert" href="/damage" />
      </div>

      <div className="card space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="h2 flex items-center gap-2"><I n="trend" c="w-5 h-5 text-accent" />{t("ব্যবসার হিসাব")}</h2><Chips value={range} onChange={setRange} options={RANGES} /></div>
        {!d ? <div className="skel h-48" /> : (
          <>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {[[t("বিক্রি"), tk(k.revenue), t("{0}টি বিক্রি", num(k.count)), 'text-stone-900'], [t("আনুমানিক লাভ"), tk(k.profit), k.profitCoverage < 100 ? t("{0}% বিক্রির হিসাবে", num(k.profitCoverage)) : '', k.profit >= 0 ? 'text-accent' : 'text-danger'], [t("আদায় (নগদ + পরিশোধ)"), tk(k.collected), '', 'text-info'], [t("ড্যামেজ ক্ষতি"), tk(k.dmgLoss), '', 'text-danger'], [t("উত্তোলন"), tk(k.wdCash + k.wdProd), t("নগদ {0}", tk(k.wdCash)), 'text-warn']].map(([l, v, sub, c]) => (
                <div key={l} className="rounded-xl bg-stone-50 p-3"><div className="muted">{l}</div><div className={`text-lg font-bold sm:text-xl ${c}`}>{v}</div>{sub && <div className="muted text-[11px]">{sub}</div>}</div>
              ))}
            </div>
            {k.profitCoverage < 100 && <p className="muted">{t("ℹ️ আগের কিছু বিক্রিতে কেনা-দাম সংরক্ষিত ছিল না, তাই লাভ শুধু নতুন বিক্রির উপর হিসাব হয়েছে। এখন থেকে সব বিক্রিতেই হিসাব ঠিকমতো জমা হবে।")}</p>}
            <BarChart data={d.chart} fmt={tk} />
          </>
        )}
      </div>

      {d && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div id="overdue" className="scroll-mt-20"><Box title={t("বাকি পরিশোধের তারিখ পেরিয়েছে")} icon="clock" tone="text-danger" link={['/due', t("সব দেখুন")]}>
            {d.overdue.length ? <div className="divide-y divide-stone-100">{d.overdue.map(b => (
              <div key={b._id} className="flex items-center gap-3 py-2.5">
                <Link href={'/buyers/' + b._id} className="flex min-w-0 flex-1 items-center gap-3"><Thumb src={b.photo} s={40} round /><div className="min-w-0"><div className="truncate font-semibold">{b.name}</div><div className="muted">{t("তারিখ ছিল")} {dt(b.since)}{b.pageNo && t(" • পেজ {0}", b.pageNo)}</div></div></Link>
                <div className="text-right"><div className="font-bold text-danger">{tk(b.amount)}</div></div>
                {b.phone && <a href={telHref(b.phone)} className="btn btn-brand-soft btn-icon" aria-label={t("ফোন করুন")}><I n="phone" c="w-4 h-4" /></a>}
              </div>))}</div> : <Empty icon="check" title={t("কারো তারিখ পেরোয়নি")} hint={t("প্রতিশ্রুত তারিখ দিয়ে বাকিতে বিক্রি করলে এখানে সতর্ক করবে")} />}
          </Box></div>

          <Box title={t("সবচেয়ে বেশি বাকি")} icon="book" tone="text-danger" link={['/due', t("সব দেখুন")]}>
            {d.topDue.length ? <div className="divide-y divide-stone-100">{d.topDue.map(b => (
              <Link key={b._id} href={'/buyers/' + b._id} className="flex items-center gap-3 py-2.5 hover:opacity-80"><Thumb src={b.photo} s={40} round /><div className="min-w-0 flex-1"><div className="truncate font-semibold">{b.name}</div><div className="muted">{b.pageNo ? t("পেজ {0} • ", b.pageNo) : ''}{b.phone}</div></div><div className="font-bold text-danger">{tk(b.due)}</div></Link>))}</div> : <Empty icon="check" title={t("কারো বাকি নেই")} />}
          </Box>

          <div id="stock" className="scroll-mt-20"><Box title={t("স্টক শেষ / কম")} icon="box" tone="text-warn" link={['/products', t("পণ্য তালিকা")]}>
            {d.out.length + d.low.length ? <div className="divide-y divide-stone-100">{[...d.out.map(p => ({ ...p, out: 1 })), ...d.low].map(p => (
              <Link key={p._id} href={'/products/' + p._id} className="flex items-center gap-3 py-2.5 hover:opacity-80"><Thumb src={p.image} s={40} /><div className="min-w-0 flex-1"><div className="truncate font-semibold">{p.name}</div><div className="muted">{p.company}</div></div>
                {p.out ? <Badge tone="red">{t("শেষ")}</Badge> : <Badge tone="amber">{num(p.stock)} {UNITS[p.unit]}  {t("(সীমা")} {num(p.minStock)})</Badge>}</Link>))}</div> : <Empty icon="check" title={t("সব পণ্যের স্টক ঠিক আছে")} hint={t("পণ্যে 'স্টক কম সতর্কতা' সংখ্যা দিলে এখানে জানাবে")} />}
          </Box></div>

          <Box title={t("মেয়াদ শেষ হচ্ছে (৩০ দিনের মধ্যে)")} icon="cal" tone="text-warn" link={['/damage', t("ড্যামেজ")]}>
            {d.soon.length ? <div className="divide-y divide-stone-100">{d.soon.map((p, i) => (
              <Link key={p._id + i} href={'/products/' + p._id} className="flex items-center justify-between gap-3 py-2.5 hover:opacity-80"><div className="min-w-0"><div className="truncate font-semibold">{p.name}</div><div className="muted">{p.company} • {num(p.qty)} {UNITS[p.unit]} • {dt(p.expiry)}</div></div><Badge tone={p.days <= 7 ? 'red' : 'amber'}>{p.days <= 0 ? t("আজ শেষ") : t("{0} দিন", num(p.days))}</Badge></Link>))}</div> : <Empty icon="check" title={t("শিগগির মেয়াদ শেষ হচ্ছে এমন পণ্য নেই")} />}
          </Box>

          <Box title={t("সেরা বিক্রীত পণ্য")} icon="flame" tone="text-orange-500">
            {d.topProducts.length ? <div className="divide-y divide-stone-100">{d.topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 py-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">{num(i + 1)}</span><div className="min-w-0 flex-1"><div className="truncate font-semibold">{p.name}</div><div className="muted">{num(p.qty)} {UNITS[p.unit]}</div></div><div className="font-bold">{tk(p.revenue)}</div></div>))}</div> : <Empty icon="bars" title={t("এই সময়ে বিক্রি নেই")} />}
          </Box>
        </div>
      )}
    </div>
  );
}
