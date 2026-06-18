import { GameStateProvider } from '@/context/GameStateContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <GameStateProvider>
          {children}
        </GameStateProvider>
      </body>
    </html>
  );
}