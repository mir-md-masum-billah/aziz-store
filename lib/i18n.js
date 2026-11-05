import EN from './en.json';

// ভাষা: 'bn' (ডিফল্ট) বা 'en'। Providers এটা সেট করে এবং ভাষা বদলালে পুরো UI আবার আঁকে।
let LANG = 'bn';
export const setLang = l => { LANG = l === 'en' ? 'en' : 'bn'; };
export const getLang = () => LANG;

const own = s => (Object.prototype.hasOwnProperty.call(EN, s) ? EN[s] : undefined);
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fill = (s, a) => s.replace(/\{(\d+)\}/g, (_, i) => a[i] ?? '');
// "{0} এর স্টক…" ধরনের কী থেকে প্যাটার্ন বানানো — সার্ভারের গতিশীল এরর মেসেজও এতে অনুবাদ হয়
const pats = Object.entries(EN).filter(([k]) => /\{\d+\}/.test(k)).map(([k, v]) => ({ re: new RegExp('^' + k.split(/\{\d+\}/).map(esc).join('(.+?)') + '$'), v }));

// শুধু হুবহু মিললে অনুবাদ (CSV সেল ইত্যাদির জন্য)
export const tx = s => (LANG === 'en' && typeof s === 'string' && own(s) !== undefined ? own(s) : s);

export function t(s, ...a) {
  if (typeof s !== 'string') return s;
  if (LANG === 'bn') return a.length ? fill(s, a) : s;
  const args = a.map(tx);
  const r = own(s);
  if (r !== undefined) return a.length ? fill(r, args) : r;
  for (const p of pats) { const m = s.match(p.re); if (m) return fill(p.v, m.slice(1).map(tx)); }
  return a.length ? fill(s, args) : s;
}
