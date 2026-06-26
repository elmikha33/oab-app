// mockData.ts

export interface Questao {
  id: string;
  enunciado: string;
  alternativas: string[];
  gabarito: number;
  explicacao: string;
  materia: string;
  tema: string;
  nivel: 'Fácil' | 'Médio' | 'Difícil';
  exame: string;
  incidenciaTema: number;
  probabilidade: 'Alta' | 'Média' | 'Baixa';
}

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  xpRecompensa: number;
  icone: string;
  tipoRequisito: 'responder_questoes' | 'questoes_corretas' | 'streak_dias' | 'materia_mestre';
  valorRequisito: number;
  materiaRequisito?: string;
}

export interface Missao {
  id: string;
  titulo: string;
  descricao: string;
  xpRecompensa: number;
  meta: number;
  progressoAtual: number;
  concluida: boolean;
  tipo: 'total_questoes' | 'questoes_materia' | 'acertos_seguidos' | 'revisao_questoes';
  materia?: string;
}

export interface UsuarioRanking {
  id: string;
  nome: string;
  nivel: number;
  titulo: string;
  xpSemanal: number;
  questoesRespondidas: number;
  taxaAcerto: number;
}

// --- DADOS BÁSICOS ---

export const MATERIAS = [
  'Ética Profissional', 'Direito Constitucional', 'Direito Administrativo',
  'Direito Penal', 'Direito Processual Penal', 'Direito Civil',
  'Direito Processual Civil', 'Direito do Trabalho', 'Direito Processual do Trabalho',
  'Direito Tributário', 'Direito Empresarial', 'Direitos Humanos',
  'Direito Internacional', 'Direito Ambiental', 'Direito do Consumidor',
  'Estatuto da Criança e do Adolescente (ECA)', 'Filosofia do Direito'
];

export const NIVEIS_TITULOS = [
  { maxNivel: 9, titulo: 'Estagiário' },
  { maxNivel: 19, titulo: 'Bacharel em Direito' },
  { maxNivel: 29, titulo: 'Operador do Direito' },
  { maxNivel: 49, titulo: 'Advogado Júnior' },
  { maxNivel: 69, titulo: 'Advogado Pleno' },
  { maxNivel: 99, titulo: 'Advogado Sênior' },
  { maxNivel: 100, titulo: 'Mestre da OAB' }
];

export function getTituloPorNivel(nivel: number): string {
  const tier = NIVEIS_TITULOS.find(t => nivel <= t.maxNivel);
  return tier ? tier.titulo : 'Mestre da OAB';
}

// --- QUESTÕES ---

export const QUESTOES_MANUAIS: Questao[] = [];

// A proteção abaixo evita erro caso o arquivo não exista ou esteja vazio
let TODAS_QUESTOES_GERADAS: Questao[] = [];
try {
  const db = require('./questoes_db');
  TODAS_QUESTOES_GERADAS = db.TODAS_QUESTOES_GERADAS || [];
} catch (e) {
  console.warn('Arquivo questoes_db.ts não encontrado, usando lista vazia.');
}

export const TODAS_QUESTOES: Questao[] = [
  ...QUESTOES_MANUAIS,
  ...TODAS_QUESTOES_GERADAS
];

// --- OUTROS DADOS ---

export const CONQUISTAS_INICIAIS: Conquista[] = [
  { id: 'badge_first', titulo: 'Batismo de Fogo', descricao: 'Respondeu à sua primeira questão no OAPlay.', xpRecompensa: 50, icone: 'Flame', tipoRequisito: 'responder_questoes', valorRequisito: 1 },
  { id: 'badge_10_correct', titulo: 'Vontade Inabalável', descricao: 'Acertou 10 questões no total.', xpRecompensa: 150, icone: 'Target', tipoRequisito: 'questoes_corretas', valorRequisito: 10 }
];

export const RANKING_INICIAL: UsuarioRanking[] = [
  { id: 'user_r1', nome: 'Dr. Lucas Silveira', nivel: 42, titulo: 'Advogado Júnior', xpSemanal: 1250, questoesRespondidas: 85, taxaAcerto: 0.81 }
];

export const MISSOES_DIARIAS_INICIAIS: Missao[] = [
  {
    id: 'm1',
    titulo: 'Treino de Ética',
    descricao: `Responda 5 questões de Ética Profissional para dominar os pontos mais cobrados.`,
    xpRecompensa: 100,
    meta: 5,
    progressoAtual: 0,
    concluida: false,
    tipo: 'questoes_materia',
    materia: 'Ética Profissional'
  }
];
