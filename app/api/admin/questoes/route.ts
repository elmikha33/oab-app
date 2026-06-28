import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const OWNER_ADMIN_EMAIL = 'mi.psy.trance@gmail.com';

function normalizarEmail(email?: string | null) {
  return String(email || '').trim().toLowerCase();
}

function isOwnerAdmin(email?: string | null) {
  return normalizarEmail(email) === OWNER_ADMIN_EMAIL;
}

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function getAdminSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Variaveis Supabase ausentes.');
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
    }

    const supabase = getAdminSupabase();
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 });
    }

    if (!isOwnerAdmin(authData.user.email)) {
      return NextResponse.json({ error: 'Acesso restrito.' }, { status: 403 });
    }

    const { data, error } = await supabase
      .from('questoes_oab')
      .select('id,materia,tema,enunciado,gabarito,ativa')
      .eq('ativa', true)
      .order('materia', { ascending: true })
      .order('tema', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      return NextResponse.json({ error: 'Nao foi possivel carregar questoes.' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('[admin:questoes] erro interno', error);

    return NextResponse.json(
      { error: 'Erro interno ao carregar admin.' },
      { status: 500 }
    );
  }
}
