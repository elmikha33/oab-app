'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from "@/lib/supabase"; 
import { RefreshCcw, CheckCircle2, XCircle, Award, ArrowLeft } from 'lucide-react';

export default function QuestoesList() {
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [userChoices, setUserChoices] = useState<Record<string, number>>({});
  const [filtroMateria, setFiltroMateria] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const savedChoices = localStorage.getItem('userChoices');
      const savedFilter = localStorage.getItem('filtroMateria');
      if (savedChoices) setUserChoices(JSON.parse(savedChoices));
      if (savedFilter) setFiltroMateria(JSON.parse(savedFilter));

      const { data } = await supabase.from("questoes_oab").select("*");
      const saved = savedChoices ? JSON.parse(savedChoices) : {};
      
      const sorted = (data || []).sort((a: any, b: any) => {
        const aR = saved[a.id] !== undefined;
        const bR = saved[b.id] !== undefined;
        return aR === bR ? 0 : aR ? 1 : -1;
      });
      
      setQuestoes(sorted);
      setIsLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('userChoices', JSON.stringify(userChoices));
      localStorage.setItem('filtroMateria', JSON.stringify(filtroMateria));
    }
  }, [userChoices, filtroMateria, isLoaded]);

  const resetar = (materia: string) => {
    const next = { ...userChoices };
    questoes.forEach(q => { if (q.materia === materia) delete next[q.id]; });
    setUserChoices(next);
    setMensagem(`${materia} resetada!`);
    setTimeout(() => setMensagem(null), 2000);
  };

  const stats = questoes.reduce((acc: any, q: any) => {
    if (userChoices[q.id] !== undefined) {
      userChoices[q.id] === Number(q.gabarito) ? acc.acertos++ : acc.erros++;
    }
    return acc;
  }, { acertos: 0, erros: 0 });

  const summary: Record<string, number> = questoes.reduce((acc: any, q: any) => {
    acc[q.materia || "Outros"] = (acc[q.materia || "Outros"] || 0) + 1;
    return acc;
  }, {});

  const exibidas = filtroMateria ? questoes.filter(q => q.materia === filtroMateria) : questoes;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-8">
      
      {/* BOTÃO DE VOLTAR FIXO */}
      <Link 
        href="/dashboard" 
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 bg-slate-900/50 w-fit px-4 py-2 rounded-xl border border-slate-800"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-bold">Voltar ao Dashboard</span>
      </Link>

      {/* PAINEL DE ESTATÍSTICAS */}
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

      {/* SUMÁRIO */}
      <div className="bg-slate-800 p-4 md:p-6 rounded-2xl border border-slate-700">
        <h3 className="text-slate-400 font-bold mb-4 uppercase text-xs">Sumário {mensagem && <span className="text-emerald-400 ml-2 animate-pulse">{mensagem}</span>}</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFiltroMateria(null)} className={`px-4 py-2 rounded-xl text-sm transition-all ${!filtroMateria ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50 scale-105 border border-indigo-400' : 'bg-slate-900 text-slate-400 border border-slate-700'}`}>Todas</button>
          {Object.entries(summary).map(([m, c]) => (
            <div key={m} className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${filtroMateria === m ? 'bg-indigo-900/40 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-900 border-slate-700'}`}>
              <button onClick={() => setFiltroMateria(m)} className={`text-sm ${filtroMateria === m ? 'text-white font-bold' : 'text-slate-300'}`}>{m} ({c})</button>
              <button onClick={() => resetar(m)} className="text-slate-500 hover:text-white"><RefreshCcw size={12}/></button>
            </div>
          ))}
        </div>
      </div>

      {/* LISTA DE QUESTÕES */}
      {exibidas.map((q: any) => {
        const answered = userChoices[q.id] !== undefined;
        const selected = userChoices[q.id];
        const correct = Number(q.gabarito);
        
        return (
          <div key={q.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-xl">
            <span className="inline-block bg-slate-800 text-slate-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-md mb-3">
              {q.tema || 'Questão OAB'}
            </span>
            <h2 className="text-lg text-white mb-6 leading-relaxed">{q.enunciado}</h2>
            <div className="space-y-3">
              {q.alternativas.map((alt: string, i: number) => (
                <button key={i} disabled={answered} onClick={() => setUserChoices(prev => ({...prev, [q.id]: i}))} className={`w-full text-left p-4 rounded-xl border transition-all ${answered ? (i === correct ? 'bg-emerald-900/40 border-emerald-500' : i === selected ? 'bg-red-900/40 border-red-500' : 'opacity-40 border-slate-800') : 'bg-slate-950 border-slate-800 hover:border-slate-500'}`}>
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
  );
}