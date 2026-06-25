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
  { name: 'Responder Questoes', href: '/play', icon: BookOpen, featured: true },
  { name: 'Modo Revisao', href: '/review', icon: Calendar },
  { name: 'Classificacao', href: '/ranking', icon: Award },
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

  const initial = user.nome?.charAt(0)?.toUpperCase() || 'C';

  return (
    <aside className="hidden min-h-screen w-72 shrink-0 flex-col border-r border-emerald-300/10 bg-slate-950/95 p-5 text-slate-200 shadow-2xl shadow-black/30 backdrop-blur-xl md:flex">

      <Link href="/dashboard" className="mb-8 flex items-center gap-3 rounded-3xl px-1 py-2">

        <div className="flex h-14 w-14 items-center justify-center rounded-3xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-300 shadow-lg shadow-emerald-500/10">
          <Scale className="h-7 w-7" strokeWidth={2.5} />
        </div>

        <div>
          <h1 className="font-heading text-2xl font-black tracking-tight text-white">
            OAB Quest
          </h1>

          <p className="text-[11px] font-black uppercase tracking-[0.28em] text-slate-500">
            Missao OAB
          </p>
        </div>

      </Link>


      <div className="mb-6 rounded-3xl border border-white/10 bg-white/[0.04] p-4 shadow-xl shadow-black/20">

        <div className="mb-4 flex items-center gap-3">

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 font-black text-emerald-950 shadow-lg shadow-emerald-500/20">
            {initial}
          </div>

          <div className="min-w-0">

            <h4 className="truncate text-sm font-black text-white">
              {user.nome}
            </h4>

            <p className="truncate text-xs font-bold text-emerald-300">
              {info.title}
            </p>

          </div>

        </div>


        <div className="flex items-center gap-2 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 font-bold text-emerald-200">

          <Flame className="h-4 w-4" />

          <span className="text-xs">
            {streak} {streakLabel}
          </span>

        </div>

      </div>


      <nav className="flex-1 space-y-2">

        {links.map(({ name, href, icon: Icon, featured }) => {

          const active = pathname === href;


          return (

            <Link

              key={name}

              href={href}

              className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm transition-all ${
                active
                  ? 'bg-emerald-300 text-emerald-950 shadow-lg shadow-emerald-500/20'
                  : featured
                  ? 'border border-emerald-300/25 bg-emerald-300/10 font-black text-emerald-100 hover:bg-emerald-300/15'
                  : 'font-bold text-slate-400 hover:bg-white/[0.06] hover:text-emerald-100'
              }`}

            >

              <Icon
                className={`h-5 w-5 ${
                  active
                    ? 'text-emerald-950'
                    : 'text-emerald-300'
                }`}
                strokeWidth={2.5}
              />


              <span>{name}</span>


            </Link>

          );

        })}

      </nav>


      <div className="mt-6 rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-emerald-300/15 via-emerald-500/5 to-slate-900 p-5">

        <Crown className="mb-3 h-6 w-6 text-emerald-300" />

        <p className="text-sm font-black text-white">
          Premium
        </p>

        <p className="mt-1 text-xs font-medium leading-relaxed text-slate-400">
          Desbloqueie recursos exclusivos e acelere seus estudos.
        </p>

        <Link
          href="/premium"
          className="mt-4 flex w-full items-center justify-center rounded-2xl bg-emerald-300 px-4 py-2.5 text-sm font-black text-emerald-950 transition hover:bg-emerald-200"
        >
          Conhecer plano
        </Link>

      </div>

    </aside>
  );
}