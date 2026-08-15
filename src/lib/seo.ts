import type { Metadata } from 'next';
import { BRAND } from '@/lib/constants';

export const DEFAULT_SEO_TITLE = 'PixAnony — Anonymous Pixel Art Community';
export const DEFAULT_SEO_DESCRIPTION = 'Create, share, and discover anonymous pixel art on PixAnony — a playful social community built around pixels, creativity, and anonymous expression.';

const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

export const SITE_URL = new URL(configuredUrl);

export function absoluteUrl(path = '/') {
  return new URL(path, SITE_URL).toString();
}

export const DEFAULT_SOCIAL_IMAGE = {
  url: '/assets/images/512x512.png',
  width: 2048,
  height: 2048,
  alt: 'PixAnony',
};

export const PUBLIC_ROBOTS: Metadata['robots'] = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    'max-image-preview': 'large',
    'max-snippet': -1,
    'max-video-preview': -1,
  },
};

export function createPublicPageMetadata({
  title,
  description,
  path,
  locale = 'en',
}: {
  title: string;
  description: string;
  path: string;
  locale?: 'en' | 'ar';
}): Metadata {
  const socialTitle = `${title} | PixAnony`;
  return {
    title,
    description,
    alternates: { canonical: path },
    robots: PUBLIC_ROBOTS,
    openGraph: {
      title: socialTitle,
      description,
      type: 'website',
      url: path,
      siteName: BRAND.name,
      locale: locale === 'ar' ? 'ar_AR' : 'en_US',
      images: [DEFAULT_SOCIAL_IMAGE],
    },
    twitter: {
      card: 'summary',
      title: socialTitle,
      description,
      images: ['/assets/images/512x512.png'],
    },
  };
}

export const WEBSITE_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND.name,
  url: SITE_URL.toString(),
  description: DEFAULT_SEO_DESCRIPTION,
  inLanguage: 'en',
  publisher: {
    '@type': 'Organization',
    name: BRAND.name,
    logo: absoluteUrl('/assets/images/512x512.png'),
  },
};
