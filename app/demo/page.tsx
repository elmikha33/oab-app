'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, LogIn, UserPlus } from 'lucide-react';
import QuestoesList from '@/components/QuestoesList';
import SoundToggle from '@/components/SoundToggle';
import ThemeToggle from '@/components/ThemeToggle';

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-emerald-300/10"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            OAPlay
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden gap-2 sm:flex">
              <SoundToggle compact className="rounded-full" />
              <ThemeToggle compact className="rounded-full" />
            </div>

            <Link
              href="/auth"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-emerald-700 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200"
            >
              <LogIn className="h-4 w-4" strokeWidth={2.8} />
              Entrar
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white px-4 py-6 dark:border-white/10 dark:bg-slate-900/70">
        <div className="mx-auto max-w-5xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-emerald-700 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200">
            <UserPlus className="h-4 w-4" strokeWidth={2.7} />
            Teste grátis sem cadastro
          </div>

          <h1 className="mt-4 max-w-3xl font-heading text-3xl font-black tracking-normal text-slate-950 sm:text-4xl dark:text-white">
            Responda algumas questões e sinta o OAPlay funcionando.
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
            Veja o feedback na hora. Depois de algumas respostas, você decide se quer criar uma conta grátis para salvar sua evolução.
          </p>
        </div>
      </section>

      <Suspense
        fallback={
          <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center p-4 text-slate-700 dark:text-slate-300">
            <p className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Carregando demo...
            </p>
          </div>
        }
      >
        <QuestoesList demoMode />
      </Suspense>
    </main>
  );
}
