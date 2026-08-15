import type { Metadata } from 'next';
import { getServerI18n } from '@/lib/i18n/server';

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return {
    title: t('seo.loginTitle'),
    description: t('seo.loginDescription'),
    robots: { index: false, follow: false },
    alternates: { canonical: '/login' },
  };
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
