import type { Metadata } from 'next';
import { Manrope, Inter, IBM_Plex_Mono } from 'next/font/google';
import { QuickJobProvider } from '@/components/quick-job/quick-job-provider';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-manrope',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600'],
  variable: '--font-ibm-plex-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Autoservis - digitální diář',
  description: 'Digitální diář a zakázkový list pro malé autoservisy',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="cs" className="dark">
      <body
        className={`${manrope.variable} ${inter.variable} ${ibmPlexMono.variable} antialiased`}
      >
        <QuickJobProvider>{children}</QuickJobProvider>
      </body>
    </html>
  );
}
