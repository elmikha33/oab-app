'use client';

import { create } from 'zustand';

/**
 * TIPOS SEGUROS (NUNCA MAIS QUEBRA BUILD)
 */
export type User = {
  nome: string;
  email?: string;
  premium: boolean;

  questoesRespondidas: number[];

  acertos: number;
  erros: number;
};

type GameState = {
  user: User | null;

  setUser: (user: User | null) => void;

  loginMock: (nome: string) => void;
  comprarPremium: () => void;

  registrarAcerto: () => void;
  registrarErro: () => void;
};

/**
 * STORE ZUSTAND (SIMPLIFICADO E ESTÁVEL)
 */
export const useGameStore = create<GameState>((set, get) => ({
  user: null,

  setUser: (user) => set({ user }),

  loginMock: (nome) =>
    set({
      user: {
        nome,
        email: `${nome.toLowerCase()}@local.com`,
        premium: false,
        questoesRespondidas: [],
        acertos: 0,
        erros: 0,
      },
    }),

  comprarPremium: () =>
    set((state) => ({
      user: state.user
        ? { ...state.user, premium: true }
        : null,
    })),

  registrarAcerto: () =>
    set((state) => {
      if (!state.user) return state;

      return {
        user: {
          ...state.user,
          acertos: state.user.acertos + 1,
        },
      };
    }),

  registrarErro: () =>
    set((state) => {
      if (!state.user) return state;

      return {
        user: {
          ...state.user,
          erros: state.user.erros + 1,
        },
      };
    }),
}));