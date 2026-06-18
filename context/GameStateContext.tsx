'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const GameStateContext = createContext<any>(null);

export const GameStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  // CARREGAR USER
  useEffect(() => {
    const saved = localStorage.getItem('user-game-data');

    const today = new Date().toISOString().split('T')[0];

    if (saved) {
      const parsed = JSON.parse(saved);

      const updated = {
        nome: parsed.nome || 'Candidato',
        streak: parsed.streak || 1,
        lastAccess: today,
        acertos: parsed.acertos || 0,
        questoesRespondidas: parsed.questoesRespondidas || [],
        questoesErradas: parsed.questoesErradas || [],
        isPremium: parsed.isPremium || false,
      };

      setUser(updated);
    } else {
      const fresh = {
        nome: 'Candidato',
        streak: 1,
        lastAccess: today,
        acertos: 0,
        questoesRespondidas: [],
        questoesErradas: [],
        isPremium: false,
      };

      setUser(fresh);
    }
  }, []);

  // SALVAR USER
  useEffect(() => {
    if (!user) return;
    localStorage.setItem('user-game-data', JSON.stringify(user));
  }, [user]);

  const registrarAcerto = (id: number) => {
    setUser((prev: any) => ({
      ...prev,
      acertos: (prev.acertos || 0) + 1,
      questoesRespondidas: [...new Set([...(prev.questoesRespondidas || []), id])],
      questoesErradas: (prev.questoesErradas || []).filter((x: number) => x !== id),
    }));
  };

  const registrarErro = (id: number) => {
    setUser((prev: any) => ({
      ...prev,
      questoesRespondidas: [...new Set([...(prev.questoesRespondidas || []), id])],
      questoesErradas: [...new Set([...(prev.questoesErradas || []), id])],
    }));
  };

  return (
    <GameStateContext.Provider
      value={{ user, setUser, registrarAcerto, registrarErro }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => {
  const ctx = useContext(GameStateContext);
  if (!ctx) {
    throw new Error('useGameState deve estar dentro do GameStateProvider');
  }
  return ctx;
};