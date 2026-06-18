'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type GameState = {
  user: any;
  setUser: (u: any) => void;

  // PROGRESSO
  questoesRespondidas: number[];
  questoesErradas: number[];
  revisaoIds: number[];

  // XP / PROGRESSO
  xp: number;
  addXp: (value: number) => void;

  // CONQUISTAS (evita erro do achievements)
  conquistas: string[];

  // AÇÕES DO APP
  loginMock: (nome: string) => void;
  comprarPremium: () => void;

  registrarAcerto: (id: number) => void;
  registrarErro: (id: number) => void;
};

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);

  const [questoesRespondidas, setQuestoesRespondidas] = useState<number[]>([]);
  const [questoesErradas, setQuestoesErradas] = useState<number[]>([]);
  const [revisaoIds, setRevisaoIds] = useState<number[]>([]);
  const [conquistas] = useState<string[]>([]);

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

  // ACERTO
  const registrarAcerto = (id: number) => {
    setQuestoesRespondidas((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );

    setXp((prev) => prev + 10);
  };

  // ERRO
  const registrarErro = (id: number) => {
    setQuestoesErradas((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  };

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

        xp,
        addXp,

        conquistas,

        loginMock,
        comprarPremium,

        registrarAcerto,
        registrarErro,
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