'use client';

import { useEffect, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';

export default function AchievementsPage() {
  const state = useGameState();

  const user = state?.user ?? null;
  const conquistas = state?.conquistas ?? [];

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-6">
        🏆 Conquistas
      </h1>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-sm">
          Total de conquistas: <strong>{conquistas.length}</strong>
        </p>

        <p className="text-sm mt-2">
          Questões respondidas: <strong>{user?.questoesRespondidas?.length || 0}</strong>
        </p>

        <div className="mt-4 space-y-2">
          {conquistas.length === 0 ? (
            <p className="text-slate-400 text-sm">
              Nenhuma conquista ainda.
            </p>
          ) : (
            conquistas.map((c, i) => (
              <div
                key={i}
                className="p-2 bg-slate-800 rounded-lg text-sm"
              >
                {c}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}