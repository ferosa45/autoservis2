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
  // reconciler) pak dostává React elementy vytvořené "jinou" instancí
  // React, než jakou sám interně používá pro validaci - odtud chyba.
  //
  // DŮLEŽITÉ: 'react' se sem NESMÍ přidat (na rozdíl od dřívější verze
  // téhle opravy) - externalizace 'react' pro celou appku rozbíjí
  // RSC serializaci na úplně jiných stránkách ("A React Element from
  // an older version of React was rendered"). Místo toho se nesoulad
  // řeší cíleně jen v src/lib/pdf/invoice-document.ts přes syrový
  // Node.js require('react'), který zaručí stejnou instanci Reactu,
  // jakou interně používá i externalizovaný @react-pdf/renderer.
  serverExternalPackages: ['@react-pdf/renderer'],
  // Zajišťuje, že se .ttf fonty pro generování PDF faktur zabalí i do
  // Vercel serverless funkce - Next.js file tracing je najde sám ve
  // většině případů (jsou načítány přes path.join(process.cwd(), ...)
  // v src/lib/pdf/invoice-document.ts), ale explicitní zápis je jistota
  // navíc, kdyby automatická detekce cestu nedohledala.
  outputFileTracingIncludes: {
    '/api/invoices/[id]/pdf/route': ['./src/lib/pdf/fonts/**'],
  },
};

module.exports = nextConfig;
