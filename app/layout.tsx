import type { Metadata, Viewport } from 'next';
import { Fraunces, IBM_Plex_Mono, Public_Sans } from 'next/font/google';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-fraunces',
  display: 'swap',
});

const publicSans = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-public-sans',
  display: 'swap',
});

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
});

const TITLE = 'The Fifth Card & the Coin';
const TAGLINE = 'Four cards name the fifth. The bandwidth left over calls the coin.';

export const metadata: Metadata = {
  title: { default: TITLE, template: `%s · ${TITLE}` },
  description: TAGLINE,
  applicationName: TITLE,
  openGraph: {
    title: TITLE,
    description: TAGLINE,
    type: 'website',
    siteName: TITLE,
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: TAGLINE,
  },
};

export const viewport: Viewport = {
  themeColor: '#0E3A2C',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable} ${plexMono.variable}`}>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
