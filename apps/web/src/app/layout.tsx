import type { Metadata } from 'next';
import { Inter, Geist, Playfair_Display } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/lib/auth-provider';
import { ToastProvider } from '@/components/ui/toast-provider';
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
  title: {
    default: 'Kwalee Beach Resort | Beach Resort in Liberia',
    template: '%s | Kwalee Beach Resort',
  },
  description:
    'Discover Kwalee Beach Resort — a coastal destination in Liberia offering beach relaxation, poolside experiences, dining, drinks and unforgettable events by the ocean.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans scroll-smooth", geist.variable, inter.variable, playfair.variable)} suppressHydrationWarning>
      <body className="antialiased min-h-screen">
        <AuthProvider>
          <ToastProvider>
            {children}
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
