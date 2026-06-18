'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type GameState = {
  user: any;
  setUser: (u: any) => void;

  // QUESTÕES
  questoesRespondidas: number[];
  questoesErradas: number[];
  revisaoIds: number[];

  // CONQUISTAS
  conquistas: string[];

  // LOGIN / PREMIUM
  loginMock: (nome: string) => void;
  comprarPremium: () => void;

  // BOSS FIGHT SYSTEM
  bossHp: number;
  playerHp: number;

  combaterBoss: (dano: number) => void;
  resetarBatalhaBoss: () => void;

  // XP SYSTEM (caso use futuramente)
  xp: number;
  addXp: (value: number) => void;
};

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);

  const [questoesRespondidas, setQuestoesRespondidas] = useState<number[]>([]);
  const [questoesErradas, setQuestoesErradas] = useState<number[]>([]);
  const [revisaoIds, setRevisaoIds] = useState<number[]>([]);
  const [conquistas, setConquistas] = useState<string[]>([]);

  // BOSS SYSTEM
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);

  // XP SYSTEM
  const [xp, setXp] = useState(0);

  // LOGIN MOCK
  const loginMock = (nome: string) => {
    setUser({
      id: Date.now(),
      nome,
      premium: false,
    });
  };

  // PREMIUM MOCK
  const comprarPremium = () => {
    setUser((prev: any) => ({
      ...prev,
      premium: true,
    }));
  };

  // BOSS ACTION
  const combaterBoss = (dano: number) => {
    setBossHp((prev) => Math.max(0, prev - dano));
    setPlayerHp((prev) => Math.max(0, prev - 5));
  };

  const resetarBatalhaBoss = () => {
    setBossHp(100);
    setPlayerHp(100);
  };

  // XP
  const addXp = (value: number) => {
    setXp((prev) => prev + value);
  };

  return (
    <GameStateContext.Provider
      value={{
        user,
        setUser,

        questoesRespondidas,
        questoesErradas,
        revisaoIds,

        conquistas,

        loginMock,
        comprarPremium,

        bossHp,
        playerHp,
        combaterBoss,
        resetarBatalhaBoss,

        xp,
        addXp,
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const context = useContext(GameStateContext);

  if (!context) {
    throw new Error('useGameState deve estar dentro do GameStateProvider');
  }

  return context;
}