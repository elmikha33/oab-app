'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

const GameStateContext = createContext<any>(null);

const MANUAL_PREMIUM_EMAILS = ['mi.psy.trance@gmail.com'];

function emailPremiumManual(email?: string | null) {
  return MANUAL_PREMIUM_EMAILS.includes(String(email || '').toLowerCase());
}

const DEVICE_ID_KEY = 'oaplay-active-device-id';

function gerarDeviceId() {
  if (typeof window === 'undefined') return '';

  const existente = localStorage.getItem(DEVICE_ID_KEY);
  if (existente) return existente;

  const novo =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(DEVICE_ID_KEY, novo);
  return novo;
}

function getDeviceName() {
  if (typeof window === 'undefined') return 'Dispositivo';

  const ua = navigator.userAgent || '';

  if (/mobile|android|iphone|ipad/i.test(ua)) {
    return 'Celular ou tablet';
  }

  if (/windows/i.test(ua)) return 'Computador Windows';
  if (/mac/i.test(ua)) return 'Computador Mac';
  if (/linux/i.test(ua)) return 'Computador Linux';

  return 'Navegador';
}

async function registrarDispositivoAtivo(accessToken: string) {
  const deviceId = gerarDeviceId();

  if (!deviceId) return null;

  const res = await fetch('/api/auth/device', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      deviceId,
      deviceName: getDeviceName(),
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao registrar dispositivo.');
  }

  return deviceId;
}

async function checarDispositivoAtivo(accessToken: string) {
  const deviceId = gerarDeviceId();

  if (!deviceId) return { active: true };

  const params = new URLSearchParams({ deviceId });

  const res = await fetch(`/api/auth/device?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao verificar dispositivo.');
  }

  return res.json();
}

const conquistas = [
  {
    id: 'badge_first',
    titulo: 'Primeira questão',
    descricao: 'Respondeu a primeira questão no OAPlay.',
    icone: 'award',
  },
  {
    id: 'badge_10_correct',
    titulo: 'Sequência inicial',
    descricao: 'Acertou 10 questões no total.',
    icone: 'award',
  },
];

function normalizarIdsQuestao(questaoId: number | string | Array<number | string>) {
  return (Array.isArray(questaoId) ? questaoId : [questaoId])
    .map((id) => String(id))
    .filter(Boolean);
}

function lerRespostasQuestoesLocal() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem('user-game-data');
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed?.respostasQuestoes && typeof parsed.respostasQuestoes === 'object'
      ? parsed.respostasQuestoes
      : {};
  } catch {
    return {};
  }
}

function premiumEstaAtivo(profile: any) {
  if (!profile?.premium_ate) return false;
  return new Date(profile.premium_ate).getTime() > Date.now();
}

function nomeDoAuthUser(authUser?: SupabaseUser | null) {
  if (!authUser) return 'Candidato';

  const metadata = authUser.user_metadata || {};

  const nome =
    metadata.full_name ||
    metadata.name ||
    metadata.nome ||
    metadata.preferred_username ||
    authUser.email?.split('@')[0] ||
    'Candidato';

  return String(nome).trim() || 'Candidato';
}

function nomeValido(nome?: string | null) {
  if (!nome) return false;

  const normalizado = String(nome).trim().toLowerCase();

  return Boolean(
    normalizado &&
      normalizado !== 'candidato' &&
      normalizado !== 'estudante' &&
      normalizado !== 'usuario' &&
      normalizado !== 'usu?rio'
  );
}

function criarUsuario(base: any = {}) {
  const today = new Date().toISOString().split('T')[0];
  const nome = base.nome || 'Candidato';

  const questoesRespondidas = [
    ...new Set([...(base.questoesRespondidas || []), ...(base.questoesErradas || [])].map(String)),
  ];

  const email = base.email || null;
  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

  return {
    id: base.id || null,
    email,
    nome,
    avatar_url: base.avatar_url || null,

    streak: base.streak || 1,
    lastAccess: today,
    acertos: base.acertos || 0,
    moedas: base.moedas || 0,
    xp: base.xp || 0,
    nivel: base.nivel || 1,
    xpNecessario: base.xpNecessario || 100,

    questoesRespondidas,
    questoesErradas: Array.isArray(base.questoesErradas) ? base.questoesErradas.map(String) : [],
    revisaoIds: Array.isArray(base.revisaoIds) ? base.revisaoIds.map(String) : [],
    respostasQuestoes:
      base.respostasQuestoes && typeof base.respostasQuestoes === 'object'
        ? base.respostasQuestoes
        : {},

    freeDailyAnswers:
      base.freeDailyAnswers?.date === today
        ? base.freeDailyAnswers
        : { date: today, count: 0 },

    conquistasDesbloqueadas: base.conquistasDesbloqueadas || [],

    isPremium: Boolean(base.isPremium),
    premium_ate: base.premium_ate || null,
    plano: base.plano || (base.isPremium ? 'premium_trimestral' : 'free'),
    subscription_status: base.subscription_status || null,
    mercado_pago_subscription_id: base.mercado_pago_subscription_id || null,

    isAdmin:
      Boolean(base.isAdmin) ||
      nome.toLowerCase() === 'admin' ||
      Boolean(adminEmail && email && email.toLowerCase() === adminEmail.toLowerCase()),

    lifetimeQuestions: base.lifetimeQuestions || base.rankingQuestions || questoesRespondidas.length || 0,
    lifetimeCorrect: base.lifetimeCorrect || base.acertos || 0,
    lifetimeReview: base.lifetimeReview || Math.max(
      Array.isArray(base.revisaoIds) ? base.revisaoIds.length : 0,
      Array.isArray(base.questoesErradas) ? base.questoesErradas.length : 0
    ),
    lifetimeReviewed: base.lifetimeReviewed || 0,
    reviewedQuestionIds: Array.isArray(base.reviewedQuestionIds)
      ? base.reviewedQuestionIds.map(String)
      : [],
    lifetimeActiveDays: base.lifetimeActiveDays || base.rankingActiveDays || base.streak || 1,

    rankingScore: base.rankingScore || 0,
    rankingQuestions: base.rankingQuestions || 0,
    rankingActiveDays: base.rankingActiveDays || 0,
    rankingLastActiveDay: base.rankingLastActiveDay || null,
    rankingAnsweredIds: Array.isArray(base.rankingAnsweredIds)
      ? base.rankingAnsweredIds.map(String)
      : [],
    rankingMilestones: Array.isArray(base.rankingMilestones) ? base.rankingMilestones : [],
  };
}

function aplicarRanking(prev: any, questaoId: number | string | Array<number | string>) {
  const today = new Date().toISOString().split('T')[0];
  const ids = normalizarIdsQuestao(questaoId);

  const rankingAnsweredIds = (prev.rankingAnsweredIds || []).map(String);
  const novosIds = ids.filter((id) => !rankingAnsweredIds.includes(id));

  let bonusDia = 0;
  let rankingActiveDays = prev.rankingActiveDays || 0;
  let rankingLastActiveDay = prev.rankingLastActiveDay || null;

  if (rankingLastActiveDay !== today) {
    bonusDia = 3;
    rankingActiveDays += 1;
    rankingLastActiveDay = today;
  }

  const rankingMilestones = Array.isArray(prev.rankingMilestones) ? prev.rankingMilestones : [];
  let bonusSemana = 0;

  if (rankingActiveDays > 0 && rankingActiveDays % 7 === 0) {
    const milestone = `active-days-${rankingActiveDays}`;
    if (!rankingMilestones.includes(milestone)) {
      bonusSemana = 10;
      rankingMilestones.push(milestone);
    }
  }

  const pontosQuestoes = novosIds.length;

  return {
    ...prev,
    rankingScore: (prev.rankingScore || 0) + pontosQuestoes + bonusDia + bonusSemana,
    rankingQuestions: (prev.rankingQuestions || 0) + novosIds.length,
    rankingActiveDays,
    rankingLastActiveDay,
    rankingAnsweredIds: [...new Set([...rankingAnsweredIds, ...novosIds])],
    rankingMilestones: [...new Set(rankingMilestones)],
  };
}

async function buscarProfile(accessToken: string) {
  const res = await fetch('/api/auth/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Erro ao carregar perfil.');
  }

  return res.json();
}

export const GameStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const carregarUsuario = useCallback(async (sessaoAtual?: Session | null) => {
    setLoading(true);

    try {
      const sessao =
        sessaoAtual ??
        (await supabase.auth.getSession()).data.session;

      setSession(sessao);

      if (!sessao?.user || !sessao.access_token) {
        setUser(null);
        return;
      }

      const authUser = sessao.user;

      let profile: any = null;

      try {
        profile = await buscarProfile(sessao.access_token);
      } catch (profileError) {
        console.warn('Nao foi possivel carregar profile. Usando dados do Supabase Auth.', profileError);
      }

      let activeDeviceId: string | null = null;

      try {
        activeDeviceId = await registrarDispositivoAtivo(sessao.access_token);
      } catch (deviceError) {
        console.warn('Nao foi possivel registrar dispositivo ativo.', deviceError);
      }

      let savedLocal: any = {};
      try {
        const raw = localStorage.getItem('user-game-data');
        savedLocal = raw ? JSON.parse(raw) : {};
      } catch {
        savedLocal = {};
      }

      const mergedUser = criarUsuario({
        ...savedLocal,
        id: authUser.id,
        email: authUser.email,
        nome: nomeValido(profile?.nome)
          ? profile.nome
          : nomeValido(nomeDoAuthUser(authUser))
            ? nomeDoAuthUser(authUser)
            : nomeValido(savedLocal.nome)
              ? savedLocal.nome
              : 'Candidato',
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || null,
        isPremium: emailPremiumManual(authUser.email) || premiumEstaAtivo(profile),
        premium_ate: emailPremiumManual(authUser.email)
          ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          : profile?.premium_ate || null,
        plano: emailPremiumManual(authUser.email)
          ? 'premium_manual'
          : profile?.plano || 'free',
        subscription_status: emailPremiumManual(authUser.email)
          ? 'manual_active'
          : profile?.subscription_status || null,
        mercado_pago_subscription_id: profile?.mercado_pago_subscription_id || null,
        active_device_id: activeDeviceId,
      });

      setUser(mergedUser);
      localStorage.setItem('user-game-data', JSON.stringify(mergedUser));
    } catch (error) {
      console.error(error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      void carregarUsuario(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, novaSessao) => {
      if (!ativo) return;

      if (!novaSessao) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      void carregarUsuario(novaSessao);
    });

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, [carregarUsuario]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem('user-game-data', JSON.stringify(user));
  }, [user]);

  const refreshUser = useCallback(async () => {
    await carregarUsuario();
  }, [carregarUsuario]);
  useEffect(() => {
    const accessToken = session?.access_token || '';

    if (!user || !accessToken) return;

    let cancelado = false;
    let verificando = false;

    async function verificarDispositivo() {
      if (cancelado || verificando) return;

      verificando = true;

      try {
        const result = await checarDispositivoAtivo(accessToken);

        if (!cancelado && result?.active === false) {
          alert('Sua conta foi aberta em outro dispositivo. Por seguranca, este acesso sera encerrado.');

          localStorage.removeItem('user-game-data');
          setUser(null);
          setSession(null);

          await supabase.auth.signOut();
          window.location.href = '/auth';
        }
      } catch (error) {
        console.warn('Nao foi possivel verificar dispositivo ativo.', error);
      } finally {
        verificando = false;
      }
    }

    const interval = window.setInterval(verificarDispositivo, 60000);

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void verificarDispositivo();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      cancelado = true;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user, session?.access_token]);


  const loginMock = useCallback((nome: string) => {
    setUser(criarUsuario({ nome }));
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem('user-game-data');
    setUser(null);
    setSession(null);
    await supabase.auth.signOut();
  }, []);

  const comprarPremium = useCallback(() => {
    setUser((prev: any) => {
      if (!prev) return prev;

      const premiumAte = new Date();
      premiumAte.setMonth(premiumAte.getMonth() + 3);

      return {
        ...prev,
        isPremium: true,
        premium_ate: premiumAte.toISOString(),
        plano: 'premium_trimestral',
      };
    });
  }, []);

  const registrarRespostaFreeHoje = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];

    setUser((prev: any) => {
      if (!prev || prev.isPremium) return prev;
      const atual = prev.freeDailyAnswers?.date === today ? prev.freeDailyAnswers.count || 0 : 0;
      return { ...prev, freeDailyAnswers: { date: today, count: atual + 1 } };
    });
  }, []);

  const registrarAcerto = useCallback((questaoId: number | string | Array<number | string>) => {
    setUser((prev: any) => {
      if (!prev) return prev;

      const ids = normalizarIdsQuestao(questaoId);
      const respondidasAtuais = (prev.questoesRespondidas || []).map(String);
      const jaRespondida = ids.some((id) => respondidasAtuais.includes(id));
      const acertos = jaRespondida ? prev.acertos || 0 : (prev.acertos || 0) + 1;

      const conquistasDesbloqueadas = [
        ...new Set([
          ...(prev.conquistasDesbloqueadas || []),
          'badge_first',
          ...(acertos >= 10 ? ['badge_10_correct'] : []),
        ]),
      ];

      const comRanking = aplicarRanking(prev, questaoId);
      const respostasQuestoes = {
        ...(prev.respostasQuestoes && typeof prev.respostasQuestoes === 'object'
          ? prev.respostasQuestoes
          : {}),
        ...lerRespostasQuestoesLocal(),
      };

      return {
        ...comRanking,
        acertos,
        respostasQuestoes,
        lifetimeQuestions: jaRespondida
          ? prev.lifetimeQuestions || 0
          : (prev.lifetimeQuestions || 0) + ids.length,
        lifetimeCorrect: jaRespondida
          ? prev.lifetimeCorrect || 0
          : (prev.lifetimeCorrect || 0) + 1,
        lifetimeActiveDays: Math.max(
          prev.lifetimeActiveDays || 1,
          comRanking.rankingActiveDays || 1,
          prev.streak || 1
        ),
        questoesRespondidas: [...new Set([...respondidasAtuais, ...ids])],
        questoesErradas: (prev.questoesErradas || []).filter((id: number | string) =>
          !ids.includes(String(id))
        ),
        conquistasDesbloqueadas: jaRespondida
          ? prev.conquistasDesbloqueadas || []
          : conquistasDesbloqueadas,
      };
    });
  }, []);

  const registrarErro = useCallback((questaoId: number | string | Array<number | string>) => {
    setUser((prev: any) => {
      if (!prev) return prev;

      const ids = normalizarIdsQuestao(questaoId);
      const comRanking = aplicarRanking(prev, questaoId);
      const respostasQuestoes = {
        ...(prev.respostasQuestoes && typeof prev.respostasQuestoes === 'object'
          ? prev.respostasQuestoes
          : {}),
        ...lerRespostasQuestoesLocal(),
      };

      const respondidasAtuais = (prev.questoesRespondidas || []).map(String);
      const novosIds = ids.filter((id) => !respondidasAtuais.includes(id));
      const novasErradas = [...new Set([...(prev.questoesErradas || []).map(String), ...ids])];

      return {
        ...comRanking,
        respostasQuestoes,
        lifetimeQuestions: (prev.lifetimeQuestions || 0) + novosIds.length,
        lifetimeReview: Math.max(prev.lifetimeReview || 0, novasErradas.length),
        lifetimeActiveDays: Math.max(
          prev.lifetimeActiveDays || 1,
          comRanking.rankingActiveDays || 1,
          prev.streak || 1
        ),
        questoesRespondidas: [...new Set([...respondidasAtuais, ...ids])],
        questoesErradas: novasErradas,
      };
    });
  }, []);

  const registrarQuestaoRevisada = useCallback((questaoId: number | string) => {
    setUser((prev: any) => {
      if (!prev) return prev;

      const id = String(questaoId);
      const reviewedQuestionIds = Array.isArray(prev.reviewedQuestionIds)
        ? prev.reviewedQuestionIds.map(String)
        : [];

      if (reviewedQuestionIds.includes(id)) {
        return prev;
      }

      return {
        ...prev,
        reviewedQuestionIds: [...reviewedQuestionIds, id],
        lifetimeReviewed: (prev.lifetimeReviewed || 0) + 1,
      };
    });
  }, []);

  const resetarAcertos = useCallback(() => {
    setUser((prev: any) => {
      if (!prev) return prev;

      return {
        ...prev,
        acertos: 0,
        xp: 0,
        moedas: 0,
        questoesRespondidas: [],
        questoesErradas: [],
        revisaoIds: [],
        respostasQuestoes: {},
        conquistasDesbloqueadas: prev.conquistasDesbloqueadas || [],
      };
    });
  }, []);

  return (
    <GameStateContext.Provider
      value={{
        user,
        setUser,
        session,
        loading,
        refreshUser,
        loginMock,
        logout,
        comprarPremium,
        registrarRespostaFreeHoje,
        registrarAcerto,
        registrarErro,
        resetarAcertos,
        conquistas,
        stats: {},
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => useContext(GameStateContext);
