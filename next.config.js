/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/invoices/[id]/pdf/route': ['./src/lib/pdf/fonts/**'],
  },
  async rewrites() {
    return [
      { source: '/dnes', destination: '/today' },
      { source: '/kalendar', destination: '/calendar' },
      { source: '/zakazky', destination: '/jobs' },
      { source: '/zakazky/:id', destination: '/jobs/:id' },
      { source: '/zakaznici', destination: '/customers' },
      { source: '/zakaznici/:id', destination: '/customers/:id' },
      { source: '/predplatne', destination: '/billing' },
      { source: '/prehled', destination: '/dashboard' },
      { source: '/faktury', destination: '/invoices' },
      { source: '/nastaveni', destination: '/settings' },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "object-src 'none'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-src 'self'",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
              "upgrade-insecure-requests",
            ].join('; '),
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
