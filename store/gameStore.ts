import { create } from 'zustand';

/**
 * TIPOS BÁSICOS (SEM GameState complexo quebrando build)
 */
type User = {
  nome: string;
  email: string;
  premium: boolean;
};

type GameStore = {
  user: User | null;

  questoesRespondidas: number[];
  questoesErradas: number[];

  // AUTH
  loginMock: (nome: string) => void;
  comprarPremium: () => void;

  // QUESTÕES
  registrarAcerto: (id: number) => void;
  registrarErro: (id: number) => void;

  // USER
  setUser: (user: User | null) => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  user: null,

  questoesRespondidas: [],
  questoesErradas: [],

  setUser: (user) => set({ user }),

  loginMock: (nome) =>
    set({
      user: {
        nome,
        email: `${nome.toLowerCase()}@local.com`,
        premium: false,
      },
    }),

  comprarPremium: () =>
    set((state) => ({
      user: state.user ? { ...state.user, premium: true } : null,
    })),

  registrarAcerto: (id) =>
    set((state) => ({
      questoesRespondidas: state.questoesRespondidas.includes(id)
        ? state.questoesRespondidas
        : [...state.questoesRespondidas, id],
    })),

  registrarErro: (id) =>
    set((state) => ({
      questoesErradas: state.questoesErradas.includes(id)
        ? state.questoesErradas
        : [...state.questoesErradas, id],
    })),
}));