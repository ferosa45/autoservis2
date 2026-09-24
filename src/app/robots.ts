import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/today',
        '/calendar',
        '/jobs',
        '/customers',
        '/billing',
        '/dashboard',
        '/invoices',
        '/settings',
        '/dnes',
        '/kalendar',
        '/zakazky',
        '/zakaznici',
        '/predplatne',
        '/prehled',
        '/faktury',
        '/nastaveni',
        '/api/',
      ],
    },
    sitemap: 'https://garazio.cz/sitemap.xml',
  };
}
