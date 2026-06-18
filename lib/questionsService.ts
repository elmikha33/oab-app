import { supabase } from './supabase';

export async function getQuestoesPorMateria(materia?: string) {
<<<<<<< HEAD
  // Verificação de segurança: se supabase for nulo, retornamos um array vazio
  if (!supabase) {
    console.error('Erro: Supabase não foi inicializado (verifique as variáveis de ambiente).');
=======
  // VerificaÃ§Ã£o de seguranÃ§a: se supabase for nulo, retornamos um array vazio
  if (!supabase) {
    console.error('Erro: Supabase nÃ£o foi inicializado (verifique as variÃ¡veis de ambiente).');
>>>>>>> e1e1b23 (primeira versao)
    return [];
  }

  let query = supabase.from('questoes').select('*');

  if (materia) {
    query = query.eq('materia', materia);
  }

  const { data, error } = await query.limit(50);

  if (error) {
<<<<<<< HEAD
    console.error('Erro ao buscar questões:', error.message);
=======
    console.error('Erro ao buscar questÃµes:', error.message);
>>>>>>> e1e1b23 (primeira versao)
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