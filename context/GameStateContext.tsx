'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type GameState = {
  user: any;
  setUser: (u: any) => void;
  registrarAcerto: (id: number) => void;
  registrarErro: (id: number) => void;
  questoesRespondidas: number[];
  questoesErradas: number[];
  revisaoIds: number[];
};

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [questoesRespondidas, setRespondidas] = useState<number[]>([]);
  const [questoesErradas, setErradas] = useState<number[]>([]);
  const [revisaoIds, setRevisaoIds] = useState<number[]>([]);

  useEffect(() => {
    // SSR safe init
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem('gameState');
    if (saved) {
      const parsed = JSON.parse(saved);
      setUser(parsed.user || null);
      setRespondidas(parsed.questoesRespondidas || []);
      setErradas(parsed.questoesErradas || []);
      setRevisaoIds(parsed.revisaoIds || []);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(
      'gameState',
      JSON.stringify({
        user,
        questoesRespondidas,
        questoesErradas,
        revisaoIds,
      })
    );
  }, [user, questoesRespondidas, questoesErradas, revisaoIds]);

  const registrarAcerto = (id: number) => {
    setRespondidas((prev) => [...new Set([...prev, id])]);
    setRevisaoIds((prev) => prev.filter((x) => x !== id));
  };

  const registrarErro = (id: number) => {
    setErradas((prev) => [...new Set([...prev, id])]);
    setRevisaoIds((prev) => [...new Set([...prev, id])]);
  };

  return (
    <GameStateContext.Provider
      value={{
        user,
        setUser,
        registrarAcerto,
        registrarErro,
        questoesRespondidas,
        questoesErradas,
        revisaoIds,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);

  // 🔥 BLINDAGEM SSR (não quebra build nunca)
  if (!context) {
    return {
      user: null,
      setUser: () => {},
      registrarAcerto: () => {},
      registrarErro: () => {},
      questoesRespondidas: [],
      questoesErradas: [],
      revisaoIds: [],
    };
  }

  return context;
}