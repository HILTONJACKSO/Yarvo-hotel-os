import type { Metadata } from 'next';
import { Inter, Geist, Playfair_Display } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/lib/auth-provider';
import { ToastProvider } from '@/components/ui/toast-provider';
import { SyncProvider } from '@/lib/sync-provider';
import { CurrencyProvider } from '@/lib/currency';
import Script from 'next/script';

const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://kwaleebeachresort.com'),
  title: {
    default: 'Kwalee Beach Resort | Luxury Coastal Hotel & Beach Resort in Liberia',
    template: '%s | Kwalee Beach Resort',
  },
  description:
    'Discover Kwalee Beach Resort in Marshall, Liberia — where pristine beaches, oceanfront glamping tents, luxury rooms, poolside relaxation, dining, and unforgettable events create a truly memorable coastal escape.',
  keywords: [
    'kwalee beach resort',
    'kwalee resort',
    'liberia beach resort',
    'marshall liberia',
    'glamping tents liberia',
    'luxury resort liberia',
    'hotels in liberia'
  ],
  alternates: {
    canonical: 'https://kwaleebeachresort.com',
  },
  icons: {
    icon: [
      { url: '/favicon.ico?v=3' },
      { url: '/favicon-48x48.png?v=3', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96x96.png?v=3', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png?v=3', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-32x32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png?v=3', sizes: '16x16', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png?v=3', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico?v=3',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://kwaleebeachresort.com',
    siteName: 'Kwalee Beach Resort',
    title: 'Kwalee Beach Resort | Coastal Stays & Oceanfront Luxury in Liberia',
    description:
      'Come as guests, leave as family. Experience beach relaxation, poolside moments, fresh dining, oceanfront glamping tents, and unforgettable private celebrations at Kwalee Beach Resort in Marshall, Liberia.',
    images: [
      {
        url: '/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'Kwalee Beach Resort',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kwalee Beach Resort | Luxury Coastal Resort in Liberia',
    description:
      'Discover Kwalee Beach Resort in Marshall, Liberia. Oceanfront tents, luxury rooms, pristine beach, fine coastal dining, and private events.',
    images: ['/opengraph-image.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['LodgingBusiness', 'Resort', 'Hotel'],
      '@id': 'https://kwaleebeachresort.com/#hotel',
      name: 'Kwalee Beach Resort',
      url: 'https://kwaleebeachresort.com',
      logo: 'https://kwaleebeachresort.com/kwalee-logo.png',
      image: 'https://kwaleebeachresort.com/opengraph-image.png',
      description:
        'A premier luxury coastal destination in Marshall, Liberia offering beach relaxation, oceanfront glamping tents, dining, poolside experiences, and memorable events.',
      telephone: '+231774340843',
      email: 'kwaleebeachresort1@gmail.com',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Kpakpa Kon',
        addressLocality: 'Marshall',
        addressRegion: 'Margibi County',
        addressCountry: 'Liberia',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://kwaleebeachresort.com/#website',
      url: 'https://kwaleebeachresort.com',
      name: 'Kwalee Beach Resort',
      publisher: {
        '@id': 'https://kwaleebeachresort.com/#hotel',
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans scroll-smooth", geist.variable, inter.variable, playfair.variable)} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png?v=3" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?v=3" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen">
        <AuthProvider>
          <ToastProvider>
            <SyncProvider>
              <CurrencyProvider>
                {children}
              </CurrencyProvider>
            </SyncProvider>
          </ToastProvider>
        </AuthProvider>
        <Script
          id="sw-register"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", function() {
                  navigator.serviceWorker.register("/sw.js").catch(console.error);
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
