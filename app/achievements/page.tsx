'use client';

import React from 'react';
import { useGameState } from '@/context/GameStateContext';
import { Award, Lock } from 'lucide-react';

// Definindo a interface para evitar o erro de 'any' implícito
interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
}

export default function AchievementsPage() {
  const { user, conquistas } = useGameState();

  // Mapeamento de ícones (ajuste conforme seus ícones importados)
  const mapaIcones: Record<string, any> = {
    'award': Award,
    'lock': Lock
  };

  if (!user) return null;

  return (
    <div className="flex-1 p-6 md:p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-8">Suas Conquistas</h1>
      
      {/* Grid de Medalhas */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {conquistas.map((badge: Conquista) => {
          const desbloqueado = user.conquistasDesbloqueadas?.includes(badge.id);
          const IconeComp = mapaIcones[badge.icone] || Award;

          return (
            <div 
              key={badge.id} 
              className={`p-6 rounded-2xl border ${desbloqueado ? 'bg-slate-900 border-indigo-500/50' : 'bg-slate-900/50 border-slate-800'}`}
            >
              <div className={`mb-4 ${desbloqueado ? 'text-yellow-400' : 'text-slate-600'}`}>
                {desbloqueado ? <IconeComp size={32} /> : <Lock size={32} />}
              </div>
              <h3 className="font-bold text-lg">{badge.titulo}</h3>
              <p className="text-sm text-slate-400">{badge.descricao}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}