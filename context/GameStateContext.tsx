'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type GameState = {
  user: {
    nome?: string;
    email?: string;
    premium?: boolean;
  } | null;

  setUser: (u: any) => void;

  questoesRespondidas: number[];
  questoesErradas: number[];

  loginMock: (name: string) => void;
  comprarPremium: () => void;

  registrarAcerto: (id: number) => void;
  registrarErro: (id: number) => void;
};

const GameContext = createContext<GameState | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);

  const [questoesRespondidas, setQuestoesRespondidas] = useState<number[]>([]);
  const [questoesErradas, setQuestoesErradas] = useState<number[]>([]);

  function loginMock(name: string) {
    setUser({ nome: name, premium: false });
  }

  function comprarPremium() {
    setUser((prev: any) =>
      prev ? { ...prev, premium: true } : { nome: 'user', premium: true }
    );
  }

  function registrarAcerto(id: number) {
    setQuestoesRespondidas(prev =>
      prev.includes(id) ? prev : [...prev, id]
    );
  }

  function registrarErro(id: number) {
    setQuestoesErradas(prev =>
      prev.includes(id) ? prev : [...prev, id]
    );
  }

  return (
    <GameContext.Provider
      value={{
        user,
        setUser,
        questoesRespondidas,
        questoesErradas,
        loginMock,
        comprarPremium,
        registrarAcerto,
        registrarErro,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameContext);

  if (!ctx) {
    return {
      user: null,
      setUser: () => {},
      questoesRespondidas: [],
      questoesErradas: [],
      loginMock: () => {},
      comprarPremium: () => {},
      registrarAcerto: () => {},
      registrarErro: () => {},
    };
  }

  return ctx;
}