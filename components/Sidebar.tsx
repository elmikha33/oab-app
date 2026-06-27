'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Crown,
  LayoutDashboard,
  Lock,
  LogOut,
  RotateCcw,
  Trophy,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useGameState } from '@/context/GameStateContext';
import { ACHIEVEMENTS, countUnlockedAchievements, isAchievementUnlocked } from '@/lib/achievements';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/play', label: 'Responder Questões', icon: BookOpen },
  { href: '/review', label: 'Modo Revisão', icon: RotateCcw },
  { href: '/achievements', label: 'Conquistas', icon: Trophy },
  { href: '/ranking', label: 'Ranking', icon: BarChart3 },
];

function getInitials(nome?: string | null) {
  const parts = String(nome || 'Candidato')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'OA';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function formatDate(date?: string | null) {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function AchievementMiniatures({ user }: { user: any }) {
  const unlockedCount = countUnlockedAchievements(user);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Coleção
        </p>
        <Link
          href="/achievements"
          className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200"
        >
          {unlockedCount}/{ACHIEVEMENTS.length}
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = isAchievementUnlocked(achievement.id, user);

          return (
            <Link
              key={achievement.id}
              href="/achievements"
              title={achievement.title}
              aria-label={achievement.title}
              className={
                unlocked
                  ? 'flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-xl shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 dark:border-emerald-300/30 dark:bg-emerald-300/10'
                  : 'flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-600'
              }
            >
              {unlocked ? (
                <span aria-hidden="true">{achievement.emoji}</span>
              ) : (
                <Lock className="h-4 w-4" strokeWidth={2.7} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function PlanStatus({ user }: { user: any }) {
  const premiumUntil = formatDate(user?.premium_ate);

  if (user?.isPremium) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-950 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-100">
        <div className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-emerald-700 dark:text-emerald-200" strokeWidth={2.8} />
          <p className="text-sm font-black">Plano Premium</p>
        </div>
        {premiumUntil && (
          <p className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-200">
            Até {premiumUntil}
          </p>
        )}
      </div>
    );
  }

  return (
    <Link
      href="/premium"
      className="block rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-950 transition hover:border-amber-300 hover:bg-amber-100 dark:border-amber-300/25 dark:bg-amber-300/10 dark:text-amber-100 dark:hover:bg-amber-300/15"
    >
      <div className="flex items-center gap-2">
        <Crown className="h-5 w-5" strokeWidth={2.8} />
        <p className="text-sm font-black">Plano Free</p>
      </div>
      <p className="mt-2 text-xs font-bold">Conhecer Premium</p>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useGameState() || {};

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[330px] overflow-y-auto border-r border-slate-200 bg-slate-50 px-5 py-6 text-slate-950 md:flex dark:border-white/10 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-full w-full flex-col gap-5">
        <Link
          href="/dashboard"
          className="rounded-3xl border border-emerald-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 dark:border-white/10 dark:bg-slate-900"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-lg font-black text-white dark:bg-emerald-300 dark:text-emerald-950">
              OA
            </span>
            <div>
              <p className="text-xl font-black tracking-tight">OAPlay</p>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">treino inteligente OAB</p>
            </div>
          </div>
        </Link>

        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white dark:bg-white dark:text-slate-950">
              {getInitials(user?.nome)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                {user?.nome || 'Candidato'}
              </p>
              <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                {user?.email || 'Usuário OAPlay'}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <AchievementMiniatures user={user} />
          </div>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? 'flex min-h-12 items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black text-white shadow-sm dark:bg-emerald-300 dark:text-emerald-950'
                    : 'flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-white hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-emerald-200'
                }
              >
                <Icon className="h-5 w-5" strokeWidth={2.6} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-3 pt-1">
          <PlanStatus user={user} />
          <ThemeToggle />

          <button
            type="button"
            onClick={() => void logout?.()}
            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
          >
            <LogOut className="h-5 w-5" strokeWidth={2.6} />
            Sair da conta
          </button>
        </div>
      </div>
    </aside>
  );
}
