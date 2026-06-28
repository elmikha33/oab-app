import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import ThemeProvider from '@/app/ThemeProvider';
import LayoutShell from '@/components/LayoutShell';
import PWARegister from '@/components/PWARegister';
import { GameStateProvider } from '@/context/GameStateContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#020617',
};

export const metadata: Metadata = {
  title: {
    default: 'OAPlay',
    template: '%s | OAPlay',
  },
  description: 'Treino diário para a 1ª fase da OAB',
  applicationName: 'OAPlay',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'OAPlay',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/oaplay-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/oaplay-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'OAPlay',
    description: 'Treino diário para a 1ª fase da OAB.',
    type: 'website',
    locale: 'pt_BR',
    images: [
      {
        url: '/oaplay-og-image.png',
        width: 1200,
        height: 630,
        alt: 'OAPlay',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OAPlay',
    description: 'Treino diário para a 1ª fase da OAB.',
    images: ['/oaplay-og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-950 antialiased transition-colors dark:bg-slate-950 dark:text-slate-50">
        <PWARegister />
        <ThemeProvider>
          <GameStateProvider>
            <LayoutShell>{children}</LayoutShell>
          </GameStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
