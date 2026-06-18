'use client';

<<<<<<< HEAD
import React from 'react';
import { useGameStore } from '@/store/gameStore';

export default function PlayPage() {
  const user = useGameStore((s) => s.user);
  const registrarAcerto = useGameStore((s) => s.registrarAcerto);
  const registrarErro = useGameStore((s) => s.registrarErro);

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl font-bold">Modo Prova</h1>

      <p className="mt-2">
        Jogador: <strong>{user?.nome || 'Não logado'}</strong>
      </p>

      <div className="mt-6 flex gap-4">
        <button
          onClick={registrarAcerto}
          className="px-4 py-2 bg-green-600 rounded"
        >
          Acertar
        </button>

        <button
          onClick={registrarErro}
          className="px-4 py-2 bg-red-600 rounded"
        >
          Errar
        </button>
      </div>

      <div className="mt-6">
        <p>Acertos: {user?.acertos || 0}</p>
        <p>Erros: {user?.erros || 0}</p>
      </div>
    </div>
  );
}
=======
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
>>>>>>> e1e1b23 (primeira versao)
