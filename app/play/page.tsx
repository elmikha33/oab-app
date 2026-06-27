'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, ArrowUp } from 'lucide-react';
import SoundToggle from '@/components/SoundToggle';
import ThemeToggle from '@/components/ThemeToggle';
import QuestoesList from '@/components/QuestoesList';

const SHOW_OFFSET = 300;

export default function PlayPage() {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const pathname = usePathname();

  const handleScroll = useCallback(() => {
    setShowTopBtn(window.scrollY > SHOW_OFFSET);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setShowTopBtn(false);
  }, [pathname]);

  return (
    <main className="relative min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-slate-50/95 px-4 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-full border border-amber-400 bg-amber-100 px-3 py-2 text-sm font-black text-amber-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-amber-200 dark:border-amber-300/35 dark:bg-amber-300/10 dark:text-amber-100 dark:hover:bg-amber-300/15"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={3} />
            Voltar para dashboard
          </Link>

          <div className="hidden gap-2 md:flex">
            <SoundToggle compact className="rounded-full" />
            <ThemeToggle compact className="rounded-full" />
          </div>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center p-4 text-slate-700 dark:text-slate-300">
            Carregando questões...
          </div>
        }
      >
        <QuestoesList />
      </Suspense>

      {showTopBtn && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed right-6 bottom-6 z-50 hidden rounded-full bg-yellow-500 text-slate-900 shadow-lg transition hover:scale-105 md:flex md:p-4"
          aria-label="Voltar ao topo"
        >
          <ArrowUp size={24} strokeWidth={3} />
        </button>
      )}
    </main>
  );
}
