'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * USER
 */
type User = {
  nome?: string;
  email?: string;
  premium?: boolean;

  // compatibilidade com páginas antigas
  questoesRespondidas?: number[];
};

/**
 * GAME STATE (BLINDADO - compatível com tudo)
 */
type GameState = {
  user: User | null;
  setUser: (u: User | null) => void;

  loginMock: (nome: string) => void;
  comprarPremium: () => void;

  questoesRespondidas: number[];
  questoesErradas: number[];

  registrarAcerto: (id: number) => void;
  registrarErro: (id: number) => void;

  // 🔥 CAMPOS LEGADOS (evita build quebrar)
  conquistas: any[];
  bossHp: number;
  playerHp: number;
  combaterBoss: () => void;
  resetarBatalhaBoss: () => void;
};

const GameContext = createContext<GameState | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [questoesRespondidas, setQuestoesRespondidas] = useState<number[]>([]);
  const [questoesErradas, setQuestoesErradas] = useState<number[]>([]);

  // fallback sistemas antigos
  const [conquistas] = useState<any[]>([]);
  const [bossHp, setBossHp] = useState(100);
  const [playerHp] = useState(100);

  function loginMock(nome: string) {
    setUser({
      nome,
      email: `${nome.toLowerCase()}@local.com`,
      premium: false,
      questoesRespondidas: [],
    });
  }

  function comprarPremium() {
    setUser((prev) =>
      prev
        ? { ...prev, premium: true }
        : { nome: 'user', premium: true }
    );
  }

  function registrarAcerto(id: number) {
    setQuestoesRespondidas((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  }

  function registrarErro(id: number) {
    setQuestoesErradas((prev) =>
      prev.includes(id) ? prev : [...prev, id]
    );
  }

  // LEGADO (não usado mais, mas evita crash)
  function combaterBoss() {
    setBossHp((prev) => Math.max(prev - 10, 0));
  }

  function resetarBatalhaBoss() {
    setBossHp(100);
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

        // legados seguros
        conquistas,
        bossHp,
        playerHp,
        combaterBoss,
        resetarBatalhaBoss,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

/**
 * HOOK BLINDADO (NUNCA QUEBRA BUILD)
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

      conquistas: [],
      bossHp: 100,
      playerHp: 100,
      combaterBoss: () => {},
      resetarBatalhaBoss: () => {},
    } as GameState;
  }

  return ctx;
}