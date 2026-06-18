import './globals.css';
import { GameStateProvider } from '@/context/GameStateContext';
import { ThemeProvider } from '@/context/ThemeContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <ThemeProvider>
          <GameStateProvider>
            {children}
          </GameStateProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}