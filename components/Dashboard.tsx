'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { useGameState } from '@/context/GameStateContext';
import { getTituloPorNivel } from '@/lib/mockData';
import { 
  Flame, 
  Coins, 
  Trophy, 
  Target, 
  ChevronRight, 
  Award, 
  BookOpen, 
  Quote 
} from 'lucide-react';

// Lista de frases para a Inspiração Jurídica
const inspiracoes = [
  { texto: "Não é que eu seja tão inteligente, é que eu fico com os problemas por mais tempo.", autor: "Albert Einstein" },
  { texto: "A advocacia não é profissão de covardes.", autor: "Sobral Pinto" },
  { texto: "Justiça tardia não é justiça, é injustiça qualificada e manifesta.", autor: "Rui Barbosa" },
  { texto: "Sempre parece impossível até que seja feito.", autor: "Nelson Mandela" },
  { texto: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", autor: "Robert Collier" },
  { texto: "O direito é a vontade do forte sobre o fraco, mas a justiça é o equilíbrio.", autor: "Rudolf von Ihering" }
];

export default function Dashboard() {
  const { user } = useGameState();
  const [mounted, setMounted] = useState(false);
  const [fraseDia, setFraseDia] = useState({ texto: '', autor: '' });

  useEffect(() => {
    setMounted(true);
    // Seleciona uma frase aleatória ao montar o componente
    const randomIdx = Math.floor(Math.random() * inspiracoes.length);
    setFraseDia(inspiracoes[randomIdx]);
  }, []);

  // Função para disparar o confete
  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#facc15', '#ffffff'],
    });
  };

  if (!mounted || !user) {
    return <div className="p-8 text-white min-h-screen bg-slate-950">Carregando Dashboard...</div>;
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-950 p-6 md:p-8 space-y-8 overflow-y-auto min-h-screen">
      <div>
        <h1 className="font-heading font-extrabold text-3xl text-white">Dashboard</h1>
        <p className="text-slate-400">Olá, <span className="text-brand-400 font-bold">{user.nome || 'Candidato'}</span>. Pronto para a missão?</p>
      </div>

      {/* Grid de Estatísticas */}
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
          
          {/* Card "Estudar Agora" com Borda Dourada Girando + Confetti */}
          <Link 
            href="/play" 
            onClick={triggerConfetti}
            className="group relative block p-[2px] rounded-2xl overflow-hidden h-[130px] w-full hover:scale-[1.01] transition-transform duration-500"
          >
            {/* Borda Giratória (Quadrado perfeito para fluidez) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] aspect-square animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_60%,#eab308)] opacity-60 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* Fundo do Card (Máscara) */}
            <div className="absolute inset-[2px] bg-slate-900 rounded-[14px]"></div>
            
            {/* Conteúdo Real do Card */}
            <div className="relative h-full w-full rounded-[14px] flex justify-between items-center px-6 transition-colors duration-300 group-hover:bg-emerald-900/10">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-800/50 rounded-xl text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-lg">Estudar Agora</h3>
                  <p className="text-slate-400 text-sm group-hover:text-slate-200 transition-colors duration-300">Continue de onde parou.</p>
                </div>
              </div>

              <div className="bg-slate-800/50 group-hover:bg-emerald-600 text-white p-3 rounded-lg transition-colors duration-300">
                <ChevronRight size={20} />
              </div>
            </div>
          </Link>

          {/* Área de Inspiração Jurídica */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Quote size={80} />
            </div>
            <h3 className="text-white font-bold mb-6 flex items-center gap-2">
              <Award className="text-brand-500" /> Inspiração Jurídica
            </h3>
            
            <div className="flex flex-col gap-4">
              <p className="text-slate-200 text-lg italic leading-relaxed">
                "{fraseDia.texto}"
              </p>
              <div className="flex items-center gap-2">
                <div className="h-px w-8 bg-brand-500"></div>
                <p className="text-brand-400 font-bold uppercase tracking-wider text-xs">
                  {fraseDia.autor}
                </p>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}