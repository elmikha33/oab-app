import { create } from 'zustand';

type User = {
  nome: string;
  email?: string;
  premium: boolean;
  questoesRespondidas: number[];
};

type GameStore = {
  user: User | null;

  // estados principais
  questoesRespondidas: number[];
  questoesErradas: number[];

  // auth simples
  loginMock: (nome: string) => void;
  logout: () => void;
  comprarPremium: () => void;

  // lógica de questões
  registrarAcerto: (id: number) => void;
  registrarErro: (id: number) => void;

  // util
  reset: () => void;
};

export const useGameStore = create<GameStore>((set, get) => ({
  user: null,

  questoesRespondidas: [],
  questoesErradas: [],

  loginMock: (nome) =>
    set({
      user: {
        nome,
        email: `${nome.toLowerCase()}@local.com`,
        premium: false,
        questoesRespondidas: [],
      },
    }),

  logout: () =>
    set({
      user: null,
      questoesRespondidas: [],
      questoesErradas: [],
    }),

  comprarPremium: () =>
    set((state) => ({
      user: state.user
        ? { ...state.user, premium: true }
        : state.user,
    })),

  registrarAcerto: (id) =>
    set((state) => {
      if (state.questoesRespondidas.includes(id)) return state;

      return {
        questoesRespondidas: [...state.questoesRespondidas, id],
        user: state.user
          ? {
              ...state.user,
              questoesRespondidas: [
                ...state.user.questoesRespondidas,
                id,
              ],
            }
          : state.user,
      };
    }),

  registrarErro: (id) =>
    set((state) => ({
      questoesErradas: state.questoesErradas.includes(id)
        ? state.questoesErradas
        : [...state.questoesErradas, id],
    })),

  reset: () =>
    set({
      user: null,
      questoesRespondidas: [],
      questoesErradas: [],
    }),
}));