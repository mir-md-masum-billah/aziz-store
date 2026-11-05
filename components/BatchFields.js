'use client';
import { t } from '@/lib/i18n';
const F = ({ l, children }) => <div><label className="lbl">{l}</label>{children}</div>;

export default function BatchFields({ f, s }) {
  const base = f.cartons && f.perCarton ? f.cartons * f.perCarton : +f.qty || 0;
  const qty = base + (+f.extra || 0);
  const ub = qty && f.buyTotal ? (f.buyTotal / qty).toFixed(2) : '';
  return (
    <>
      <F l={t("কার্টুন সংখ্যা")}><input type="number" min="0" inputMode="numeric" className="inp" value={f.cartons} onChange={s('cartons')} /></F>
      <F l={t("প্রতি কার্টুনে পিস/একক")}><input type="number" min="0" inputMode="numeric" className="inp" value={f.perCarton} onChange={s('perCarton')} /></F>
      <F l={t("অতিরিক্ত পিস (কার্টুনের বাইরে)")}><input type="number" min="0" inputMode="numeric" className="inp" value={f.extra} onChange={s('extra')} /></F>
      <F l={t("মোট পরিমাণ (অটো)")}>{f.cartons && f.perCarton ? <input className="inp" disabled value={qty} /> : <input type="number" min="0" className="inp" placeholder={t("কার্টুন না থাকলে সরাসরি লিখুন")} value={f.qty} onChange={s('qty')} />}</F>
      <F l={t("মোট কেনা দাম (৳)")}><input type="number" min="0" inputMode="decimal" className="inp" value={f.buyTotal} onChange={s('buyTotal')} /></F>
      <F l={t("প্রতি একক কেনা দাম (অটো)")}><input className="inp" disabled value={ub} /></F>
      <F l={t("বিক্রয় মূল্য (প্রতি একক) *")}><input type="number" min="0" inputMode="decimal" className="inp" value={f.sellPrice} onChange={s('sellPrice')} /></F>
      <F l={t("কেনার তারিখ")}><input type="date" className="inp" value={f.purchaseDate} onChange={s('purchaseDate')} /></F>
      <F l={t("উৎপাদন তারিখ")}><input type="date" className="inp" value={f.mfgDate} onChange={s('mfgDate')} /></F>
      <F l={t("মেয়াদ শেষের তারিখ")}><input type="date" className="inp" value={f.expiry} onChange={s('expiry')} /></F>
      <F l={t("স্টক কম সতর্কতা (এর নিচে নামলে)")}><input type="number" min="0" className="inp" placeholder={t("যেমন ১০")} value={f.minStock} onChange={s('minStock')} /></F>
    </>
  );
}
