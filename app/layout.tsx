import './globals.css';

import { GameStateProvider } from '@/context/GameStateContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Metadata, Viewport } from 'next';
import LayoutShell from '@/components/LayoutShell';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Missão OAB',
  description: 'Sistema de estudo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-white">
        <GameStateProvider>
          <ThemeProvider>
            <LayoutShell>{children}</LayoutShell>
          </ThemeProvider>
        </GameStateProvider>
      </body>
    </html>
  );
}