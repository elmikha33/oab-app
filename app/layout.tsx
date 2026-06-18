import './globals.css';

import { GameStateProvider } from '@/context/GameStateContext';
import { ThemeProvider } from '@/context/ThemeContext';

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
            {children}
          </ThemeProvider>
        </GameStateProvider>

      </body>
    </html>
  );
}