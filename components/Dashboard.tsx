'use client';

import React from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useGameState } from '../context/GameStateContext';
import { getProgressionInfo } from '../lib/progression';
import { Flame, BookOpen, ChevronRight, Zap } from 'lucide-react';

export default function Dashboard() {
  const { user } = useGameState();
  
  if (!user) return <div className="p-6 text-white">Carregando...</div>;

  const info = getProgressionInfo(user.streak || 0);
  const streakLabel = (user.streak === 1) ? 'dia' : 'dias';

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ['#eab308', '#ffffff', '#3b82f6'] });
  };

  return (
    <div className="flex-1 p-4 md:p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="font-heading font-extrabold text-2xl mb-6 tracking-tight">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Card Ofensiva */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-inner">
          <div className="p-3 bg-slate-950 rounded-xl text-orange-500 border border-slate-800 shadow-xl flex items-center justify-center">
            <Flame size={28} className="drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
          </div>
          <div>
            <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Ofensiva</p>
            <p className="font-bold text-xl">{user.streak} {streakLabel} <span className="text-sm font-medium text-slate-400">de ofensiva</span></p>
          </div>
        </div>

        {/* Card Status - Raio Azul Vibrante */}
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 shadow-inner relative overflow-hidden">
          <div className="absolute -left-4 -top-4 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl"></div>
          
          <div className="p-3 bg-slate-950 rounded-xl border border-blue-900/50 shadow-xl relative z-10 flex items-center justify-center">
            <Zap size={28} className="text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
          </div>
          
          <div className="relative z-10">
            <p className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Status Atual</p>
            <p className="font-extrabold text-xl tracking-tight text-white">
              {info.title}
            </p>
          </div>
        </div>
      </div>

      {/* Card "Estudar Agora" com Brilho e Efeitos */}
      <Link 
        href="/play" 
        onClick={triggerConfetti}
        // Adicionadas classes group-hover para efeito de luz ao passar o mouse
        className="group relative block p-[2px] rounded-3xl overflow-hidden h-[130px] w-full mb-8 hover:scale-[1.01] transition-all duration-500 shadow-2xl hover:shadow-brand-500/50"
      >
        {/* Efeito de brilho de fundo (mobile e desktop hover) */}
        <div className="absolute inset-0 bg-brand-600/30 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        {/* Animação de rotação */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_60%,#eab308)] opacity-60 group-hover:opacity-100 transition-opacity"></div>
        
        {/* Fundo interno */}
        <div className="absolute inset-[3px] bg-slate-900 rounded-[21px]"></div>
        
        {/* Conteúdo do card */}
        <div className="relative h-full w-full rounded-[21px] flex justify-between items-center px-8 z-10">
          <div className="flex items-center gap-5">
            {/* Ícone com brilho no hover */}
            <div className="p-4 bg-slate-800 rounded-2xl text-emerald-400 border border-slate-700 shadow-2xl group-hover:text-emerald-300 group-hover:shadow-emerald-500/30 group-hover:border-emerald-700 transition-all">
              <BookOpen size={28} />
            </div>
            <div>
              <h3 className="font-extrabold text-2xl tracking-tight text-white">Estudar Agora</h3>
              <p className="text-slate-400 text-base">Continue sua preparação para a OAB.</p>
            </div>
          </div>
          {/* Botão lateral com brilho e cor no hover */}
          <div className="bg-slate-800 p-3 rounded-xl text-white border border-slate-700 group-hover:bg-brand-600 group-hover:shadow-brand-500/50 group-hover:border-brand-500 transition-all">
            <ChevronRight size={24} />
          </div>
        </div>
      </Link>
    </div>
  );
}