import type { LucideIcon } from 'lucide-react';
import { Brain, CheckCircle2, Compass, Crown, Flame, RotateCcw, ShieldCheck, Sparkles, Target, Trophy, Zap } from 'lucide-react';

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
    id: 'three_active_days',
    emoji: '\u{1F9ED}',
    icon: Compass,
    title: 'Rota traçada',
    description: 'Volte ao OAPlay em 3 dias ativos e transforme estudo em hábito.',
    requirement: '3 dias ativos',
  },
  {
    id: 'twenty_five_questions',
    emoji: '\u{26A1}',
    icon: Zap,
    title: 'Sprint de arrancada',
    description: 'Responda 25 questões e aqueça o motor da aprovação.',
    requirement: '25 questões respondidas',
  },
  {
    id: 'twenty_five_correct',
    emoji: '\u{1F48E}',
    icon: Sparkles,
    title: 'Precisão lapidada',
    description: 'Some 25 acertos e mostre que sua técnica já está ficando afiada.',
    requirement: '25 acertos',
  },
  {
    id: 'reviewed_5',
    emoji: '\u{1F9E0}',
    icon: Brain,
    title: 'Erro domado',
    description: 'Recupere 5 questões no modo revisão e transforme falha em repertório.',
    requirement: '5 questões revisadas',
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
    title: 'Mestre da Revisão',
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

const LEGACY_ACHIEVEMENT_IDS: Record<string, string[]> = {
  first_question: ['badge_first', 'firstQuestion'],
  ten_correct: ['badge_10_correct', 'tenCorrect'],
  three_active_days: ['badge_3_days', 'threeActiveDays'],
  twenty_five_questions: ['badge_25_questions', 'twentyFiveQuestions'],
  twenty_five_correct: ['badge_25_correct', 'twentyFiveCorrect'],
  reviewed_5: ['badge_reviewed_5', 'reviewed5'],
  fifty_correct: ['badge_50_correct', 'fiftyCorrect'],
  hundred_correct: ['badge_100_correct', 'hundredCorrect'],
  reviewed_33: ['badge_reviewed_33', 'reviewed33'],
  twenty_five_review: ['badge_25_review', 'twentyFiveReview'],
  seven_days: ['badge_7_days', 'sevenDays'],
  premium: ['badge_premium'],
};

function toCanonicalAchievementId(id: unknown) {
  const value = String(id ?? '').trim();
  if (!value) return '';

  if (ACHIEVEMENTS.some((achievement) => achievement.id === value)) {
    return value;
  }

  const canonical = Object.entries(LEGACY_ACHIEVEMENT_IDS).find(([, legacyIds]) =>
    legacyIds.includes(value)
  )?.[0];

  return canonical || value;
}

export function normalizeAchievementIds(ids: unknown) {
  if (!Array.isArray(ids)) return [];

  return [
    ...new Set(
      ids
        .map(toCanonicalAchievementId)
        .filter(Boolean)
    ),
  ];
}

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
  if (id === 'premium') {
    return Boolean(user?.isPremium);
  }

  const persisted = normalizeAchievementIds(user?.conquistasDesbloqueadas);
  if (persisted.includes(id)) return true;

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
    case 'three_active_days':
      return diasAtivos >= 3;
    case 'twenty_five_questions':
      return respondidas >= 25;
    case 'twenty_five_correct':
      return acertos >= 25;
    case 'reviewed_5':
      return Number(user?.lifetimeReviewed || 0) >= 5;
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
    default:
      return false;
  }
}

export function getUnlockedAchievementIds(user: any) {
  const persisted = normalizeAchievementIds(user?.conquistasDesbloqueadas).filter(
    (id) => id !== 'premium' || Boolean(user?.isPremium)
  );
  const derived = ACHIEVEMENTS
    .filter((achievement) => isAchievementUnlocked(achievement.id, user))
    .map((achievement) => achievement.id);

  return [...new Set([...persisted, ...derived])];
}

export function countUnlockedAchievements(user: any) {
  const unlockedIds = getUnlockedAchievementIds(user);
  return ACHIEVEMENTS.filter((achievement) => unlockedIds.includes(achievement.id)).length;
}
