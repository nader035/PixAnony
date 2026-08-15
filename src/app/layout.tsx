import type { Metadata, Viewport } from 'next';
import { Manrope } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { BRAND } from '@/lib/constants';
import { DEFAULT_SEO_DESCRIPTION, DEFAULT_SEO_TITLE, DEFAULT_SOCIAL_IMAGE, PUBLIC_ROBOTS, SITE_URL, WEBSITE_JSON_LD } from '@/lib/seo';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: {
    default: DEFAULT_SEO_TITLE,
    template: '%s | PixAnony',
  },
  description: DEFAULT_SEO_DESCRIPTION,
  applicationName: BRAND.name,
  authors: [{ name: BRAND.name }],
  creator: BRAND.name,
  publisher: BRAND.name,
  category: 'art',
  keywords: ['anonymous pixel art', 'pixel art community', 'digital art', 'creative community'],
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
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    type: 'website',
    url: '/',
    siteName: BRAND.name,
    locale: 'en_US',
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: 'summary',
    title: DEFAULT_SEO_TITLE,
    description: DEFAULT_SEO_DESCRIPTION,
    images: ['/assets/images/512x512.png'],
  },
};

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#edf2fb' },
    { media: '(prefers-color-scheme: dark)', color: '#121722' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased bg-bg text-text font-sans" suppressHydrationWarning>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSON_LD).replace(/</g, '\\u003c') }}
          />
          {children}
          <Toaster
            position="bottom-right"
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
        </ThemeProvider>
      </body>
    </html>
  );
}
