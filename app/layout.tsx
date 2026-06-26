import './globals.css';
import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import ThemeProvider from '@/app/ThemeProvider';
import LayoutShell from '@/components/LayoutShell';
import { GameStateProvider } from '@/context/GameStateContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0d1b2a',
};

export const metadata: Metadata = {
  title: {
    default: 'OAPlay',
    template: '%s | OAPlay',
  },
  description: 'Questões OAB gamificadas para estudar, jogar, evoluir e acelerar sua aprovação.',
  applicationName: 'OAPlay',
  appleWebApp: {
    capable: true,
    title: 'OAPlay',
    statusBarStyle: 'black-translucent',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/oaplay-icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/oaplay-icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [{ url: '/oaplay-icon-180.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'OAPlay',
    description: 'Questões OAB gamificadas para estudar, jogar, evoluir e ser aprovado.',
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
    description: 'Questões OAB gamificadas para estudar, jogar, evoluir e ser aprovado.',
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
        <ThemeProvider>
          <GameStateProvider>
            <LayoutShell>{children}</LayoutShell>
          </GameStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
