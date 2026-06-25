import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function extrairProjectRef(url: string) {
  try {
    const host = new URL(url).hostname;
    const [projectRef] = host.split('.');
    return projectRef || null;
  } catch {
    return null;
  }
}

function getSupabase() {
  const key = supabaseServiceRoleKey || supabaseAnonKey;
  if (!supabaseUrl || !key) return null;

  return createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
    },
  });
}

export async function GET() {
  const supabase = getSupabase();
  let totalQuestoesAtivas: number | null = null;
  let totalQuestoesAtivasErro: string | null = null;
  let questao674 = null;
  let questao674Erro: string | null = null;

  if (supabase) {
    const { count, error: countError } = await supabase
      .from('questoes_oab')
      .select('id', { count: 'exact', head: true })
      .eq('ativa', true)
      .eq('inativa', false);

    if (countError) {
      totalQuestoesAtivasErro = 'erro ao consultar total de questoes ativas';
    } else {
      totalQuestoesAtivas = count ?? 0;
    }

    const { data, error: questaoError } = await supabase
      .from('questoes_oab')
      .select('id,origem,edicao_exame,numero_questao,gabarito,gabarito_oficial,enunciado')
      .eq('id', 674)
      .maybeSingle();

    if (questaoError) {
      questao674Erro = 'erro ao consultar questao 674';
    } else {
      questao674 = data;
    }
  }

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || null,
    projectRef: extrairProjectRef(supabaseUrl),
    NEXT_PUBLIC_SUPABASE_ANON_KEY_exists: Boolean(supabaseAnonKey),
    NEXT_PUBLIC_SUPABASE_ANON_KEY_prefix12: supabaseAnonKey
      ? supabaseAnonKey.slice(0, 12)
      : null,
    SUPABASE_SERVICE_ROLE_KEY_exists: Boolean(supabaseServiceRoleKey),
    total_questoes_ativas: totalQuestoesAtivas,
    total_questoes_ativas_erro: totalQuestoesAtivasErro,
    questao_674: questao674,
    questao_674_erro: questao674Erro,
  });
}
