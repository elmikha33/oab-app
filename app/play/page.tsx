'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUp } from 'lucide-react';
import QuestoesList from '@/components/QuestoesList';

/** quantos px de rolagem até o botão aparecer */
const SHOW_OFFSET = 300;

export default function PlayPage() {
  const [showTopBtn, setShowTopBtn] = useState(false);
  const pathname = usePathname(); // esconde ao trocar de rota

  /* evita recriar a cada render  */
  const handleScroll = useCallback(() => {
    setShowTopBtn(window.scrollY > SHOW_OFFSET);
  }, []);

  /* liga / desliga listener */
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  /* se o usuário navegar para outra rota, volta ao topo e esconde o botão */
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setShowTopBtn(false);
  }, [pathname]);

  return (
    <main className="relative min-h-screen bg-slate-950">
      <Suspense
        fallback={
          <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center p-4 text-slate-300">
            Carregando questoes...
          </div>
        }
      >
        <QuestoesList />
      </Suspense>

      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 z-50 rounded-full bg-yellow-500 p-3 text-slate-900 shadow-lg transition hover:scale-105 md:bottom-6 md:right-6 md:p-4"
          aria-label="Voltar ao topo"
        >
          <ArrowUp size={24} strokeWidth={3} />
        </button>
      )}
    </main>
  );
}
