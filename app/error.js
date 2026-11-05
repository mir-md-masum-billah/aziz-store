'use client';
import { Empty } from '@/components/ui';
import { t } from '@/lib/i18n';
export default function Error({ reset }) {
  return <div className="card mx-auto max-w-md"><Empty icon="alert" title={t("কিছু একটা ভুল হয়েছে")} hint={t("ইন্টারনেট সংযোগ দেখে আবার চেষ্টা করুন")}><button className="btn" onClick={reset}>{t("আবার চেষ্টা করুন")}</button></Empty></div>;
}
