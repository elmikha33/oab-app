'use client';

import { useGameStore } from '@/store/gameStore';

export default function AchievementsPage() {
  const questoesRespondidas = useGameStore(
    (state) => state.questoesRespondidas
  );

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