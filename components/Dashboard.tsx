'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/context/GameStateContext';
import { BarChart3, BookOpen, ChevronRight, Flame, RefreshCcw } from 'lucide-react';
import { QUOTES } from '@/data/quotes';
import RankingPreview from '@/components/RankingPreview';

export default function Dashboard() {
  const router = useRouter();
  const { user } = useGameState();

  const [quote, setQuote] = useState(() => {
    return QUOTES[Math.floor(Math.random() * QUOTES.length)];
  });

  function refreshQuote() {
    let nova = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    if (QUOTES.length > 1) {
      while (nova.text === quote.text) {
        nova = QUOTES[Math.floor(Math.random() * QUOTES.length)];
      }
    }

    setQuote(nova);
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 text-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950 dark:text-white">
        Carregando...
      </div>
    );
  }

  const totalAcertos = user.acertos ?? 0;
  const streak = user.streak || 0;
  const streakLabel = streak === 1 ? 'dia ativo' : 'dias ativos';

  const goToStudy = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    router.push('/play');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-4 pb-12 pt-8 text-slate-950 transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950 dark:text-white md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 max-w-3xl">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
            Painel de estudos
          </p>

          <h1 className="font-heading text-4xl font-black tracking-tight text-slate-950 dark:text-white md:text-5xl">
            Bem-vindo, {user.nome}
          </h1>

          <p className="mt-3 text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            Continue seu treino com foco, ritmo e questões organizadas para avançar todos os dias.
          </p>
        </header>

        <section className="mb-6 rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
          <p className="text-lg italic leading-relaxed text-slate-800 dark:text-slate-100">
            &quot;{quote.text}&quot;
          </p>

          <div className="mt-6 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              {quote.author}
            </p>

            <button
              type="button"
              onClick={refreshQuote}
              title="Nova frase"
              aria-label="Atualizar frase"
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-950/5 transition hover:scale-105 hover:bg-emerald-100 dark:bg-emerald-300/10 dark:text-emerald-300"
            >
              <RefreshCcw className="h-5 w-5" strokeWidth={3} />
            </button>
          </div>
        </section>

        <section className="mb-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300">
              <Flame className="h-7 w-7" />
            </div>
            <p className="text-4xl font-black text-slate-950 dark:text-white">{streak}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">{streakLabel}</p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-500">Mantenha a consistência.</p>
          </div>

          <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-xl shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300">
              <BarChart3 className="h-7 w-7" />
            </div>
            <p className="text-4xl font-black text-slate-950 dark:text-white">{totalAcertos}</p>
            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">questões corretas</p>
            <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-500">Continue praticando.</p>
          </div>
        </section>

        <Link
          href="/play"
          onClick={goToStudy}
          className="group mb-6 flex min-h-[132px] items-center rounded-[2rem] border border-emerald-200 bg-white px-6 text-slate-950 shadow-xl shadow-emerald-950/5 transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-950/10 dark:border-emerald-400/40 dark:bg-gradient-to-br dark:from-emerald-700 dark:via-emerald-950 dark:to-slate-950 dark:text-white md:px-7"
        >
          <div className="flex w-full items-center justify-between gap-5">
            <div className="flex min-w-0 items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 dark:bg-emerald-300/15 dark:text-emerald-200">
                <BookOpen size={30} />
              </div>

              <div className="min-w-0">
                <h2 className="font-heading text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  Estudar Agora
                </h2>
                <p className="mt-1 font-semibold text-slate-600 dark:text-emerald-50/90">
                  Responda questões e mantenha sua evolução.
                </p>
              </div>
            </div>

            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition group-hover:translate-x-1 dark:bg-emerald-300 dark:text-emerald-950">
              <ChevronRight />
            </div>
          </div>
        </Link>

        <RankingPreview />
      </div>
    </div>
  );
}
