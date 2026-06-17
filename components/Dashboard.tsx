'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGameState } from '@/context/GameStateContext';
import { Flame, Coins, Trophy, Target, ChevronRight, Award, BookOpen } from 'lucide-react';

export default function Dashboard() {
  const { user, missoes } = useGameState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) {
    return <div className="p-8 text-white min-h-screen bg-slate-950">Carregando Dashboard...</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 p-6 md:p-8 space-y-8 overflow-y-auto min-h-screen">
      <div>
        <h1 className="font-heading font-extrabold text-3xl text-white">Dashboard</h1>
        <p className="text-slate-400">Olá, <span className="text-brand-400 font-bold">{user.nome || 'Candidato'}</span>. Pronto para a missão?</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Nível', value: user.nivel || 1, icon: Trophy, color: 'text-yellow-500' },
          { label: 'Moedas', value: user.moedas || 0, icon: Coins, color: 'text-yellow-400' },
          { label: 'Ofensiva', value: `${user.streak || 0} dias`, icon: Flame, color: 'text-orange-500' },
          { label: 'XP Total', value: user.xp || 0, icon: Award, color: 'text-brand-500' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
            <div className={`p-2 bg-slate-950 rounded-lg ${stat.color}`}><stat.icon size={20} /></div>
            <div>
              <p className="text-slate-500 text-xs uppercase font-bold">{stat.label}</p>
              <p className="text-white font-bold">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 flex justify-between items-center">
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2"><BookOpen className="text-emerald-400" /> Estudar Agora</h3>
              <p className="text-slate-400 text-sm">Continue de onde parou.</p>
            </div>
            <Link href="/play" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all active:scale-95">
              Acessar <ChevronRight size={16} />
            </Link>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Target className="text-brand-500" /> Suas Metas</h3>
            <div className="space-y-3">
              {missoes && missoes.length > 0 ? missoes.map((m: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="text-slate-200 font-medium">{m.titulo}</p>
                    <p className="text-xs text-slate-500">{m.progresso || 0}/{m.meta} questões</p>
                  </div>
                  <span className="text-xs text-brand-500 font-bold">{m.xp} XP</span>
                </div>
              )) : <p className="text-slate-500 text-sm italic">Nenhuma missão no momento.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}