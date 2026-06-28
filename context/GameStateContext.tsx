'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { MonitorCheck, ShieldAlert } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getUnlockedAchievementIds, normalizeAchievementIds } from '@/lib/achievements';

const GameStateContext = createContext<any>(null);

const OWNER_ADMIN_EMAIL = 'mi.psy.trance@gmail.com';
const MANUAL_PREMIUM_EMAILS = [OWNER_ADMIN_EMAIL];

function normalizarEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase();
}

function emailAdmin(email?: string | null) {
  const normalizedEmail = normalizarEmail(email);
  return Boolean(normalizedEmail && normalizedEmail === OWNER_ADMIN_EMAIL);
}

function emailPremiumManual(email?: string | null) {
  return MANUAL_PREMIUM_EMAILS.includes(normalizarEmail(email));
}

const DEVICE_ID_KEY = 'oaplay-active-device-id';
const GAME_DATA_KEY = 'user-game-data';
const PERMANENT_PROGRESS_KEY = 'oaplay-permanent-progress';
const DAY_MS = 24 * 60 * 60 * 1000;
const DAILY_RANKING_BONUS = 3;
const WEEKLY_RANKING_BONUS = 10;

const PERMANENT_NUMBER_FIELDS = [
  'lifetimeQuestions',
  'lifetimeCorrect',
  'lifetimeReview',
  'lifetimeReviewed',
  'lifetimeActiveDays',
  'rankingScore',
  'rankingQuestions',
  'rankingActiveDays',
];

const PERMANENT_ARRAY_FIELDS = [
  'conquistasDesbloqueadas',
  'reviewedQuestionIds',
  'rankingAnsweredIds',
  'rankingMilestones',
];

function numeroSeguro(value: unknown) {
  const numero = Number(value);
  return Number.isFinite(numero) && numero > 0 ? numero : 0;
}

function maxNumero(...values: unknown[]) {
  return Math.max(0, ...values.map(numeroSeguro));
}

function arrayUnico(...values: unknown[]) {
  return [
    ...new Set(
      values
        .flatMap((value) => (Array.isArray(value) ? value : []))
        .map((item) => String(item))
        .filter(Boolean)
    ),
  ];
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function normalizarDiaLocal(value: unknown) {
  const texto = String(value || '').trim();
  if (!texto) return null;

  const isoDate = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) return `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}`;

  const date = new Date(texto);
  if (Number.isNaN(date.getTime())) return null;

  return getLocalDateKey(date);
}

function diaLocalParaTime(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).getTime();
}

function diferencaDiasLocais(from: string, to: string) {
  return Math.round((diaLocalParaTime(to) - diaLocalParaTime(from)) / DAY_MS);
}

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

function lerJsonLocal(key: string) {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function lerUsuarioLocal() {
  const parsed = lerJsonLocal(GAME_DATA_KEY);
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

function getPermanentProgressKey(identifier?: unknown) {
  const id = String(identifier || '').trim().toLowerCase();
  return id ? `${PERMANENT_PROGRESS_KEY}:${id}` : PERMANENT_PROGRESS_KEY;
}

function extrairProgressoPermanente(user: any) {
  const conquistasDesbloqueadas = getUnlockedAchievementIds(user);
  const questoesRespondidas = Array.isArray(user?.questoesRespondidas)
    ? user.questoesRespondidas
    : [];
  const questoesErradas = Array.isArray(user?.questoesErradas) ? user.questoesErradas : [];
  const revisaoIds = Array.isArray(user?.revisaoIds) ? user.revisaoIds : [];

  return {
    conquistasDesbloqueadas,
    lifetimeQuestions: maxNumero(
      user?.lifetimeQuestions,
      user?.rankingQuestions,
      questoesRespondidas.length
    ),
    lifetimeCorrect: maxNumero(user?.lifetimeCorrect, user?.acertos),
    lifetimeReview: maxNumero(
      user?.lifetimeReview,
      questoesErradas.length,
      revisaoIds.length
    ),
    lifetimeReviewed: maxNumero(user?.lifetimeReviewed),
    lifetimeActiveDays: maxNumero(
      user?.lifetimeActiveDays,
      user?.rankingActiveDays,
      user?.streak
    ),
    reviewedQuestionIds: arrayUnico(user?.reviewedQuestionIds),
    rankingScore: maxNumero(user?.rankingScore),
    rankingQuestions: maxNumero(user?.rankingQuestions),
    rankingActiveDays: maxNumero(user?.rankingActiveDays),
    lastAccess: normalizarDiaLocal(user?.lastAccess),
    rankingLastActiveDay: normalizarDiaLocal(user?.rankingLastActiveDay),
    rankingAnsweredIds: arrayUnico(user?.rankingAnsweredIds),
    rankingMilestones: arrayUnico(user?.rankingMilestones),
    savedAt: new Date().toISOString(),
  };
}

function lerProgressoPermanenteLocal(identifier?: unknown) {
  const parsed = lerJsonLocal(getPermanentProgressKey(identifier));
  return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
}

function salvarProgressoPermanenteLocal(user: any) {
  if (typeof window === 'undefined' || !user) return;

  const key = getPermanentProgressKey(user.id || user.email);
  const atual = lerProgressoPermanenteLocal(user.id || user.email);
  const permanente = mesclarProgressoPermanente(atual, extrairProgressoPermanente(user));

  localStorage.setItem(key, JSON.stringify(permanente));
}

function mesclarProgressoPermanente(...sources: any[]) {
  const validSources = sources.filter((source) =>
    source && typeof source === 'object' && !Array.isArray(source)
  );
  const merged = Object.assign({}, ...validSources);

  for (const field of PERMANENT_NUMBER_FIELDS) {
    merged[field] = maxNumero(
      ...validSources.flatMap((source) => [
        source[field],
        field === 'lifetimeQuestions' ? source.rankingQuestions : undefined,
        field === 'lifetimeCorrect' ? source.acertos : undefined,
        field === 'lifetimeReview'
          ? Math.max(
              Array.isArray(source.questoesErradas) ? source.questoesErradas.length : 0,
              Array.isArray(source.revisaoIds) ? source.revisaoIds.length : 0
            )
          : undefined,
        field === 'lifetimeActiveDays'
          ? Math.max(numeroSeguro(source.rankingActiveDays), numeroSeguro(source.streak))
          : undefined,
      ])
    );
  }

  for (const field of PERMANENT_ARRAY_FIELDS) {
    merged[field] =
      field === 'conquistasDesbloqueadas'
        ? normalizeAchievementIds(arrayUnico(...validSources.map((source) => source[field])))
        : arrayUnico(...validSources.map((source) => source[field]));
  }

  const lastAccessCandidates = validSources
    .map((source) => normalizarDiaLocal(source.lastAccess))
    .filter(Boolean) as string[];
  const rankingLastActiveCandidates = validSources
    .map((source) => normalizarDiaLocal(source.rankingLastActiveDay))
    .filter(Boolean) as string[];

  if (lastAccessCandidates.length) {
    merged.lastAccess = lastAccessCandidates.sort().at(-1);
  }

  if (rankingLastActiveCandidates.length) {
    merged.rankingLastActiveDay = rankingLastActiveCandidates.sort().at(-1);
  }

  return merged;
}

function lerRespostasQuestoesLocal() {
  if (typeof window === 'undefined') return {};

  try {
    const parsed = lerUsuarioLocal();
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
  if (emailAdmin(authUser.email)) return 'Admin';

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

function aplicarAtividadeDiaria(prev: any, options: { pontuarRanking?: boolean } = {}) {
  const today = getLocalDateKey();
  const lastAccessDay = normalizarDiaLocal(prev?.lastAccess);
  const rankingLastActiveDay = normalizarDiaLocal(prev?.rankingLastActiveDay);
  const currentStreak = maxNumero(prev?.streak);
  const currentLifetimeActiveDays = maxNumero(
    prev?.lifetimeActiveDays,
    prev?.rankingActiveDays,
    prev?.streak
  );

  const mudouDia = lastAccessDay !== today;
  const diff = lastAccessDay ? diferencaDiasLocais(lastAccessDay, today) : null;
  const streak = mudouDia
    ? diff === 1
      ? currentStreak + 1
      : 1
    : Math.max(currentStreak, 1);
  const lifetimeActiveDays = mudouDia
    ? Math.max(currentLifetimeActiveDays + 1, streak)
    : Math.max(currentLifetimeActiveDays, streak);

  const rankingMilestones = arrayUnico(prev?.rankingMilestones);
  let rankingScore = maxNumero(prev?.rankingScore);
  let rankingActiveDays = maxNumero(
    prev?.rankingActiveDays,
    prev?.lifetimeActiveDays,
    prev?.streak
  );
  let nextRankingLastActiveDay = rankingLastActiveDay;

  if (rankingLastActiveDay !== today) {
    rankingActiveDays += 1;
    nextRankingLastActiveDay = today;

    if (options.pontuarRanking !== false) {
      rankingScore += DAILY_RANKING_BONUS;
    }

    if (rankingActiveDays > 0 && rankingActiveDays % 7 === 0) {
      const milestone = `active-days-${rankingActiveDays}`;

      if (!rankingMilestones.includes(milestone)) {
        rankingScore += WEEKLY_RANKING_BONUS;
        rankingMilestones.push(milestone);
      }
    }
  }

  return {
    ...prev,
    streak,
    lastAccess: today,
    lifetimeActiveDays,
    rankingScore,
    rankingActiveDays,
    rankingLastActiveDay: nextRankingLastActiveDay || today,
    rankingMilestones: [...new Set(rankingMilestones)],
  };
}

function criarUsuario(base: any = {}) {
  const today = getLocalDateKey();

  const questoesRespondidas = [
    ...new Set([...(base.questoesRespondidas || []), ...(base.questoesErradas || [])].map(String)),
  ];

  const email = base.email || null;
  const contaAdmin = emailAdmin(email);
  const nome = contaAdmin ? 'Admin' : base.nome || 'Candidato';

  const user = {
    id: base.id || null,
    email,
    nome,
    avatar_url: base.avatar_url || null,

    streak: maxNumero(base.streak),
    lastAccess: normalizarDiaLocal(base.lastAccess) || null,
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

    conquistasDesbloqueadas: normalizeAchievementIds(base.conquistasDesbloqueadas),

    isPremium: Boolean(base.isPremium),
    premium_ate: base.premium_ate || null,
    plano: base.plano || (base.isPremium ? 'premium_trimestral' : 'free'),
    subscription_status: base.subscription_status || null,
    mercado_pago_subscription_id: base.mercado_pago_subscription_id || null,

    isAdmin: contaAdmin,

    lifetimeQuestions: maxNumero(base.lifetimeQuestions, base.rankingQuestions, questoesRespondidas.length),
    lifetimeCorrect: maxNumero(base.lifetimeCorrect, base.acertos),
    lifetimeReview: maxNumero(base.lifetimeReview, Math.max(
      Array.isArray(base.revisaoIds) ? base.revisaoIds.length : 0,
      Array.isArray(base.questoesErradas) ? base.questoesErradas.length : 0
    )),
    lifetimeReviewed: maxNumero(base.lifetimeReviewed),
    reviewedQuestionIds: Array.isArray(base.reviewedQuestionIds)
      ? base.reviewedQuestionIds.map(String)
      : [],
    lifetimeActiveDays: maxNumero(base.lifetimeActiveDays, base.rankingActiveDays, base.streak),

    rankingScore: maxNumero(base.rankingScore),
    rankingQuestions: maxNumero(base.rankingQuestions),
    rankingActiveDays: maxNumero(base.rankingActiveDays),
    rankingLastActiveDay: normalizarDiaLocal(base.rankingLastActiveDay),
    rankingAnsweredIds: Array.isArray(base.rankingAnsweredIds)
      ? base.rankingAnsweredIds.map(String)
      : [],
    rankingMilestones: Array.isArray(base.rankingMilestones) ? base.rankingMilestones : [],
  };

  const userComDiaAtualizado = aplicarAtividadeDiaria(user, { pontuarRanking: true });

  return {
    ...userComDiaAtualizado,
    conquistasDesbloqueadas: getUnlockedAchievementIds(userComDiaAtualizado),
  };
}

function aplicarRanking(prev: any, questaoId: number | string | Array<number | string>) {
  const comAtividadeDiaria = aplicarAtividadeDiaria(prev, { pontuarRanking: true });
  const ids = normalizarIdsQuestao(questaoId);

  const rankingAnsweredIds = (comAtividadeDiaria.rankingAnsweredIds || []).map(String);
  const novosIds = ids.filter((id) => !rankingAnsweredIds.includes(id));
  const pontosQuestoes = novosIds.length;

  return {
    ...comAtividadeDiaria,
    rankingScore: (comAtividadeDiaria.rankingScore || 0) + pontosQuestoes,
    rankingQuestions: (comAtividadeDiaria.rankingQuestions || 0) + novosIds.length,
    rankingAnsweredIds: [...new Set([...rankingAnsweredIds, ...novosIds])],
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

function comConquistasPermanentes(user: any) {
  const permanente = mesclarProgressoPermanente(user, extrairProgressoPermanente(user));

  return {
    ...user,
    ...Object.fromEntries(
      [...PERMANENT_NUMBER_FIELDS, ...PERMANENT_ARRAY_FIELDS].map((field) => [
        field,
        permanente[field],
      ])
    ),
    conquistasDesbloqueadas: getUnlockedAchievementIds({
      ...user,
      ...permanente,
    }),
  };
}

type AtualizarPerfilPayload = {
  nome?: string;
  avatar_url?: string | null;
};

const PROGRESS_KEYS = [
  'streak',
  'lastAccess',
  'acertos',
  'moedas',
  'xp',
  'nivel',
  'xpNecessario',
  'questoesRespondidas',
  'questoesErradas',
  'revisaoIds',
  'respostasQuestoes',
  'freeDailyAnswers',
  'conquistasDesbloqueadas',
  'lifetimeQuestions',
  'lifetimeCorrect',
  'lifetimeReview',
  'lifetimeReviewed',
  'reviewedQuestionIds',
  'lifetimeActiveDays',
  'rankingScore',
  'rankingQuestions',
  'rankingActiveDays',
  'rankingLastActiveDay',
  'rankingAnsweredIds',
  'rankingMilestones',
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function extrairProgressoUsuario(user: any) {
  const permanente = mesclarProgressoPermanente(user, extrairProgressoPermanente(user));
  const userSeguro = {
    ...user,
    ...permanente,
    conquistasDesbloqueadas: getUnlockedAchievementIds({
      ...user,
      ...permanente,
    }),
  };
  const progress: Record<string, unknown> = {};

  for (const key of PROGRESS_KEYS) {
    if (userSeguro?.[key] !== undefined) {
      progress[key] = userSeguro[key];
    }
  }

  return progress;
}

async function salvarProgressoRemoto(accessToken: string, user: any) {
  if (!accessToken || !user) return;

  const res = await fetch('/api/auth/profile', {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      oaplay_progress: extrairProgressoUsuario(user),
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Nao foi possivel salvar o progresso.');
  }
}

export const GameStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceLogoutNotice, setDeviceLogoutNotice] = useState<{
    deviceName?: string | null;
  } | null>(null);
  const previousAchievementIdsRef = useRef<string[] | null>(null);
  const lastRemoteProgressRef = useRef<string>('');
  const deviceLogoutHandledRef = useRef(false);
  const deviceRedirectTimerRef = useRef<number | null>(null);

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

      const savedLocal = lerUsuarioLocal();
      const permanentLocalProgress = lerProgressoPermanenteLocal(authUser.id || authUser.email);

      const metadataProgress = isPlainObject(authUser.user_metadata?.oaplay_progress)
        ? authUser.user_metadata.oaplay_progress
        : {};

      const profileProgress = isPlainObject(profile?.oaplay_progress)
        ? profile.oaplay_progress
        : {};
      const mergedProgress = {
        ...profileProgress,
        ...metadataProgress,
        ...savedLocal,
        ...mesclarProgressoPermanente(
          profileProgress,
          metadataProgress,
          savedLocal,
          permanentLocalProgress
        ),
      };

      const mergedUser = criarUsuario({
        ...mergedProgress,
        id: authUser.id,
        email: authUser.email,
        nome: nomeValido(profile?.nome)
          ? profile.nome
          : nomeValido(nomeDoAuthUser(authUser))
            ? nomeDoAuthUser(authUser)
            : nomeValido(savedLocal.nome)
              ? savedLocal.nome
              : 'Candidato',
        avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url || savedLocal.avatar_url || null,
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
        isAdmin: emailAdmin(authUser.email),
      });

      setUser(mergedUser);
      localStorage.setItem(GAME_DATA_KEY, JSON.stringify(mergedUser));
      salvarProgressoPermanenteLocal(mergedUser);
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
    localStorage.setItem(GAME_DATA_KEY, JSON.stringify(user));
    salvarProgressoPermanenteLocal(user);
  }, [user]);

  useEffect(() => {
    if (!user || !session?.access_token) return;

    const progress = extrairProgressoUsuario(user);
    const serialized = JSON.stringify(progress);

    if (serialized === lastRemoteProgressRef.current) return;

    const timeout = window.setTimeout(() => {
      void salvarProgressoRemoto(session.access_token, user)
        .then(() => {
          lastRemoteProgressRef.current = serialized;
        })
        .catch((error) => {
          console.warn('Nao foi possivel salvar progresso remoto.', error);
        });
    }, 1200);

    return () => window.clearTimeout(timeout);
  }, [user, session?.access_token]);

  useEffect(() => {
    if (!user) {
      previousAchievementIdsRef.current = null;
      return;
    }

    const currentIds = normalizeAchievementIds(user.conquistasDesbloqueadas);
    const previousIds = previousAchievementIdsRef.current;

    if (previousIds) {
      const unlockedNow = currentIds.filter((id) => !previousIds.includes(id));

      if (unlockedNow.length && typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('oaplay-achievement-unlocked', {
            detail: {
              ids: unlockedNow,
              id: unlockedNow[0],
            },
          })
        );
      }
    }

    previousAchievementIdsRef.current = currentIds;
  }, [user]);

  const refreshUser = useCallback(async () => {
    await carregarUsuario();
  }, [carregarUsuario]);

  const atualizarPerfil = useCallback(async ({ nome, avatar_url }: AtualizarPerfilPayload) => {
    if (!session?.access_token) {
      throw new Error('Sessao expirada. Entre novamente para atualizar o perfil.');
    }

    const res = await fetch('/api/auth/profile', {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ nome, avatar_url }),
    });

    const profile = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(profile?.error || 'Nao foi possivel atualizar o perfil.');
    }

    setUser((prev: any) => {
      if (!prev) return prev;

      return criarUsuario({
        ...prev,
        nome: profile?.nome || prev.nome,
        avatar_url: profile?.avatar_url ?? prev.avatar_url ?? null,
      });
    });

    return profile;
  }, [session?.access_token]);

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
          if (deviceLogoutHandledRef.current) return;

          deviceLogoutHandledRef.current = true;
          setDeviceLogoutNotice({
            deviceName: result?.active_device_name || 'outro dispositivo',
          });

          localStorage.removeItem(GAME_DATA_KEY);
          setUser(null);
          setSession(null);

          await supabase.auth.signOut();

          if (deviceRedirectTimerRef.current) {
            window.clearTimeout(deviceRedirectTimerRef.current);
          }

          deviceRedirectTimerRef.current = window.setTimeout(() => {
            window.location.href = '/auth';
          }, 4500);
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

  useEffect(() => {
    return () => {
      if (deviceRedirectTimerRef.current) {
        window.clearTimeout(deviceRedirectTimerRef.current);
      }
    };
  }, []);


  const logout = useCallback(async () => {
    if (session?.access_token && user) {
      await salvarProgressoRemoto(session.access_token, user);
    }

    localStorage.removeItem(GAME_DATA_KEY);
    setUser(null);
    setSession(null);

    try {
      await supabase.auth.signOut();
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth';
      }
    }
  }, [session?.access_token, user]);

  const registrarRespostaFreeHoje = useCallback(() => {
    const today = getLocalDateKey();

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

      const comRanking = aplicarRanking(prev, questaoId);
      const respostasQuestoes = {
        ...(prev.respostasQuestoes && typeof prev.respostasQuestoes === 'object'
          ? prev.respostasQuestoes
          : {}),
        ...lerRespostasQuestoesLocal(),
      };

      const next = {
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
          comRanking.lifetimeActiveDays || 1,
          comRanking.rankingActiveDays || 1,
          comRanking.streak || 1
        ),
        questoesRespondidas: [...new Set([...respondidasAtuais, ...ids])],
        questoesErradas: (prev.questoesErradas || []).filter((id: number | string) =>
          !ids.includes(String(id))
        ),
      };

      return comConquistasPermanentes(next);
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

      const next = {
        ...comRanking,
        respostasQuestoes,
        lifetimeQuestions: (prev.lifetimeQuestions || 0) + novosIds.length,
        lifetimeReview: Math.max(prev.lifetimeReview || 0, novasErradas.length),
        lifetimeActiveDays: Math.max(
          prev.lifetimeActiveDays || 1,
          comRanking.lifetimeActiveDays || 1,
          comRanking.rankingActiveDays || 1,
          comRanking.streak || 1
        ),
        questoesRespondidas: [...new Set([...respondidasAtuais, ...ids])],
        questoesErradas: novasErradas,
      };

      return comConquistasPermanentes(next);
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

      const next = {
        ...prev,
        reviewedQuestionIds: [...reviewedQuestionIds, id],
        lifetimeReviewed: (prev.lifetimeReviewed || 0) + 1,
      };

      return comConquistasPermanentes(next);
    });
  }, []);

  const resetarAcertos = useCallback(() => {
    setUser((prev: any) => {
      if (!prev) return prev;

      const questoesRespondidas = Array.isArray(prev.questoesRespondidas)
        ? prev.questoesRespondidas.map(String)
        : [];
      const questoesErradas = Array.isArray(prev.questoesErradas)
        ? prev.questoesErradas.map(String)
        : [];
      const revisaoIds = Array.isArray(prev.revisaoIds)
        ? prev.revisaoIds.map(String)
        : [];
      const conquistasAntesDoReset = getUnlockedAchievementIds({
        ...prev,
        lifetimeQuestions: Math.max(prev.lifetimeQuestions || 0, questoesRespondidas.length),
        lifetimeCorrect: Math.max(prev.lifetimeCorrect || 0, prev.acertos || 0),
        lifetimeReview: Math.max(prev.lifetimeReview || 0, revisaoIds.length, questoesErradas.length),
        lifetimeActiveDays: Math.max(
          prev.lifetimeActiveDays || 1,
          prev.rankingActiveDays || 1,
          prev.streak || 1
        ),
      });

      return comConquistasPermanentes({
        ...prev,
        acertos: 0,
        xp: 0,
        moedas: 0,
        questoesRespondidas: [],
        questoesErradas: [],
        revisaoIds: [],
        respostasQuestoes: {},
        lifetimeQuestions: Math.max(prev.lifetimeQuestions || 0, questoesRespondidas.length),
        lifetimeCorrect: Math.max(prev.lifetimeCorrect || 0, prev.acertos || 0),
        lifetimeReview: Math.max(prev.lifetimeReview || 0, revisaoIds.length, questoesErradas.length),
        lifetimeActiveDays: Math.max(
          prev.lifetimeActiveDays || 1,
          prev.rankingActiveDays || 1,
          prev.streak || 1
        ),
        reviewedQuestionIds: Array.isArray(prev.reviewedQuestionIds)
          ? prev.reviewedQuestionIds.map(String)
          : [],
        conquistasDesbloqueadas: conquistasAntesDoReset,
      });
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
        atualizarPerfil,
        logout,
        registrarRespostaFreeHoje,
        registrarAcerto,
        registrarErro,
        registrarQuestaoRevisada,
        resetarAcertos,
        conquistas,
        stats: {},
      }}
    >
      {children}

      {deviceLogoutNotice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-md">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-emerald-300/20 bg-slate-900 text-white shadow-2xl shadow-black/50">
            <div className="border-b border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 p-6 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-200">
                <ShieldAlert className="h-8 w-8" strokeWidth={2.5} />
              </div>

              <h2 className="mt-5 font-heading text-2xl font-black">
                Acesso encerrado
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-slate-300">
                Sua conta foi aberta em outro dispositivo. Para manter sua conta protegida, este acesso foi desconectado.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-300/10 text-emerald-200">
                  <MonitorCheck className="h-5 w-5" strokeWidth={2.5} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                    Sessão ativa agora
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-100">
                    {deviceLogoutNotice.deviceName || 'Outro dispositivo'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (deviceRedirectTimerRef.current) {
                    window.clearTimeout(deviceRedirectTimerRef.current);
                  }

                  window.location.href = '/auth';
                }}
                className="w-full rounded-2xl bg-emerald-300 px-5 py-3.5 text-sm font-black text-emerald-950 transition hover:bg-emerald-200"
              >
                Entrar novamente
              </button>

              <p className="text-center text-xs font-semibold text-slate-500">
                Você será levado para a tela de login automaticamente.
              </p>
            </div>
          </div>
        </div>
      )}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => useContext(GameStateContext);
