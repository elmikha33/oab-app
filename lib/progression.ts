import { BookOpen, Trophy, Crown, Zap, Medal } from 'lucide-react';

export const PROGRESSION_TIERS = [
  { minStreak: 30, title: "Mestre da OAB", icon: Crown, color: "text-yellow-400" },
  { minStreak: 14, title: "Advogado em Ascensão", icon: Trophy, color: "text-amber-500" },
  { minStreak: 7, title: "Bacharelando", icon: Medal, color: "text-emerald-400" },
  { minStreak: 3, title: "Estudante", icon: BookOpen, color: "text-blue-500" },
  { minStreak: 0, title: "Iniciante", icon: Zap, color: "text-blue-500" },
];

export const getProgressionInfo = (streak: number) => {
  return PROGRESSION_TIERS.find(tier => streak >= tier.minStreak) || PROGRESSION_TIERS[PROGRESSION_TIERS.length - 1];
};