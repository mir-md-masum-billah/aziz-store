import Link from 'next/link';
import { tk, num, UNITS } from '@/lib/client';
import { Badge, I } from '@/components/ui';
import { t } from '@/lib/i18n';

export default function ProductCard({ p }) {
  const staff = p.stockCost !== undefined; // স্টাফের API-তে অতিরিক্ত তথ্য থাকে
  const out = !(p.stock > 0), low = staff && !out && p.minStock > 0 && p.stock <= p.minStock;
  return (
    <Link href={`/products/${p._id}`} className="card card-hover group block overflow-hidden !p-0">
      <div className="relative aspect-square bg-stone-100">
        {p.image ? <img src={p.image} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
          : <div className="flex h-full w-full items-center justify-center text-stone-300"><I n="box" c="h-12 w-12" /></div>}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {out && <Badge tone="red" className="shadow-sm !bg-red-600 !text-white">{t("স্টক শেষ")}</Badge>}
          {low && <Badge tone="amber" className="shadow-sm">{t("স্টক কম")}</Badge>}
          {staff && p.expiredQty > 0 && <Badge tone="red" className="shadow-sm">{t("মেয়াদ শেষ")}</Badge>}
          {staff && !p.expiredQty && p.soonQty > 0 && <Badge tone="amber" className="shadow-sm">{t("মেয়াদ কাছে")}</Badge>}
        </div>
      </div>
      <div className="p-3">
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
          {p.companyLogo && <img src={p.companyLogo} alt="" className="h-4 w-4 object-contain" />}
          <span className="truncate">{p.company}{p.group && ` • ${p.group}`}</span>
        </div>
        <div className="mt-0.5 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-stone-900">{p.name}</div>
        <div className="mt-1.5 flex items-baseline justify-between gap-1">
          <div className="font-bold text-accent">{tk(p.sellPrice)}<span className="ml-0.5 text-[11px] font-normal text-stone-400">/{UNITS[p.unit]}</span></div>
          <div className={`text-[11px] font-medium ${out ? 'text-danger' : 'text-stone-500'}`}>{staff ? `${num(p.stock)} ${UNITS[p.unit]}` : out ? '' : t("স্টকে আছে")}</div>
        </div>
      </div>
    </Link>
  );
}
