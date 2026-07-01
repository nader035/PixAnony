import type { Metadata } from 'next';
import { Inter, Pixelify_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { BRAND } from '@/lib/constants';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const pixelifySans = Pixelify_Sans({
  subsets: ['latin'],
  variable: '--font-pixelify',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PixAnony - Express in Pixels Anonymously',
  description: BRAND.description,
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${pixelifySans.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col antialiased bg-bg text-text font-sans">
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
