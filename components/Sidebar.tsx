'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import confetti from 'canvas-confetti';
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
} from 'lucide-react';

const links = [
  { name: 'Dashboard',          href: '/dashboard', icon: LayoutDashboard },
  { name: 'Responder Questões', href: '/play',      icon: BookOpen, featured: true },
  { name: 'Modo Revisão',       href: '/review',    icon: Calendar },
  { name: 'Classificação',      href: '/ranking',   icon: Award },
  { name: 'Seja Premium',       href: '/premium',   icon: Crown },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useGameState();

  if (!user) return null;

  const info   = getProgressionInfo(user.streak || 0);
  const streak = user.streak || 0;
  const streakLabel = streak === 1 ? 'dia ativo' : 'dias ativos';

  /* dispara confetti e deixa Link navegar normalmente */
  const handleConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 72,
      origin: { y: 0.62 },
      colors: ['#fbbf24', '#ffffff', '#8b5cf6'],
    });
  };

  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r border-slate-800 bg-slate-950/95 p-4 text-slate-200 shadow-2xl shadow-black/20 md:flex">
      {/* logo */}
      <Link href="/dashboard" className="mb-6 flex items-center gap-3 rounded-xl px-2 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-emerald-300 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-400/20">
          <Scale className="h-6 w-6" />
        </div>
        <div className="leading-tight">
          <span className="font-heading text-2xl font-extrabold tracking-tight text-white">
            Leg<span className="text-emerald-400">l</span>
          </span>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Missao OAB
          </p>
        </div>
      </Link>

      {/* box usuário */}
      <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-bold text-white shadow-lg shadow-brand-500/20">
            {user.nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-slate-100">
              {user.nome}
            </h4>
            <p className="truncate text-xs font-bold text-brand-400">
              {info.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-orange-500/15 bg-orange-500/10 px-3 py-2 font-semibold text-orange-300">
          <Flame className="h-4 w-4" />
          <span className="text-xs">
            {streak} {streakLabel}
          </span>
        </div>
      </div>

      {/* navegação */}
      <nav className="flex-1 space-y-2">
        {links.map(({ name, href, icon: Icon, featured }) => {
          const isActive = pathname === href;

          /* link “Estudar” ganhou confetti */
          if (featured) {
            return (
              <Link
                key={href}
                href={href}
                onClick={handleConfetti}
                className={`golden-nav-link flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-extrabold text-white transition-transform duration-300 hover:-translate-y-0.5 ${
                  isActive ? 'ring-1 ring-yellow-300/60' : ''
                }`}
              >
                <Icon className="h-5 w-5 text-yellow-300" />
                <span>{name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'border border-brand-500/20 bg-brand-500/15 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
