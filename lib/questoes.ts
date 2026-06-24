import { createClient } from "@supabase/supabase-js";

// ExtraÃ­mos as variÃ¡veis de ambiente com um fallback de seguranÃ§a
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/* ðŸ”¥ BUSCA SEM LIMIT FIXO (OU COM LIMIT ALTO) */
export async function getQuestoes() {
  const { data, error } = await supabase
    .from("questoes_oab")
    .select("*")
    .eq("ativa", true)
    .order("created_at", { ascending: false })
    .limit(10000); // Mantive o seu limite de 200

  if (error) {
    console.error("Erro ao buscar questÃµes:", error.message);
    return [];
  }

  // Retornamos data ou array vazio para garantir que o retorno seja sempre do mesmo tipo
  return data || [];
}
