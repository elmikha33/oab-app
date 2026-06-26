'use client';

import { FormEvent, Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Mail, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useGameState } from '@/context/GameStateContext';

function AuthFormContent() {
  const router = useRouter();
  const { user, loading, refreshUser } = useGameState();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    let cancelado = false;

    async function finalizarRetornoOAuth() {
      if (typeof window === 'undefined') return;

      const url = new URL(window.location.href);
      const temCode = url.searchParams.has('code');
      const temAccessToken = window.location.hash.includes('access_token');

      if (!temCode && !temAccessToken) return;

      setCarregando(true);
      setErro('');

      try {
        if (temCode) {
          const { error } = await supabase.auth.exchangeCodeForSession(window.location.href);

          if (error) {
            throw error;
          }
        }

        await refreshUser();

        if (!cancelado) {
          window.history.replaceState({}, document.title, '/auth');
          router.replace('/dashboard');
        }
      } catch (error: any) {
        if (!cancelado) {
          setErro(error?.message || 'Erro ao finalizar login com Google.');
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }

    finalizarRetornoOAuth();

    return () => {
      cancelado = true;
    };
  }, [refreshUser, router]);

  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [loading, user, router]);

  async function entrarComGoogle() {
    setCarregando(true);
    setErro('');
    setAviso('');

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${siteUrl}/auth`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      setErro(error.message);
      setCarregando(false);
    }
  }

  async function entrarComEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setCarregando(true);
    setErro('');
    setAviso('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setErro(error.message || 'Erro ao entrar.');
      setCarregando(false);
      return;
    }

    await refreshUser();
    setCarregando(false);
    router.replace('/dashboard');
  }

  async function criarContaEmail() {
    setCarregando(true);
    setErro('');
    setAviso('');

    if (!email.trim() || !senha.trim()) {
      setErro('Informe email e senha.');
      setCarregando(false);
      return;
    }

    if (senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres.');
      setCarregando(false);
      return;
    }

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      window.location.origin;

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        emailRedirectTo: `${siteUrl}/auth`,
        data: {
          nome: nome.trim() || email.trim().split('@')[0],
          full_name: nome.trim() || email.trim().split('@')[0],
        },
      },
    });

    if (error) {
      setErro(error.message || 'Erro ao criar conta.');
      setCarregando(false);
      return;
    }

    if (!data.session) {
      setAviso('Conta criada. Confira seu email para confirmar o acesso.');
      setCarregando(false);
      return;
    }

    await refreshUser();
    setCarregando(false);
    router.replace('/dashboard');
  }

  if (loading || carregando) {
    return (
      <div className="flex w-full max-w-md flex-col items-center justify-center rounded-[2rem] border border-emerald-300/10 bg-slate-900 p-8 text-center text-emerald-300 shadow-2xl shadow-black/50">
        <Loader2 className="h-7 w-7 animate-spin" />
        <p className="mt-4 text-sm font-bold text-slate-200">
          Entrando no OAPlay...
        </p>
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-emerald-300/10 bg-slate-900/95 p-7 shadow-2xl shadow-black/50">
      <div className="mb-8 text-center">
        <img
          src="/oaplay-logo-horizontal-transparent-white.png"
          alt="OAPlay"
          className="mx-auto h-14 w-auto object-contain"
        />

        <p className="mt-4 text-xs font-black uppercase tracking-[0.24em] text-emerald-300">
          Sua aprovacao expressa
        </p>

        <p className="mt-3 text-sm leading-relaxed text-slate-400">
          Entre para acessar seu painel, salvar progresso e assinar o Premium.
        </p>
      </div>

      {erro && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-red-500/25 bg-red-500/10 p-3 text-xs text-red-300">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{erro}</span>
        </div>
      )}

      {aviso && (
        <div className="mb-4 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-3 text-xs font-semibold text-emerald-200">
          {aviso}
        </div>
      )}

      <button
        type="button"
        onClick={entrarComGoogle}
        disabled={carregando}
        className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-4 py-3.5 text-sm font-black text-slate-950 transition hover:bg-emerald-50 disabled:opacity-60"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-950 text-[11px] font-black text-white">
          G
        </span>
        <span>Entrar com Google</span>
      </button>

      <div className="relative my-5 text-center">
        <span className="absolute inset-x-0 top-1/2 -translate-y-1/2 border-t border-white/10" />
        <span className="relative bg-slate-900 px-3 text-[10px] font-black uppercase tracking-wider text-slate-500">
          Ou use email e senha
        </span>
      </div>

      <form onSubmit={entrarComEmail} className="space-y-3">
        <input
          type="text"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          placeholder="Seu nome"
          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300"
        />

        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300"
        />

        <input
          type="password"
          required
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          placeholder="Senha"
          className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-300"
        />

        <button
          type="submit"
          disabled={carregando}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3.5 text-sm font-black text-emerald-950 transition hover:bg-emerald-200 disabled:opacity-60"
        >
          <Mail className="h-4 w-4" />
          Entrar
        </button>

        <button
          type="button"
          onClick={criarContaEmail}
          disabled={carregando}
          className="w-full rounded-2xl border border-emerald-300/20 px-4 py-3 text-sm font-bold text-emerald-200 transition hover:bg-emerald-300/10 disabled:opacity-60"
        >
          Criar conta com email
        </button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 p-4 text-slate-100">
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-teal-400/10 blur-[120px]" />

      <Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-300" />
          </div>
        }
      >
        <AuthFormContent />
      </Suspense>
    </div>
  );
}