'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useGameState } from '@/context/GameStateContext';
import { BarChart3, BookOpen, ChevronRight, Flame, Sparkles } from 'lucide-react';

const QUOTES = [
  { text: 'O direito não socorre aos que dormem.', author: 'Autor Anônimo' },
  { text: 'A persistência é o caminho do êxito.', author: 'Charlie Chaplin' },
  { text: 'A lei é a razão livre da paixão.', author: 'Aristóteles' },
];

export default function Dashboard() {
  const router = useRouter();
  const { user } = useGameState();
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  if (!user) return <div className="min-h-screen bg-slate-950 p-8 text-white">Carregando...</div>;

  const totalAcertos = user.acertos ?? 0;

  const goToStudy = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    try {
      confetti({
        particleCount: 120,
        spread: 74,
        origin: { y: 0.62 },
        colors: ['#fbbf24', '#ffffff', '#8b5cf6'],
      });
    } finally {
      router.push('/play');
    }
  };

  return (
    <div className="min-h-screen flex-1 bg-[linear-gradient(180deg,#020617_0%,#0f172a_45%,#020617_100%)] px-4 pb-10 pt-5 text-white md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-2 md:mb-8">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-3 py-1 text-xs font-bold uppercase text-yellow-300">
            <Sparkles className="h-3.5 w-3.5" />
            Missão diária
          </div>
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Bem-vindo, {user.nome}
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-slate-400">
            Continue seu treino com foco, ritmo e questões organizadas para a sua aprovação.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/20 md:mb-8 md:p-5">
          <p className="text-sm italic leading-relaxed text-slate-200">&quot;{quote.text}&quot;</p>
          <p className="mt-2 text-xs font-bold uppercase text-yellow-400">{quote.author}</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 md:mb-8 md:gap-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/15">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/10 p-2">
                <Flame className="h-4 w-4 text-orange-400" />
              </div>
              <p className="text-[11px] font-black uppercase text-slate-500">Ofensiva</p>
            </div>
            <p className="text-2xl font-extrabold">{user.streak || 0}</p>
            <p className="text-xs text-slate-500">dias ativos</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-black/15">
            <div className="mb-3 flex items-center gap-2">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-2">
                <BarChart3 className="h-4 w-4 text-blue-400" />
              </div>
              <p className="text-[11px] font-black uppercase text-slate-500">Acertos</p>
            </div>
            <p className="text-2xl font-extrabold">{totalAcertos}</p>
            <p className="text-xs text-slate-500">questões corretas</p>
          </div>
        </div>

        <Link
          href="/play"
          onClick={goToStudy}
          className="golden-action group mb-8 flex min-h-[132px] w-full items-center rounded-2xl px-5 py-5 transition-transform duration-300 hover:-translate-y-0.5 md:min-h-[140px] md:px-7"
        >
          <div className="relative z-10 flex w-full items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4 md:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 shadow-lg shadow-yellow-500/15 md:h-16 md:w-16">
                <BookOpen size={28} />
              </div>
              <div className="min-w-0">
                <h3 className="font-heading text-2xl font-extrabold tracking-tight text-white md:text-3xl">
                  Estudar Agora
                </h3>
                <p className="mt-1 text-sm leading-snug text-slate-300">
                  Responda questões e mantenha sua evolução.
                </p>
              </div>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-500/20 transition-transform duration-300 group-hover:translate-x-1">
              <ChevronRight size={24} strokeWidth={3} />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
