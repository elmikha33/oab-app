'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameState } from '@/context/GameStateContext';
import { getProgressionInfo } from '@/lib/progression';
import {
  Award,
  BookOpen,
  Calendar,
  Crown,
  Flame,
  LayoutDashboard,
  Scale,
  Trophy,
} from 'lucide-react';

const links = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Responder Questões', href: '/play', icon: BookOpen, featured: true },
  { name: 'Modo Revisão', href: '/review', icon: Calendar },
  { name: 'Classificação', href: '/ranking', icon: Award },
  { name: 'Ranking', href: '/ranking', icon: Trophy },
  { name: 'Seja Premium', href: '/premium', icon: Crown },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useGameState();

  if (!user) return null;

  const info = getProgressionInfo(user.streak || 0);
  const streak = user.streak || 0;
  const streakLabel = streak === 1 ? 'dia ativo' : 'dias ativos';

  return (
    <aside className="hidden min-h-screen w-72 flex-col border-r border-emerald-100 bg-white/95 p-5 text-slate-900 shadow-2xl shadow-emerald-950/5 backdrop-blur transition-colors dark:border-white/10 dark:bg-slate-950/95 dark:text-slate-200 dark:shadow-black/20 md:flex">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 rounded-2xl px-1 py-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-300 dark:bg-slate-900 dark:text-emerald-300 dark:ring-emerald-400/20">
          <Scale className="h-6 w-6" strokeWidth={2.5} />
        </div>

        <div className="leading-tight">
          <span className="font-heading text-2xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Leg<span className="text-emerald-600 dark:text-emerald-400">Ⅰ</span>
          </span>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">
            Missão OAB
          </p>
        </div>
      </Link>

      <div className="mb-6 rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm shadow-emerald-950/5 transition-colors dark:border-white/10 dark:bg-slate-900/80 dark:shadow-black/10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 font-black text-white shadow-lg shadow-emerald-500/20 dark:bg-emerald-500 dark:text-emerald-950">
            {user.nome.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <h4 className="truncate text-sm font-black text-slate-950 dark:text-slate-100">
              {user.nome}
            </h4>
            <p className="truncate text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {info.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 font-bold text-emerald-800 dark:border-emerald-400/25 dark:bg-emerald-400/10 dark:text-emerald-300">
          <Flame className="h-4 w-4" />
          <span className="text-xs">
            {streak} {streakLabel}
          </span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map(({ name, href, icon: Icon, featured }) => {
          const isActive = pathname === href;

          if (featured) {
            return (
              <Link
                key={href}
                href={href}
                className={[
                  'flex min-h-12 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-black transition-all',
                  isActive
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-200 dark:hover:bg-emerald-300/15',
                ].join(' ')}
              >
                <Icon
                  className={
                    isActive
                      ? 'h-5 w-5 text-white dark:text-emerald-950'
                      : 'h-5 w-5 text-emerald-700 dark:text-emerald-300'
                  }
                />
                <span>{name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-11 items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-bold transition-all ${
                isActive
                  ? 'border border-emerald-500 bg-emerald-600 text-white shadow-sm shadow-emerald-500/15 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950'
                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-emerald-200'
              }`}
            >
              <Icon
                className={`h-5 w-5 ${
                  isActive
                    ? 'text-white dark:text-emerald-950'
                    : 'text-slate-500 dark:text-slate-500'
                }`}
              />
              <span>{name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 dark:border-emerald-300/20 dark:from-emerald-300/10 dark:to-slate-900">
        <Crown className="mb-3 h-6 w-6 text-emerald-700 dark:text-emerald-300" />
        <p className="text-sm font-black text-slate-950 dark:text-white">Seja Premium</p>
        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-400">
          Desbloqueie recursos exclusivos e acelere sua aprovação.
        </p>
        <Link
          href="/premium"
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700"
        >
          Assine agora
        </Link>
      </div>
    </aside>
  );
}
