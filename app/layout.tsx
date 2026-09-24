import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from '@/providers/Providers';

export const metadata: Metadata = {
  title: 'Al Barakah Premium - Admin',
  robots: { index: false, follow: false },
};

const FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&family=Open+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Playfair+Display:ital,wght@0,600;0,700;0,800;1,600&family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=Rubik:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        {/* Same Google Fonts request as the storefront/legacy index.html (family names are referenced literally by inline styles). */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href={FONTS_HREF} rel="stylesheet" />
      </head>
      <body className="h-full bg-[#faf9f6] text-stone-900 antialiased selection:bg-amber-900 selection:text-amber-100">
        <div id="root" className="min-h-full flex flex-col">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
