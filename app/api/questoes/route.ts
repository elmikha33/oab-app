import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase(accessToken?: string | null) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variaveis do Supabase ausentes.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

function getBearerToken(request: Request) {
  const header = request.headers.get('authorization') || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 });
    }

    const authSupabase = getSupabase();
    const { data: authData, error: authError } = await authSupabase.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json({ error: 'Sessao invalida.' }, { status: 401 });
    }

    const supabase = getSupabase(token);
    const { searchParams } = new URL(request.url);

    const page = Math.max(Number(searchParams.get('page') ?? '0'), 0);
    const limitParam = Number(searchParams.get('limit') ?? '200');
    const limit = Math.min(Math.max(limitParam, 1), 500);

    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('questoes_oab')
      .select('*')
      .eq('ativa', true)
      .eq('inativa', false)
      .order('edicao_exame', { ascending: false, nullsFirst: false })
      .order('numero_questao', { ascending: true, nullsFirst: false })
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      console.error('[api:questoes] erro ao buscar questoes', error.message);

      return NextResponse.json(
        { error: 'Nao foi possivel carregar questoes.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('[api:questoes] erro interno', error);

    return NextResponse.json(
      { error: 'Erro inesperado ao buscar questoes.' },
      { status: 500 }
    );
  }
}
