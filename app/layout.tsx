import './globals.css';

export const metadata = {
  title: 'OAB App',
  description: 'Sistema de questões OAB',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body>{children}</body>
    </html>
  );
}