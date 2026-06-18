'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { Scale, ShieldAlert, Loader2 } from 'lucide-react';

function AuthFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const loginMock = useGameStore((state) => state.loginMock);
  const comprarPremium = useGameStore((state) => state.comprarPremium);
  const user = useGameStore((state) => state.user);

  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

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

    loginMock(nome.trim());

    const comprouPremium =
      searchParams.get('checkout') === 'premium';

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

        <h2 className="font-heading font-extrabold text-2xl text-white">
          MISSÃO <span className="text-brand-500">OAB</span>
        </h2>

        <p className="text-xs text-slate-400">
          Acesse o seu painel de estudos e comece o desafio
        </p>
      </div>

      {erro && (
        <div className="mb-4 bg-red-500/10 border border-red-500/25 p-3 rounded-xl flex items-center gap-2 text-xs text-red-400">
          <ShieldAlert className="h-4 w-4" />
          {erro}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-5">
        <input
          type="text"
          placeholder="Seu nome"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            if (erro) setErro('');
          }}
          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-brand-600 text-white rounded-xl"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <button
        onClick={loginComoAdmin}
        disabled={loading}
        className="w-full mt-4 py-3 bg-slate-800 text-white rounded-xl"
      >
        Login Admin
      </button>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <Suspense
        fallback={
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        }
      >
        <AuthFormContent />
      </Suspense>
    </div>
  );
}