import './globals.css';
import type { Metadata, Viewport } from 'next';
import ThemeProvider from '@/app/ThemeProvider';
import LayoutShell from '@/components/LayoutShell';
import { GameStateProvider } from '@/context/GameStateContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Missao OAB',
  description: 'Sistema de estudo',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
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
