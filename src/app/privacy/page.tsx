import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield } from '@/components/ui/icons';
import { Logo } from '@/components/ui/logo';
import { createPublicPageMetadata } from '@/lib/seo';
import { getServerI18n } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  return createPublicPageMetadata({
    title: t('privacy.metaTitle'),
    description: t('privacy.metaDescription'),
    path: '/privacy',
    locale,
  });
}

export default async function PrivacyPage() {
  const { t } = await getServerI18n();

  return (
    <main id="main-content" className="min-h-screen bg-bg px-4 py-6 text-text sm:px-8 sm:py-10">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-card p-6 shadow-float sm:p-12">
        <div className="flex items-center justify-between gap-4"><Logo /><Link href="/" className="flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-sm font-semibold text-text-muted"><ArrowLeft className="rtl-flip" size={15} />{t('privacy.home')}</Link></div>
        <span className="mt-16 grid h-14 w-14 place-items-center rounded-full bg-[var(--mint)]"><Shield size={24} /></span>
        <h1 className="mt-6 text-4xl font-bold sm:text-5xl">{t('privacy.title')}</h1>
        <div className="mt-8 space-y-8 text-base leading-7 text-text-muted">
          <section><h2 className="text-xl font-bold text-text">{t('privacy.storeTitle')}</h2><p className="mt-2">{t('privacy.storeText')}</p></section>
          <section><h2 className="text-xl font-bold text-text">{t('privacy.anonymousTitle')}</h2><p className="mt-2">{t('privacy.anonymousText')}</p></section>
          <section><h2 className="text-xl font-bold text-text">{t('privacy.choicesTitle')}</h2><p className="mt-2">{t('privacy.choicesText')}</p></section>
          <section><h2 className="text-xl font-bold text-text">{t('privacy.questionsTitle')}</h2><p className="mt-2">{t('privacy.questionsText')}</p></section>
        </div>
      </div>
    </main>
  );
}
