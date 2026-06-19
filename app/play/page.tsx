'use client';

import { useEffect, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import QuestoesList from '@/components/QuestoesList';

export default function PlayPage() {
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <main className="relative min-h-screen bg-slate-950">
      <QuestoesList />

      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-4 z-50 rounded-full bg-yellow-500 p-3 text-slate-900 shadow-lg md:bottom-6 md:right-6 md:p-4"
          aria-label="Voltar ao topo"
        >
          <ArrowUp size={24} strokeWidth={3} />
        </button>
      )}
    </main>
  );
}
