'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameState } from '@/context/GameStateContext';
import { BarChart3, BookOpen, ChevronRight, Flame, RefreshCcw } from 'lucide-react';
import { QUOTES } from '@/data/quotes';
import RankingPreview from '@/components/RankingPreview';

export default function Dashboard() {
  const router = useRouter();
const { user } = useGameState();
  useEffect(() => {
    if (!user) {
      router.replace('/auth');
    }
  }, [user, router]);

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-emerald-300/20 border-t-emerald-300" />
          <p className="text-sm font-black uppercase tracking-[0.25em] text-emerald-300">
            Entrando no OAPlay
          </p>
        </div>
      </main>
    );
  }


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
const totalAcertos = user.acertos ?? 0;
  const streak = user.streak || 0;
  const streakLabel = streak === 1 ? 'dia ativo' : 'dias ativos';

  const goToStudy = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    router.push('/play');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-3 pb-10 pt-3 text-slate-950 transition-colors dark:from-slate-950 dark:via-slate-950 dark:to-emerald-950 dark:text-white sm:px-4 md:px-8 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <section className="mb-4 overflow-hidden rounded-3xl border border-emerald-100 bg-white shadow-xl shadow-emerald-950/5 dark:border-emerald-300/10 dark:bg-slate-900 md:hidden">
          <div className="bg-slate-950 px-4 py-4">
            <img
              src="/oaplay-logo-horizontal-transparent-white.png"
              alt="OAPlay"
              className="h-10 w-auto object-contain"
            />
          </div>

          <div className="px-4 py-4">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
              Painel de estudos
            </p>

            <h1 className="mt-2 font-heading text-2xl font-black tracking-tight text-slate-950 dark:text-white">
              Bem-vindo, {user.nome}
            </h1>

            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
              Continue seu treino com foco, ritmo e questÃµes organizadas para avanÃ§ar todos os dias.
            </p>
          </div>
        </section>

        <header className="mb-4 hidden max-w-3xl md:mb-8 md:block">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
            Painel de estudos
          </p>

          <h1 className="font-heading text-5xl font-black tracking-tight text-slate-950 dark:text-white">
            Bem-vindo, {user.nome}
          </h1>

          <p className="mt-3 text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300">
            Continue seu treino com foco, ritmo e questÃµes organizadas para avanÃ§ar todos os dias.
          </p>
        </header>

        <section className="mb-4 rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900 md:mb-6 md:rounded-[2rem] md:p-6">
          <p className="text-base italic leading-relaxed text-slate-800 dark:text-slate-100 md:text-lg">
            &quot;{quote.text}&quot;
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 md:mt-6">
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-300 md:text-xs">
              {quote.author}
            </p>

            <button
              type="button"
              onClick={refreshQuote}
              title="Nova frase"
              aria-label="Atualizar frase"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 shadow-md shadow-emerald-950/5 transition hover:scale-105 hover:bg-emerald-100 dark:bg-emerald-300/10 dark:text-emerald-300 md:h-11 md:w-11"
            >
              <RefreshCcw className="h-4 w-4 md:h-5 md:w-5" strokeWidth={3} />
            </button>
          </div>
        </section>

        <section className="mb-4 grid grid-cols-2 gap-3 md:mb-6 md:grid-cols-2 md:gap-4">
          <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900 md:rounded-[2rem] md:p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300 md:mb-4 md:h-14 md:w-14">
              <Flame className="h-5 w-5 md:h-7 md:w-7" />
            </div>

            <p className="text-3xl font-black text-slate-950 dark:text-white md:text-4xl">
              {streak}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
              {streakLabel}
            </p>

            <p className="mt-1 hidden text-xs font-medium text-slate-500 dark:text-slate-500 sm:block">
              Mantenha a consistÃªncia.
            </p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl shadow-emerald-950/5 dark:border-white/15 dark:bg-slate-900 md:rounded-[2rem] md:p-6">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-300 md:mb-4 md:h-14 md:w-14">
              <BarChart3 className="h-5 w-5 md:h-7 md:w-7" />
            </div>

            <p className="text-3xl font-black text-slate-950 dark:text-white md:text-4xl">
              {totalAcertos}
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
              questÃµes corretas
            </p>

            <p className="mt-1 hidden text-xs font-medium text-slate-500 dark:text-slate-500 sm:block">
              Continue praticando.
            </p>
          </div>
        </section>

        <Link
          href="/play"
          onClick={goToStudy}
          className="group mb-4 flex min-h-[104px] items-center rounded-3xl border border-emerald-200 bg-white p-4 text-slate-950 shadow-xl shadow-emerald-950/5 transition hover:-translate-y-1 hover:border-emerald-400 hover:shadow-2xl hover:shadow-emerald-950/10 dark:border-emerald-400/40 dark:bg-gradient-to-br dark:from-emerald-700 dark:via-emerald-950 dark:to-slate-950 dark:text-white md:mb-6 md:min-h-[132px] md:rounded-[2rem] md:p-0 md:px-7"
        >
          <div className="flex w-full items-center justify-between gap-3 md:gap-5">
            <div className="flex min-w-0 items-center gap-3 md:gap-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 dark:bg-emerald-300/15 dark:text-emerald-200 md:h-16 md:w-16">
                <BookOpen size={26} />
              </div>

              <div className="min-w-0">
                <h2 className="font-heading text-2xl font-black leading-tight tracking-tight text-slate-950 dark:text-white md:text-3xl">
                  Estudar Agora
                </h2>

                <p className="mt-1 max-w-[210px] text-sm font-semibold leading-snug text-slate-600 dark:text-emerald-50/90 md:max-w-none md:text-base">
                  Responda questÃµes e mantenha sua evoluÃ§Ã£o.
                </p>
              </div>
            </div>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 transition group-hover:translate-x-1 dark:bg-emerald-300 dark:text-emerald-950 md:h-14 md:w-14">
              <ChevronRight className="h-6 w-6" />
            </div>
          </div>
        </Link>

        <RankingPreview />
      </div>
    </div>
  );
}