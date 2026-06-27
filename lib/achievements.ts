import type { LucideIcon } from 'lucide-react';
import { CheckCircle2, Crown, Flame, RotateCcw, ShieldCheck, Target, Trophy } from 'lucide-react';

export type AchievementDefinition = {
  id: string;
  emoji: string;
  icon: LucideIcon;
  title: string;
  description: string;
  requirement: string;
};

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: 'first_question',
    emoji: '\u{1F3AF}',
    icon: Target,
    title: 'Primeira questão',
    description: 'Responda sua primeira questão no OAPlay.',
    requirement: 'Responder 1 questão',
  },
  {
    id: 'ten_correct',
    emoji: '\u{2694}\u{FE0F}',
    icon: CheckCircle2,
    title: 'Sequência inicial',
    description: 'Acerte 10 questões no total.',
    requirement: '10 acertos',
  },
  {
    id: 'fifty_correct',
    emoji: '\u{1F525}',
    icon: Flame,
    title: 'Ritmo de prova',
    description: 'Acerte 50 questões no total.',
    requirement: '50 acertos',
  },
  {
    id: 'hundred_correct',
    emoji: '\u{1F3C6}',
    icon: Trophy,
    title: 'Maratonista OAB',
    description: 'Acerte 100 questões no total.',
    requirement: '100 acertos',
  },
  {
    id: 'reviewed_33',
    emoji: '\u{1F9E0}',
    icon: RotateCcw,
    title: 'Revisou 33 questões',
    description: 'Conclua 33 questões no modo revisão.',
    requirement: '33 questões revisadas',
  },
  {
    id: 'twenty_five_review',
    emoji: '\u{1F6E1}\u{FE0F}',
    icon: ShieldCheck,
    title: 'Caçador de erros',
    description: 'Acumule 25 erros para revisar.',
    requirement: '25 erros para revisar',
  },
  {
    id: 'seven_days',
    emoji: '\u{1F4C5}',
    icon: Flame,
    title: 'Constância semanal',
    description: 'Estude em 7 dias ativos.',
    requirement: '7 dias ativos',
  },
  {
    id: 'premium',
    emoji: '\u{1F451}',
    icon: Crown,
    title: 'Aluno Premium',
    description: 'Desbloqueie o plano Premium.',
    requirement: 'Conta Premium ativa',
  },
];

function totalRespondidas(user: any) {
  return Math.max(
    Number(user?.lifetimeQuestions || 0),
    Array.isArray(user?.questoesRespondidas) ? user.questoesRespondidas.length : 0
  );
}

function totalRevisao(user: any) {
  const revisao = Array.isArray(user?.revisaoIds) ? user.revisaoIds.length : 0;
  const erradas = Array.isArray(user?.questoesErradas) ? user.questoesErradas.length : 0;

  return revisao + erradas;
}

export function isAchievementUnlocked(id: string, user: any) {
  const acertos = Math.max(Number(user?.lifetimeCorrect || 0), Number(user?.acertos || 0));
  const respondidas = totalRespondidas(user);
  const revisao = Math.max(Number(user?.lifetimeReview || 0), totalRevisao(user));
  const diasAtivos = Math.max(
    Number(user?.lifetimeActiveDays || 0),
    Number(user?.rankingActiveDays || 0),
    Number(user?.streak || 0)
  );

  switch (id) {
    case 'first_question':
      return respondidas >= 1 || acertos >= 1;
    case 'ten_correct':
      return acertos >= 10;
    case 'fifty_correct':
      return acertos >= 50;
    case 'hundred_correct':
      return acertos >= 100;
    case 'reviewed_33':
      return Number(user?.lifetimeReviewed || 0) >= 33;
    case 'twenty_five_review':
      return revisao >= 25;
    case 'seven_days':
      return diasAtivos >= 7;
    case 'premium':
      return Boolean(user?.isPremium);
    default:
      return false;
  }
}

export function countUnlockedAchievements(user: any) {
  return ACHIEVEMENTS.filter((achievement) => isAchievementUnlocked(achievement.id, user)).length;
}
