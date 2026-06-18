'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type GameState = {
  user: any;
  setUser: (u: any) => void;

  questoesRespondidas: number[];
  questoesErradas: number[];
  revisaoIds: number[];

  conquistas: string[];
  setConquistas: (c: string[]) => void;

  // 🆕 FUNÇÕES QUE ESTÃO FALTANDO NO SEU PROJETO
  loginMock: (nome: string) => void;
  comprarPremium: () => void;
};

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);

  const [questoesRespondidas, setQuestoesRespondidas] = useState<number[]>([]);
  const [questoesErradas, setQuestoesErradas] = useState<number[]>([]);
  const [revisaoIds, setRevisaoIds] = useState<number[]>([]);
  const [conquistas, setConquistas] = useState<string[]>([]);

  // 🧠 LOGIN SIMPLES (MOCK)
  const loginMock = (nome: string) => {
    setUser({
      id: Date.now(),
      nome,
      premium: false,
      questoesRespondidas: [],
      questoesErradas: [],
    });
  };

  // 💰 PREMIUM MOCK
  const comprarPremium = () => {
    setUser((prev: any) => ({
      ...prev,
      premium: true,
    }));
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
        setConquistas,

        loginMock,
        comprarPremium,
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