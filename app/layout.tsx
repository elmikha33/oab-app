import { GameProvider } from '@/context/GameStateContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <GameProvider>{children}</GameProvider>
      </body>
    </html>
  );
}