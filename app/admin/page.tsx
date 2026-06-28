'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabase";
import { useGameState } from '@/context/GameStateContext';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading: userLoading } = useGameState() || {};
  const [questoes, setQuestoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    if (userLoading) return;

    if (!user?.isAdmin) {
      setLoading(false);
      router.replace('/dashboard');
      return;
    }

    async function fetchQuestoes() {
      setLoading(true);
      setErro('');

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        router.replace('/auth');
        return;
      }

      const response = await fetch('/api/admin/questoes', {
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !Array.isArray(data)) {
        setErro(data?.error || 'Nao foi possivel carregar o admin.');
        setLoading(false);
        return;
      }

      setQuestoes(data);
      setLoading(false);
    }

    fetchQuestoes();
  }, [router, user?.isAdmin, userLoading]);

  if (userLoading || loading) return <div className="p-8 text-white">Carregando admin...</div>;

  if (!user?.isAdmin) {
    return <div className="p-8 text-white">Acesso restrito.</div>;
  }

  if (erro) {
    return <div className="p-8 text-white">{erro}</div>;
  }

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
