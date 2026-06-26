import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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

    const { error: upsertError } = await adminClient
      .from('profiles')
      .upsert(profileBase, { onConflict: 'id' });

    if (upsertError) {
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const premiumAtivo =
      profile?.premium_ate &&
      new Date(profile.premium_ate).getTime() > Date.now();

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

    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erro inesperado.',
      },
      { status: 500 }
    );
  }
}