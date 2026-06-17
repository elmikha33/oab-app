'use client';

import React from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useGameState } from '@/context/GameStateContext';
import { Flame, BookOpen, ChevronRight, BarChart3 } from 'lucide-react';

const QUOTES = [
  { text: "O direito não socorre aos que dormem.", author: "Autor Anônimo" },
  { text: "A persistência é o caminho do êxito.", author: "Charlie Chaplin" },
  { text: "A lei é a razão livre da paixão.", author: "Filósofo Aristóteles" }
];

export default function Dashboard() {
  const { user } = useGameState();
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

  if (!user) return <div className="p-8 text-white min-h-screen bg-slate-950">Carregando...</div>;

  const totalAcertos = user.acertos ?? 0;

  const triggerConfetti = () => confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#eab308', '#ffffff', '#3b82f6'] });

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="font-heading font-extrabold text-2xl mb-6">Dashboard</h1>

      <div className="bg-slate-900 border-l-4 border-yellow-500 p-4 rounded-xl mb-8 shadow-lg">
        <p className="italic text-slate-200">"{quote.text}"</p>
        <p className="mt-2 text-sm font-bold text-slate-400">— {quote.author}</p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="text-orange-500" size={20} />
            <p className="text-[11px] uppercase font-bold text-slate-500">Ofensiva</p>
          </div>
          <p className="font-bold text-xl">{user.streak || 0} dias</p>
        </div>
        
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="text-blue-500" size={20} />
            <p className="text-[11px] uppercase font-bold text-slate-500">Acertos</p>
          </div>
          <p className="font-bold text-xl">{totalAcertos}</p>
        </div>
      </div>

      <Link 
        href="/play" 
        onClick={triggerConfetti}
        className="group relative block p-[2px] rounded-3xl overflow-hidden h-[120px] w-full mb-8 shadow-2xl transition-all duration-300 hover:scale-[1.01]"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_60%,#eab308)] opacity-70"></div>
        <div className="absolute inset-[3px] bg-slate-900 rounded-[21px] z-10 transition-colors duration-300 group-hover:bg-slate-800"></div>
        
        <div className="relative h-full w-full rounded-[21px] flex justify-between items-center px-8 z-20">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-slate-800 rounded-2xl text-emerald-400 border border-slate-700 shadow-xl"><BookOpen size={28} /></div>
            <div>
              <h3 className="font-extrabold text-xl text-white">Estudar Agora</h3>
              <p className="text-slate-400 text-sm">Prepare-se para a OAB.</p>
            </div>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl text-white border border-slate-700 group-hover:bg-yellow-600 transition-colors">
            <ChevronRight size={24} />
          </div>
        </div>
      </Link>
    </div>
  );
}