'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/context/GameStateContext';
import { BarChart3, BookOpen, ChevronRight, Flame, RefreshCcw } from 'lucide-react';
import { QUOTES } from '@/data/quotes';

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
      <div className="min-h-screen flex-1 bg-slate-50 p-8 text-slate-950 dark:bg-slate-950 dark:text-white">
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
    <div className="min-h-screen flex-1 bg-emerald-50/40 px-4 pb-10 pt-5 text-slate-950 transition-colors dark:bg-slate-950 dark:text-white md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <h1 className="font-heading text-3xl font-extrabold text-slate-950 dark:text-white md:text-4xl">
            Bem-vindo, {user.nome}
          </h1>

          <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
            Continue seu treino com foco, ritmo e questões organizadas para a sua aprovação.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
          <p className="italic text-slate-800 dark:text-slate-100">
            &quot;{quote.text}&quot;
          </p>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300">
              {quote.author}
            </p>

            <button
              type="button"
              onClick={refreshQuote}
              title="Nova frase"
              aria-label="Atualizar frase"
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400 bg-emerald-500 text-white shadow-md shadow-emerald-500/20 transition hover:scale-105 hover:bg-emerald-600 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950"
            >
              <RefreshCcw className="h-4 w-4" strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
            <Flame className="text-emerald-600 dark:text-emerald-300" />
            <p className="mt-3 text-3xl font-black">{streak}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">{streakLabel}</p>
          </div>

          <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900">
            <BarChart3 className="text-teal-600 dark:text-teal-300" />
            <p className="mt-3 text-3xl font-black">{totalAcertos}</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">questões corretas</p>
          </div>
        </div>

        <Link
          href="/play"
          onClick={goToStudy}
          className="group flex min-h-[140px] items-center rounded-3xl border border-emerald-400/60 bg-gradient-to-br from-emerald-700 via-emerald-950 to-slate-950 px-7 text-white shadow-xl shadow-emerald-900/20 transition hover:-translate-y-1 hover:border-emerald-300"
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/50 bg-emerald-300/15 text-emerald-200">
                <BookOpen size={30} />
              </div>

              <div>
                <h2 className="text-3xl font-black">Estudar Agora</h2>
                <p className="font-semibold text-emerald-50/90">
                  Responda questões e mantenha sua evolução.
                </p>
              </div>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-emerald-950 shadow-lg shadow-emerald-500/20 transition group-hover:translate-x-1">
              <ChevronRight />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
