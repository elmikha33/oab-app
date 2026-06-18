<<<<<<< HEAD
import { GameProvider } from '@/context/GameStateContext';
=======
import './globals.css';
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
>>>>>>> e1e1b23 (primeira versao)

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
<<<<<<< HEAD
        <GameProvider>{children}</GameProvider>
=======
        <GameStateProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </GameStateProvider>
>>>>>>> e1e1b23 (primeira versao)
      </body>
    </html>
  );
}