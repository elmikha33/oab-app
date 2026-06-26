import { supabase } from './supabase';

export async function getQuestoesPorMateria(materia?: string) {
  // VerificaÃ§Ã£o de seguranÃ§a: se supabase for nulo, retornamos um array vazio
  if (!supabase) {
    console.error('Erro: Supabase nÃ£o foi inicializado (verifique as variÃ¡veis de ambiente).');
    return [];
  }

  let query = supabase.from('questoes').select('*');

  if (materia) {
    query = query.eq('materia', materia);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error('Erro ao buscar questÃµes:', error.message);
    return [];
  }

  return data || [];
}

export async function getQuestaoAleatoria(materia?: string) {
  const questoes = await getQuestoesPorMateria(materia);

  if (!questoes || questoes.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * questoes.length);
  return questoes[randomIndex];
}