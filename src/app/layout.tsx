import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { BRAND } from '@/lib/constants';
import { DEFAULT_SOCIAL_IMAGE, PUBLIC_ROBOTS, SITE_URL, WEBSITE_JSON_LD } from '@/lib/seo';
import { LocaleProvider } from '@/components/i18n/locale-provider';
import { directionFor } from '@/lib/i18n/translations';
import { getServerI18n } from '@/lib/i18n/server';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export async function generateMetadata(): Promise<Metadata> {
  const { locale, t } = await getServerI18n();
  const title = t('seo.defaultTitle');
  const description = t('seo.defaultDescription');

  return {
    metadataBase: SITE_URL,
    title: {
      default: title,
      template: '%s | PixAnony',
    },
    description,
    applicationName: BRAND.name,
    authors: [{ name: BRAND.name }],
    creator: BRAND.name,
    publisher: BRAND.name,
    category: 'art',
    keywords: locale === 'ar'
      ? ['رسم رقمي', 'رسومات مجهولة', 'مجتمع فني', 'PixAnony']
      : ['anonymous pixel art', 'pixel art community', 'digital art', 'creative community'],
    alternates: { canonical: '/' },
    icons: {
      icon: [
        { url: '/assets/images/favicon.ico', sizes: 'any', type: 'image/x-icon' },
        { url: '/assets/images/16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/assets/images/32x32.png', sizes: '32x32', type: 'image/png' },
      ],
      shortcut: [{ url: '/assets/images/favicon.ico', type: 'image/x-icon' }],
      apple: [{ url: '/assets/images/180x180.png', sizes: '180x180', type: 'image/png' }],
    },
    robots: PUBLIC_ROBOTS,
    openGraph: {
      title,
      description,
      type: 'website',
      url: '/',
      siteName: BRAND.name,
      locale: locale === 'ar' ? 'ar_AR' : 'en_US',
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: ['/assets/images/512x512.png'],
    },
  };
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#edf2fb' },
    { media: '(prefers-color-scheme: dark)', color: '#121722' },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, t } = await getServerI18n();

  return (
    <html
      lang={locale}
      dir={directionFor(locale)}
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${locale === 'ar' ? 'font-ar' : ''} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased bg-bg text-text font-sans" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">{t('common.skipContent')}</a>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <LocaleProvider initialLocale={locale}>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  ...WEBSITE_JSON_LD,
                  description: t('seo.defaultDescription'),
                  inLanguage: locale,
                }).replace(/</g, '\\u003c'),
              }}
            />
            {children}
            <Toaster
              position={locale === 'ar' ? 'bottom-left' : 'bottom-right'}
              theme="light"
              richColors
              toastOptions={{
                style: {
                  background: 'var(--card)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text)',
                },
              }}
            />
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
