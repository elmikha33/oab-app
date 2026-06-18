'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * TIPAGEM SEGURA (evita erros de build tipo "property does not exist")
 */
type User = {
  nome?: string;
  email?: string;
  premium?: boolean;
  questoesRespondidas?: number[];
};

type GameState = {
  user: User | null;

  setUser: (u: User | null) => void;

  loginMock: (nome: string) => void;
  comprarPremium: () => void;

  questoesRespondidas: number[];
  questoesErradas: number[];

  registrarAcerto: (id: number) => void;
  registrarErro: (id: number) => void;
};

const GameContext = createContext<GameState | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [questoesRespondidas, setQuestoesRespondidas] = useState<number[]>([]);
  const [questoesErradas, setQuestoesErradas] = useState<number[]>([]);

  /**
   * LOGIN MOCK
   */
  function loginMock(nome: string) {
    setUser({
      nome,
      email: `${nome.toLowerCase()}@local.com`,
      premium: false,
      questoesRespondidas: [],
    });
  }

  /**
   * PREMIUM MOCK
   */
  function comprarPremium() {
    setUser((prev) =>
      prev
        ? { ...prev, premium: true }
        : { nome: 'user', premium: true }
    );
  }

  /**
   * ACERTO
   */
  function registrarAcerto(id: number) {
    setQuestoesRespondidas((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );

    setUser((prev) =>
      prev
        ? {
            ...prev,
            questoesRespondidas: [
              ...(prev.questoesRespondidas || []),
              id,
            ],
          }
        : prev
    );
  }

  /**
   * ERRO
   */
  function registrarErro(id: number) {
    setQuestoesErradas((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  }

  return (
    <GameContext.Provider
      value={{
        user,
        setUser,
        loginMock,
        comprarPremium,
        questoesRespondidas,
        questoesErradas,
        registrarAcerto,
        registrarErro,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

/**
 * HOOK SEGURO (não quebra build mesmo se esquecer Provider)
 */
export function useGameState() {
  const ctx = useContext(GameContext);

  if (!ctx) {
    return {
      user: null,
      setUser: () => {},

      loginMock: () => {},
      comprarPremium: () => {},

      questoesRespondidas: [],
      questoesErradas: [],

      registrarAcerto: () => {},
      registrarErro: () => {},
    } as GameState;
  }

  return ctx;
}