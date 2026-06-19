'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameState } from '../../context/GameStateContext';
import { Scale, ShieldAlert, Loader2 } from 'lucide-react';

/**
 * Componente interno que contém a lógica de hooks.
 * Ele será "embrulhado" pelo Suspense no componente principal.
 */
function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginMock, comprarPremium, user } = useGameState();
  
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  // Efeito de redirecionamento se já logado
  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Por favor, escolha um nome de jogador.');
      return;
    }

    setLoading(true);
    
    // Simulação de login
    loginMock(nome.trim());

    // Verifica parâmetro de checkout premium
    const comprouPremium = searchParams.get('checkout') === 'premium';
    
    // Pequeno delay para garantir sincronia com contexto
    setTimeout(() => {
      if (comprouPremium) {
        comprarPremium();
      }
      setLoading(false);
      router.push('/dashboard');
    }, 800);
  };

  const loginComoAdmin = () => {
    setLoading(true);
    setTimeout(() => {
      loginMock('admin');
      setLoading(false);
      router.push('/admin');
    }, 500);
  };

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-black relative z-10 glass">
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 mb-8 text-center">
        <div className="bg-brand-600 p-3 rounded-2xl glow-purple text-white">
          <Scale className="h-8 w-8" />
        </div>
        <h2 className="font-heading font-extrabold text-2xl text-white tracking-wide">
          MISSÃO <span className="text-brand-500">OAB</span>
        </h2>
        <p className="text-xs text-slate-400">Acesse o seu painel de estudos e comece o desafio</p>
      </div>

      {erro && (
        <div className="mb-4 bg-red-500/10 border border-red-500/25 p-3 rounded-xl flex items-center gap-2 text-xs text-red-400">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="nome" className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Nome do Jogador / Estudante
          </label>
          <input
            id="nome"
            type="text"
            required
            placeholder="Digite seu nome completo ou apelido..."
            value={nome}
            onChange={(e) => {
              setNome(e.target.value);
              if (erro) setErro('');
            }}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm placeholder:text-slate-600 text-white outline-none transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-bold rounded-xl glow-purple flex items-center justify-center gap-2 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Inicializando Arena...
            </>
          ) : (
            'Entrar com Google (Simulado)'
          )}
        </button>
      </form>

      <div className="relative my-6 text-center">
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-slate-800"></span>
        <span className="relative bg-slate-900 px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Ou para teste rápido
        </span>
      </div>

      <button
        onClick={loginComoAdmin}
        disabled={loading}
        className="w-full py-3 bg-slate-950 border border-slate-800 hover:bg-slate-800/60 disabled:opacity-50 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
      >
        🔑 Login rápido como Admin
      </button>

      <div className="mt-8 text-center">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Ao se registrar, você concorda com nossos Termos de Serviço. O sistema criará uma conta local persistida no seu navegador.
        </p>
      </div>
    </div>
  );
}

/**
 * Componente Exportado Principal
 * O uso do Suspense aqui é obrigatório para Next.js App Router (Build)
 */
export default function AuthPage() {
  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      <Suspense fallback={
        <div className="flex items-center justify-center p-8">
           <Loader2 className="h-8 w-8 animate-spin text-brand-500" />
        </div>
      }>
        <AuthFormContent />
      </Suspense>
    </div>
  );
}