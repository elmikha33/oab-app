import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAvatarAvailable } from '@/lib/avatarOptions';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OWNER_ADMIN_EMAIL = 'mi.psy.trance@gmail.com';

function normalizarEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase();
}

function emailAdmin(email?: string | null) {
  const normalizedEmail = normalizarEmail(email);

  return Boolean(normalizedEmail && normalizedEmail === OWNER_ADMIN_EMAIL);
}

const CAMPOS_PROIBIDOS_PROFILE = [
  'is_premium',
  'isPremium',
  'premium_ate',
  'plano',
  'subscription_status',
  'mercado_pago_subscription_id',
  'mercado_pago_customer_id',
  'isAdmin',
  'is_admin',
  'role',
];

const PROGRESS_ARRAY_FIELDS = [
  'questoesRespondidas',
  'questoesErradas',
  'revisaoIds',
  'conquistasDesbloqueadas',
  'reviewedQuestionIds',
  'rankingAnsweredIds',
  'rankingMilestones',
];

const PROGRESS_NUMBER_FIELDS = [
  'streak',
  'acertos',
  'moedas',
  'xp',
  'nivel',
  'xpNecessario',
  'lifetimeQuestions',
  'lifetimeCorrect',
  'lifetimeReview',
  'lifetimeReviewed',
  'lifetimeActiveDays',
  'rankingScore',
  'rankingQuestions',
  'rankingActiveDays',
];

function premiumEstaAtivo(profile: any, email?: string | null) {
  if (emailAdmin(email)) return true;
  if (!profile?.premium_ate) return false;
  return new Date(profile.premium_ate).getTime() > Date.now();
}

function limparNome(nome?: string | null) {
  return String(nome || '').replace(/\s+/g, ' ').trim().slice(0, 40);
}

function limparAvatar(avatar?: string | null) {
  return String(avatar || '').trim().slice(0, 120);
}

function limparStringArray(value: unknown, max = 2000) {
  return Array.isArray(value)
    ? [...new Set(value.map((item) => String(item)).filter(Boolean))].slice(0, max)
    : [];
}

function limparNumero(value: unknown) {
  const numero = Number(value);
  return Number.isFinite(numero) && numero >= 0 ? numero : 0;
}

function limparObjeto(value: unknown, max = 3000) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(Object.entries(value as Record<string, unknown>).slice(-max));
}

function limparProgresso(value: unknown) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const input = value as Record<string, unknown>;
  const progress: Record<string, unknown> = {};

  for (const field of PROGRESS_ARRAY_FIELDS) {
    progress[field] = limparStringArray(input[field]);
  }

  for (const field of PROGRESS_NUMBER_FIELDS) {
    progress[field] = limparNumero(input[field]);
  }

  progress.lastAccess = String(input.lastAccess || '').slice(0, 32) || null;
  progress.rankingLastActiveDay = String(input.rankingLastActiveDay || '').slice(0, 32) || null;
  progress.respostasQuestoes = limparObjeto(input.respostasQuestoes);

  const freeDailyAnswers =
    input.freeDailyAnswers && typeof input.freeDailyAnswers === 'object' && !Array.isArray(input.freeDailyAnswers)
      ? (input.freeDailyAnswers as Record<string, unknown>)
      : {};

  progress.freeDailyAnswers = {
    date: String(freeDailyAnswers.date || '').slice(0, 32),
    count: limparNumero(freeDailyAnswers.count),
  };

  progress.savedAt = new Date().toISOString();

  return progress;
}

function getBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function getClients(accessToken?: string | null) {
  if (!supabaseUrl || !anonKey) {
    throw new Error('Variáveis públicas do Supabase ausentes.');
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
  });

  const userClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });

  const adminClient = serviceKey
    ? createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      })
    : null;

  return {
    authClient,
    profileClient: adminClient || userClient,
    adminClient,
  };
}

async function atualizarAuthMetadata(
  accessToken: string,
  data: Record<string, unknown>
) {
  if (!supabaseUrl || !anonKey) return false;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'PUT',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ data }),
  }).catch(() => null);

  return Boolean(response?.ok);
}

function nomeDoUsuario(user: any) {
  if (emailAdmin(user?.email)) return 'Admin';

  const metadata = user?.user_metadata || {};
  return (
    metadata.full_name ||
    metadata.name ||
    metadata.nome ||
    user?.email?.split('@')[0] ||
    'Candidato'
  );
}

function respostaProfile(profile: any, email?: string | null) {
  const contaAdmin = emailAdmin(email);

  return contaAdmin
    ? { ...profile, nome: 'Admin', isAdmin: true, is_admin: true }
    : { ...profile, isAdmin: false, is_admin: false };
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
    }

    const { authClient, profileClient, adminClient } = getClients(token);

    const { data: authData, error: authError } = await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 });
    }

    const authUser = authData.user;

    const profileBase = {
      id: authUser.id,
      email: authUser.email || null,
      nome: nomeDoUsuario(authUser),
      avatar_url: authUser.user_metadata?.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existingProfile, error: existingProfileError } = await profileClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingProfileError) {
      return NextResponse.json({ error: existingProfileError.message }, { status: 500 });
    }

    let profile = existingProfile;

    if (!profile) {
      const { data: insertedProfile, error: insertError } = await profileClient
        .from('profiles')
        .insert(profileBase)
        .select('*')
        .single();

      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }

      profile = insertedProfile;
    } else {
      const patch: Record<string, unknown> = {
        email: authUser.email || profile.email || null,
      };

      if (emailAdmin(authUser.email) && profile.nome !== 'Admin') {
        patch.nome = 'Admin';
      }

      if (!profile.nome) {
        patch.nome = profileBase.nome;
      }

      if (!profile.avatar_url && profileBase.avatar_url) {
        patch.avatar_url = profileBase.avatar_url;
      }

      if (Object.keys(patch).length > 1) {
        patch.updated_at = new Date().toISOString();

        const { data: updatedProfile, error: updateError } = await profileClient
          .from('profiles')
          .update(patch)
          .eq('id', authUser.id)
          .select('*')
          .single();

        if (updateError) {
          return NextResponse.json({ error: updateError.message }, { status: 500 });
        }

        profile = updatedProfile;
      }
    }

    const premiumAtivo = premiumEstaAtivo(profile, authUser.email);

    if (profile.is_premium !== Boolean(premiumAtivo)) {
      if (adminClient) {
        await adminClient
          .from('profiles')
          .update({
            is_premium: Boolean(premiumAtivo),
            plano: premiumAtivo ? 'premium_trimestral' : 'free',
            updated_at: new Date().toISOString(),
          })
          .eq('id', authUser.id);
      }

      profile.is_premium = Boolean(premiumAtivo);
      profile.plano = premiumAtivo ? 'premium_trimestral' : 'free';
    }

    return NextResponse.json(respostaProfile(profile, authUser.email));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro inesperado.',
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
    }

    const { authClient, profileClient, adminClient } = getClients(token);
    const { data: authData, error: authError } = await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 });
    }

    const authUser = authData.user;
    const body = await request.json().catch(() => ({}));

    if (CAMPOS_PROIBIDOS_PROFILE.some((campo) => Object.prototype.hasOwnProperty.call(body, campo))) {
      return NextResponse.json(
        { error: 'Campo de perfil nao permitido.' },
        { status: 400 }
      );
    }

    const progressoSolicitado = limparProgresso(
      body?.oaplay_progress || body?.progress || body?.game_state
    );
    const temCampoDePerfil =
      Object.prototype.hasOwnProperty.call(body, 'nome') ||
      Object.prototype.hasOwnProperty.call(body, 'avatar_url');

    if (progressoSolicitado && !temCampoDePerfil) {
      const ok = await atualizarAuthMetadata(token, {
        oaplay_progress: progressoSolicitado,
      });

      if (!ok) {
        return NextResponse.json(
          { error: 'Nao foi possivel salvar o progresso.' },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, oaplay_progress: progressoSolicitado });
    }

    const nomeSolicitado = limparNome(body?.nome);
    const avatarSolicitado = limparAvatar(body?.avatar_url);

    const { data: profileAtualData, error: profileError } = await profileClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError && adminClient) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const profileAtual = profileError ? null : profileAtualData;

    const contaAdmin = emailAdmin(authUser.email);
    const nome = contaAdmin ? 'Admin' : nomeSolicitado;
    const premiumAtivo = premiumEstaAtivo(profileAtual, authUser.email);

    if (!contaAdmin && nome.length < 2) {
      return NextResponse.json({ error: 'Informe um nome com pelo menos 2 caracteres.' }, { status: 400 });
    }

    if (avatarSolicitado && !isAvatarAvailable(avatarSolicitado, Boolean(premiumAtivo))) {
      return NextResponse.json({ error: 'Avatar indisponivel para este plano.' }, { status: 403 });
    }

    const profilePatch = {
      id: authUser.id,
      email: authUser.email || profileAtual?.email || null,
      nome,
      avatar_url: avatarSolicitado || profileAtual?.avatar_url || null,
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error: updateError } = await profileClient
      .from('profiles')
      .upsert(profilePatch, { onConflict: 'id' })
      .select('*')
      .single();

    if (updateError) {
      if (!adminClient) {
        await atualizarAuthMetadata(token, {
          nome,
          name: nome,
          full_name: nome,
          avatar_url: profilePatch.avatar_url,
        });

        return NextResponse.json(respostaProfile(profilePatch, authUser.email));
      }

      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(respostaProfile(profile, authUser.email));
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro inesperado.',
      },
      { status: 500 }
    );
  }
}
