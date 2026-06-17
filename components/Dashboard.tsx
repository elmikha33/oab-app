'use client';

import React from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useGameState } from '@/context/GameStateContext'; // Certifique-se do caminho
import { Flame, BookOpen, ChevronRight, Quote } from 'lucide-react';

export default function Dashboard() {
  const { user } = useGameState();

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#eab308', '#ffffff'] });
  };

  if (!user) return <div className="p-8 text-white">Carregando...</div>;

  return (
    <div className="flex-1 p-6 md:p-8 bg-slate-950 min-h-screen text-white">
      <div className="mb-8">
        <h1 className="font-heading font-extrabold text-3xl">Dashboard</h1>
      </div>

      {/* Agora lendo o streak do Contexto */}
      <div className="mb-8">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-3 w-fit">
          <div className="p-2 bg-slate-950 rounded-lg text-orange-500">
            <Flame size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-500">Ofensiva</p>
            <p className="font-bold text-lg">{user.streak} dias de ofensiva</p>
          </div>
        </div>
      </div>

      {/* Link de Estudo */}
      <Link 
        href="/play" 
        onClick={triggerConfetti}
        className="group relative block p-[2px] rounded-2xl overflow-hidden h-[130px] w-full mb-8 hover:scale-[1.01] transition-transform duration-500"
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_60%,#eab308)] opacity-70 group-hover:opacity-100 transition-opacity"></div>
        <div className="absolute inset-[2px] bg-slate-900 rounded-[14px]"></div>
        <div className="relative h-full w-full rounded-[14px] flex justify-between items-center px-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-800 rounded-xl text-emerald-400"><BookOpen size={24} /></div>
            <div>
              <h3 className="font-bold text-lg">Estudar Agora</h3>
              <p className="text-slate-400 text-sm">Continue sua preparação.</p>
            </div>
          </div>
          <div className="bg-slate-800 p-2 rounded-lg text-white"><ChevronRight size={20} /></div>
        </div>
      </Link>
    </div>
  );
}