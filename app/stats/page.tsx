'use client';

import React, { useEffect, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';

export default function StatsPage() {
  const [isClient, setIsClient] = useState(false);
  const context = useGameState();

  useEffect(() => {
    setIsClient(true);
  }, []);

  // BLINDAGEM TOTAL: Se nÃ£o for o cliente (build), nÃ£o tenta acessar stats
  if (!isClient || typeof window === 'undefined') {
    return (
      <div className="flex-1 p-8 bg-slate-950 min-h-screen text-white">
        <h1 className="text-2xl font-bold mb-4">EstatÃ­sticas</h1>
        <p className="text-slate-400">Carregando...</p>
      </div>
    );
  }

  // SeguranÃ§a: se context for nulo, garantimos que stats Ã© um objeto vazio {}
  const stats = context?.stats ?? {};
  const statsEntries = Object.entries(stats);

  return (
    <div className="flex-1 p-6 md:p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">EstatÃ­sticas de Estudo</h1>

      {statsEntries.length === 0 ? (
        <p className="text-slate-500 italic">Nenhum dado disponÃ­vel.</p>
      ) : (
        <div className="grid gap-4">
          {statsEntries.map(([materia, valor]) => (
            <div key={materia} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between mb-2">
                <span className="font-bold">{materia}</span>
                <span>{typeof valor === 'number' ? `${valor}%` : '0%'}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full" 
                  style={{ width: `${typeof valor === 'number' ? valor : 0}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}