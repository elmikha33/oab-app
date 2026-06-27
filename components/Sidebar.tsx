'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  Crown,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { useGameState } from '@/context/GameStateContext';

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
  const totalCorrect = Math.max(Number(user?.lifetimeCorrect || 0), Number(user?.acertos || 0));
  const activeDays = Math.max(
    Number(user?.lifetimeActiveDays || 0),
    Number(user?.rankingActiveDays || 0),
    Number(user?.streak || 0)
  );
  const reviewed = Math.max(Number(user?.lifetimeReviewed || 0), Number(user?.lifetimeReview || 0));

  const badges = [
    { label: 'Questões', value: totalCorrect, icon: ShieldCheck },
    { label: 'Constância', value: activeDays, icon: Sparkles },
    { label: 'Revisão', value: reviewed, icon: RotateCcw },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {badges.map((badge) => {
        const Icon = badge.icon;

        return (
          <div
            key={badge.label}
            className="rounded-2xl border border-slate-200 bg-white p-3 text-center shadow-sm dark:border-white/10 dark:bg-slate-950"
          >
            <Icon className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-300" strokeWidth={2.6} />
            <p className="mt-2 text-base font-black text-slate-950 dark:text-white">{badge.value}</p>
            <p className="mt-0.5 truncate text-[10px] font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {badge.label}
            </p>
          </div>
        );
      })}
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
          <p className="text-sm font-black">Premium ativo</p>
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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[300px] border-r border-slate-200 bg-slate-50 px-4 py-5 text-slate-950 md:flex dark:border-white/10 dark:bg-slate-950 dark:text-white">
      <div className="flex min-h-0 w-full flex-col gap-4">
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

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
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

        <div className="space-y-3">
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
