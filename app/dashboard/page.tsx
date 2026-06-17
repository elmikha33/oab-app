'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
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
  const { user, missoes, setMissoes } = useGameState();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState<Record<string, { acertos: number, total: number }>>({});

  useEffect(() => {
    setMounted(true);
    
    async function carregarDados() {
      // 1. Carregar Questões do Banco
      const { data } = await supabase.from("questoes_oab").select("id, materia, gabarito");
      const choices = JSON.parse(localStorage.getItem('userChoices') || '{}');
      
      // 2. Calcular Desempenho
      const calculo: Record<string, { acertos: number, total: number }> = {};
      data?.forEach((q: any) => {
        if (!calculo[q.materia]) calculo[q.materia] = { acertos: 0, total: 0 };
        if (choices[q.id] !== undefined) {
          calculo[q.materia].total += 1;
          if (choices[q.id] === Number(q.gabarito)) calculo[q.materia].acertos += 1;
        }
      });
      setStats(calculo);

      // 3. Gerar Missões Inteligentes (50% do total de cada matéria)
      const resumo = data?.reduce((acc: any, q: any) => {
        acc[q.materia] = (acc[q.materia] || 0) + 1;
        return acc;
      }, {});
      
      if (resumo) {
        const metas = Object.entries(resumo).map(([materia, total]: any) => ({
          titulo: `Estudar ${materia}`,
          progresso: Math.min(calculo[materia]?.total || 0, Math.ceil(total * 0.5)),
          meta: Math.ceil(total * 0.5),
          xp: 50
        }));
        setMissoes(metas);
      }
    }
    carregarDados();
  }, [setMissoes]);

  if (!mounted || !user) return null;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 p-6 md:p-8 space-y-8 overflow-y-auto">
        {/* Header */}
        <div>
            <h1 className="font-heading font-extrabold text-3xl text-white">Dashboard</h1>
            <p className="text-slate-400">Olá, <span className="text-brand-400 font-bold">{user.nome}</span>. Pronto para a missão?</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
                { label: 'Nível', value: user.nivel, icon: Trophy, color: 'text-yellow-500' },
                { label: 'Moedas', value: user.moedas, icon: Coins, color: 'text-yellow-400' },
                { label: 'Ofensiva', value: `${user.streak} dias`, icon: Flame, color: 'text-orange-500' },
                { label: 'XP Total', value: user.xp, icon: Award, color: 'text-brand-500' },
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
            {/* Coluna Principal */}
            <div className="md:col-span-2 space-y-6">
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-6 flex justify-between items-center">
                    <div>
                        <h3 className="text-white font-bold text-lg flex items-center gap-2"><BookOpen className="text-emerald-400" /> Estudar Agora</h3>
                        <p className="text-slate-400 text-sm">Continue de onde parou.</p>
                    </div>
                    <Link href="/play" className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1 transition-all active:scale-95 shadow-lg shadow-emerald-900/20">
                        Acessar <ChevronRight size={16} />
                    </Link>
                </div>

                {/* Lista de Missões */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Target className="text-brand-500" /> Suas Metas</h3>
                    <div className="space-y-3">
                        {missoes.map((m: any, idx: number) => (
                            <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                                <div>
                                    <p className="text-slate-200 font-medium">{m.titulo}</p>
                                    <p className="text-xs text-slate-500">{m.progresso}/{m.meta} questões respondidas</p>
                                </div>
                                <span className="text-xs text-brand-500 font-bold">{m.xp} XP</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Performance */}
            <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><TrendingUp className="text-emerald-500" /> Desempenho</h3>
                    <div className="space-y-4">
                        {Object.entries(stats).length > 0 ? Object.entries(stats).map(([materia, data]) => {
                            const percent = data.total > 0 ? Math.round((data.acertos / data.total) * 100) : 0;
                            return (
                                <div key={materia} className="text-sm">
                                    <div className="flex justify-between mb-1 text-slate-400">
                                        <span>{materia}</span>
                                        <span className="text-white font-bold">{percent}%</span>
                                    </div>
                                    <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>
                            );
                        }) : <p className="text-slate-500 text-sm">Nenhum estudo registrado.</p>}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}