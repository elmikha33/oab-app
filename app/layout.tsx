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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <GameStateProvider>
          <LayoutShell>
            {children}
          </LayoutShell>
        </GameStateProvider>
      </body>
    </html>
  );
}