import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase =
  (globalThis as any).sb ??
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
(globalThis as any).sb = supabase;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = Number(searchParams.get('page') ?? '0');
  const limitRaw = searchParams.get('limit') ?? '25';
  const limit =
    limitRaw.toLowerCase() === 'infinity'
      ? Number.POSITIVE_INFINITY
      : Number(limitRaw);

  const PAGE_SIZE = 25;
  const from = page * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  try {
    const selectBase =
      'id, uuid, hash, materia, tema, enunciado, alternativas, gabarito, comentario';
    const selectComRevisao = `${selectBase}, revisado_ia, revisao_humana_necessaria, ativa`;

    const result = await supabase
      .from('questoes_oab')
      .select(selectComRevisao)
      .eq('ativa', true)
      .or('revisao_humana_necessaria.is.false,revisao_humana_necessaria.is.null')
      .order('id', { ascending: true })
      .range(from, to);

    const { data, error } = result;

    if (error) {
      console.error('Supabase error', error);
      throw error;
    }

    const questoes = data ?? [];
    const resposta = limit === Infinity ? questoes : questoes.slice(0, limit);
    return NextResponse.json(resposta);
  } catch (err: any) {
    console.error('Rota /api/questoes falhou', err);
    return NextResponse.json(
      { error: err.message ?? 'Erro ao buscar questoes.' },
      { status: 500 }
    );
  }
}
