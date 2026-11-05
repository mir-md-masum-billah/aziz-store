'use client';
import { t } from '@/lib/i18n';
// স্টকে যোগ করার ফর্ম: পুরনো ব্যাচ থেকে "প্রতি কার্টুনে কয়টা" ও "প্রতি কার্টুনের দাম" আগে থেকে ভরা থাকে
export const calc = f => {
  const pc = +f.perCarton || 0, cp = +f.cartonPrice || 0, c = +f.cartons || 0, ex = +f.extra || 0;
  const qty = c * pc + ex, unit = pc ? cp / pc : 0;
  return { qty, unit, total: Math.round(qty * unit * 100) / 100 };
};
const F = ({ l, children }) => <div><label className="lbl">{l}</label>{children}</div>;

export default function RestockFields({ f, s }) {
  const carton = !!f.perCarton, r = calc(f);
  return (
    <>
      <F l={t("কার্টুন সংখ্যা")}><input type="number" min="0" className="inp" autoFocus value={f.cartons} onChange={s('cartons')} /></F>
      <F l={t("প্রতি কার্টুনে পিস/একক")}><input type="number" min="0" className="inp" value={f.perCarton} onChange={s('perCarton')} /></F>
      <F l={t("অতিরিক্ত পিস (কার্টুনের বাইরে)")}><input type="number" min="0" className="inp" value={f.extra} onChange={s('extra')} /></F>
      {carton ? (
        <>
          <F l={t("প্রতি কার্টুনের কেনা দাম")}>
            <input type="number" min="0" className="inp" value={f.cartonPrice} onChange={s('cartonPrice')} />
            {f.lastCartonPrice !== '' && <div className="muted mt-1">{t("আগের বার প্রতি কার্টুন: ৳")}{f.lastCartonPrice}</div>}
          </F>
          <F l={t("মোট পরিমাণ (অটো)")}><input className="inp" disabled value={r.qty || ''} /></F>
          <F l={t("মোট কেনা দাম (অটো)")}><input className="inp" disabled value={r.total || ''} /></F>
          <F l={t("প্রতি একক কেনা দাম (অটো)")}><input className="inp" disabled value={r.unit ? r.unit.toFixed(2) : ''} /></F>
        </>
      ) : (
        <>
          <F l={t("মোট পরিমাণ")}><input type="number" min="0" className="inp" placeholder={t("কার্টুন না থাকলে সরাসরি লিখুন")} value={f.qty} onChange={s('qty')} /></F>
          <F l={t("মোট কেনা দাম")}><input type="number" min="0" className="inp" value={f.buyTotal} onChange={s('buyTotal')} /></F>
        </>
      )}
      <F l={t("বিক্রয় মূল্য (প্রতি একক)")}><input type="number" min="0" className="inp" value={f.sellPrice} onChange={s('sellPrice')} /></F>
      <F l={t("কেনার তারিখ")}><input type="date" className="inp" value={f.purchaseDate} onChange={s('purchaseDate')} /></F>
      <F l={t("উৎপাদন তারিখ")}><input type="date" className="inp" value={f.mfgDate} onChange={s('mfgDate')} /></F>
      <F l={t("মেয়াদ শেষের তারিখ")}><input type="date" className="inp" value={f.expiry} onChange={s('expiry')} /></F>
    </>
  );
}
