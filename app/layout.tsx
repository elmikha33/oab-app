import './globals.css';
<<<<<<< HEAD

import { GameStateProvider } from '@/context/GameStateContext';
import { ThemeProvider } from '@/context/ThemeContext';
=======
import { Metadata, Viewport } from 'next';
import { GameStateProvider } from '../context/GameStateContext';
import LayoutShell from '../components/LayoutShell';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Missão OAB',
  description: 'Sistema de estudo',
};
>>>>>>> 287bc4ad7e1c302163ff1f5fe459d04185da957e

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
<<<<<<< HEAD
    <html lang="pt-br">
      <body className="min-h-screen bg-slate-950 text-white">

        <GameStateProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </GameStateProvider>

=======
    <html lang="pt-BR">
      <body>
        <GameStateProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </GameStateProvider>
>>>>>>> 287bc4ad7e1c302163ff1f5fe459d04185da957e
      </body>
    </html>
  );
}