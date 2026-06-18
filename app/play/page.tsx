'use client';

import { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
<<<<<<< HEAD
import QuestoesList from '@/components/QuestoesList';

export default function PlayPage() {
=======
import { useGameState } from '@/context/GameStateContext'; 
import QuestoesList from '@/components/QuestoesList';

export default function PlayPage() {
  const { setUser } = useGameState();
>>>>>>> 287bc4ad7e1c302163ff1f5fe459d04185da957e
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowTopBtn(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

<<<<<<< HEAD
  return (
    <main className="relative min-h-screen bg-slate-950 p-4">
      {/* ❌ NÃO mexe mais no user aqui */}
      <QuestoesList />
=======
  const handleCorrectAnswer = () => {
    setUser((prev: any) => ({
      ...prev,
      acertos: (prev.acertos || 0) + 1
    }));
  };

  return (
    <main className="relative min-h-screen bg-slate-950 p-4">
      <QuestoesList onCorrectAnswer={handleCorrectAnswer} />
>>>>>>> 287bc4ad7e1c302163ff1f5fe459d04185da957e

      {showTopBtn && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
<<<<<<< HEAD
          className="fixed bottom-6 right-6 p-4 bg-yellow-500 text-slate-900 rounded-full shadow-lg z-50"
=======
          className="fixed bottom-6 right-6 p-4 bg-yellow-500 text-slate-900 rounded-full shadow-lg z-50 hover:bg-yellow-400 transition-all active:scale-95"
>>>>>>> 287bc4ad7e1c302163ff1f5fe459d04185da957e
        >
          <ArrowUp size={24} strokeWidth={3} />
        </button>
      )}
    </main>
  );
}