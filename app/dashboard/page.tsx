'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useGameState } from '@/context/GameStateContext';
import { 
  Flame, 
  Coins, 
  Trophy, 
  Target, 
  ChevronRight,
  TrendingUp,
  Award,
  BookOpen
} from 'lucide-react';

export default function Dashboard() {
  const { user, missoes } = useGameState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !user) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 p-6 md:p-8 space-y-8 overflow-y-auto">
        {/* Header de Boas Vindas */}
        <div>
            <h1 className="font-heading font-extrabold text-3xl text-white">Dashboard</h1>
            <p className="text-slate-400">Olá, <span className="text-brand-400 font-bold">{user.nome}</span>. Pronto para a sua próxima missão?</p>
        </div>

        {/* Linha de Indicadores (Stats) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { label: 'Nível', value: user.nivel, icon: Trophy, color: 'text-yellow-500' },
                { label: 'Moedas', value: user.moedas, icon: Coins, color: 'text-yellow-400' },
                { label: 'Ofensiva', value: `${user.streak} dias`, icon: Flame, color: 'text-orange-500' },
                { label: 'XP Total', value: user.xp, icon: Award, color: 'text-brand-500' },
            ].map((stat, i) => (
                <div key={i} className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
                    <div className={`p-2 bg-slate-950 rounded-lg ${stat.color}`}>
                        <stat.icon size={20} />
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs uppercase font-bold">{stat.label}</p>
                        <p className="text-white font-bold">{stat.value}</p>
                    </div>
                </div>
            ))}
        </div>

        {/* Conteúdo Principal */}
        <div className="grid md:grid-cols-3 gap-6">
            
            {/* Coluna Principal: Missões e Estudo */}
            <div className="md:col-span-2 space-y-6">
                
                {/* Bloco de Estudo (FUNCIONAL) */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            <BookOpen className="text-emerald-400" /> Estudar Agora
                        </h3>
                        <p className="text-slate-400 text-sm">Continue de onde você parou hoje.</p>
                    </div>
                    <Link 
                        href="/play" 
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
                    >
                        Acessar <ChevronRight size={16} />
                    </Link>
                </div>

                {/* Lista de Missões */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <Target className="text-brand-500" /> Suas Missões Ativas
                    </h3>
                    
                    <div className="space-y-3">
                        {missoes && missoes.length > 0 ? (
                            missoes.map((missao: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-all">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-brand-500" />
                                        <span className="text-slate-200 font-medium">{missao.titulo || 'Missão Sem Título'}</span>
                                    </div>
                                    <span className="text-xs text-slate-500 uppercase font-bold">{missao.xp} XP</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-slate-500 italic">Nenhuma missão ativa no momento.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Coluna Lateral: Performance */}
            <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                        <TrendingUp className="text-emerald-500" /> Desempenho
                    </h3>
                    
                    <div className="space-y-4">
                        <div className="text-sm text-slate-400">
                            <div className="flex justify-between mb-1">
                                <span>Direito Civil</span>
                                <span className="text-white font-bold">75%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 w-[75%]" />
                            </div>
                        </div>
                        
                        <div className="text-sm text-slate-400">
                            <div className="flex justify-between mb-1">
                                <span>Processo Civil</span>
                                <span className="text-white font-bold">40%</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-brand-500 w-[40%]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}