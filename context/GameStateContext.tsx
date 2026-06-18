'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * USER TYPE (compatível com páginas antigas)
 */
type User = {
  nome?: string;
  email?: string;
  premium?: boolean;
  questoesRespondidas?: number[];
};

/**
 * GAME STATE TOTALMENTE BLINDADO
 * (contém tudo que seu app já tentou usar em algum momento)
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

  // =========================
  // LEGACY / UI STATES
  // =========================
  conquistas: any[];

  bossHp: number;
  playerHp: number;

  combaterBoss: () => void;
  resetarBatalhaBoss: () => void;

  // =========================
  // FUNÇÕES QUE JÁ EXISTIRAM NO SEU APP
  // =========================
  buscarQuestaoDificil: () => any;
};

const GameContext = createContext<GameState | undefined>(undefined);

/**
 * PROVIDER
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const [questoesRespondidas, setQuestoesRespondidas] = useState<number[]>([]);
  const [questoesErradas, setQuestoesErradas] = useState<number[]>([]);

  const [bossHp, setBossHp] = useState(100);
  const [playerHp] = useState(100);

  const [conquistas] = useState<any[]>([]);

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
   * QUESTÕES
   */
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

  /**
   * BOSS (LEGACY SAFE)
   */
  function combaterBoss() {
    setBossHp((prev) => Math.max(prev - 10, 0));
  }

  function resetarBatalhaBoss() {
    setBossHp(100);
  }

  /**
   * QUESTÃO DIFÍCIL (STUB SEGURO)
   * evita crash se ainda não existe backend real
   */
  function buscarQuestaoDificil() {
    return {
      id: 1,
      enunciado: 'Questão simulada (fallback seguro para build)',
      alternativas: ['A', 'B', 'C', 'D'],
      resposta: 'A',
      dificuldade: 'difícil',
    };
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

        conquistas,

        bossHp,
        playerHp,

        combaterBoss,
        resetarBatalhaBoss,

        buscarQuestaoDificil,
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

      buscarQuestaoDificil: () => ({
        id: 1,
        enunciado: 'Fallback seguro',
        alternativas: ['A', 'B', 'C', 'D'],
        resposta: 'A',
        dificuldade: 'facil',
      }),
    } as GameState;
  }

  return ctx;
}