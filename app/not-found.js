'use client';
import Link from 'next/link';
import { Empty } from '@/components/ui';
import { t } from '@/lib/i18n';
export default function NotFound() {
  return <div className="card mx-auto max-w-md"><Empty icon="search" title={t("পেজটি পাওয়া যায়নি")} hint={t("লিংকটি ভুল হতে পারে বা পেজটি সরিয়ে ফেলা হয়েছে")}><Link href="/" className="btn">{t("হোম পেজে যান")}</Link></Empty></div>;
}
