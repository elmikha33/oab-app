'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Crown,
  Grid2X2,
  Medal,
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
    label: 'Classificacao',
    href: '/achievements',
    icon: Medal,
  },
  {
    label: 'Ranking',
    href: '/ranking',
    icon: Trophy,
  },
];

function formatarData(data?: string | null) {
  if (!data) return null;

  const date = new Date(data);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleDateString('pt-BR');
}

function PlanStatus() {
  const { user, refreshUser } = useGameState() || {};
  const isPremium = Boolean(user?.isPremium);
  const premiumAte = formatarData(user?.premium_ate);

  return (
    <div className="mt-2 rounded-2xl border border-emerald-300/20 bg-slate-900/80 p-4 text-white shadow-lg shadow-black/20">
      <div className="flex items-center gap-3">
        <div
          className={
            isPremium
              ? 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-300 text-sm font-black text-emerald-950'
              : 'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-300/15 text-sm font-black text-amber-200'
          }
        >
          {isPremium ? 'P' : 'F'}
        </div>

        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
            Plano atual
          </p>

          <p className="text-sm font-black text-white">
            {isPremium ? 'Premium' : 'Free'}
          </p>

          {isPremium && premiumAte && (
            <p className="mt-0.5 text-xs font-semibold text-emerald-200">
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
            className="w-full rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 text-xs font-black text-emerald-200 transition hover:bg-emerald-300/15"
          >
            Atualizar status
          </button>

          <Link
            href="/premium"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-3 py-2.5 text-xs font-black text-emerald-950 transition hover:bg-emerald-200"
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
          className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-emerald-300 dark:border-white/10 dark:bg-slate-900"
        >
          <img
            src="/oaplay-logo-horizontal-transparent-white.png"
            alt="OAPlay"
            className="hidden h-24 w-auto object-contain dark:block"
          />

          <img
            src="/oaplay-logo-horizontal-transparent-darktext.png"
            alt="OAPlay"
            className="h-24 w-auto object-contain dark:hidden"
          />
        </Link>

        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-xl shadow-black/10 dark:border-white/10 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-lg font-black text-emerald-950">
              {String(user?.nome || 'U').slice(0, 1).toUpperCase()}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-slate-950 dark:text-white">
                {user?.nome || 'Usuario'}
              </p>

              <p className="text-xs font-black text-emerald-600 dark:text-emerald-300">
                {user?.isPremium ? 'Premium' : 'Iniciante'}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-emerald-300/25 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
            1 dia ativo
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