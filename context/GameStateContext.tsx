'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type GameState = {
  user: any;
  setUser: (u: any) => void;

  registrarAcerto: (id: number) => void;
  registrarErro: (id: number) => void;

  questoesRespondidas: number[];
  questoesErradas: number[];
  revisaoIds: number[];

  // 🆕 CONQUISTAS (CORRIGE SEU ERRO)
  conquistas: string[];
  setConquistas: (c: string[]) => void;
};

const GameStateContext = createContext<GameState | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);

  const [questoesRespondidas, setQuestoesRespondidas] = useState<number[]>([]);
  const [questoesErradas, setQuestoesErradas] = useState<number[]>([]);
  const [revisaoIds, setRevisaoIds] = useState<number[]>([]);

  // 🆕 CONQUISTAS STATE
  const [conquistas, setConquistas] = useState<string[]>([]);

  const registrarAcerto = (id: number) => {
    setQuestoesRespondidas((prev) => [...new Set([...prev, id])]);
    setRevisaoIds((prev) => prev.filter((x) => x !== id));
  };

  const registrarErro = (id: number) => {
    setQuestoesErradas((prev) => [...new Set([...prev, id])]);
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

        // 🆕 EXPORTANDO
        conquistas,
        setConquistas,
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