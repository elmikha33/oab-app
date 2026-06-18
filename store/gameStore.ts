import { create } from 'zustand';

type User = {
  nome: string;
  email?: string;
  premium?: boolean;
  questoesRespondidas?: number[];
};

type GameState = {
  user: User | null;

  loginMock: (nome: string) => void;
  comprarPremium: () => void;

  questoesRespondidas: number[];
  questoesErradas: number[];

  registrarAcerto: (id: number) => void;
  registrarErro: (id: number) => void;

  setUser: (user: User | null) => void;
};

export const useGameStore = create<GameState>((set, get) => ({
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
        questoesRespondidas: [],
      },
    }),

  comprarPremium: () =>
    set((state) => ({
      user: state.user
        ? { ...state.user, premium: true }
        : { nome: 'user', premium: true },
    })),

  registrarAcerto: (id) => {
    const state = get();

    if (!state.questoesRespondidas.includes(id)) {
      set({
        questoesRespondidas: [...state.questoesRespondidas, id],
      });
    }

    if (state.user) {
      set({
        user: {
          ...state.user,
          questoesRespondidas: [
            ...(state.user.questoesRespondidas || []),
            id,
          ],
        },
      });
    }
  },

  registrarErro: (id) => {
    const state = get();

    if (!state.questoesErradas.includes(id)) {
      set({
        questoesErradas: [...state.questoesErradas, id],
      });
    }
  },
}));