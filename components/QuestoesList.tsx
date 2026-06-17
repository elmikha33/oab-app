'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { RefreshCcw, ArrowLeft } from 'lucide-react';

const PRIORITY_ORDER = [
  "Ética Profissional", "Direito Constitucional", "Direito Administrativo",
  "Direito Civil", "Direito Processual Civil", "Direito Penal",
  "Direito Processual Penal", "Direito do Trabalho", "Direito Processual do Trabalho",
  "Direito Tributário", "Direito Empresarial", "Direitos Humanos",
  "Direito Ambiental", "Direito do Consumidor", "Direito Internacional",
  "Direito Previdenciário", "Filosofia do Direito"
];

export default function QuestoesList() {
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [userChoices, setUserChoices] = useState<Record<string, number>>({});
  const [filtroMateria, setFiltroMateria] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("questoes_oab").select("*");
      if (data) setQuestoes(data);
    };
    load();
  }, []);

  const orderedSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    questoes.forEach(q => {
      const mat = (q.materia || "Outros").trim();
      counts[mat] = (counts[mat] || 0) + 1;
    });

    return PRIORITY_ORDER.map((materia, index) => {
      const dbKey = Object.keys(counts).find(k => k.toLowerCase() === materia.toLowerCase());
      return {
        name: dbKey || materia,
        count: dbKey ? counts[dbKey] : 0,
        order: index + 1
      };
    }).filter(item => item.count > 0);
  }, [questoes]);

  const stats = useMemo(() => {
    return questoes.reduce((acc: any, q: any) => {
      if (userChoices[q.id] !== undefined) {
        userChoices[q.id] === Number(q.gabarito) ? acc.acertos++ : acc.erros++;
      }
      return acc;
    }, { acertos: 0, erros: 0 });
  }, [questoes, userChoices]);

  const resetar = (materia: string) => {
    const next = { ...userChoices };
    questoes.forEach(q => { 
      if ((q.materia || "").trim() === materia) delete next[q.id]; 
    });
    setUserChoices(next);
    setMensagem(`${materia} resetada!`);
    setTimeout(() => setMensagem(null), 2000);
  };

  const exibidas = filtroMateria 
    ? questoes.filter(q => (q.materia || "").trim() === filtroMateria) 
    : questoes;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-8">
      
      <Link href="/dashboard" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 bg-slate-900/50 w-fit px-4 py-2 rounded-xl border border-slate-800">
        <ArrowLeft size={18} />
        <span className="text-sm font-bold">Voltar ao Dashboard</span>
      </Link>

      <div className="grid grid-cols-3 gap-2 md:gap-4">
        {[
          { label: 'Acertos', val: stats.acertos, color: 'text-emerald-400', border: 'border-emerald-500/30' },
          { label: 'Erros', val: stats.erros, color: 'text-red-400', border: 'border-red-500/30' },
          { label: 'Total', val: stats.acertos + stats.erros, color: 'text-indigo-400', border: 'border-indigo-500/30' }
        ].map((s, i) => (
          <div key={i} className={`bg-slate-900/50 border ${s.border} p-3 rounded-2xl`}>
            <p className={`${s.color} text-[10px] uppercase font-bold`}>{s.label}</p>
            <p className="text-xl font-bold text-white">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700">
        <h3 className="text-slate-400 font-bold mb-4 uppercase text-xs flex justify-between">
          <span>Matérias por Prioridade</span>
          {mensagem && <span className="text-emerald-400 animate-pulse">{mensagem}</span>}
        </h3>
        <div className="flex flex-wrap gap-2">
          <button 
            style={{ order: 0 }}
            onClick={() => setFiltroMateria(null)} 
            className={`px-3 py-2 rounded-xl border text-sm transition-all ${!filtroMateria ? 'bg-indigo-600 border-indigo-400 text-white font-bold' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
          >
            Todas ({questoes.length})
          </button>

          {orderedSummary.map((item) => (
            <div key={item.name} style={{ order: item.order } as React.CSSProperties} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${filtroMateria === item.name ? 'bg-indigo-900/40 border-indigo-500' : 'bg-slate-900 border-slate-700'}`}>
              <button onClick={() => setFiltroMateria(item.name)} className={`text-sm ${filtroMateria === item.name ? 'text-white font-bold' : 'text-slate-300'}`}>{item.name} ({item.count})</button>
              <button onClick={() => resetar(item.name)} className="text-slate-500 hover:text-white"><RefreshCcw size={12}/></button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {exibidas.map((q: any) => {
          const answered = userChoices[q.id] !== undefined;
          const selected = userChoices[q.id];
          const correct = Number(q.gabarito);
          
          return (
            <div key={q.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
              <div className="flex gap-2 mb-3">
                <span className="inline-block bg-indigo-900/40 text-indigo-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md border border-indigo-900/50">
                  {q.materia || 'Matéria'}
                </span>
                <span className="inline-block bg-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md">
                  {q.tema || 'Questão OAB'}
                </span>
              </div>
              <h2 className="text-lg text-white mb-6 leading-relaxed">{q.enunciado}</h2>
              <div className="space-y-3">
                {q.alternativas.map((alt: string, i: number) => (
                  <button 
                    key={i} 
                    disabled={answered} 
                    onClick={() => setUserChoices(prev => ({...prev, [q.id]: i}))} 
                    className={`w-full text-left p-4 rounded-xl border transition-all ${answered ? (i === correct ? 'bg-emerald-900/40 border-emerald-500' : i === selected ? 'bg-red-900/40 border-red-500' : 'opacity-40 border-slate-800') : 'bg-slate-950 border-slate-800 hover:border-slate-500'}`}
                  >
                    {alt}
                  </button>
                ))}
              </div>
              {answered && (
                <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                  <p className="font-bold mb-2">{selected === correct ? "✅ Correto!" : "❌ Incorreto."}</p>
                  <p className="text-sm italic">{q.comentario}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}