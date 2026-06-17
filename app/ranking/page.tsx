'use client';

import React, { useEffect, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { Trophy, Medal, User } from 'lucide-react';

export default function RankingPage() {
  const { ranking } = useGameState(); // Assumindo que seu contexto tem uma lista de 'ranking'
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Proteção contra erro de prerender: só renderiza se estiver montado e existir ranking
  if (!mounted || !ranking || !Array.isArray(ranking)) {
    return (
      <div className="flex-1 p-8 bg-slate-950 min-h-screen text-white">
        <h1 className="text-2xl font-bold mb-4">Ranking</h1>
        <p className="text-slate-400">Carregando classificação...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Trophy className="text-yellow-500" /> Ranking Global
      </h1>
      
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        {ranking.map((player: any, index: number) => (
          <div 
            key={player.id} 
            className={`flex items-center gap-4 p-4 border-b border-slate-800 last:border-0 ${index < 3 ? 'bg-slate-800/30' : ''}`}
          >
            <div className="w-8 text-center font-bold text-slate-500">
              {index === 0 ? <Medal className="text-yellow-400 inline" /> : index + 1}
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
              <User size={20} className="text-slate-400" />
            </div>
            <div className="flex-1">
              <p className="font-bold">{player.nome}</p>
              <p className="text-xs text-slate-400">Nível {player.nivel} • {player.xp} XP</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}