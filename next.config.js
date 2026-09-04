/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // @react-pdf/renderer způsoboval "Minified React error #31" při
  // generování PDF v API route handleru. Skutečná příčina: Next.js
  // App Router kompiluje route handlery ve stejné webpack "(rsc)" vrstvě
  // jako React Server Components, kde se 'react' resolvuje jinak než
  // v běžném Node.js kontextu. @react-pdf/renderer (a jeho interní
  // reconciler) pak dostává React elementy vytvořené "jinou" instancí React,
  // než jakou sám interně používá pro validaci.
  serverExternalPackages: ['@react-pdf/renderer'],
  outputFileTracingIncludes: {
    '/api/invoices/[id]/pdf/route': ['./src/lib/pdf/fonts/**'],
  },
  // Česká URL aplikace. Staré adresy zůstávají funkční díky rewrite,
  // takže existující záložky a odkazy se nerozbijí.
  async rewrites() {
    return [
      { source: '/dnes', destination: '/today' },
      { source: '/kalendar', destination: '/calendar' },
      { source: '/zakazky', destination: '/jobs' },
      { source: '/zakazky/:id', destination: '/jobs/:id' },
      { source: '/zakaznici', destination: '/customers' },
      { source: '/zakaznici/:id', destination: '/customers/:id' },
      { source: '/vozidla', destination: '/vehicles' },
      { source: '/predplatne', destination: '/billing' },
      { source: '/prehled', destination: '/dashboard' },
    ];
  },
};

module.exports = nextConfig;
