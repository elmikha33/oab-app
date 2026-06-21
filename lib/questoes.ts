import { createClient } from "@supabase/supabase-js";

// Extraímos as variáveis de ambiente com um fallback de segurança
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* 🔥 BUSCA SEM LIMIT FIXO (OU COM LIMIT ALTO) */
export async function getQuestoes() {
  const { data, error } = await supabase
    .from("questoes_oab")
    .select("*")
    .eq("ativa", true)
    .order("created_at", { ascending: false })
    .limit(200); // Mantive o seu limite de 200

  if (error) {
    console.error("Erro ao buscar questões:", error.message);
    return [];
  }

  // Retornamos data ou array vazio para garantir que o retorno seja sempre do mesmo tipo
  return data || [];
}
