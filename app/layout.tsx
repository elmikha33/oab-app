import './globals.css';

import { GameStateProvider } from '@/context/GameStateContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Metadata } from 'next';
import LayoutShell from '@/components/LayoutShell';

export const metadata: Metadata = {
  title: 'Missão OAB',
  description: 'Sistema de estudo',
};

<html lang="pt-BR" className={theme === 'dark' ? 'dark' : 'light'}>
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-br">
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