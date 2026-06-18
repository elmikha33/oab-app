'use client';

import { useGameState } from '@/context/GameStateContext';

export default function AchievementsPage() {
  const { questoesRespondidas } = useGameState();

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold">Conquistas</h1>

      <p className="text-sm mt-2">
        Questões respondidas:{' '}
        <strong>{questoesRespondidas.length}</strong>
      </p>
    </div>
  );
}