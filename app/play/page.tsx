'use client';

import React from 'react';
import { useGameStore } from '@/store/gameStore';

export default function PlayPage() {
  const user = useGameStore((s) => s.user);
  const setUser = useGameStore((s) => s.setUser);

  const handleCorrectAnswer = () => {
    if (!user) return;

    setUser({
      ...user,
      acertos: (user.acertos || 0) + 1,
    });
  };

  const handleWrongAnswer = () => {
    if (!user) return;

    setUser({
      ...user,
      erros: (user.erros || 0) + 1,
    });
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold">Modo Prova</h1>

      <p className="mt-2">
        Jogador: <strong>{user?.nome || 'Não logado'}</strong>
      </p>

      <div className="mt-6 flex gap-4">
        <button
          onClick={handleCorrectAnswer}
          className="px-4 py-2 bg-green-600 rounded"
        >
          Acertar
        </button>

        <button
          onClick={handleWrongAnswer}
          className="px-4 py-2 bg-red-600 rounded"
        >
          Errar
        </button>
      </div>

      <div className="mt-6">
        <p>Acertos: {user?.acertos || 0}</p>
        <p>Erros: {user?.erros || 0}</p>
      </div>
    </div>
  );
}