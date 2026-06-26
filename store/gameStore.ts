import { create } from 'zustand';

export interface GameState {
  level: number;
  xp: number;
  lives: number;
  incrementXP: (amount: number) => void;
  loseLife: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  level: 1,
  xp: 0,
  lives: 3,

  incrementXP: (amount) =>
    set((state) => {
      const totalXP = state.xp + amount;
      const level = 1 + Math.floor(totalXP / 1_000); // sobe 1 nível a cada 1000 XP
      return { xp: totalXP, level };
    }),

  loseLife: () =>
    set((state) => ({ lives: Math.max(0, state.lives - 1) })),

  reset: () => set({ level: 1, xp: 0, lives: 3 }),
}));
