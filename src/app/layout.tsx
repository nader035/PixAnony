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

export const metadata: Metadata = {
  title: 'PixAnony | Make art. Share it your way.',
  description: BRAND.description,
  icons: { icon: '/favicon.ico' },
  openGraph: {
    title: 'PixAnony | Make art. Share it your way.',
    description: BRAND.description,
    type: 'website',
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
