import { putImage, okType } from '@/lib/r2';
import { J, E, H, limited, ipOf } from '@/lib/auth';

// রেজিস্ট্রেশনের সময় লগইন ছাড়াই ছবি আপলোড লাগে, তাই এটা পাবলিক — কিন্তু ধরন ও সংখ্যা সীমিত
export const POST = H(async req => {
  if (limited('up:' + ipOf(req), 30, 10 * 60e3)) return E('অনেক ছবি আপলোড হয়েছে, কিছুক্ষণ পরে চেষ্টা করুন', 429);
  const f = (await req.formData()).get('file');
  if (!f || !okType(f.type)) return E('শুধু JPG, PNG, WEBP বা GIF ছবি আপলোড করুন');
  if (f.size > 4e6) return E('ছবি ৪MB এর বেশি হবে না');
  try { return J({ url: await putImage(Buffer.from(await f.arrayBuffer()), f.type) }); }
  catch (e) { console.error(e); return E('আপলোড ব্যর্থ: R2 সেটিং দেখুন', 500); }
});
