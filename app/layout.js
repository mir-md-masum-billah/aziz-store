import './globals.css';
import { cookies } from 'next/headers';
import { Hind_Siliguri } from 'next/font/google';
import Providers from '@/components/Providers';
import Nav from '@/components/Nav';

const font = Hind_Siliguri({ subsets: ['bengali', 'latin'], weight: ['400', '500', '600', '700'], variable: '--font-bn', display: 'swap' });

// ভাষা ও থিম কুকিতে থাকে, তাই সার্ভারই প্রথমবার সঠিক ভাষা/মোডে পেজ পাঠায় (ঝলকানি বা ভুল ভাষা দেখায় না)
const prefs = () => { const c = cookies(); return { lang: c.get('lang')?.value === 'en' ? 'en' : 'bn', theme: c.get('theme')?.value === 'dark' ? 'dark' : 'light' }; };

export function generateMetadata() {
  const en = prefs().lang === 'en', name = en ? 'Aziz Army General Store' : 'আজিজ আর্মি জেনারেল স্টোর';
  return {
    title: { default: name, template: `%s • ${name}` },
    description: en ? 'All kinds of grocery and general goods — prices, stock and dues in one place' : 'সব ধরনের মুদি ও জেনারেল পণ্য — দাম, স্টক ও বাকির হিসাব এক জায়গায়',
    manifest: '/manifest.webmanifest',
  };
}
export function generateViewport() { return { themeColor: prefs().theme === 'dark' ? '#0c0a09' : '#047857', width: 'device-width', initialScale: 1 }; }

export default function RootLayout({ children }) {
  const { lang, theme } = prefs();
  return (
    <html lang={lang} className={`${font.variable} ${theme === 'dark' ? 'dark' : ''}`} suppressHydrationWarning>
      <body className="font-sans">
        <Providers lang={lang} theme={theme}>
          <Nav />
          <main className="mx-auto max-w-6xl px-3 pb-28 pt-4 sm:px-5 sm:pt-6 md:pb-10">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
