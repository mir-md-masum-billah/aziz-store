import { cookies } from 'next/headers';

export default function manifest() {
  const en = cookies().get('lang')?.value === 'en';
  return {
    name: en ? 'Aziz Army General Store' : 'আজিজ আর্মি জেনারেল স্টোর', short_name: en ? 'Aziz Store' : 'আজিজ স্টোর',
    description: en ? 'Prices, stock and dues' : 'দাম, স্টক ও বাকির হিসাব',
    start_url: '/dashboard', display: 'standalone', background_color: '#fafaf9', theme_color: '#047857', lang: en ? 'en' : 'bn',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}
