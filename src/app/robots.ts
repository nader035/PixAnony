import type { MetadataRoute } from 'next';
import { absoluteUrl, SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/auth/',
        '/bookmarks',
        '/challenges',
        '/confirm',
        '/drops',
        '/home',
        '/login',
        '/notifications',
        '/paint',
        '/profile/*/received',
        '/send/',
        '/settings',
      ],
    },
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL.origin,
  };
}
