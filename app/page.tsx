'use client';

import { useEffect, useState } from 'react';
import Dashboard from '@/components/Dashboard';

export default function Page() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Blindagem: Se não estiver no navegador, não tenta renderizar o Dashboard
  if (!isClient) {
    return (
      <div className="flex-1 p-8 bg-slate-950 min-h-screen text-white flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return <Dashboard />;
}