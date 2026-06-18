'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQuestoes() {
      const { data, error } = await supabase.from("questoes_oab").select("*");
      if (data) setQuestoes(data);
      setLoading(false);
    }
    fetchQuestoes();
  }, []);

  if (loading) return <div className="p-8 text-white">Carregando admin...</div>;

  return (
    <div className="flex-1 p-6 md:p-8 bg-slate-950 min-h-screen">
      <h1 className="text-2xl font-bold text-white mb-6">Painel Administrativo - Questões OAB</h1>
      
      <div className="overflow-x-auto bg-slate-900 rounded-xl border border-slate-800">
        <table className="w-full text-left">
          <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
            <tr>
              <th className="py-3 px-4">Matéria</th>
              <th className="py-3 px-4">Tema</th>
              <th className="py-3 px-4">Enunciado</th>
              <th className="py-3 px-4">Gabarito</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs text-slate-300">
            {questoes.map((q: any) => (
              <tr key={q.id} className="hover:bg-slate-950/50">
                <td className="py-3 px-4 font-semibold text-brand-400">{q.materia}</td>
                <td className="py-3 px-4">{q.tema}</td>
                <td className="py-3 px-4 max-w-[400px] truncate">{q.enunciado}</td>
                <td className="py-3 px-4">{q.gabarito}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}