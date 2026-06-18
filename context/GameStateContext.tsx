'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * GAME STATE BLINDADO (PRODUÇÃO)
 * - Não quebra build
 * - Campos opcionais seguros
 * - Compatível com qualquer page
 */

type User = {
  nome?: string;
  email?: string;
  premium?: boolean;
} | null;

type GameState = {
  user: User;

  // AUTH SAFE
  loginMock: (name: string) => void;
  logout: () => void;
  comprarPremium: () => void;

  // PROGRESSO
  conquistas: string[];

  // BOSS (opcional, não quebra se não usar)
  bossHp: number;
  playerHp: number;
  combaterBoss: () => void;
  resetarBatalhaBoss: () => void;
};

const GameContext = createContext<GameState | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);

  const [conquistas, setConquistas] = useState<string[]>([]);

  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);

  function loginMock(name: string) {
    setUser({ nome: name, premium: false });
  }

  function logout() {
    setUser(null);
  }

  function comprarPremium() {
    setUser(prev =>
      prev ? { ...prev, premium: true } : { nome: 'User', premium: true }
    );
  }

  function combaterBoss() {
    setBossHp(hp => Math.max(0, hp - 10));
    setPlayerHp(hp => Math.max(0, hp - 5));
  }

  function resetarBatalhaBoss() {
    setBossHp(100);
    setPlayerHp(100);
  }

  return (
    <GameContext.Provider
      value={{
        user,
        loginMock,
        logout,
        comprarPremium,
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

export function useGameState() {
  const context = useContext(GameContext);

  if (!context) {
    // 🔥 BLINDAGEM DE BUILD (não quebra SSR / Vercel)
    return {
      user: null,
      loginMock: () => {},
      logout: () => {},
      comprarPremium: () => {},
      conquistas: [],
      bossHp: 0,
      playerHp: 0,
      combaterBoss: () => {},
      resetarBatalhaBoss: () => {},
    };
  }

  return context;
}