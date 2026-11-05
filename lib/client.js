import { t, tx, getLang } from './i18n';

// ---------- নেটওয়ার্ক ----------
export const api = async (u, m = 'GET', b) => {
  const r = await fetch(u, { method: m, headers: { 'Content-Type': 'application/json' }, body: b ? JSON.stringify(b) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) { const e = new Error(t(d.error || 'ত্রুটি হয়েছে')); e.status = r.status; throw e; }
  return d;
};

// মোবাইলের বড় ছবি আপলোডের আগে ছোট করা (JPEG/PNG; PNG-র স্বচ্ছতা ঠিক থাকে)
const shrink = f => new Promise(res => {
  if (!/^image\/(jpeg|png)$/.test(f.type) || f.size < 500e3) return res(f);
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const k = Math.min(1, 1400 / Math.max(img.width, img.height)), c = document.createElement('canvas');
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
    c.toBlob(b => res(b && b.size < f.size ? new File([b], 'photo', { type: f.type }) : f), f.type, .82);
  };
  img.onerror = () => { URL.revokeObjectURL(url); res(f); };
  img.src = url;
});
export const up = async f => {
  const fd = new FormData(); fd.append('file', await shrink(f));
  const r = await fetch('/api/upload', { method: 'POST', body: fd });
  const d = await r.json().catch(() => ({})); if (!r.ok) throw new Error(t(d.error || 'আপলোড ব্যর্থ')); return d.url;
};

// ---------- ফরম্যাট ----------
const loc = () => (getLang() === 'en' ? 'en-US' : 'bn-BD');
export const tk = n => '৳' + Number(n || 0).toLocaleString(loc(), { maximumFractionDigits: 2 });
export const num = n => Number(n || 0).toLocaleString(loc(), { maximumFractionDigits: 2 });
export const dt = d => (d ? new Date(d).toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'bn-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
// স্থানীয় সময় অনুযায়ী আজকের তারিখ (UTC হলে বাংলাদেশে ভোরে গতকাল দেখাত)
export const todayStr = (d = new Date()) => new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
export const daysLeft = d => Math.ceil((new Date(d).getTime() + 864e5 - Date.now()) / 864e5);
export const isExp = b => !!b.expiry && new Date(b.expiry).getTime() + 864e5 <= Date.now();
// দেখানোর সময় বর্তমান ভাষায় অনুবাদ হয় (DAMAGE_KINDS ডেটা হিসেবে বাংলাই থাকে, দেখানোর জায়গায় t() লাগে)
const view = o => new Proxy(o, { get: (x, k) => (typeof k === 'string' && Object.prototype.hasOwnProperty.call(x, k) ? t(x[k]) : x[k]) });
export const UNITS = view({ pcs: 'পিস', kg: 'কেজি', gram: 'গ্রাম', litre: 'লিটার', dozen: 'ডজন', packet: 'প্যাকেট' });
export const DAMAGE_KINDS = ['ইঁদুরে খেয়েছে', 'মেয়াদ শেষ', 'ভিজে/পচে গেছে', 'ভেঙে/ফেটে গেছে', 'চুরি/হারানো', 'অন্যান্য'];
export const ROLES = view({ admin: 'অ্যাডমিন', seller: 'বিক্রেতা', buyer: 'ক্রেতা' });

// সবচেয়ে নতুন লেনদেন আগে (একই তারিখ হলে পরে যোগ হওয়াটা আগে)
export const newest = (k = 'date') => (a, b) => (new Date(b[k] || 0) - new Date(a[k] || 0)) || (String(b._id || '') < String(a._id || '') ? -1 : String(b._id || '') > String(a._id || '') ? 1 : 0);

// ---------- যোগাযোগ ও এক্সপোর্ট ----------
const intl = p => '88' + String(p || '').replace(/\D/g, '').replace(/^88/, '');
export const telHref = p => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
export const waHref = (p, text) => `https://wa.me/${intl(p)}?text=${encodeURIComponent(text || '')}`;
export const smsHref = (p, text) => `sms:${String(p || '').replace(/[^\d+]/g, '')}?body=${encodeURIComponent(text || '')}`;

// Excel-এ বাংলা ঠিকমতো দেখাতে BOM সহ CSV
export function downloadCsv(name, rows) {
  const q = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const blob = new Blob(['\ufeff' + rows.map(r => r.map(c => q(tx(c))).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// মেমো/স্টেটমেন্ট প্রিন্ট — আলাদা উইন্ডোতে সাদাসিধে লেআউট
export function printHtml(title, html) {
  const w = window.open('', '_blank', 'width=720,height=900'); if (!w) return alert(t('পপ-আপ ব্লক করা আছে, অনুমতি দিন'));
  w.document.write(`<!doctype html><html lang="${getLang()}"><head><meta charset="utf-8"><title>${title}</title><style>
  body{font-family:'Noto Sans Bengali','Hind Siliguri',system-ui,sans-serif;color:#1c1917;max-width:680px;margin:24px auto;padding:0 16px;font-size:14px}
  h1{font-size:20px;margin:0}h2{font-size:15px;margin:18px 0 6px}.m{color:#78716c;font-size:12px}.c{text-align:center}
  table{width:100%;border-collapse:collapse}th,td{padding:6px 4px;border-bottom:1px solid #e7e5e4;text-align:left}th:last-child,td:last-child{text-align:right}
  .t td{border:0;padding:3px 4px}.b{font-weight:700}.hr{border-top:2px dashed #a8a29e;margin:14px 0}@media print{button{display:none}}
  </style></head><body>${html}<p class="c"><button onclick="print()">${t('প্রিন্ট করুন')}</button></p><script>setTimeout(()=>print(),300)<\/script></body></html>`);
  w.document.close();
}
export const escHtml = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
