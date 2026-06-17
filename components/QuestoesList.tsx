'use client';

import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase"; 
import { RefreshCcw, CheckCircle2, XCircle, Award } from 'lucide-react';

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
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-emerald-900/20 p-4 rounded-2xl">
          <p className="text-emerald-400 text-xs font-bold">ACERTOS</p>
          <p className="text-2xl font-bold text-white">{stats.acertos}</p>
        </div>
        <div className="bg-red-900/20 p-4 rounded-2xl">
          <p className="text-red-400 text-xs font-bold">ERROS</p>
          <p className="text-2xl font-bold text-white">{stats.erros}</p>
        </div>
        <div className="bg-indigo-900/20 p-4 rounded-2xl">
          <p className="text-indigo-400 text-xs font-bold">TOTAL</p>
          <p className="text-2xl font-bold text-white">{stats.acertos + stats.erros}</p>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-slate-400 font-bold uppercase text-xs">Sumário</h3>
          {mensagem && <span className="text-emerald-400 text-[10px] animate-pulse">{mensagem}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setFiltroMateria(null)} className="px-3 py-1 rounded-lg text-sm bg-slate-600">Todas</button>
          {Object.entries(summary).map(([m, c]) => (
            <div key={m} className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
              <button onClick={() => setFiltroMateria(m)} className="text-sm text-slate-300">{m} ({c})</button>
              <button onClick={() => resetar(m)} className="text-slate-500 hover:text-white"><RefreshCcw size={12}/></button>
            </div>
          ))}
        </div>
      </div>

      {exibidas.map((q: any) => {
        const answered = userChoices[q.id] !== undefined;
        const selected = userChoices[q.id];
        const correct = Number(q.gabarito);
        
        return (
          <div key={q.id} className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <h2 className="text-lg text-white mb-6">{q.enunciado}</h2>
            <div className="space-y-3">
              {q.alternativas.map((alt: string, i: number) => (
                <button key={i} disabled={answered} onClick={() => setUserChoices(prev => ({...prev, [q.id]: i}))} className={`w-full text-left p-4 rounded-xl border ${answered ? (i === correct ? 'bg-emerald-900 border-emerald-500' : i === selected ? 'bg-red-900 border-red-500' : 'opacity-30 border-slate-800') : 'bg-slate-950 border-slate-800'}`}>
                  {alt}
                </button>
              ))}
            </div>
            {answered && (
              <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-300">
                <p className="font-bold">{selected === correct ? "✅ Correto!" : "❌ Incorreto."}</p>
                <p className="text-sm mt-2">{q.comentario}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}