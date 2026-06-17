'use client';

import React, { useEffect, useState } from 'react';
import { useGameState } from '@/context/GameStateContext';
import { supabase } from "@/lib/supabase";

export default function ReviewPage() {
  const { user } = useGameState();
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuestoes() {
      const { data } = await supabase.from("questoes_oab").select("*");
      if (data) setQuestoes(data);
      setLoading(false);
    }
    loadQuestoes();
  }, []);

  // Filtrar as questões que estão na lista de revisão do usuário
  // Tipamos 'q' como 'any' para evitar o erro de build
  const questoesRevisao = questoes.filter((q: any) => user?.revisaoIds?.includes(q.id));

  const iniciarRevisao = () => {
    if (questoesRevisao.length === 0) return;
    // Lógica para iniciar o modo revisão
    console.log("Iniciando revisão...");
  };

  if (loading) return <div className="p-8 text-white">Carregando revisão...</div>;

  return (
    <div className="flex-1 p-6 md:p-8 bg-slate-950 min-h-screen text-white">
      <h1 className="text-3xl font-bold mb-2">Área de Revisão</h1>
      <p className="text-slate-400 mb-8">
        Você tem {questoesRevisao.length} questões para revisar.
      </p>

      {questoesRevisao.length > 0 ? (
        <button 
          onClick={iniciarRevisao}
          className="bg-indigo-600 hover:bg-indigo-500 px-6 py-3 rounded-xl font-bold transition-all"
        >
          Iniciar Revisão Agora
        </button>
      ) : (
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
          <p className="text-slate-400">Nenhuma questão na sua lista de revisão no momento. Continue estudando!</p>
        </div>
      )}
    </div>
  );
}