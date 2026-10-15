import type { Metadata, Viewport } from 'next';
import './globals.css';

const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://omni.foxintelligence.co.uk';

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: { default: 'OMNISYNAPSE Ω — FOX Intelligence', template: '%s · OMNISYNAPSE Ω' },
  description: 'One Mind. Infinite Connections. Continuous Evolution. The private supervisory intelligence layer of the FOX Intelligence ecosystem.',
  applicationName: 'OMNISYNAPSE',
  robots: { index: false, follow: false },
  openGraph: { title: 'OMNISYNAPSE Ω', description: 'The supervisory mind of the FOX Intelligence ecosystem.', images: ['/og.jpg'], siteName: 'FOX Intelligence' },
};

export const viewport: Viewport = { themeColor: '#05080d', width: 'device-width', initialScale: 1, viewportFit: 'cover' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-GB">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Michroma&family=Space+Mono:wght@400;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
