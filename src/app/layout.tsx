import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { BRAND } from '@/lib/constants';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const metadataUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(metadataUrl),
  title: 'PixAnony | Make art. Share it your way.',
  description: BRAND.description,
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'PixAnony | Make art. Share it your way.',
    description: BRAND.description,
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PixAnony | Make art. Share it your way.',
    description: BRAND.description,
  },
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
