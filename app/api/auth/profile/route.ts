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
  const adminEmail = normalizarEmail(process.env.NEXT_PUBLIC_ADMIN_EMAIL);

  return Boolean(
    normalizedEmail &&
      (normalizedEmail === OWNER_ADMIN_EMAIL || (adminEmail && normalizedEmail === adminEmail))
  );
}

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

function getBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function getClients() {
  if (!supabaseUrl || !anonKey || !serviceKey) {
    throw new Error('Variaveis Supabase ausentes.');
  }

  return {
    authClient: createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false },
    }),
    adminClient: createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    }),
  };
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

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
    }

    const { authClient, adminClient } = getClients();

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

    const { data: existingProfile, error: existingProfileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (existingProfileError) {
      return NextResponse.json({ error: existingProfileError.message }, { status: 500 });
    }

    let profile = existingProfile;

    if (!profile) {
      const { data: insertedProfile, error: insertError } = await adminClient
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

        const { data: updatedProfile, error: updateError } = await adminClient
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
      await adminClient
        .from('profiles')
        .update({
          is_premium: Boolean(premiumAtivo),
          plano: premiumAtivo ? 'premium_trimestral' : 'free',
          updated_at: new Date().toISOString(),
        })
        .eq('id', authUser.id);

      profile.is_premium = Boolean(premiumAtivo);
      profile.plano = premiumAtivo ? 'premium_trimestral' : 'free';
    }

    return NextResponse.json(emailAdmin(profile?.email) ? { ...profile, nome: 'Admin' } : profile);
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

    const { authClient, adminClient } = getClients();
    const { data: authData, error: authError } = await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 });
    }

    const authUser = authData.user;
    const body = await request.json().catch(() => ({}));
    const nomeSolicitado = limparNome(body?.nome);
    const avatarSolicitado = limparAvatar(body?.avatar_url);

    const { data: profileAtual, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

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

    const { data: profile, error: updateError } = await adminClient
      .from('profiles')
      .upsert(profilePatch, { onConflict: 'id' })
      .select('*')
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json(contaAdmin ? { ...profile, nome: 'Admin' } : profile);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro inesperado.',
      },
      { status: 500 }
    );
  }
}
