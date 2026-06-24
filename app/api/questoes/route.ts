import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function getSupabase() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variáveis do Supabase ausentes');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
    },
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Math.max(Number(searchParams.get('page') ?? '0'), 0);
    const limitParam = Number(searchParams.get('limit') ?? '200');
    const limit = Math.min(Math.max(limitParam, 1), 500);

    const from = page * limit;
    const to = from + limit - 1;

    const supabase = getSupabase();

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
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Erro inesperado ao buscar questões',
      },
      { status: 500 }
    );
  }
}