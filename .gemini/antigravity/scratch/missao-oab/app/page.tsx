'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useGameState } from '../context/GameStateContext';
import {
  Flame, Target, Award, Sparkles, Scale, ArrowRight, Brain, TrendingUp
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useGameState();
  const router = useRouter();

  /* 🔥 evita múltiplos redirects desnecessários */
  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 flex flex-col font-sans selection:bg-brand-500/30 selection:text-white">

      {/* Header */}
      <header className="max-w-7xl mx-auto w-full px-6 h-20 flex items-center justify-between border-b border-slate-900/50">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-2 rounded-lg shadow-lg shadow-brand-600/20">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <span className="font-extrabold text-xl text-white tracking-wide">
            MISSÃO <span className="text-brand-500">OAB</span>
          </span>
        </div>

        <Link
          href="/auth"
          className="px-5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-semibold hover:bg-slate-800 transition-all"
        >
          Entrar na Arena
        </Link>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto w-full px-6 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">

        <div className="space-y-6 text-center md:text-left">

          <div className="inline-flex items-center gap-1.5 bg-brand-500/10 border border-brand-500/25 px-3 py-1 rounded-full text-xs font-semibold text-brand-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>A Revolução Gamificada dos Estudos</span>
          </div>

          <h1 className="font-extrabold text-5xl md:text-7xl tracking-tight text-white leading-[1.1]">
            Passe na OAB como um <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">JOGO</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl max-w-lg mx-auto md:mx-0">
            Estude com inteligência, ganhe XP e evolua até a aprovação.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">

            <Link
              href="/auth"
              className="px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              Começar
              <ArrowRight className="h-5 w-5" />
            </Link>

            <a
              href="#recursos"
              className="px-8 py-4 bg-slate-900 border border-slate-800 text-slate-300 font-semibold rounded-xl text-center"
            >
              Como funciona?
            </a>

          </div>
        </div>

        {/* Card */}
        <div className="relative flex justify-center">
          <div className="absolute inset-0 bg-brand-500/20 blur-[120px] rounded-full"></div>

          <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-6">

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                LVL 1
              </div>

              <div>
                <h4 className="font-bold">Bacharel Iniciante</h4>
                <div className="w-32 h-2 bg-slate-800 rounded-full mt-1 overflow-hidden">
                  <div className="w-3/4 h-full bg-brand-500"></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <Flame className="text-orange-500 mb-2" />
                <span className="text-xl font-bold block">7</span>
                <span className="text-[10px] text-slate-500 uppercase">Streak</span>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <Target className="text-brand-400 mb-2" />
                <span className="text-xl font-bold block">84%</span>
                <span className="text-[10px] text-slate-500 uppercase">Precisão</span>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* Recursos */}
      <section id="recursos" className="max-w-7xl mx-auto w-full px-6 py-20 border-t border-slate-900">

        <h2 className="text-3xl font-bold text-center mb-16">
          Por que funciona?
        </h2>

        <div className="grid md:grid-cols-3 gap-8">

          {[
            {
              icon: Brain,
              title: "IA Inteligente",
              desc: "Explica seus erros automaticamente"
            },
            {
              icon: TrendingUp,
              title: "Evolução Real",
              desc: "Você sobe de nível estudando"
            },
            {
              icon: Award,
              title: "Conquistas",
              desc: "Sistema de gamificação completo"
            }
          ].map((item, i) => (
            <div key={i} className="bg-slate-900/50 p-8 rounded-2xl border border-slate-800">

              <div className="bg-slate-800 w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-brand-400">
                <item.icon size={24} />
              </div>

              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-400">{item.desc}</p>

            </div>
          ))}

        </div>

      </section>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-slate-900/50">
        <p className="text-slate-600 text-sm">
          © {new Date().getFullYear()} Missão OAB
        </p>
      </footer>

    </div>
  );
}