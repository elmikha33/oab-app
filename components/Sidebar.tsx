'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Crown,
  Flame,
  Grid2X2,
  Lock,
  Medal,
  Star,
  Trophy,
} from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: Grid2X2,
  },
  {
    label: 'Responder Questoes',
    href: '/play',
    icon: BookOpen,
  },
  {
    label: 'Modo Revisao',
    href: '/review',
    icon: CalendarDays,
  },
  {
    label: 'Conquistas',
    href: '/achievements',
    icon: Medal,
  },
  {
    label: 'Ranking',
    href: '/ranking',
    icon: Trophy,
  },
];

const BADGES = [
  {
    id: 'first_question',
    emoji: '\u{1F3AF}',
    title: 'Primeira questao',
    description: 'Responda sua primeira questao.',
  },
  {
    id: 'ten_correct',
    emoji: '\u{2694}\u{FE0F}',
    title: '10 acertos',
    description: 'Acerte 10 questoes.',
  },
  {
    id: 'fifty_correct',
    emoji: '\u{1F525}',
    title: '50 acertos',
    description: 'Acerte 50 questoes.',
  },
  {
    id: 'hundred_correct',
    emoji: '\u{1F3C6}',
    title: '100 acertos',
    description: 'Acerte 100 questoes.',
  },
  {
    id: 'reviewed_33',
    emoji: '\u{1F9E0}',
    title: 'Revisou 33 Questoes',
    description: 'Revise 33 questoes.',
  },
  {
    id: 'five_review',
    emoji: '\u{1F6E1}\u{FE0F}',
    title: 'Cacador de erros',
    description: 'Tenha 5 questoes em revisao.',
  },
  {
    id: 'seven_days',
    emoji: '\u{1F4C5}',
    title: '7 dias ativos',
    description: 'Estude em 7 dias diferentes.',
  },
  {
    id: 'premium',
    emoji: '\u{1F451}',
    title: 'Premium',
    description: 'Tenha uma conta Premium ativa.',
  },
];

function formatarData(data?: string | null) {
  if (!data) return null;

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('pt-BR');
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

function badgeUnlocked(id: string, user: any) {
  const acertos = Math.max(Number(user?.lifetimeCorrect || 0), Number(user?.acertos || 0));
  const respondidas = totalRespondidas(user);
  const diasAtivos = Math.max(Number(user?.lifetimeActiveDays || 0), Number(user?.rankingActiveDays || 0), Number(user?.streak || 0));
  const revisao = Math.max(Number(user?.lifetimeReview || 0), totalRevisao(user));

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
    case 'five_review':
      return revisao >= 5;
    case 'seven_days':
      return diasAtivos >= 7;
    case 'premium':
      return Boolean(user?.isPremium);
    default:
      return false;
  }
}

function UserAvatar({ isPremium }: { isPremium: boolean }) {
  if (isPremium) {
    return (
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-amber-300/50 bg-gradient-to-br from-amber-200 via-emerald-300 to-cyan-300 text-3xl shadow-xl shadow-amber-950/20">
        <span className="drop-shadow-sm">🦉</span>
        <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-amber-200 bg-slate-950 text-sm shadow-lg">
          👑
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.35rem] border border-emerald-300/40 bg-gradient-to-br from-slate-100 via-emerald-100 to-white text-3xl shadow-xl shadow-black/10 dark:from-slate-800 dark:via-slate-900 dark:to-emerald-950">
      <span className="drop-shadow-sm">🐢</span>
      <span className="absolute -right-1 -top-1 flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300/40 bg-emerald-300 text-xs font-black text-emerald-950 shadow-lg">
        F
      </span>
    </div>
  );
}

function AchievementMiniatures({ user }: { user: any }) {
  const unlockedCount = BADGES.filter((badge) => badgeUnlocked(badge.id, user)).length;

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950/60">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Colecao
        </p>

        <Link
          href="/achievements"
          className="rounded-full border border-emerald-300/35 bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 transition hover:bg-emerald-100 dark:bg-emerald-300/10 dark:text-emerald-200"
        >
          {unlockedCount}/{BADGES.length}
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {BADGES.map((badge) => {
          const unlocked = badgeUnlocked(badge.id, user);

          return (
            <Link
              key={badge.id}
              href="/achievements"
              title={badge.title}
              className={
                unlocked
                  ? 'flex h-10 items-center justify-center rounded-xl border border-emerald-300 bg-emerald-100 text-xl shadow-sm transition hover:scale-105 dark:border-emerald-300/35 dark:bg-emerald-300/15'
                  : 'flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-slate-300 hover:text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-600'
              }
            >
              {unlocked ? badge.emoji : <Lock className="h-4 w-4" strokeWidth={2.7} />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PlanStatus() {
  const { user, refreshUser } = useGameState() || {};
  const isPremium = Boolean(user?.isPremium);
  const premiumAte = formatarData(user?.premium_ate);

  return (
    <div
      className={
        isPremium
          ? 'mt-2 rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-emerald-950 shadow-xl shadow-emerald-950/10 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-white'
          : 'mt-2 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-xl shadow-amber-950/10 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-white'
      }
    >
      <div className="flex items-center gap-3">
        <div
          className={
            isPremium
              ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white shadow-lg shadow-emerald-500/20 dark:bg-emerald-300 dark:text-emerald-950'
              : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-sm font-black text-white shadow-lg shadow-amber-500/20 dark:bg-amber-300 dark:text-amber-950'
          }
        >
          {isPremium ? 'P' : 'F'}
        </div>

        <div className="min-w-0">
          <p
            className={
              isPremium
                ? 'text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-200'
                : 'text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:text-amber-200'
            }
          >
            Plano atual
          </p>

          <p className="text-sm font-black text-slate-950 dark:text-white">
            {isPremium ? 'Premium' : 'Free'}
          </p>

          {isPremium && premiumAte && (
            <p className="mt-0.5 text-xs font-black text-emerald-700 dark:text-emerald-200">
              Ate {premiumAte}
            </p>
          )}
        </div>
      </div>

      {!isPremium && (
        <div className="mt-3 grid grid-cols-1 gap-2">
          <button
            type="button"
            onClick={() => {
              void refreshUser?.();
            }}
            className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200 dark:hover:bg-emerald-300/15"
          >
            Atualizar status
          </button>

          <Link
            href="/premium"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-black text-white transition hover:bg-emerald-600 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200"
          >
            <Crown className="h-4 w-4" strokeWidth={3} />
            Conhecer Premium
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useGameState() || {};

  if (!user) return null;

  return (
    <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[300px] shrink-0 overflow-y-auto border-r border-slate-200 bg-white px-5 py-6 text-slate-950 shadow-2xl shadow-black/5 md:block dark:border-white/10 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-full flex-col gap-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-4 rounded-[1.75rem] border border-slate-200 bg-white p-4 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-emerald-300 dark:border-white/10 dark:bg-slate-900"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/25 bg-slate-950 shadow-lg shadow-black/20">
            <img
              src="/oaplay-icon-192.png"
              alt="OAPlay"
              className="h-12 w-12 object-contain"
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-baseline leading-none">
              <span className="text-[2rem] font-black tracking-tight text-slate-950 dark:text-white">
                OA
              </span>
              <span className="text-[2rem] font-black tracking-tight text-emerald-400">
                Play
              </span>
            </div>

            <p className="mt-2 text-[10px] font-black uppercase leading-tight tracking-[0.22em] text-emerald-400">
              Sua aprovacao
              <br />
              expressa
            </p>
          </div>
        </Link>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <UserAvatar isPremium={Boolean(user?.isPremium)} />

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                {user?.nome || 'Usuario'}
              </p>

              <p className="text-xs font-black text-emerald-600 dark:text-emerald-300">
                {user?.isPremium ? 'Premium' : 'Free'}
              </p>
            </div>
          </div>

          <AchievementMiniatures user={user} />

          <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
            {user?.streak || 1} dia ativo
          </div>
        </section>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? 'flex min-h-14 items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-300 px-4 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-950/10'
                    : 'flex min-h-14 items-center gap-3 rounded-2xl border border-transparent px-4 text-sm font-black text-slate-600 transition hover:border-emerald-300/40 hover:bg-emerald-50 hover:text-emerald-900 dark:text-slate-400 dark:hover:bg-emerald-300/10 dark:hover:text-emerald-100'
                }
              >
                <Icon className="h-5 w-5 shrink-0" strokeWidth={2.7} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <PlanStatus />
        </nav>
      </div>
    </aside>
  );
}