'use client';

import { useState, useEffect } from 'react';
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
    <main className="relative min-h-screen bg-slate-950 p-4">
      {/* ❌ NÃO mexe mais no user aqui */}
      <QuestoesList />

      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 p-4 bg-yellow-500 text-slate-900 rounded-full shadow-lg z-50"
        >
          <ArrowUp size={24} strokeWidth={3} />
        </button>
      )}
    </main>
  );
}