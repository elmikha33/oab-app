import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import {
  AiProviderPausedError,
  gerarJsonComModeloForte,
  gerarJsonComFallback,
  getStrongModelLabel,
  getPrimaryModelLabel,
  parseAiProviderMode,
  type AiMessage,
  type AiProviderMode,
} from "./aiProvider";
import {
  obterRegraQuestaoConhecida,
  type RegraQuestaoConhecida,
} from "./questoesRegrasConhecidas";

const LOGS_DIR = path.resolve(process.cwd(), "logs");
const DATA_DIR = path.resolve(process.cwd(), "data");
const REVISOES_HUMANAS_PENDENTES_FILE = path.join(LOGS_DIR, "revisoes_humanas_pendentes.txt");
const REGRAS_CONHECIDAS_SUGERIDAS_FILE = path.join(LOGS_DIR, "regras_conhecidas_sugeridas.txt");
const REGRAS_CONHECIDAS_DINAMICAS_FILE = path.join(DATA_DIR, "regrasConhecidasDinamicas.json");
const MODELO_IA = getPrimaryModelLabel();
const DEFAULT_LIMIT = 80;
const COLUNAS_OBRIGATORIAS_QUESTOES = [
  "revisado_ia",
  "revisado_em",
  "confianca_correcao",
  "revisao_humana_necessaria",
  "motivo_revisao_humana",
  "modelo_ultima_revisao",
  "problemas_qualidade",
  "prova_codigo",
  "numero_questao",
  "gabarito_oficial",
  "fonte_gabarito",
  "validacao_tripla",
  "anulada",
  "ativa",
  "motivo_anulacao",
  "anulada_oficial",
  "inativa",
  "fonte_anulacao",
  "motivo_inativacao",
  "comentario_auditado",
  "comentario_auditado_em",
  "comentario_auditoria_motivo",
];

function formatarDataLog(data: Date) {
  const pad = (valor: number) => String(valor).padStart(2, "0");
  return [
    data.getFullYear(),
    pad(data.getMonth() + 1),
    pad(data.getDate()),
  ].join("-") + `_${pad(data.getHours())}-${pad(data.getMinutes())}-${pad(data.getSeconds())}`;
}

function formatarArgumentoLog(arg: unknown) {
  if (typeof arg === "string") return arg;
  if (arg instanceof Error) return arg.stack || arg.message;
  try {
    return JSON.stringify(arg);
  } catch {
    return String(arg);
  }
}

type LogPersistente = {
  arquivoHistorico: string;
  arquivoUltima: string;
  fdHistorico: number;
  fdUltima: number;
  finalizado: boolean;
};

let logPersistente: LogPersistente | null = null;

function inicializarLogPersistente() {
  fs.mkdirSync(LOGS_DIR, { recursive: true });

  const arquivoHistorico = path.join(LOGS_DIR, `validacao_${formatarDataLog(new Date())}.txt`);
  const arquivoUltima = path.join(LOGS_DIR, "ultima_validacao.txt");
  logPersistente = {
    arquivoHistorico,
    arquivoUltima,
    fdHistorico: fs.openSync(arquivoHistorico, "w"),
    fdUltima: fs.openSync(arquivoUltima, "w"),
    finalizado: false,
  };

  const originalLog = console.log.bind(console);
  const originalError = console.error.bind(console);
  const escrever = (args: unknown[]) => {
    if (!logPersistente || logPersistente.finalizado) return;

    const linha = args.map(formatarArgumentoLog).join(" ");
    fs.writeSync(logPersistente.fdHistorico, `${linha}\n`, undefined, "utf8");
    fs.writeSync(logPersistente.fdUltima, `${linha}\n`, undefined, "utf8");
  };

  console.log = (...args: unknown[]) => {
    originalLog(...args);
    escrever(args);
  };

  console.error = (...args: unknown[]) => {
    originalError(...args);
    escrever(args);
  };

  return logPersistente;
}

inicializarLogPersistente();

function finalizarLogPersistente() {
  if (!logPersistente || logPersistente.finalizado) return;

  try {
    fs.fsyncSync(logPersistente.fdHistorico);
    fs.fsyncSync(logPersistente.fdUltima);
  } finally {
    fs.closeSync(logPersistente.fdHistorico);
    fs.closeSync(logPersistente.fdUltima);
    logPersistente.finalizado = true;
  }
}

process.once("beforeExit", finalizarLogPersistente);
process.once("exit", finalizarLogPersistente);
process.once("uncaughtException", (err) => {
  console.error(err instanceof Error ? err.stack || err.message : err);
  finalizarLogPersistente();
  process.exit(1);
});
process.once("unhandledRejection", (reason) => {
  console.error(reason instanceof Error ? reason.stack || reason.message : reason);
  finalizarLogPersistente();
  process.exit(1);
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL nao encontrada.");
if (!supabaseKey) throw new Error("Chave Supabase nao encontrada.");

const supabase = createClient(supabaseUrl, supabaseKey);

const LETRAS = ["A", "B", "C", "D"] as const;
const MOTIVO_COMENTARIO_CONTRADIZ_GABARITO =
  "comentário contradiz letra do gabarito oficial";
const PROVAS_DIR = path.resolve(process.cwd(), "provas");
const GABARITOS_DIR = path.resolve(process.cwd(), "provas", "gabaritos");

type GabaritoOficialValor = number | "ANULADA";

type GabaritoOficialQuestao = {
  codigoProva: string;
  numeroQuestao: number;
  valor: GabaritoOficialValor;
  arquivo: string;
  linha: number;
  numeroInferido: boolean;
};

type GabaritosOficiais = Map<
  string,
  Map<number, Omit<GabaritoOficialQuestao, "codigoProva" | "numeroQuestao" | "numeroInferido">>
>;

type ArquivoOficial = {
  codigoProva: string;
  caminho: string;
  fonte: string;
};

type AnulacaoOficialProva = {
  fonte: string;
  questoes: Map<number, { linha: number }>;
};

type AnulacaoOficialQuestao = {
  codigoProva: string;
  numeroQuestao: number;
  fonte: string;
  linha: number;
  numeroInferido: boolean;
};

type AnulacoesOficiais = Map<string, AnulacaoOficialProva>;

type Questao = {
  id: string | number;
  uuid?: string | null;
  numero?: number | string | null;
  ordem?: number | string | null;
  questao?: number | string | null;
  enunciado: string | null;
  alternativas: unknown;
  gabarito: unknown;
  materia?: string | null;
  tema?: string | null;
  dificuldade?: number | string | null;
  comentario?: string | null;
  origem?: string | null;
  prova_codigo?: string | null;
  numero_questao?: number | string | null;
  gabarito_oficial?: unknown;
  fonte_gabarito?: string | null;
  anulada?: boolean | null;
  ativa?: boolean | null;
  motivo_anulacao?: string | null;
  anulada_oficial?: boolean | null;
  inativa?: boolean | null;
  fonte_anulacao?: string | null;
  motivo_inativacao?: string | null;
  revisado_ia?: boolean | null;
  revisado_em?: string | null;
  revisao_humana_necessaria?: boolean | null;
  comentario_auditado?: boolean | null;
  comentario_auditado_em?: string | null;
  comentario_auditoria_motivo?: string | null;
  validacao_tripla?: unknown;
};

type ProblemasQualidade = {
  enunciado: string[];
  alternativas: string[];
  gabarito: string[];
};

type RevisaoNormalizada = {
  enunciadoNovo: string;
  alternativasNovas: string[];
  materiaNova: string;
  temaNovo: string;
  dificuldadeNova: number;
  gabaritoNovo: number | null;
  comentarioNovo: string;
  confiancaCorrecao: number;
  revisaoHumanaNecessaria: boolean;
  motivoAlteracao: string;
  motivoRevisaoHumana: string;
  problemasQualidade: ProblemasQualidade;
  gabaritoOficial: number | null;
  fonteGabarito: string | null;
  anulada: boolean;
  ativa: boolean;
  motivoAnulacao: string | null;
  anuladaOficial: boolean;
  inativa: boolean;
  fonteAnulacao: string | null;
  motivoInativacao: string | null;
  acao: string | null;
  modeloRevisao: string;
  validacaoTripla: Record<string, unknown>;
  comentarioAuditado: boolean;
  comentarioAuditadoEm: string | null;
  comentarioAuditoriaMotivo: string | null;
};

type ResultadoQuestao = {
  questao: Questao;
  antes: {
    enunciado: string;
    alternativas: string[];
    materia: string;
    tema: string;
    dificuldade: number;
    gabarito: number | null;
    comentario: string;
  };
  depois: RevisaoNormalizada;
  mudancas: {
    enunciado: boolean;
    alternativas: boolean;
    materia: boolean;
    tema: boolean;
    dificuldade: boolean;
    gabarito: boolean;
    comentario: boolean;
  };
};

type ValidacaoComentario = {
  tentativas: number;
  erros: string[];
  alertas: string[];
  geradoDoZero: boolean;
  parecidoComAnterior: boolean;
  regeneradoPorFugaTema: boolean;
  autocorrecaoAvancadaStatus: "NAO_NECESSARIA" | "FALLBACK_FORTE_USADO" | "FALHOU";
  autocorrecaoAvancadaMotivo: string;
  autocorrecaoAvancadaModelo: string;
  autocorrecaoAvancadaComentarioFinal: string;
  referenciasNormativasChecadas: boolean;
  referenciasNormativasAjustadas: boolean;
  auditoriaSemanticaExecutada: boolean;
  auditoriaSemanticaAprovada: boolean;
  auditoriaSemanticaCorrigida: boolean;
  auditoriaSemanticaMelhoriaIgnorada: boolean;
  auditoriaSemanticaMotivo: string;
  auditoriaSemanticaStatus:
    | "APROVADO"
    | "ERRO_JURIDICO"
    | "CORRIGIDO_ERRO_JURIDICO"
    | "IGNORADO_MELHORIA_ESTILO";
  aderenciaEnunciadoExecutada: boolean;
  aderenteQuestao: boolean;
  aderenciaEnunciadoMotivo: string;
  comentariosRejeitadosFugaTema: number;
  regraLocalDinamicaStatus?: "CRIADA" | "USADA" | "NAO_CRIADA";
  regraLocalDinamicaMotivo?: string;
  regraLocalDinamicaCaminho?: string;
};

type ChecagemReferenciasNormativas = {
  comentario: string;
  checadas: boolean;
  ajustadas: boolean;
  alertas: string[];
};

type AuditoriaComentario = {
  comentario: string;
  status: "APROVADO" | "ERRO_JURIDICO" | "CORRIGIDO_ERRO_JURIDICO" | "IGNORADO_MELHORIA_ESTILO";
  aprovado: boolean;
  corrigido: boolean;
  melhoriaIgnorada: boolean;
  motivo: string;
  alertas: string[];
};

type AderenciaComentario = {
  aderente: boolean;
  motivo: string;
  aderenciaForcada: boolean;
};

type RegraQuestaoDinamica = RegraQuestaoConhecida & {
  origem: string;
  criado_em: string;
  numero_questao?: number;
  prova_codigo?: string;
  gabarito_oficial?: string;
  fonte_gabarito?: string;
};

type RegrasConhecidasDinamicas = Record<string, RegraQuestaoDinamica>;

const MATERIAS_VALIDAS = [
  "Ética Profissional",
  "Direito Constitucional",
  "Direito Administrativo",
  "Direito Tributário",
  "Direito Civil",
  "Direito Empresarial",
  "Direito Penal",
  "Direito Processual Civil",
  "Direito Processual Penal",
  "Direito do Trabalho",
  "Direito Processual do Trabalho",
  "Direitos Humanos",
  "Direito Ambiental",
  "Direito Internacional",
  "Direito do Consumidor",
  "Filosofia do Direito",
  "Direito Eleitoral",
  "Direito Financeiro",
];

function parseArgs() {
  const args = process.argv.slice(2);
  const has = (flag: string) => args.includes(flag);
  const value = (name: string) => {
    const found = args.find((arg) => arg.startsWith(`${name}=`));
    return found ? found.slice(name.length + 1) : undefined;
  };

  const limitRaw = value("--limit") || process.env.QUESTOES_REVIEW_LIMIT;
  const limit = limitRaw ? Number(limitRaw) : DEFAULT_LIMIT;
  const idRaw = value("--id");
  let id: number | undefined;

  if (idRaw) {
    const parsedId = Number(idRaw);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      throw new Error("--id deve ser um numero inteiro positivo.");
    }
    id = parsedId;
  }

  return {
    auditarComentarios: has("--auditar-comentarios"),
    all: has("--all"),
    dryRun: has("--dry-run"),
    force: has("--force"),
    id,
    limit: Number.isFinite(limit) ? limit : DEFAULT_LIMIT,
    provider: parseAiProviderMode(value("--provider") || process.env.AI_PROVIDER || "auto"),
  };
}

function removerAcentos(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function parseLinhaGabarito(linha: string) {
  const semComentario = linha.split("#")[0]?.trim() || "";
  if (!semComentario) return null;

  const normalizada = removerAcentos(semComentario).toUpperCase();
  const match = normalizada.match(
    /^(?:QUESTAO\s*)?(\d{1,3})\s*(?:[).:\-;=]\s*|\s+)([A-D]|ANULADA)$/
  );

  if (!match) return null;

  const numeroQuestao = Number(match[1]);
  const valor: GabaritoOficialValor | null =
    match[2] === "ANULADA" ? "ANULADA" : normalizarGabarito(match[2]);

  if (!Number.isInteger(numeroQuestao) || numeroQuestao <= 0 || valor === null) {
    return null;
  }

  return { numeroQuestao, valor };
}

function caminhoRelativo(caminho: string) {
  return path.relative(process.cwd(), caminho).replace(/\\/g, "/");
}

function listarArquivosOficiais(prefixo: "gabarito" | "anuladas"): ArquivoOficial[] {
  const porProva = new Map<string, ArquivoOficial>();
  const regex = new RegExp(`^${prefixo}[_-]?(\\d+)\\.txt$`, "i");

  for (const dir of [PROVAS_DIR, GABARITOS_DIR]) {
    if (!fs.existsSync(dir)) continue;

    for (const arquivo of fs.readdirSync(dir)) {
      const codigoProva = arquivo.match(regex)?.[1];
      if (!codigoProva || porProva.has(codigoProva)) continue;

      const caminho = path.join(dir, arquivo);
      porProva.set(codigoProva, {
        codigoProva,
        caminho,
        fonte: caminhoRelativo(caminho),
      });
    }
  }

  return [...porProva.values()];
}

function parseLinhaAnulada(linha: string) {
  const semComentario = linha.split("#")[0]?.trim() || "";
  if (!semComentario) return null;

  const normalizada = removerAcentos(semComentario).toUpperCase();
  const match = normalizada.match(
    /^(?:QUESTAO\s*)?(\d{1,3})(?:\s*(?:[).:\-;=]\s*|\s+)ANULADA)?$/
  );

  if (!match) return null;

  const numeroQuestao = Number(match[1]);
  if (!Number.isInteger(numeroQuestao) || numeroQuestao <= 0) return null;

  return numeroQuestao;
}

function carregarGabaritosOficiais(): GabaritosOficiais {
  const gabaritos: GabaritosOficiais = new Map();

  for (const arquivo of listarArquivosOficiais("gabarito")) {
    const linhas = fs.readFileSync(arquivo.caminho, "utf8").split(/\r?\n/);
    const respostas = new Map<
      number,
      Omit<GabaritoOficialQuestao, "codigoProva" | "numeroQuestao" | "numeroInferido">
    >();

    linhas.forEach((linha, index) => {
      const parsed = parseLinhaGabarito(linha);
      if (!parsed) return;

      respostas.set(parsed.numeroQuestao, {
        valor: parsed.valor,
        arquivo: arquivo.fonte,
        linha: index + 1,
      });
    });

    if (respostas.size > 0) {
      gabaritos.set(arquivo.codigoProva, respostas);
    }
  }

  return gabaritos;
}

function carregarAnulacoesOficiais(): AnulacoesOficiais {
  const anulacoes: AnulacoesOficiais = new Map();

  for (const arquivo of listarArquivosOficiais("anuladas")) {
    const linhas = fs.readFileSync(arquivo.caminho, "utf8").split(/\r?\n/);
    const questoes = new Map<number, { linha: number }>();

    linhas.forEach((linha, index) => {
      const numeroQuestao = parseLinhaAnulada(linha);
      if (!numeroQuestao) return;

      questoes.set(numeroQuestao, { linha: index + 1 });
    });

    anulacoes.set(arquivo.codigoProva, {
      fonte: arquivo.fonte,
      questoes,
    });
  }

  return anulacoes;
}

function extrairCodigoProva(questao: Questao) {
  const direto = normalizarTexto(questao.prova_codigo);
  if (direto) return direto.replace(/\D/g, "") || direto;

  const origem = normalizarTexto(questao.origem);
  const match = origem.match(/(\d{1,4})/);
  return match?.[1] || "";
}

function numeroInteiroPositivo(valor: unknown) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function obterNumeroQuestaoSalvo(questao: Questao) {
  const camposDiretos = [
    questao.numero_questao,
    questao.numero,
    questao.ordem,
    questao.questao,
  ];

  for (const valor of camposDiretos) {
    const numero = numeroInteiroPositivo(valor);
    if (numero) return numero;
  }

  if (questao.validacao_tripla && typeof questao.validacao_tripla === "object") {
    const validacao = questao.validacao_tripla as Record<string, unknown>;
    const numero = numeroInteiroPositivo(validacao.numero_questao);
    if (numero) return numero;
  }

  return null;
}

function obterValidacaoTriplaSalva(questao: Questao) {
  return questao.validacao_tripla && typeof questao.validacao_tripla === "object"
    ? (questao.validacao_tripla as Record<string, unknown>)
    : {};
}

function carregarRegrasConhecidasDinamicas(): RegrasConhecidasDinamicas {
  if (!fs.existsSync(REGRAS_CONHECIDAS_DINAMICAS_FILE)) return {};

  try {
    const parsed = JSON.parse(fs.readFileSync(REGRAS_CONHECIDAS_DINAMICAS_FILE, "utf8")) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as RegrasConhecidasDinamicas)
      : {};
  } catch {
    return {};
  }
}

function salvarRegrasConhecidasDinamicas(regras: RegrasConhecidasDinamicas) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(REGRAS_CONHECIDAS_DINAMICAS_FILE, `${JSON.stringify(regras, null, 2)}\n`, "utf8");
}

function obterNumeroQuestao(questao: Questao) {
  return obterNumeroQuestaoSalvo(questao);
}

function obterGabaritoOficial(
  questao: Questao,
  gabaritos: GabaritosOficiais
): GabaritoOficialQuestao | null {
  const codigoProva = extrairCodigoProva(questao);
  const numeroQuestao = obterNumeroQuestao(questao);

  if (!codigoProva || !numeroQuestao) return null;

  const entrada = gabaritos.get(codigoProva)?.get(numeroQuestao);
  if (!entrada) return null;

  return {
    codigoProva,
    numeroQuestao,
    numeroInferido: false,
    ...entrada,
  };
}

function obterRegraQuestaoDinamica(
  questao: Questao,
  gabaritoOficial: GabaritoOficialQuestao | null
) {
  if (!gabaritoOficial || gabaritoOficial.valor === "ANULADA") return null;

  const id = String(questao.id);
  const regra = carregarRegrasConhecidasDinamicas()[id];
  if (!regra) return null;

  const numeroSalvo = obterNumeroQuestaoSalvo(questao);
  if (!numeroSalvo || regra.numero_questao !== gabaritoOficial.numeroQuestao) return null;
  if (numeroSalvo !== gabaritoOficial.numeroQuestao) return null;

  const gabaritoLetra = formatarGabarito(gabaritoOficial.valor);
  if (regra.gabarito_oficial !== gabaritoLetra) return null;

  return regra;
}

function obterAnulacaoOficial(
  questao: Questao,
  anulacoes: AnulacoesOficiais
): AnulacaoOficialQuestao | null {
  const codigoProva = extrairCodigoProva(questao);
  const numeroQuestao = obterNumeroQuestao(questao);

  if (!codigoProva || !numeroQuestao) return null;

  const prova = anulacoes.get(codigoProva);
  const entrada = prova?.questoes.get(numeroQuestao);
  if (!prova || !entrada) return null;

  return {
    codigoProva,
    numeroQuestao,
    fonte: prova.fonte,
    linha: entrada.linha,
    numeroInferido: false,
  };
}

function obterAvisoArquivoAnuladas(questao: Questao, anulacoes: AnulacoesOficiais) {
  const codigoProva = extrairCodigoProva(questao);
  if (!codigoProva || anulacoes.has(codigoProva)) return null;
  return `arquivo de anuladas nao encontrado para esta prova: provas/anuladas_${codigoProva}.txt`;
}

function formatarGabaritoOficial(gabarito: GabaritoOficialQuestao | null) {
  if (!gabarito) return "nao encontrado";
  const valor = gabarito.valor === "ANULADA" ? "ANULADA" : formatarGabarito(gabarito.valor);
  return `${valor} (${gabarito.arquivo}, questao ${gabarito.numeroQuestao})`;
}

function questaoAnuladaOuInativa(questao: Questao) {
  return (
    questao.anulada === true ||
    questao.anulada_oficial === true ||
    questao.ativa === false ||
    questao.inativa === true
  );
}

function questaoJaRevisada(questao: Questao) {
  return questao.revisado_ia === true || normalizarTexto(questao.revisado_em).length > 0;
}

function comentarioJaAuditado(questao: Questao) {
  return questao.comentario_auditado === true || normalizarTexto(questao.comentario_auditado_em).length > 0;
}

function questaoSemGabaritoOficialSalvo(questao: Questao) {
  return normalizarGabarito(questao.gabarito_oficial) === null && !normalizarTexto(questao.fonte_gabarito);
}

function questaoDeveEntrarNaFila(questao: Questao, args: ReturnType<typeof parseArgs>) {
  if (questaoAnuladaOuInativa(questao)) return false;
  if (args.id && String(questao.id) !== String(args.id)) return false;
  if (args.force) return true;
  if (questao.revisao_humana_necessaria === true) return true;
  if (questaoSemGabaritoOficialSalvo(questao)) return true;
  if (!comentarioJaAuditado(questao)) return true;

  return !questaoJaRevisada(questao);
}

function normalizarMateria(materia: string) {
  const m = String(materia || "").trim();

  const mapa: Record<string, string> = {
    "Direito do Advogado": "Ética Profissional",
    "Direito da Advocacia": "Ética Profissional",
    "Estatuto da OAB": "Ética Profissional",
    "Estatuto da Advocacia": "Ética Profissional",
    "Código de Ética": "Ética Profissional",
    "Código de Ética e Estatuto da OAB": "Ética Profissional",
    Ética: "Ética Profissional",
    "Direito Internacional Privado": "Direito Internacional",
    "Direito Internacional Público": "Direito Internacional",
    "Direito Previdenciário": "Direito do Trabalho",
    "Processo Civil": "Direito Processual Civil",
    "Processo Penal": "Direito Processual Penal",
    "Processo do Trabalho": "Direito Processual do Trabalho",
    "Direito do Processo do Trabalho": "Direito Processual do Trabalho",
  };

  if (MATERIAS_VALIDAS.includes(m)) return m;
  if (mapa[m]) return mapa[m];

  const x = m.toLowerCase();

  if (
    x.includes("advog") ||
    x.includes("oab") ||
    x.includes("ética") ||
    x.includes("etica") ||
    x.includes("estatuto")
  ) {
    return "Ética Profissional";
  }

  if (x.includes("internacional")) return "Direito Internacional";
  if (x.includes("constitucional")) return "Direito Constitucional";
  if (x.includes("administrativo")) return "Direito Administrativo";
  if (x.includes("tribut")) return "Direito Tributário";
  if (x.includes("civil") && x.includes("process")) return "Direito Processual Civil";
  if (x.includes("civil")) return "Direito Civil";
  if (x.includes("empres")) return "Direito Empresarial";
  if (x.includes("penal") && x.includes("process")) return "Direito Processual Penal";
  if (x.includes("penal")) return "Direito Penal";
  if (x.includes("trabalho") && x.includes("process")) return "Direito Processual do Trabalho";
  if (x.includes("trabalho")) return "Direito do Trabalho";
  if (x.includes("humanos")) return "Direitos Humanos";
  if (x.includes("ambiental")) return "Direito Ambiental";
  if (x.includes("consumidor")) return "Direito do Consumidor";
  if (x.includes("filosofia")) return "Filosofia do Direito";
  if (x.includes("eleitoral")) return "Direito Eleitoral";
  if (x.includes("financeiro")) return "Direito Financeiro";

  return "";
}

function normalizarDificuldade(valor: unknown) {
  if (typeof valor === "number") {
    if (valor <= 1) return 1;
    if (valor === 2) return 2;
    return 3;
  }

  const texto = String(valor || "").toLowerCase();

  if (texto.includes("fácil") || texto.includes("facil")) return 1;
  if (texto.includes("média") || texto.includes("media") || texto.includes("médio") || texto.includes("medio")) {
    return 2;
  }
  if (texto.includes("difícil") || texto.includes("dificil")) return 3;

  const numero = Number(valor);
  if (!Number.isNaN(numero)) {
    if (numero <= 1) return 1;
    if (numero === 2) return 2;
    return 3;
  }

  return 2;
}

function normalizarGabarito(valor: unknown): number | null {
  if (typeof valor === "number" && Number.isInteger(valor) && valor >= 0 && valor <= 3) {
    return valor;
  }

  const texto = String(valor ?? "").trim().toUpperCase();
  const letraIndex = LETRAS.indexOf(texto as (typeof LETRAS)[number]);
  if (letraIndex >= 0) return letraIndex;

  const numero = Number(texto);
  if (Number.isInteger(numero) && numero >= 0 && numero <= 3) return numero;

  return null;
}

function formatarGabarito(valor: number | null) {
  return valor === null ? "INVALIDO" : LETRAS[valor];
}

function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarAlternativas(valor: unknown) {
  if (Array.isArray(valor)) {
    return valor.slice(0, 4).map(normalizarTexto);
  }

  if (valor && typeof valor === "object") {
    const record = valor as Record<string, unknown>;
    return LETRAS.map((letra) => normalizarTexto(record[letra] ?? record[letra.toLowerCase()]));
  }

  return [];
}

function alternativasValidas(alternativas: string[]) {
  return alternativas.length === 4 && alternativas.every((alt) => alt.length >= 2);
}

function limparJson(texto: string) {
  const limpo = texto
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");

  if (inicio === -1 || fim === -1) {
    throw new Error("Resposta da IA nao contem JSON valido.");
  }

  return limpo.slice(inicio, fim + 1);
}

function clampConfianca(valor: unknown) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return 0;
  return Math.max(0, Math.min(100, Math.round(numero)));
}

function mudou(antes: unknown, depois: unknown) {
  return normalizarTexto(antes) !== normalizarTexto(depois);
}

function arraysMudaram(antes: string[], depois: string[]) {
  return JSON.stringify(antes.map(normalizarTexto)) !== JSON.stringify(depois.map(normalizarTexto));
}

function resumirTexto(texto: unknown, limite = 180) {
  const t = normalizarTexto(texto);
  if (!t) return "vazio";
  return t.length > limite ? `${t.slice(0, limite)}...` : t;
}

function normalizarParaComparacao(texto: unknown) {
  return removerAcentos(normalizarTexto(texto))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokensComparacao(texto: unknown) {
  return new Set(
    normalizarParaComparacao(texto)
      .split(" ")
      .filter((token) => token.length > 3)
  );
}

function textoContemTermo(texto: string, termo: string) {
  const textoNormalizado = normalizarParaComparacao(texto);
  const termoNormalizado = normalizarParaComparacao(termo);
  return Boolean(termoNormalizado) && textoNormalizado.includes(termoNormalizado);
}

function textoContemAlgumTermo(texto: string, termos: string[]) {
  return termos.some((termo) => textoContemTermo(texto, termo));
}

function subtopicoDiretamenteRelacionadoAoTema(
  questao: Questao,
  comentario: string,
  alternativaCorreta: string
) {
  const contextoQuestao = [
    questao.tema,
    questao.enunciado,
    alternativaCorreta,
  ].join(" ");
  const grupos = [
    {
      tema: "regime de cumprimento de pena",
      contexto: [
        "regime de cumprimento de pena",
        "cumprimento de pena",
        "regime aberto",
        "regime fechado",
        "regime semiaberto",
        "semiaberto",
        "progressao de regime",
      ],
      comentario: [
        "regime aberto",
        "regime fechado",
        "regime semiaberto",
        "semiaberto",
        "progressao de regime",
        "regressao de regime",
        "cumprimento de pena",
      ],
    },
    {
      tema: "acao penal",
      contexto: [
        "acao penal",
        "acao penal publica",
        "acao penal publica condicionada",
        "acao penal publica incondicionada",
        "representacao",
      ],
      comentario: [
        "representacao",
        "acao penal publica condicionada",
        "acao penal publica incondicionada",
        "condicionada a representacao",
        "independe de representacao",
        "ministerio publico",
      ],
    },
    {
      tema: "prisao preventiva",
      contexto: [
        "prisao preventiva",
        "preventiva",
      ],
      comentario: [
        "prisao preventiva",
        "requisitos da prisao preventiva",
        "ordem publica",
        "ordem economica",
        "conveniencia da instrucao",
        "aplicacao da lei penal",
      ],
    },
    {
      tema: "inquerito policial",
      contexto: [
        "inquerito policial",
        "inquerito",
      ],
      comentario: [
        "inquerito policial",
        "dispensabilidade do inquerito",
        "dispensavel",
        "denuncia",
        "oferecimento da denuncia",
        "investigacao policial",
        "procedimento administrativo",
      ],
    },
    {
      tema: "homicidio",
      contexto: [
        "homicidio",
      ],
      comentario: [
        "motivo torpe",
        "motivo futil",
        "qualificadora",
        "homicidio qualificado",
        "circunstancia qualificadora",
      ],
    },
  ];

  for (const grupo of grupos) {
    if (textoContemAlgumTermo(contextoQuestao, grupo.contexto) && textoContemAlgumTermo(comentario, grupo.comentario)) {
      return grupo.tema;
    }
  }

  return "";
}

function divergenciaDeInstitutoCentral(
  questao: Questao,
  comentario: string,
  alternativaCorreta: string
) {
  const alternativas = normalizarAlternativas(questao.alternativas);
  const contextoQuestao = [
    questao.tema,
    questao.enunciado,
    alternativaCorreta,
    JSON.stringify(alternativas),
  ].join(" ");
  const comentarioNormalizado = normalizarParaComparacao(comentario);

  const divergencias = [
    {
      instituto: "uniao estavel/sucessao",
      contexto: ["uniao estavel", "sucessao", "heranca", "companheiro", "convivente"],
      comentarioIncompativel: ["divorcio", "separacao judicial", "separacao de fato", "dissolucao do casamento"],
      motivo: "comentario explica divorcio/separacao judicial, mas o enunciado trata de uniao estavel ou sucessao",
    },
    {
      instituto: "direito de vizinhanca",
      contexto: ["direito de vizinhanca", "vizinhanca", "uso anormal da propriedade", "passagem forcada", "direito de construir"],
      comentarioIncompativel: ["usucapiao", "desapropriacao", "desapropriar", "aquisicao originaria"],
      motivo: "comentario explica usucapiao/desapropriacao, mas o enunciado trata de direito de vizinhanca",
    },
    {
      instituto: "responsabilidade civil ambiental objetiva",
      contexto: [
        "responsabilidade civil ambiental",
        "responsabilidade ambiental",
        "responsabilidade civil objetiva",
        "responsabilidade objetiva ambiental",
        "dano ambiental",
      ],
      comentarioIncompativel: ["poluidor pagador", "principio do poluidor pagador"],
      motivo: "comentario explica principio do poluidor-pagador, mas o enunciado exige responsabilidade civil ambiental objetiva",
    },
  ];

  for (const divergencia of divergencias) {
    const contextoBate = textoContemAlgumTermo(contextoQuestao, divergencia.contexto);
    const comentarioBate = textoContemAlgumTermo(comentario, divergencia.comentarioIncompativel);
    if (!contextoBate || !comentarioBate) continue;

    if (
      divergencia.instituto === "responsabilidade civil ambiental objetiva" &&
      /\bresponsabilidade\b/.test(comentarioNormalizado) &&
      /\b(objetiva|independe de culpa|sem culpa)\b/.test(comentarioNormalizado)
    ) {
      continue;
    }

    return divergencia.motivo;
  }

  return "";
}

function comentarioExplicaInstitutoCentral(
  questao: Questao,
  comentario: string,
  alternativaCorreta: string
) {
  const alternativas = normalizarAlternativas(questao.alternativas);
  const contextoQuestao = [
    questao.tema,
    questao.enunciado,
    alternativaCorreta,
    JSON.stringify(alternativas),
  ].join(" ");

  const grupos = [
    {
      instituto: "direito de vizinhanca",
      contexto: ["direito de vizinhanca", "vizinhanca", "uso anormal da propriedade", "passagem forcada", "direito de construir"],
      comentario: ["direito de vizinhanca", "vizinhanca", "imoveis vizinhos", "proprietarios de imoveis vizinhos", "uso da propriedade", "convivencia harmoniosa"],
    },
    {
      instituto: "uniao estavel/sucessao",
      contexto: ["uniao estavel", "sucessao", "heranca", "companheiro", "convivente"],
      comentario: ["uniao estavel", "sucessao", "heranca", "companheiro", "convivente", "efeitos sucessorios"],
    },
    {
      instituto: "responsabilidade civil ambiental objetiva",
      contexto: ["responsabilidade civil ambiental", "responsabilidade ambiental", "responsabilidade civil objetiva", "responsabilidade objetiva ambiental", "dano ambiental"],
      comentario: ["responsabilidade civil ambiental", "responsabilidade ambiental", "responsabilidade objetiva", "dano ambiental", "independe de culpa", "sem culpa"],
    },
    {
      instituto: "proibicao absoluta da tortura",
      contexto: ["tortura", "guerra", "emergencia publica", "ameaca a seguranca nacional"],
      comentario: ["tortura", "proibida de forma absoluta", "situacoes excepcionais", "guerra", "emergencia publica", "ameaca a seguranca nacional"],
    },
  ];

  for (const grupo of grupos) {
    if (textoContemAlgumTermo(contextoQuestao, grupo.contexto) && textoContemAlgumTermo(comentario, grupo.comentario)) {
      return grupo.instituto;
    }
  }

  return "";
}

function feedbackRegeneracaoComentario(motivoRejeicao: string) {
  const motivo = normalizarTexto(motivoRejeicao);
  if (!motivo) return "";

  if (normalizarParaComparacao(motivo).includes("fuga de tema")) {
    const motivoLimpo = motivo
      .replace(/^Comentario rejeitado por fuga de tema:\s*/i, "")
      .replace(/^fuga de tema:\s*/i, "")
      .trim();
    const explicacao = motivoLimpo.replace(/^comentario explica\s+/i, "");
    return [
      `O comentario anterior foi rejeitado porque explicou ${explicacao || motivoLimpo || motivo}.`,
      "Gere um novo comentario explicando especificamente o instituto central do enunciado e da alternativa correta oficial.",
      "Nao reaproveite o comentario anterior rejeitado.",
      "Nao explique instituto de mesma materia se ele nao for o instituto central cobrado na questao.",
    ].join(" ");
  }

  return `A tentativa anterior foi rejeitada por: ${motivo}`;
}

function comentarioMuitoParecidoComAntigo(comentarioNovo: string, comentarioAntes: string) {
  const novo = normalizarParaComparacao(comentarioNovo);
  const antigo = normalizarParaComparacao(comentarioAntes);
  if (!novo || !antigo || antigo.length < 120) return false;

  if (novo.includes(antigo.slice(0, 120))) return true;

  const tokensNovo = tokensComparacao(novo);
  const tokensAntigo = tokensComparacao(antigo);
  if (tokensNovo.size < 20 || tokensAntigo.size < 20) return false;

  let intersecao = 0;
  for (const token of tokensAntigo) {
    if (tokensNovo.has(token)) intersecao++;
  }

  const uniao = new Set([...tokensNovo, ...tokensAntigo]).size;
  const jaccard = uniao > 0 ? intersecao / uniao : 0;
  const coberturaMenor = intersecao / Math.min(tokensNovo.size, tokensAntigo.size);

  return jaccard >= 0.72 || coberturaMenor >= 0.86;
}

function extrairLetrasPorPadroes(texto: string, padroes: RegExp[]) {
  const letras = new Set<string>();

  for (const padrao of padroes) {
    for (const match of texto.matchAll(padrao)) {
      const letra = normalizarTexto(match[1]).toUpperCase();
      if (LETRAS.includes(letra as (typeof LETRAS)[number])) {
        letras.add(letra);
      }
    }
  }

  return letras;
}

function analisarLetrasDoComentario(comentario: string, gabaritoOficial: number | null) {
  const letraOficial = gabaritoOficial === null ? "" : formatarGabarito(gabaritoOficial);
  const texto = normalizarParaComparacao(comentario);
  const letrasCorretas = extrairLetrasPorPadroes(texto, [
    /\balternativa\s+correta\s+(?:e|eh|seria)?\s*(?:a\s+|letra\s+)?([a-d])\b/g,
    /\b(?:a\s+)?alternativa\s+([a-d])\s+(?:esta|e|eh|seria)\s+correta\b/g,
    /\bletra\s+([a-d])\s+(?:esta|e|eh|seria)\s+correta\b/g,
    /\bgabarito\s+(?:oficial\s+|correto\s+|correta\s+)?(?:e\s+|eh\s+|seria\s+)?(?:a\s+|letra\s+)?([a-d])\s+(?:esta|e|eh|seria)\s+corret[oa]\b/g,
    /\bgabarito\s+(?:oficial\s+|correto\s+|correta\s+)?(?:e\s+|eh\s+|seria\s+)?(?:a\s+|letra\s+)?([a-d])\b(?!\s+(?:esta|e|eh|seria)\s+incorret[oa]\b)(?!\s+nao\s+(?:esta|e|eh|seria)\s+corret[oa]\b)/g,
    /\bopcao\s+correta\s+(?:e|eh|seria)?\s*(?:a\s+|letra\s+)?([a-d])\b/g,
    /\bopcao\s+([a-d])\s+(?:esta|e|eh|seria)\s+correta\b/g,
    /\bopcao\s+([a-d])\b(?!\s+(?:esta|e|eh|seria|incorreta|errada)\b)(?!\s+nao\s+(?:esta|e|eh|seria)\s+correta\b)/g,
  ]);
  const letrasIncorretas = extrairLetrasPorPadroes(texto, [
    /\b(?:a\s+)?alternativa\s+([a-d])\s+(?:esta|e|eh|seria)\s+incorreta\b/g,
    /\b(?:a\s+)?alternativa\s+([a-d])\s+nao\s+(?:esta|e|eh|seria)\s+correta\b/g,
    /\bletra\s+([a-d])\s+(?:esta|e|eh|seria)\s+incorreta\b/g,
    /\bletra\s+([a-d])\s+nao\s+(?:esta|e|eh|seria)\s+correta\b/g,
    /\bgabarito\s+(?:oficial\s+|correto\s+|correta\s+)?(?:e\s+|eh\s+|seria\s+)?(?:a\s+|letra\s+)?([a-d])\s+(?:esta|e|eh|seria)\s+incorret[oa]\b/g,
    /\bgabarito\s+(?:oficial\s+|correto\s+|correta\s+)?(?:e\s+|eh\s+|seria\s+)?(?:a\s+|letra\s+)?([a-d])\s+nao\s+(?:esta|e|eh|seria)\s+corret[oa]\b/g,
    /\bopcao\s+([a-d])\s+(?:esta|e|eh|seria)\s+incorreta\b/g,
    /\bopcao\s+([a-d])\s+nao\s+(?:esta|e|eh|seria)\s+correta\b/g,
  ]);
  const afirmaOutraAlternativaCorreta =
    Boolean(letraOficial) && [...letrasCorretas].some((letra) => letra !== letraOficial);
  const afirmaGabaritoOficialIncorreto =
    Boolean(letraOficial) && letrasIncorretas.has(letraOficial);

  return {
    letraOficial,
    letrasCorretas: [...letrasCorretas],
    letrasIncorretas: [...letrasIncorretas],
    afirmaOutraAlternativaCorreta,
    afirmaGabaritoOficialIncorreto,
    contradizGabarito:
      afirmaOutraAlternativaCorreta || afirmaGabaritoOficialIncorreto,
  };
}

function comentarioContradizGabaritoOficial(comentario: string, gabaritoOficial: number | null) {
  if (gabaritoOficial === null) return false;
  return analisarLetrasDoComentario(comentario, gabaritoOficial).contradizGabarito;
}

function comentarioMencionaGabaritoOficial(comentario: string, gabaritoOficial: number) {
  const letra = formatarGabarito(gabaritoOficial);
  return analisarLetrasDoComentario(comentario, gabaritoOficial).letrasCorretas.includes(letra);
}

function comentarioPossuiReferenciaNormativaEspecifica(comentario: string) {
  return /(\blei\s*(?:n[ºo.]?\s*)?\d|\bart\.?\s*\d|\bartigo\s+\d|\bs[uú]mula\s+\d|\btema\s+\d+\s+(?:do\s+)?(?:stf|stj)\b)/i.test(
    comentario
  );
}

function protegerReferenciasNormativasConfiaveis(texto: string) {
  const referencias: string[] = [];
  const protegido = normalizarTexto(texto).replace(
    /\bLei\s*(?:n[ºo.]?|no\.?|numero|n[uú]mero)?\s*\d{1,6}(?:[./-]\d{2,4})+\b/giu,
    (match) => {
      const marcador = `__REFERENCIA_LEI_CONFIAVEL_${referencias.length}__`;
      referencias.push(match);
      return marcador;
    }
  );

  return { texto: protegido, referencias };
}

function restaurarReferenciasNormativasConfiaveis(texto: string, referencias: string[]) {
  let restaurado = texto;

  referencias.forEach((referencia, index) => {
    restaurado = restaurado.replaceAll(`__REFERENCIA_LEI_CONFIAVEL_${index}__`, referencia);
  });

  return restaurado;
}

function mascararReferenciasNormativasConfiaveis(texto: string) {
  return protegerReferenciasNormativasConfiaveis(texto).texto;
}


function limparMarcadoresNormativosGenericos(comentario: string) {
  return normalizarTexto(comentario)
    .replace(/\bLei\s*(?:n[ºo.]?|no\.?|numero|n[uú]mero)?\s*legislacao aplicavel\b/giu, "legislacao aplicavel")
    .replace(/\b(?:n[ºo.]?|no\.?|numero|n[uú]mero)\s*legislacao aplicavel\b/giu, "legislacao aplicavel")
    .replace(/\b(?:da|de|do)\s+legislacao aplicavel\b/giu, "da legislacao aplicavel")
    .replace(/\blegislacao aplicavel\s+legislacao aplicavel\b/giu, "legislacao aplicavel")
    .replace(/\bnormas aplicaveis\s+normas aplicaveis\b/giu, "normas aplicaveis")
    .replace(/\bcomo e o caso da legislacao aplicavel\b/giu, "conforme a legislacao aplicavel")
    .replace(/\bcomo e o caso de legislacao aplicavel\b/giu, "conforme a legislacao aplicavel")
    .replace(/\bcomo e o caso do legislacao aplicavel\b/giu, "conforme a legislacao aplicavel")
    .replace(/\bLei\s*(?:n[ºo.]?|no\.?|numero|n[uú]mero)?\s*$/giu, "legislacao aplicavel")
    .replace(/\s+/g, " ")
    .trim();
}

function removerReferenciasNormativasEspecificas(comentario: string) {
  const protegido = protegerReferenciasNormativasConfiaveis(comentario);
  const seguro = protegido.texto
    .replace(/\bLei\s*(?:n[ºo.]?\s*)?\d{1,6}(?:[./-]\d{2,4})?\b/gi, "legislacao aplicavel")
    .replace(/\bArt\.?\s*\d+[ºo]?(?:[-,]\s*[A-Za-z])?(?:\s*,?\s*(?:§|paragrafo|inciso)\s*[^.;,)]*)?/gi, "dispositivo aplicavel")
    .replace(/\bartigo\s+\d+[ºo]?(?:[-,]\s*[A-Za-z])?(?:\s*,?\s*(?:§|paragrafo|inciso)\s*[^.;,)]*)?/gi, "dispositivo aplicavel")
    .replace(/\bS[uú]mula\s+\d+(?:\s+do\s+(?:STF|STJ|TST|TSE))?\b/gi, "entendimento juridico aplicavel")
    .replace(/\bTema\s+\d+\s+(?:do\s+)?(?:STF|STJ)\b/gi, "entendimento juridico aplicavel")
    .replace(/\s+/g, " ")
    .trim();

  return restaurarReferenciasNormativasConfiaveis(
    limparMarcadoresNormativosGenericos(seguro),
    protegido.referencias
  );
}

function comentarioPossuiReferenciaNormativaBloqueada(comentario: string) {
  const texto = mascararReferenciasNormativasConfiaveis(comentario);

  return [
    /\blei\s*(?:n\.?|no\.?|numero|n[uú]mero)?\s*\d/iu,
    /\b\d{1,2}\.\d{3}(?:[./-]\d{2,4})?\b/u,
    /\bart\.?\s*\d*/iu,
    /\bartigo\b/iu,
    /\binciso\b/iu,
    /§/u,
    /\bpar[aá]grafo\b/iu,
    /\bs[uú]mula\b/iu,
    /\btema\s+(?:\d+\s+)?(?:do\s+)?(?:stf|stj)\b/iu,
    /\b(?:RE|ARE|ADI|ADC|ADPF)\b/u,
    /\bjurisprud[eê]ncia\b/iu,
  ].some((regex) => regex.test(texto));
}

function sanitizarReferenciasNormativasBloqueadas(comentario: string) {
  const protegido = protegerReferenciasNormativasConfiaveis(comentario);
  let seguro = protegido.texto
    .replace(/\bLei\s*(?:n\.?|no\.?|numero|n[uú]mero)?\s*\d{1,6}(?:[./-]\d{2,4})?\b/giu, "legislacao aplicavel")
    .replace(/\b\d{1,2}\.\d{3}(?:[./-]\d{2,4})?\b/gu, "legislacao aplicavel")
    .replace(/\bArt\.?\s*\d*[ºo]?(?:[-,]\s*[A-Za-z])?(?:\s*,?\s*(?:§|par[aá]grafo|inciso)\s*[^.;,)]*)?/giu, "normas aplicaveis")
    .replace(/\bartigo(?:s)?(?:\s+\d+[ºo]?)?(?:\s*,?\s*(?:§|par[aá]grafo|inciso)\s*[^.;,)]*)?/giu, "normas aplicaveis")
    .replace(/\binciso(?:s)?\s+[IVXLCDM\d-]+/giu, "normas aplicaveis")
    .replace(/\binciso(?:s)?\b/giu, "normas aplicaveis")
    .replace(/§+\s*\d*[ºo]?(?:\s*[,e]\s*\d+[ºo]?)*\b/giu, "normas aplicaveis")
    .replace(/\bpar[aá]grafo(?:s)?(?:\s+\d+[ºo]?)?\b/giu, "normas aplicaveis")
    .replace(/\bS[uú]mula\s+\d+(?:\s+do\s+(?:STF|STJ|TST|TSE))?\b/giu, "entendimento juridico aplicavel")
    .replace(/\bS[uú]mula\b/giu, "entendimento juridico aplicavel")
    .replace(/\bTema\s+\d+\s+(?:do\s+)?(?:STF|STJ)\b/giu, "entendimento juridico aplicavel")
    .replace(/\bTema\s+(?:STF|STJ)\b/giu, "entendimento juridico aplicavel")
    .replace(/\b(?:RE|ARE|ADI|ADC|ADPF)\s*\d[\d.]*\b/gu, "entendimento juridico aplicavel")
    .replace(/\b(?:RE|ARE|ADI|ADC|ADPF)\b/gu, "entendimento juridico aplicavel")
    .replace(/\bjurisprud[eê]ncia\s+especifica\b/giu, "entendimento juridico aplicavel")
    .replace(/\bjurisprud[eê]ncia\b/giu, "entendimento juridico aplicavel")
    .replace(/\s+/g, " ")
    .trim();

  if (comentarioPossuiReferenciaNormativaBloqueada(seguro)) {
    seguro = seguro
      .replace(/\b(?:lei|art|artigo|inciso|paragrafo|sumula|tema)\b/giu, "normas aplicaveis")
      .replace(/§/gu, "normas aplicaveis")
      .replace(/\b(?:RE|ARE|ADI|ADC|ADPF)\b/gu, "entendimento juridico aplicavel")
      .replace(/\b\d{1,2}\.\d{3}(?:[./-]\d{2,4})?\b/gu, "legislacao aplicavel")
      .replace(/\s+/g, " ")
      .trim();
  }

  seguro = limparMarcadoresNormativosGenericos(seguro);

  return restaurarReferenciasNormativasConfiaveis(seguro, protegido.referencias);
}

function auditoriaDescreveApenasMelhoria(motivo: string) {
  const texto = removerAcentos(normalizarTexto(motivo)).toLowerCase();
  return /\b(melhoria|estilo|redacao|clareza|mais claro|mais completo|completude|didatico|didatica|precisao terminologica|terminologia|preferencia|apresentacao|troca de inicio|professor de redacao)\b/.test(
    texto
  );
}

function motivoAprovadoContemErroJuridico(motivo: string) {
  const texto = normalizarParaComparacao(motivo);
  return [
    "ensina regra errada",
    "conceito juridico falso",
    "conceito juridico realmente falso",
    "erro juridico",
    "alternativa diferente",
    "inversao",
    "inverte",
    "fuga de tema",
    "fugiu do tema",
  ].some((termo) => texto.includes(termo));
}

function normalizarMotivoAuditoria(
  status: AuditoriaComentario["status"],
  motivo: string,
  melhoriaIgnorada: boolean,
  aderenciaForcada: boolean
) {
  const motivoSeguro = normalizarTexto(motivo) || "comentario juridicamente correto";

  if (status !== "APROVADO") return motivoSeguro;
  if (aderenciaForcada) return "comentario aderente ao tema da questao";
  if (melhoriaIgnorada) return "melhoria de estilo ignorada; comentario aprovado";
  if (motivoAprovadoContemErroJuridico(motivoSeguro)) return "comentario juridicamente correto";

  return motivoSeguro;
}

function detectarErroJuridicoCriticoLocal(
  questao: Questao,
  comentario: string,
  gabaritoOficial: GabaritoOficialQuestao
) {
  const texto = normalizarParaComparacao(comentario);
  const contexto = normalizarParaComparacao(
    [
      questao.tema,
      questao.enunciado,
      JSON.stringify(normalizarAlternativas(questao.alternativas)),
    ].join(" ")
  );
  const letra = formatarGabarito(gabaritoOficial.valor === "ANULADA" ? null : gabaritoOficial.valor);

  const rescisaoIndiretaInvertida =
    texto.includes("rescisao indireta") &&
    /\b(empregador|empresa|reclamada)\b/.test(texto) &&
    /\b(declara|declarada|declarar|provoca|provocada|requer|requerida|pede|pedida|pleiteia|pleiteada)\b/.test(texto);

  if (rescisaoIndiretaInvertida) {
    return {
      motivo: "troca de sujeito juridico: rescisao indireta e provocada pelo empregado diante de falta grave do empregador",
      comentarioCorrigido: `A alternativa ${letra} esta correta porque a rescisao indireta e provocada pelo empregado quando ha falta grave do empregador. Nao se deve atribuir ao empregador a titularidade desse pedido, pois isso inverte os sujeitos juridicos da relacao trabalhista.`,
    };
  }

  const contextoRecursal = /\b(recurso|recursal|preparo|custas|deposito recursal)\b/.test(contexto);
  const afirmacaoAbsolutaPreparo =
    contextoRecursal &&
    /\bpreparo\b/.test(texto) &&
    (
      /\bnao exige preparo\b/.test(texto) ||
      /\bsem preparo\b/.test(texto) ||
      /\bsempre\b/.test(texto) ||
      /\bnunca\b/.test(texto) ||
      /\bisent[oa] automaticamente\b/.test(texto)
    );

  if (afirmacaoAbsolutaPreparo) {
    return {
      motivo: "afirmacao absoluta sobre preparo recursal depende do contexto e nao pode ser aprovada automaticamente",
      comentarioCorrigido: `A alternativa ${letra} esta correta porque o preparo recursal deve ser analisado conforme o recurso, a parte recorrente e as regras aplicaveis ao caso concreto. Evite afirmar de forma absoluta que nao ha preparo, que sempre ha dispensa ou que a isencao e automatica quando a questao depender de excecoes.`,
    };
  }

  return null;
}

function removerAberturaDeApresentacao(comentario: string) {
  let texto = normalizarParaComparacao(comentario);

  const aberturas = [
    /^(?:a\s+)?(?:alternativa|letra)\s+[a-d]\s+(?:esta|e|se\s+mostra|se\s+encontra)?\s*(?:correta|certa)?\s*(?:porque|pois)?\s*/,
    /^(?:a\s+)?(?:resposta|opcao)\s+correta\s+(?:esta\s+relacionada\s+(?:ao|a|com)?|esta|e|decorre|se\s+refere)?\s*(?:porque|pois)?\s*/,
    /^(?:o\s+)?gabarito\s+(?:esta|e|se\s+mostra)?\s*(?:correto|certo)?\s*(?:porque|pois)?\s*/,
  ];

  let anterior = "";
  while (texto && texto !== anterior) {
    anterior = texto;
    for (const abertura of aberturas) {
      texto = texto.replace(abertura, "").trim();
    }
  }

  return texto;
}

function tokensNucleoJuridico(comentario: string) {
  const stopwords = new Set([
    "alternativa",
    "letra",
    "resposta",
    "opcao",
    "gabarito",
    "correta",
    "correto",
    "certa",
    "certo",
    "porque",
    "pois",
    "esta",
    "estao",
    "relacionada",
    "relacionado",
    "questao",
  ]);

  return new Set(
    removerAberturaDeApresentacao(comentario)
      .split(" ")
      .filter((token) => token.length > 3 && !stopwords.has(token))
  );
}

function mudouPolaridadeJuridica(antes: string, depois: string) {
  const contarNegacoes = (texto: string) =>
    (normalizarParaComparacao(texto).match(/\b(?:nao|vedad|proibid|impedid|incompativel|invalido|ilicit)\w*\b/g) || [])
      .length;

  return contarNegacoes(antes) !== contarNegacoes(depois);
}

function auditoriaManteveMesmoNucleoJuridico(antes: string, depois: string) {
  const nucleoAntes = removerAberturaDeApresentacao(antes);
  const nucleoDepois = removerAberturaDeApresentacao(depois);

  if (!nucleoAntes || !nucleoDepois || mudouPolaridadeJuridica(antes, depois)) return false;
  if (nucleoAntes === nucleoDepois) return true;
  if (nucleoAntes.length >= 40 && (nucleoDepois.includes(nucleoAntes) || nucleoAntes.includes(nucleoDepois))) {
    return true;
  }

  const tokensAntes = tokensNucleoJuridico(antes);
  const tokensDepois = tokensNucleoJuridico(depois);
  if (tokensAntes.size < 4 || tokensDepois.size < 4) return false;

  let intersecao = 0;
  for (const token of tokensAntes) {
    if (tokensDepois.has(token)) intersecao++;
  }

  return intersecao / tokensAntes.size >= 0.82;
}

function comentarioGenerico(comentario: string, gabaritoOficial: number | null) {
  const texto = normalizarParaComparacao(comentario);
  if (texto.length < 80) return true;

  const temConectorExplicativo =
    /\b(porque|pois|uma vez que|haja vista|conforme|nos termos|previsto|preve|estabelece)\b/.test(texto);
  if (!temConectorExplicativo) return true;

  const letra = gabaritoOficial === null ? "" : formatarGabarito(gabaritoOficial).toLowerCase();
  const marcador = letra ? `alternativa ${letra} esta correta` : "";
  const inicioExplicacao = marcador ? texto.indexOf(marcador) : -1;
  const explicacao =
    inicioExplicacao >= 0 ? texto.slice(inicioExplicacao + marcador.length) : texto;
  if (tokensComparacao(explicacao).size < 10) return true;

  const fraseGenerica =
    /\b(melhor alternativa|mais adequada|opcao correta|resposta correta|conforme o enunciado|de acordo com o enunciado)\b/.test(
      texto
    );
  const temSinalJuridico =
    /\b(artigo|art|lei|codigo|estatuto|constituicao|sumula|jurisprudencia|norma|dispositivo|direito|dever|obrigacao|competencia|prazo|processo|contrato|responsabilidade|advogado|oab|tribut|penal|civil|administrativ|constitucional|trabalho)\b/.test(
      texto
    );

  return fraseGenerica && !temSinalJuridico;
}

function validarComentarioGerado(
  comentarioNovo: string,
  comentarioAntes: string,
  gabaritoOficial: number | null
) {
  const resultado = {
    erros: [] as string[],
    alertas: [] as string[],
    parecidoComAnterior: false,
    referenciasNormativasChecadas: false,
    referenciasNormativasAjustadas: false,
  };

  if (!normalizarTexto(comentarioNovo)) {
    resultado.erros.push("Comentario vazio.");
    return resultado;
  }

  if (comentarioGenerico(comentarioNovo, gabaritoOficial)) {
    resultado.erros.push("Comentario vazio, curto ou generico demais para explicacao juridica confiavel.");
  }

  if (gabaritoOficial === null) {
    resultado.erros.push("Nao ha gabarito oficial para validar o comentario.");
    return resultado;
  }

  if (comentarioContradizGabaritoOficial(comentarioNovo, gabaritoOficial)) {
    resultado.erros.push(MOTIVO_COMENTARIO_CONTRADIZ_GABARITO);
  }

  if (!comentarioMencionaGabaritoOficial(comentarioNovo, gabaritoOficial)) {
    resultado.erros.push(
      `Comentario nao menciona que a alternativa oficial ${formatarGabarito(gabaritoOficial)} esta correta.`
    );
  }

  if (comentarioMuitoParecidoComAntigo(comentarioNovo, comentarioAntes)) {
    resultado.parecidoComAnterior = true;
    resultado.alertas.push(
      "Comentario parecido com anterior, mas coerente com o gabarito oficial."
    );
  }

  return resultado;
}

function revisarPorRegraConhecidaLocal(
  questao: Questao,
  gabaritoOficial: GabaritoOficialQuestao,
  regra: RegraQuestaoConhecida,
  opcoes: { dinamica?: boolean } = {}
): { json: Record<string, unknown>; validacaoComentario: ValidacaoComentario } {
  const gabaritoOficialNumero =
    gabaritoOficial.valor !== "ANULADA" ? gabaritoOficial.valor : null;
  const comentarioBruto = normalizarTexto(regra.comentario_seguro);
  const comentarioSanitizado = sanitizarReferenciasNormativasBloqueadas(comentarioBruto);
  const referenciasNormativasAjustadas = comentarioBruto !== comentarioSanitizado;
  const validacao = validarComentarioGerado(
    comentarioSanitizado,
    normalizarTexto(questao.comentario),
    gabaritoOficialNumero
  );
  const statusAuditoriaLocal: ValidacaoComentario["auditoriaSemanticaStatus"] =
    validacao.erros.includes(MOTIVO_COMENTARIO_CONTRADIZ_GABARITO)
      ? "ERRO_JURIDICO"
      : "APROVADO";
  const motivo = opcoes.dinamica
    ? "corrigido por regra local dinamica"
    : "corrigido por regra conhecida local";

  return {
    json: {
      materia: questao.materia || "",
      tema: questao.tema || "",
      dificuldade: normalizarDificuldade(questao.dificuldade),
      corrigir_enunciado: false,
      enunciado_corrigido: questao.enunciado || "",
      corrigir_alternativas: false,
      alternativas_corrigidas: normalizarAlternativas(questao.alternativas),
      gabarito_correto: formatarGabarito(gabaritoOficialNumero),
      confianca_correcao: validacao.erros.length === 0 ? 100 : 0,
      comentario: comentarioSanitizado,
      motivo_alteracao: motivo,
      motivo_revisao_humana: "",
      problemas_qualidade: { enunciado: [], alternativas: [], gabarito: [] },
      _provedor_ia: "local",
      _modelo_ia: "regra-conhecida-local",
      _motivo_provedor_ia: "comentario seguro local usado antes de chamar IA",
      _fallback_ia_usado: false,
      _regra_conhecida_local: true,
      _regra_local_dinamica: opcoes.dinamica === true,
      _regra_conhecida_instituto_central: regra.instituto_central,
      _regra_conhecida_evitar: regra.evitar,
    },
    validacaoComentario: {
      tentativas: 0,
      erros: validacao.erros,
      alertas: [
        ...validacao.alertas,
        `Regra conhecida local aplicada: ${regra.instituto_central}`,
      ],
      geradoDoZero: true,
      parecidoComAnterior: validacao.parecidoComAnterior,
      regeneradoPorFugaTema: false,
      autocorrecaoAvancadaStatus: "NAO_NECESSARIA",
      autocorrecaoAvancadaMotivo: "regra conhecida local usada antes de IA",
      autocorrecaoAvancadaModelo: "nao usado",
      autocorrecaoAvancadaComentarioFinal: comentarioSanitizado,
      referenciasNormativasChecadas: true,
      referenciasNormativasAjustadas,
      auditoriaSemanticaExecutada: true,
      auditoriaSemanticaAprovada: validacao.erros.length === 0,
      auditoriaSemanticaCorrigida: false,
      auditoriaSemanticaMelhoriaIgnorada: false,
      auditoriaSemanticaMotivo:
        statusAuditoriaLocal === "ERRO_JURIDICO"
          ? MOTIVO_COMENTARIO_CONTRADIZ_GABARITO
          : motivo,
      auditoriaSemanticaStatus: statusAuditoriaLocal,
      aderenciaEnunciadoExecutada: true,
      aderenteQuestao: validacao.erros.length === 0,
      aderenciaEnunciadoMotivo:
        validacao.erros.length === 0
          ? `regra local aderente ao instituto central: ${regra.instituto_central}`
          : "regra local rejeitada pelas validacoes locais",
      comentariosRejeitadosFugaTema: 0,
      regraLocalDinamicaStatus: opcoes.dinamica ? "USADA" : "NAO_CRIADA",
      regraLocalDinamicaMotivo: opcoes.dinamica
        ? "regra dinamica carregada antes de chamar IA"
        : "regra dinamica nao necessaria",
      regraLocalDinamicaCaminho: REGRAS_CONHECIDAS_DINAMICAS_FILE,
    },
  };
}

function dataIsoEhHoje(valor: unknown) {
  const data = Date.parse(String(valor || ""));
  if (!Number.isFinite(data)) return false;

  return new Date(data).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
}

function fallbackForteFalhouHojeMesmoMotivo(questao: Questao, motivoAtual: string) {
  const validacao = obterValidacaoTriplaSalva(questao);
  if (!dataIsoEhHoje(validacao.fallback_forte_falhou_em)) return null;

  const motivoAnterior = normalizarParaComparacao(validacao.fallback_forte_motivo);
  const motivoNovo = normalizarParaComparacao(motivoAtual);
  const mesmoMotivo =
    motivoAnterior &&
    motivoNovo &&
    (motivoAnterior === motivoNovo ||
      motivoAnterior.includes(motivoNovo) ||
      motivoNovo.includes(motivoAnterior));

  if (!mesmoMotivo) return null;

  return {
    motivo: normalizarTexto(validacao.fallback_forte_motivo) || motivoAtual,
    modelo: normalizarTexto(validacao.fallback_forte_modelo) || getStrongModelLabel() || "nao configurado",
  };
}

function erroSomenteFormatoAlternativaOficial(erros: string[]) {
  const errosNormalizados = erros.map(normalizarParaComparacao);

  const faltaPrefixo = errosNormalizados.some((erro) =>
    erro.includes("nao menciona que a alternativa oficial")
  );

  const somenteProblemasDeForma = errosNormalizados.every(
    (erro) =>
      erro.includes("nao menciona que a alternativa oficial") ||
      erro.includes("vazio curto ou generico demais")
  );

  return faltaPrefixo && somenteProblemasDeForma;
}

function prefixarAlternativaOficial(comentario: string, gabaritoOficial: number | null) {
  const texto = normalizarTexto(comentario);
  if (gabaritoOficial === null || !texto) return texto;
  if (comentarioMencionaGabaritoOficial(texto, gabaritoOficial)) return texto;

  const letra = formatarGabarito(gabaritoOficial);

  const padroes = [
    /^A alternativa correta (?:destaca|afirma|indica|aponta|explica)\s+que\s+/i,
    /^A resposta correta (?:destaca|afirma|indica|aponta|explica)\s+que\s+/i,
    /^A opcao correta (?:destaca|afirma|indica|aponta|explica)\s+que\s+/i,
    /^A opção correta (?:destaca|afirma|indica|aponta|explica)\s+que\s+/i,
  ];

  for (const padrao of padroes) {
    if (padrao.test(texto)) {
      return texto.replace(padrao, `A alternativa ${letra} esta correta porque `);
    }
  }

  const primeira = texto.charAt(0).toLowerCase();
  const restante = texto.slice(1);
  return `A alternativa ${letra} esta correta porque ${primeira}${restante}`;
}

function termosEvitarDoTexto(textoBruto: string) {
  const texto = normalizarParaComparacao(textoBruto);
  const candidatos = [
    { termo: "Corte Interamericana", padrao: "corte interamericana" },
    { termo: "OEA", padrao: "oea" },
    { termo: "jurisdicao", padrao: "jurisdicao" },
    { termo: "tratados internacionais", padrao: "tratados internacionais" },
    { termo: "divorcio", padrao: "divorcio" },
    { termo: "separacao judicial", padrao: "separacao judicial" },
    { termo: "separacao de fato", padrao: "separacao de fato" },
    { termo: "usucapiao", padrao: "usucapiao" },
    { termo: "desapropriacao", padrao: "desapropriacao" },
    { termo: "principio do poluidor-pagador", padrao: "poluidor pagador" },
  ];

  return candidatos.filter((item) => texto.includes(item.padrao)).map((item) => item.termo);
}

function comentarioContemTermosProibidos(comentario: string, evitar: string[]) {
  const texto = normalizarParaComparacao(comentario);
  return evitar.some((termo) => {
    const normalizado = normalizarParaComparacao(termo);
    return normalizado && texto.includes(normalizado);
  });
}

function salvarRegraDinamicaAprovada(params: {
  questao: Questao;
  gabaritoOficial: GabaritoOficialQuestao;
  comentario: string;
  institutoCentral: string;
  origem: string;
  comentarioRejeitado: string;
  motivoRejeicao: string;
}) {
  const gabaritoOficialNumero =
    params.gabaritoOficial.valor !== "ANULADA" ? params.gabaritoOficial.valor : null;
  const id = Number(params.questao.id);
  const numeroSalvo = obterNumeroQuestaoSalvo(params.questao);
  const comentario = normalizarTexto(params.comentario);
  const institutoCentral =
    normalizarTexto(params.institutoCentral) || normalizarTexto(params.questao.tema);
  const evitar = termosEvitarDoTexto(`${params.comentarioRejeitado} ${params.motivoRejeicao}`);

  if (!Number.isInteger(id) || id <= 0) {
    return { status: "NAO_CRIADA" as const, motivo: "id da questao invalido", evitar };
  }
  if (gabaritoOficialNumero === null) {
    return { status: "NAO_CRIADA" as const, motivo: "gabarito oficial ausente ou anulado", evitar };
  }
  if (!numeroSalvo || numeroSalvo !== params.gabaritoOficial.numeroQuestao) {
    return { status: "NAO_CRIADA" as const, motivo: "numero_questao nao confere com gabarito oficial", evitar };
  }
  if (!institutoCentral) {
    return { status: "NAO_CRIADA" as const, motivo: "instituto central nao identificado", evitar };
  }

  const validacao = validarComentarioGerado(
    comentario,
    normalizarTexto(params.questao.comentario),
    gabaritoOficialNumero
  );
  if (validacao.erros.length > 0) {
    return {
      status: "NAO_CRIADA" as const,
      motivo: `comentario final nao passou validacao local: ${validacao.erros.join(" ")}`,
      evitar,
    };
  }
  if (comentarioContemTermosProibidos(comentario, evitar)) {
    return {
      status: "NAO_CRIADA" as const,
      motivo: "comentario final contem termo proibido extraido da fuga de tema",
      evitar,
    };
  }

  try {
    const regras = carregarRegrasConhecidasDinamicas();
    regras[String(id)] = {
      instituto_central: institutoCentral,
      evitar,
      comentario_seguro: comentario,
      origem: params.origem,
      criado_em: new Date().toISOString(),
      numero_questao: params.gabaritoOficial.numeroQuestao,
      prova_codigo: params.gabaritoOficial.codigoProva,
      gabarito_oficial: formatarGabarito(gabaritoOficialNumero),
      fonte_gabarito: `${params.gabaritoOficial.arquivo}:${params.gabaritoOficial.linha}`,
    };
    salvarRegrasConhecidasDinamicas(regras);
  } catch (err) {
    const motivo = err instanceof Error ? err.message : "falha ao salvar regra dinamica";
    return { status: "NAO_CRIADA" as const, motivo, evitar };
  }

  return {
    status: "CRIADA" as const,
    motivo: params.origem.includes("fallback")
      ? "fallback forte aprovado pelo auditor e salvo como regra local dinamica"
      : "correcao aprovada promovida para regra local dinamica",
    evitar,
  };
}


function resultadoElegivelParaRegraDinamica(
  resultado: ResultadoQuestao,
  gabaritoOficial: GabaritoOficialQuestao | null
) {
  const validacao = resultado.depois.validacaoTripla;
  const gabaritoOficialNumero =
    gabaritoOficial && gabaritoOficial.valor !== "ANULADA" ? gabaritoOficial.valor : null;

  if (!gabaritoOficial || gabaritoOficialNumero === null) {
    return { elegivel: false, motivo: "gabarito oficial ausente ou anulado" };
  }

  if (resultado.depois.revisaoHumanaNecessaria) {
    return { elegivel: false, motivo: "questao marcada para revisao humana" };
  }

  if (validacao.regra_local_dinamica_status === "USADA" || validacao.regra_local_dinamica_status === "CRIADA") {
    return { elegivel: false, motivo: "regra dinamica ja existente ou ja criada" };
  }

  if (!resultado.mudancas.comentario) {
    return { elegivel: false, motivo: "comentario nao foi alterado" };
  }

  if (
    resultado.mudancas.enunciado ||
    resultado.mudancas.alternativas ||
    resultado.mudancas.gabarito ||
    resultado.mudancas.materia ||
    resultado.mudancas.tema
  ) {
    return { elegivel: false, motivo: "houve mudanca estrutural; regra dinamica nao criada por seguranca" };
  }

  if (resultado.depois.comentarioAuditado !== true) {
    return { elegivel: false, motivo: "comentario ainda nao foi auditado" };
  }

  const comentarioAnterior = normalizarTexto(resultado.antes.comentario);
  const comentarioAnteriorGenericoOuIncompleto =
    comentarioGenerico(comentarioAnterior, gabaritoOficialNumero) ||
    !comentarioMencionaGabaritoOficial(comentarioAnterior, gabaritoOficialNumero) ||
    comentarioContradizGabaritoOficial(comentarioAnterior, gabaritoOficialNumero);

  const houveCorrecaoRelevante =
    validacao.auditoria_semantica_corrigida === true ||
    validacao.autocorrecao_avancada_status === "FALLBACK_FORTE_USADO" ||
    validacao.comentario_regenerado_por_fuga_tema === true ||
    comentarioAnteriorGenericoOuIncompleto;

  if (!houveCorrecaoRelevante) {
    return {
      elegivel: false,
      motivo: "comentario aprovado apenas como melhoria de estilo; regra dinamica nao criada",
    };
  }

  if (
    validacao.auditoria_semantica_melhoria_ignorada === true &&
    validacao.auditoria_semantica_corrigida !== true &&
    validacao.autocorrecao_avancada_status !== "FALLBACK_FORTE_USADO" &&
    validacao.comentario_regenerado_por_fuga_tema !== true &&
    !comentarioAnteriorGenericoOuIncompleto
  ) {
    return {
      elegivel: false,
      motivo: "melhoria de estilo/completude ignorada; regra dinamica nao criada para evitar cache desnecessario",
    };
  }

  if (validacao.comentario_aderencia_executada === true && validacao.comentario_aderente_questao !== true) {
    return { elegivel: false, motivo: "comentario nao aderente ao enunciado" };
  }

  if (Array.isArray(validacao.comentario_validacao_erros) && validacao.comentario_validacao_erros.length > 0) {
    return { elegivel: false, motivo: "comentario possui erros de validacao" };
  }

  const validacaoLocal = validarComentarioGerado(
    resultado.depois.comentarioNovo,
    resultado.antes.comentario,
    gabaritoOficialNumero
  );

  if (validacaoLocal.erros.length > 0) {
    return {
      elegivel: false,
      motivo: `comentario final nao passou validacao local: ${validacaoLocal.erros.join(" ")}`,
    };
  }

  return { elegivel: true, motivo: "comentario corrigido, auditado e aderente" };
}

function promoverRegraDinamicaResultado(
  resultado: ResultadoQuestao,
  gabaritoOficial: GabaritoOficialQuestao | null,
  dryRun: boolean
) {
  const validacao = resultado.depois.validacaoTripla;
  const elegibilidade = resultadoElegivelParaRegraDinamica(resultado, gabaritoOficial);

  if (!elegibilidade.elegivel) {
    if (!validacao.regra_local_dinamica_status) {
      validacao.regra_local_dinamica_status = "NAO_CRIADA";
      validacao.regra_local_dinamica_motivo = elegibilidade.motivo;
      validacao.regra_local_dinamica_caminho = REGRAS_CONHECIDAS_DINAMICAS_FILE;
    }
    return;
  }

  const gabaritoOficialNumero =
    gabaritoOficial && gabaritoOficial.valor !== "ANULADA" ? gabaritoOficial.valor : null;
  const alternativaCorreta =
    gabaritoOficialNumero !== null ? resultado.depois.alternativasNovas[gabaritoOficialNumero] || "" : "";
  const institutoCentral =
    comentarioExplicaInstitutoCentral(
      resultado.questao,
      resultado.depois.comentarioNovo,
      alternativaCorreta
    ) ||
    normalizarTexto(resultado.depois.temaNovo) ||
    normalizarTexto(resultado.questao.tema) ||
    "instituto central da questao";
  const origem =
    resultado.depois.validacaoTripla.autocorrecao_avancada_status === "FALLBACK_FORTE_USADO"
      ? "fallback_forte_aprovado_pelo_auditor"
      : resultado.depois.validacaoTripla.auditoria_semantica_corrigida === true
      ? "auditoria_semantica_corrigiu_erro_juridico"
      : "comentario_aprovado_pelo_pipeline";

  if (dryRun) {
    validacao.regra_local_dinamica_status = "NAO_CRIADA";
    validacao.regra_local_dinamica_motivo = "dry-run: regra dinamica seria criada em execucao real";
    validacao.regra_local_dinamica_caminho = REGRAS_CONHECIDAS_DINAMICAS_FILE;
    return;
  }

  const regraDinamica = salvarRegraDinamicaAprovada({
    questao: resultado.questao,
    gabaritoOficial: gabaritoOficial!,
    comentario: resultado.depois.comentarioNovo,
    institutoCentral,
    origem,
    comentarioRejeitado: resultado.antes.comentario,
    motivoRejeicao: normalizarTexto(resultado.depois.comentarioAuditoriaMotivo) ||
      normalizarTexto(validacao.comentario_aderencia_motivo) ||
      normalizarTexto(resultado.depois.motivoAlteracao),
  });

  validacao.regra_local_dinamica_status = regraDinamica.status;
  validacao.regra_local_dinamica_motivo = regraDinamica.motivo;
  validacao.regra_local_dinamica_caminho = REGRAS_CONHECIDAS_DINAMICAS_FILE;
  resultado.depois.comentarioAuditoriaMotivo =
    regraDinamica.status === "CRIADA"
      ? "corrigido e promovido para regra local dinamica"
      : resultado.depois.comentarioAuditoriaMotivo;
}

function esperar(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function detectarProblemasLocais(questao: Questao): ProblemasQualidade {
  const enunciado = normalizarTexto(questao.enunciado);
  const alternativas = normalizarAlternativas(questao.alternativas);
  const problemas: ProblemasQualidade = {
    enunciado: [],
    alternativas: [],
    gabarito: [],
  };

  if (enunciado.length < 40) {
    problemas.enunciado.push("Enunciado curto demais ou possivelmente incompleto.");
  }
  if (/[�]{1,}|Ã.|Â./.test(enunciado)) {
    problemas.enunciado.push("Enunciado contem indicios de problema de codificacao/OCR.");
  }
  if (!/[?.:]$/.test(enunciado) && enunciado.length < 220) {
    problemas.enunciado.push("Enunciado pode estar cortado.");
  }

  if (alternativas.length !== 4) {
    problemas.alternativas.push(`Quantidade de alternativas invalida: ${alternativas.length}.`);
  }

  alternativas.forEach((alt, index) => {
    if (!alt) problemas.alternativas.push(`Alternativa ${LETRAS[index] || index + 1} vazia.`);
    if (/[�]{1,}|Ã.|Â./.test(alt)) {
      problemas.alternativas.push(`Alternativa ${LETRAS[index] || index + 1} contem indicios de codificacao/OCR.`);
    }
    if (alt.length > 0 && alt.length < 8) {
      problemas.alternativas.push(`Alternativa ${LETRAS[index] || index + 1} muito curta.`);
    }
  });

  const duplicadas = alternativas
    .map((alt) => alt.toLowerCase())
    .filter((alt, index, arr) => alt && arr.indexOf(alt) !== index);
  if (duplicadas.length > 0) {
    problemas.alternativas.push("Ha alternativas duplicadas ou praticamente iguais.");
  }

  if (normalizarGabarito(questao.gabarito) === null) {
    problemas.gabarito.push("Gabarito atual invalido ou fora de A-D.");
  }

  return problemas;
}

function juntarProblemas(a: ProblemasQualidade, b: Partial<ProblemasQualidade>): ProblemasQualidade {
  return {
    enunciado: [...new Set([...(a.enunciado || []), ...((b.enunciado as string[]) || [])])],
    alternativas: [...new Set([...(a.alternativas || []), ...((b.alternativas as string[]) || [])])],
    gabarito: [...new Set([...(a.gabarito || []), ...((b.gabarito as string[]) || [])])],
  };
}

function extrairProblemasIa(valor: unknown): Partial<ProblemasQualidade> {
  if (!valor || typeof valor !== "object") return {};
  const record = valor as Record<string, unknown>;
  const toArray = (field: unknown) => (Array.isArray(field) ? field.map(normalizarTexto).filter(Boolean) : []);
  return {
    enunciado: toArray(record.enunciado),
    alternativas: toArray(record.alternativas),
    gabarito: toArray(record.gabarito),
  };
}

async function checarReferenciasNormativasComGroq(
  questao: Questao,
  comentario: string,
  gabaritoOficial: GabaritoOficialQuestao
): Promise<ChecagemReferenciasNormativas> {
  const comentarioOriginal = normalizarTexto(comentario);
  void questao;
  void gabaritoOficial;

  if (!comentarioPossuiReferenciaNormativaBloqueada(comentarioOriginal)) {
    return {
      comentario: comentarioOriginal,
      checadas: false,
      ajustadas: false,
      alertas: [],
    };
  }

  const comentarioSeguro = sanitizarReferenciasNormativasBloqueadas(comentarioOriginal);
  return {
    comentario: comentarioSeguro,
    checadas: true,
    ajustadas: comentarioSeguro !== comentarioOriginal,
    alertas: [
      "Referencias normativas especificas removidas automaticamente pela blindagem anti-alucinacao.",
    ],
  };
}

async function auditarComentarioSemanticoComGroq(
  questao: Questao,
  comentario: string,
  gabaritoOficial: GabaritoOficialQuestao,
  providerMode: AiProviderMode
): Promise<AuditoriaComentario> {
  const alternativas = normalizarAlternativas(questao.alternativas);
  const comentarioAtual = sanitizarReferenciasNormativasBloqueadas(comentario);
  const gabaritoOficialNumero =
    gabaritoOficial.valor !== "ANULADA" ? gabaritoOficial.valor : null;
  const contradicaoInicial = analisarLetrasDoComentario(
    comentarioAtual,
    gabaritoOficialNumero
  );

  if (contradicaoInicial.contradizGabarito) {
    return {
      comentario: comentarioAtual,
      status: "ERRO_JURIDICO",
      aprovado: false,
      corrigido: false,
      melhoriaIgnorada: false,
      motivo: MOTIVO_COMENTARIO_CONTRADIZ_GABARITO,
      alertas: [MOTIVO_COMENTARIO_CONTRADIZ_GABARITO],
    };
  }

  const messages: AiMessage[] = [
      {
        role: "system",
        content: `
Voce e auditor semantico conservador de comentarios de questoes OAB.

Objetivo:
- verificar SOMENTE se existe erro juridico real no comentario;
- o gabarito oficial do TXT e verdade absoluta;
- voce NAO pode alterar gabarito, enunciado, alternativas, materia ou tema;
- avalie apenas o comentario.

Regras importantes:
- Voce e fiscal, nao professor de redacao.
- Voce NAO e editor de texto.
- Voce NAO deve melhorar estilo.
- Voce NAO deve trocar palavras por preferencia.
- Voce NAO deve corrigir apenas porque a explicacao poderia ficar mais completa.
- Voce NAO deve corrigir apenas para adicionar "A alternativa X esta correta porque".
- Voce NAO deve corrigir "sancao aplicada" para "sancao disciplinar aplicada" se o sentido juridico estiver correto.

Retorne CORRIGIDO_ERRO_JURIDICO somente quando houver erro juridico real:
- conceito juridico realmente falso;
- comentario ensina regra errada;
- comentario defendendo alternativa diferente do gabarito oficial;
- troca sujeito juridico;
- inverte obrigacao ou direito.
- troca titular do direito/dever, especialmente empregado e empregador;
- afirma de forma absoluta regra recursal que depende do contexto, de excecao ou da parte recorrente.

Regras especificas:
- Rescisao indireta e provocada pelo empregado diante de falta grave do empregador. Nunca atribua ao empregador o pedido/declaracao de rescisao indireta.
- Justa causa e aplicada pelo empregador ao empregado. Nunca inverta esse sujeito.
- Em preparo recursal, cuidado com frases absolutas como "nao exige preparo", "sempre", "nunca" ou "isento automaticamente"; se depender do contexto da questao, trate como erro juridico real.

Se o comentario estiver correto, ainda que incompleto, simples ou com redacao diferente, retorne APROVADO.
Se voce apenas sugeriria melhoria de clareza, estilo, completude, precisao terminologica ou inclusao da frase "A alternativa X esta correta", retorne APROVADO e mantenha o comentario original.
Se antes e depois defendem a mesma tese juridica e mudam somente apresentacao, retorne APROVADO.

Exemplos que devem ser APROVADO, nao CORRIGIDO_ERRO_JURIDICO:
- trocar "A tecnica utilizada pelo STF e a analogia" por "A alternativa C esta correta porque a tecnica utilizada..." e apenas melhoria de escrita;
- trocar "sancao aplicada" por "sancao disciplinar aplicada" e apenas precisao terminologica se o sentido juridico ja estiver correto.
- trocar "O gabarito esta correto porque o habeas data..." por "A alternativa C esta correta porque o habeas data..." e apenas troca de abertura;
- trocar "A resposta correta esta relacionada..." por "A alternativa B esta correta porque..." e apenas troca de apresentacao se o nucleo juridico for o mesmo.

Exemplos que devem ser CORRIGIDO_ERRO_JURIDICO:
- dizer que a rescisao indireta pode ser declarada pelo empregador;
- dizer que o empregado aplica justa causa ao empregador;
- dizer em tema de recurso que "nao exige preparo" de forma absoluta quando a resposta depende de excecao, parte recorrente ou contexto.

Se e somente se retornar CORRIGIDO_ERRO_JURIDICO:
- escreva um comentario corrigido;
- comece com "A alternativa ${formatarGabarito(gabaritoOficial.valor === "ANULADA" ? null : gabaritoOficial.valor)} esta correta porque...";
- mantenha explicacao conceitual estilo professor OAB;
- nao cite numeros de lei, artigos, incisos, paragrafos, sumulas, RE, ARE, ADI, ADC, ADPF ou Tema STF/STJ.

Retorne apenas JSON:
{
  "status": "APROVADO",
  "motivo": "comentario juridicamente correto",
  "melhoria_ignorada": false,
  "comentario_corrigido": ""
}
`,
      },
      {
        role: "user",
        content: `
Enunciado:
${questao.enunciado || ""}

Alternativas:
${JSON.stringify(alternativas, null, 2)}

Gabarito oficial:
${formatarGabaritoOficial(gabaritoOficial)}

Comentario atual:
${comentarioAtual}
`,
      },
  ];

  const resposta = await gerarJsonComFallback({
    messages,
    providerMode,
    responseLabel: "auditoria_semantica",
  });
  const json = resposta.json;
  const statusRaw = normalizarTexto(json.status).toUpperCase();
  const statusInicial: AuditoriaComentario["status"] =
    statusRaw === "CORRIGIDO_ERRO_JURIDICO"
      ? "CORRIGIDO_ERRO_JURIDICO"
      : statusRaw === "ERRO_JURIDICO"
        ? "ERRO_JURIDICO"
      : statusRaw === "IGNORADO_MELHORIA_ESTILO"
        ? "IGNORADO_MELHORIA_ESTILO"
        : "APROVADO";
  const motivo = normalizarTexto(json.motivo) || "Auditoria semantica executada.";
  const corrigido = normalizarTexto(json.comentario_corrigido);
  const erroCriticoLocal = detectarErroJuridicoCriticoLocal(
    questao,
    comentarioAtual,
    gabaritoOficial
  );
  const statusBase: AuditoriaComentario["status"] = erroCriticoLocal
    ? "CORRIGIDO_ERRO_JURIDICO"
    : statusInicial;
  const motivoBase = erroCriticoLocal?.motivo || motivo;
  const corrigidoBase = erroCriticoLocal?.comentarioCorrigido || corrigido;
  const melhoriaIgnorada =
    !erroCriticoLocal &&
    (
      json.melhoria_ignorada === true ||
      statusBase === "IGNORADO_MELHORIA_ESTILO" ||
      (
        statusBase === "CORRIGIDO_ERRO_JURIDICO" &&
        (
          auditoriaDescreveApenasMelhoria(motivoBase) ||
          (Boolean(corrigidoBase) && auditoriaManteveMesmoNucleoJuridico(comentarioAtual, corrigidoBase))
        )
      )
    );
  const deveCorrigir =
    statusBase === "CORRIGIDO_ERRO_JURIDICO" && Boolean(corrigidoBase) && !melhoriaIgnorada;
  const statusAntesValidacaoFinal: AuditoriaComentario["status"] =
    statusBase === "IGNORADO_MELHORIA_ESTILO" || melhoriaIgnorada
      ? "APROVADO"
      : statusBase === "ERRO_JURIDICO"
      ? "ERRO_JURIDICO"
      : statusBase === "CORRIGIDO_ERRO_JURIDICO" && !deveCorrigir
      ? "ERRO_JURIDICO"
      : statusBase;
  const comentarioFinal = sanitizarReferenciasNormativasBloqueadas(
    deveCorrigir ? corrigidoBase : comentarioAtual
  );
  const contradicaoFinal = analisarLetrasDoComentario(
    comentarioFinal,
    gabaritoOficialNumero
  );
  const status: AuditoriaComentario["status"] = contradicaoFinal.contradizGabarito
    ? "ERRO_JURIDICO"
    : statusAntesValidacaoFinal;
  const motivoNormalizado = contradicaoFinal.contradizGabarito
    ? MOTIVO_COMENTARIO_CONTRADIZ_GABARITO
    : normalizarMotivoAuditoria(status, motivoBase, melhoriaIgnorada, false);
  const aprovado =
    status === "APROVADO" ||
    (status === "CORRIGIDO_ERRO_JURIDICO" && deveCorrigir && !contradicaoFinal.contradizGabarito);

  return {
    comentario: contradicaoFinal.contradizGabarito ? comentarioAtual : comentarioFinal,
    status,
    aprovado,
    corrigido: aprovado && deveCorrigir,
    melhoriaIgnorada: aprovado ? melhoriaIgnorada : false,
    motivo: motivoNormalizado,
    alertas: [
      status === "ERRO_JURIDICO"
        ? MOTIVO_COMENTARIO_CONTRADIZ_GABARITO
        : status === "CORRIGIDO_ERRO_JURIDICO"
        ? "Auditoria semantica corrigiu erro juridico grave antes de salvar."
        : melhoriaIgnorada
          ? "Auditoria semantica ignorou melhoria de estilo/completude sem erro grave."
          : "Auditoria semantica aprovou o comentario.",
    ],
  };
}

async function verificarAderenciaComentarioComGroq(
  questao: Questao,
  comentario: string,
  gabaritoOficial: GabaritoOficialQuestao,
  providerMode: AiProviderMode,
  auditoriaSemanticaAprovada: boolean
): Promise<AderenciaComentario> {
  const alternativas = normalizarAlternativas(questao.alternativas);
  const gabaritoNumero = gabaritoOficial.valor !== "ANULADA" ? gabaritoOficial.valor : null;
  const alternativaCorreta =
    gabaritoNumero === null ? "" : alternativas[gabaritoNumero] || "";

  const messages: AiMessage[] = [
    {
      role: "system",
      content: `
Voce e auditor de aderencia de comentarios OAB.

Objetivo:
- verificar se o comentario explica exatamente o problema apresentado no enunciado;
- comparar enunciado, alternativa correta oficial e comentario;
- o gabarito oficial do TXT e verdade absoluta;
- nao corrija o comentario, apenas classifique aderencia.

Regra central:
- Nao basta o comentario estar juridicamente correto isoladamente.
- Nao basta o comentario pertencer a mesma materia ou disciplina.
- Compare o instituto juridico central do enunciado/alternativas com o instituto juridico central do comentario.
- Retorne NAO se o comentario explicar outro instituto, outro pedido, outro recurso, outra consequencia juridica, outro momento processual ou outro assunto da disciplina.
- Retorne SIM somente se o comentario justificar a alternativa oficial dentro do caso/problema narrado no enunciado.
- Retorne SIM quando o comentario tratar de subtopico diretamente relacionado ao tema da questao.
- Se a auditoria juridica estiver correta e a diferenca for apenas entre tema geral e subtopico natural do mesmo tema, nao trate como fuga de tema.

Exemplos de NAO:
- enunciado sobre valor da causa, comentario sobre cabimento de apelacao contra indeferimento;
- enunciado sobre conexao e reuniao de processos, comentario sobre incompetencia relativa na contestacao.
- enunciado sobre uniao estavel/sucessao, comentario sobre divorcio ou separacao judicial;
- enunciado sobre direito de vizinhanca, comentario sobre usucapiao ou desapropriacao;
- enunciado sobre responsabilidade civil ambiental objetiva, comentario apenas sobre principio do poluidor-pagador.

Exemplos de SIM:
- enunciado sobre regime de cumprimento de pena, comentario sobre regime aberto, fechado, semiaberto ou progressao de regime;
- enunciado sobre acao penal, comentario sobre representacao, acao penal publica condicionada ou incondicionada;
- enunciado sobre prisao preventiva, comentario sobre requisitos ou garantia da ordem publica;
- enunciado sobre inquerito policial, comentario sobre dispensabilidade do inquerito ou oferecimento da denuncia.

Retorne apenas JSON:
{
  "aderente_a_questao": "SIM",
  "motivo": "comentario explica o mesmo problema do enunciado"
}
`,
    },
    {
      role: "user",
      content: `
Enunciado:
${questao.enunciado || ""}

Alternativa correta oficial (${formatarGabarito(gabaritoNumero)}):
${alternativaCorreta}

Gabarito oficial:
${formatarGabaritoOficial(gabaritoOficial)}

Comentario novo:
${comentario}
`,
    },
  ];

  const resposta = await gerarJsonComFallback({
    messages,
    providerMode,
    responseLabel: "aderencia_comentario",
  });

  const status = removerAcentos(normalizarTexto(resposta.json.aderente_a_questao)).toUpperCase();
  const aderenteIa = status === "SIM";
  const subtopicoRelacionado = subtopicoDiretamenteRelacionadoAoTema(
    questao,
    comentario,
    alternativaCorreta
  );
  const divergenciaInstituto = divergenciaDeInstitutoCentral(
    questao,
    comentario,
    alternativaCorreta
  );
  const institutoCentralExplicado = comentarioExplicaInstitutoCentral(
    questao,
    comentario,
    alternativaCorreta
  );
  const aderente =
    !divergenciaInstituto &&
    (aderenteIa ||
      (auditoriaSemanticaAprovada && (Boolean(subtopicoRelacionado) || Boolean(institutoCentralExplicado))));
  const aderenciaForcada =
    !aderenteIa && aderente && (Boolean(subtopicoRelacionado) || Boolean(institutoCentralExplicado));
  const motivoIa = normalizarTexto(resposta.json.motivo);

  return {
    aderente,
    aderenciaForcada,
    motivo:
      divergenciaInstituto
        ? divergenciaInstituto
        :
      aderenciaForcada && subtopicoRelacionado
        ? `Comentario trata de subtopico diretamente relacionado ao tema ${subtopicoRelacionado}.`
        :
      aderenciaForcada && institutoCentralExplicado
        ? `Comentario explica o instituto central do enunciado: ${institutoCentralExplicado}.`
        : motivoIa || (aderente ? "Comentario aderente." : "Comentario fugiu do tema."),
  };
}

async function revisarComGroq(
  questao: Questao,
  gabaritoOficial: GabaritoOficialQuestao | null,
  providerMode: AiProviderMode,
  tentativa = 1,
  motivoRejeicao = ""
) {
  const alternativas = normalizarAlternativas(questao.alternativas);
  const problemasLocais = detectarProblemasLocais(questao);
  const gabaritoOficialNumero =
    gabaritoOficial && gabaritoOficial.valor !== "ANULADA" ? gabaritoOficial.valor : null;
  const gabaritoOficialLetra = formatarGabarito(gabaritoOficialNumero);
  const feedbackRejeicao = feedbackRegeneracaoComentario(motivoRejeicao);

  const messages: AiMessage[] = [
      {
        role: "system",
        content: `
Voce e revisor senior de banco de questoes da OAB.

Objetivo:
- validar qualidade juridica e qualidade de extracao;
- corrigir materia, tema, dificuldade e comentario;
- corrigir enunciado/alternativas apenas quando houver erro claro de OCR, parser, corte ou formatacao;
- usar o gabarito oficial informado pelo TXT como resposta obrigatoria.

Regras de seguranca:
- Retorne apenas JSON valido.
- Nao invente artigo, sumula ou jurisprudencia. Se nao souber o fundamento exato, explique sem citar numero.
- O gabarito oficial do TXT e a fonte maxima de verdade.
- Voce NAO escolhe o gabarito final.
- O campo "gabarito_correto" deve repetir o gabarito oficial do TXT.
- Gere o comentario DO ZERO. Nao copie, remende ou reaproveite o comentario atual.
- O comentario antigo e apenas uma referencia ruim para evitar repetir erro anterior.
- Explique a questao considerando obrigatoriamente que a alternativa correta e ${gabaritoOficialLetra}.
- Comece o comentario exatamente com: "A alternativa ${gabaritoOficialLetra} esta correta porque..."
- Prefira explicacao conceitual, no estilo professor de cursinho OAB.
- Nao cite numeros de leis, artigos, incisos, paragrafos, sumulas, jurisprudencia, RE, ARE, ADI, ADC, ADPF ou Tema STF/STJ.
- Mesmo que voce ache que sabe o dispositivo especifico, use explicacao conceitual.
- Quando precisar referir fundamento normativo, use "conforme a legislacao aplicavel", "Estatuto correspondente", "normas aplicaveis" ou "conforme entendimento juridico aplicavel".
- Explique o fundamento juridico sem criar referencia normativa falsa.
- Se possivel, explique por que as demais alternativas estao incorretas.
- Se voce discordar do gabarito oficial, nao mude o gabarito; registre a discordancia apenas no motivo_alteracao.
- Se houver alternativa faltando, cortada, duplicada ou enunciado incompleto sem correcao segura, marque revisao humana.
- A materia deve ser uma destas: ${MATERIAS_VALIDAS.join(", ")}.
- dificuldade deve ser 1, 2 ou 3.

Formato obrigatorio:
{
  "materia": "Direito Civil",
  "tema": "tema juridico especifico",
  "dificuldade": 2,
  "corrigir_enunciado": false,
  "enunciado_corrigido": "texto final do enunciado",
  "corrigir_alternativas": false,
  "alternativas_corrigidas": ["A", "B", "C", "D"],
  "gabarito_correto": "A",
  "confianca_correcao": 95,
  "comentario": "comentario juridico objetivo explicando a alternativa correta",
  "motivo_alteracao": "motivo juridico e/ou de qualidade",
  "motivo_revisao_humana": "",
  "problemas_qualidade": {
    "enunciado": [],
    "alternativas": [],
    "gabarito": []
  }
}
`,
      },
      {
        role: "user",
        content: `
Questao ID: ${questao.id}

Enunciado atual:
${questao.enunciado || ""}

Alternativas atuais:
${JSON.stringify(alternativas, null, 2)}

Gabarito atual:
${formatarGabarito(normalizarGabarito(questao.gabarito))}

Gabarito oficial em TXT:
${formatarGabaritoOficial(gabaritoOficial)}

Dados atuais:
Materia: ${questao.materia || "vazio"}
Tema: ${questao.tema || "vazio"}
Dificuldade: ${questao.dificuldade || "vazio"}

Comentario antigo (referencia ruim; nao copie):
${questao.comentario || "vazio"}

Problemas detectados antes da IA:
${JSON.stringify(problemasLocais, null, 2)}

Tentativa: ${tentativa}/2
${feedbackRejeicao}
`,
      },
  ];

  const resposta = await gerarJsonComFallback({
    messages,
    providerMode,
    responseLabel: "revisao_questao",
  });

  return {
    ...resposta.json,
    _provedor_ia: resposta.provider,
    _modelo_ia: resposta.model,
    _motivo_provedor_ia: resposta.motivo,
    _fallback_ia_usado: resposta.fallbackUsado,
  };
}

function deveAcionarAutocorrecaoAvancada(erros: string[], aderenteQuestao: boolean, aderenciaMotivo: string) {
  if (erros.length > 0) return true;

  const texto = normalizarParaComparacao([...erros, aderenciaMotivo].join(" "));
  return (
    !aderenteQuestao ||
    texto.includes("fuga de tema") ||
    texto.includes("outro instituto") ||
    texto.includes("generico") ||
    texto.includes("vazio curto") ||
    texto.includes("comentario vazio") ||
    texto.includes("nao menciona")
  );
}

async function tentarAutocorrecaoAvancada(
  questao: Questao,
  gabaritoOficial: GabaritoOficialQuestao,
  providerMode: AiProviderMode,
  comentarioRejeitado: string,
  motivoRejeicao: string,
  comentariosRejeitadosFugaTema: number
): Promise<{ json: Record<string, unknown>; validacaoComentario: ValidacaoComentario }> {
  const alternativas = normalizarAlternativas(questao.alternativas);
  const gabaritoOficialNumero =
    gabaritoOficial.valor !== "ANULADA" ? gabaritoOficial.valor : null;
  const gabaritoOficialLetra = formatarGabarito(gabaritoOficialNumero);
  const modeloForte = getStrongModelLabel() || "nao configurado";
  const motivoBase = normalizarTexto(motivoRejeicao) || "comentario rejeitado nas tentativas anteriores";
  let modeloUsado = modeloForte;
  let comentarioFinal = "";

  const falha = (
    motivo: string,
    errosFalha: string[],
    alertasFalha: string[] = []
  ): { json: Record<string, unknown>; validacaoComentario: ValidacaoComentario } => {
    const erroLetra = errosFalha.includes(MOTIVO_COMENTARIO_CONTRADIZ_GABARITO);

    return {
      json: {},
      validacaoComentario: {
        tentativas: 3,
        erros: errosFalha,
        alertas: alertasFalha,
        geradoDoZero: false,
        parecidoComAnterior: false,
        regeneradoPorFugaTema: true,
        autocorrecaoAvancadaStatus: "FALHOU",
        autocorrecaoAvancadaMotivo: motivo,
        autocorrecaoAvancadaModelo: modeloUsado,
        autocorrecaoAvancadaComentarioFinal: comentarioFinal,
        referenciasNormativasChecadas: false,
        referenciasNormativasAjustadas: false,
        auditoriaSemanticaExecutada: erroLetra,
        auditoriaSemanticaAprovada: false,
        auditoriaSemanticaCorrigida: false,
        auditoriaSemanticaMelhoriaIgnorada: false,
        auditoriaSemanticaMotivo: erroLetra ? MOTIVO_COMENTARIO_CONTRADIZ_GABARITO : "",
        auditoriaSemanticaStatus: erroLetra ? "ERRO_JURIDICO" : "APROVADO",
        aderenciaEnunciadoExecutada: false,
        aderenteQuestao: false,
        aderenciaEnunciadoMotivo: motivo,
        comentariosRejeitadosFugaTema,
      },
    };
  };

  try {
    const messages: AiMessage[] = [
      {
        role: "system",
        content: `
Voce e corretor senior de comentarios de questoes OAB.

Gere um comentario novo, especifico da questao, explicando a alternativa oficial, sem citar numero de lei, artigo, sumula ou jurisprudencia especifica.
Nao explique outro instituto. Nao seja generico.
Nao altere gabarito, enunciado, alternativas, materia ou tema.
Use o gabarito oficial como fonte maxima.

Retorne apenas JSON:
{
  "comentario": "...",
  "instituto_central": "...",
  "por_que_aderente": "..."
}
`,
      },
      {
        role: "user",
        content: `
Enunciado completo:
${questao.enunciado || ""}

Alternativas completas:
${JSON.stringify(alternativas, null, 2)}

Gabarito oficial (${gabaritoOficialLetra}):
${formatarGabaritoOficial(gabaritoOficial)}

Tema:
${questao.tema || "vazio"}

Comentario rejeitado:
${comentarioRejeitado || "vazio"}

Motivo da rejeicao:
${motivoBase}

Instrucao obrigatoria:
O comentario anterior foi rejeitado porque explicou ${motivoBase}. Gere um novo comentario explicando especificamente o instituto central do enunciado.
`,
      },
    ];

    const resposta = await gerarJsonComModeloForte({
      messages,
      responseLabel: "autocorrecao_avancada_comentario",
    });
    modeloUsado = resposta.model;

    const comentarioBruto = normalizarTexto(resposta.json.comentario);
    let comentarioSanitizado = sanitizarReferenciasNormativasBloqueadas(comentarioBruto);
    comentarioFinal = comentarioSanitizado;
    const referenciasNormativasAjustadas = comentarioBruto !== comentarioSanitizado;
    let formatoCorrigidoLocalmente = false;

    let validacaoInicial = validarComentarioGerado(
      comentarioSanitizado,
      normalizarTexto(questao.comentario),
      gabaritoOficialNumero
    );
    if (erroSomenteFormatoAlternativaOficial(validacaoInicial.erros)) {
      comentarioSanitizado = prefixarAlternativaOficial(comentarioSanitizado, gabaritoOficialNumero);
      comentarioFinal = comentarioSanitizado;
      formatoCorrigidoLocalmente = true;
      validacaoInicial = validarComentarioGerado(
        comentarioSanitizado,
        normalizarTexto(questao.comentario),
        gabaritoOficialNumero
      );
    }
    if (validacaoInicial.erros.length > 0) {
      return falha(
        `fallback forte gerou comentario invalido: ${validacaoInicial.erros.join(" ")}`,
        validacaoInicial.erros,
        validacaoInicial.alertas
      );
    }

    const auditoria = await auditarComentarioSemanticoComGroq(
      questao,
      comentarioSanitizado,
      gabaritoOficial,
      providerMode
    );
    let comentarioAuditado = auditoria.comentario;
    comentarioFinal = comentarioAuditado;

    let validacaoAposAuditoria = validarComentarioGerado(
      comentarioAuditado,
      normalizarTexto(questao.comentario),
      gabaritoOficialNumero
    );
    if (!auditoria.aprovado && validacaoAposAuditoria.erros.length === 0) {
      validacaoAposAuditoria.erros = [
        auditoria.motivo || "Comentario reprovado pela auditoria semantica.",
      ];
    }
    if (erroSomenteFormatoAlternativaOficial(validacaoAposAuditoria.erros)) {
      comentarioAuditado = prefixarAlternativaOficial(comentarioAuditado, gabaritoOficialNumero);
      comentarioFinal = comentarioAuditado;
      formatoCorrigidoLocalmente = true;
      validacaoAposAuditoria = validarComentarioGerado(
        comentarioAuditado,
        normalizarTexto(questao.comentario),
        gabaritoOficialNumero
      );
    }
    if (validacaoAposAuditoria.erros.length > 0) {
      return falha(
        `fallback forte reprovado apos auditoria: ${validacaoAposAuditoria.erros.join(" ")}`,
        validacaoAposAuditoria.erros,
        [...validacaoInicial.alertas, ...validacaoAposAuditoria.alertas, ...auditoria.alertas]
      );
    }

    const aderencia = await verificarAderenciaComentarioComGroq(
      questao,
      comentarioAuditado,
      gabaritoOficial,
      providerMode,
      auditoria.aprovado
    );
    const comentariosFugaTema =
      comentariosRejeitadosFugaTema + (aderencia.aderente ? 0 : 1);

    if (!aderencia.aderente) {
      return falha(
        `fallback forte ainda fugiu do tema: ${aderencia.motivo}`,
        [`Comentario rejeitado por fuga de tema: ${aderencia.motivo}`],
        [
          ...validacaoInicial.alertas,
          ...validacaoAposAuditoria.alertas,
          ...auditoria.alertas,
          `Aderencia ao enunciado: NAO. ${aderencia.motivo}`,
        ]
      );
    }

    const motivoAuditoria =
      "corrigido automaticamente por fallback forte";
    const regraDinamica = salvarRegraDinamicaAprovada({
      questao,
      gabaritoOficial,
      comentario: comentarioAuditado,
      institutoCentral: normalizarTexto(resposta.json.instituto_central) || normalizarTexto(questao.tema),
      origem: formatoCorrigidoLocalmente
        ? "fallback_forte_formatado_localmente_aprovado_pelo_auditor"
        : "fallback_forte_aprovado_pelo_auditor",
      comentarioRejeitado,
      motivoRejeicao: motivoBase,
    });

    return {
      json: {
        materia: questao.materia || "",
        tema: questao.tema || "",
        dificuldade: questao.dificuldade || 2,
        corrigir_enunciado: false,
        enunciado_corrigido: questao.enunciado || "",
        corrigir_alternativas: false,
        alternativas_corrigidas: alternativas,
        gabarito_correto: gabaritoOficialLetra,
        confianca_correcao: 95,
        comentario: comentarioAuditado,
        motivo_alteracao: motivoAuditoria,
        motivo_revisao_humana: "",
        problemas_qualidade: { enunciado: [], alternativas: [], gabarito: [] },
        _provedor_ia: resposta.provider,
        _modelo_ia: resposta.model,
        _motivo_provedor_ia: resposta.motivo,
        _fallback_ia_usado: true,
      },
      validacaoComentario: {
        tentativas: 3,
        erros: [],
        alertas: [
          ...validacaoInicial.alertas,
          ...validacaoAposAuditoria.alertas,
          ...auditoria.alertas,
          `Aderencia ao enunciado: SIM. ${aderencia.motivo}`,
          "REGERADO POR FUGA DE TEMA",
          "AUTOCORRECAO AVANCADA: FALLBACK FORTE USADO",
          formatoCorrigidoLocalmente
            ? "Comentario do fallback forte teve formato corrigido localmente."
            : "",
        ],
        geradoDoZero: true,
        parecidoComAnterior: validacaoAposAuditoria.parecidoComAnterior,
        regeneradoPorFugaTema: true,
        autocorrecaoAvancadaStatus: "FALLBACK_FORTE_USADO",
        autocorrecaoAvancadaMotivo: motivoAuditoria,
        autocorrecaoAvancadaModelo: resposta.model,
        autocorrecaoAvancadaComentarioFinal: comentarioAuditado,
        referenciasNormativasChecadas: true,
        referenciasNormativasAjustadas,
        auditoriaSemanticaExecutada: true,
        auditoriaSemanticaAprovada: auditoria.aprovado,
        auditoriaSemanticaCorrigida: auditoria.corrigido,
        auditoriaSemanticaMelhoriaIgnorada: auditoria.melhoriaIgnorada,
        auditoriaSemanticaMotivo: motivoAuditoria,
        auditoriaSemanticaStatus: auditoria.status,
        aderenciaEnunciadoExecutada: true,
        aderenteQuestao: true,
        aderenciaEnunciadoMotivo: aderencia.motivo,
        comentariosRejeitadosFugaTema: comentariosFugaTema,
        regraLocalDinamicaStatus: regraDinamica.status,
        regraLocalDinamicaMotivo: regraDinamica.motivo,
        regraLocalDinamicaCaminho: REGRAS_CONHECIDAS_DINAMICAS_FILE,
      },
    };
  } catch (err) {
    const motivo =
      err instanceof Error ? err.message : "fallback forte falhou ao gerar comentario";
    return falha(motivo, [`Autocorrecao avancada falhou: ${motivo}`]);
  }
}

async function revisarComGroqValidado(
  questao: Questao,
  gabaritoOficial: GabaritoOficialQuestao,
  providerMode: AiProviderMode
) {
  const gabaritoOficialNumero =
    gabaritoOficial.valor !== "ANULADA" ? gabaritoOficial.valor : null;
  let ultimaResposta: Record<string, unknown> = {};
  let erros: string[] = [];
  let alertas: string[] = [];
  let parecidoComAnterior = false;
  let referenciasNormativasChecadas = false;
  let referenciasNormativasAjustadas = false;
  let auditoriaSemanticaExecutada = false;
  let auditoriaSemanticaAprovada = false;
  let auditoriaSemanticaCorrigida = false;
  let auditoriaSemanticaMelhoriaIgnorada = false;
  let auditoriaSemanticaMotivo = "";
  let auditoriaSemanticaStatus: ValidacaoComentario["auditoriaSemanticaStatus"] = "APROVADO";
  let aderenciaEnunciadoExecutada = false;
  let aderenteQuestao = false;
  let aderenciaEnunciadoMotivo = "";
  let comentariosRejeitadosFugaTema = 0;
  let motivoRejeicaoProximaTentativa = "";
  let regeneradoPorFugaTema = false;
  let autocorrecaoAvancadaStatus: ValidacaoComentario["autocorrecaoAvancadaStatus"] = "NAO_NECESSARIA";
  let autocorrecaoAvancadaMotivo = "comentario aprovado sem fallback forte";
  let autocorrecaoAvancadaModelo = "";
  let autocorrecaoAvancadaComentarioFinal = "";

  for (let tentativa = 1; tentativa <= 2; tentativa++) {
    const tentativaRegeneradaPorFugaTema = normalizarParaComparacao(
      motivoRejeicaoProximaTentativa
    ).includes("fuga de tema");
    if (tentativaRegeneradaPorFugaTema) {
      regeneradoPorFugaTema = true;
    }

    ultimaResposta = await revisarComGroq(
      questao,
      gabaritoOficial,
      providerMode,
      tentativa,
      motivoRejeicaoProximaTentativa
    );

    const validacao = validarComentarioGerado(
      normalizarTexto(ultimaResposta.comentario),
      normalizarTexto(questao.comentario),
      gabaritoOficialNumero
    );
    erros = validacao.erros;
    alertas = validacao.alertas;
    parecidoComAnterior = validacao.parecidoComAnterior;
    if (erros.includes(MOTIVO_COMENTARIO_CONTRADIZ_GABARITO)) {
      auditoriaSemanticaExecutada = true;
      auditoriaSemanticaAprovada = false;
      auditoriaSemanticaCorrigida = false;
      auditoriaSemanticaMelhoriaIgnorada = false;
      auditoriaSemanticaMotivo = MOTIVO_COMENTARIO_CONTRADIZ_GABARITO;
      auditoriaSemanticaStatus = "ERRO_JURIDICO";
    }

    if (erros.length === 0) {
      const checagemReferencias = await checarReferenciasNormativasComGroq(
        questao,
        normalizarTexto(ultimaResposta.comentario),
        gabaritoOficial
      );
      ultimaResposta = {
        ...ultimaResposta,
        comentario: checagemReferencias.comentario,
      };
      referenciasNormativasChecadas = checagemReferencias.checadas;
      referenciasNormativasAjustadas = checagemReferencias.ajustadas;

      const auditoriaSemantica = await auditarComentarioSemanticoComGroq(
        questao,
        checagemReferencias.comentario,
        gabaritoOficial,
        providerMode
      );
      ultimaResposta = {
        ...ultimaResposta,
        comentario: auditoriaSemantica.comentario,
      };
      auditoriaSemanticaExecutada = true;
      auditoriaSemanticaAprovada = auditoriaSemantica.aprovado;
      auditoriaSemanticaCorrigida = auditoriaSemantica.corrigido;
      auditoriaSemanticaMelhoriaIgnorada = auditoriaSemantica.melhoriaIgnorada;
      auditoriaSemanticaMotivo = auditoriaSemantica.motivo;
      auditoriaSemanticaStatus = auditoriaSemantica.status;

      const validacaoAposReferencias = validarComentarioGerado(
        auditoriaSemantica.comentario,
        normalizarTexto(questao.comentario),
        gabaritoOficialNumero
      );
      erros = validacaoAposReferencias.erros;
      if (!auditoriaSemantica.aprovado && erros.length === 0) {
        erros = [auditoriaSemantica.motivo || "Comentario reprovado pela auditoria semantica."];
      }
      alertas = [
        ...validacaoAposReferencias.alertas,
        ...checagemReferencias.alertas,
        ...auditoriaSemantica.alertas,
      ];
      parecidoComAnterior = validacaoAposReferencias.parecidoComAnterior;

      if (erros.length === 0) {
        const aderencia = await verificarAderenciaComentarioComGroq(
          questao,
          auditoriaSemantica.comentario,
          gabaritoOficial,
          providerMode,
          auditoriaSemantica.aprovado
        );
        aderenciaEnunciadoExecutada = true;
        aderenteQuestao = aderencia.aderente;
        aderenciaEnunciadoMotivo = aderencia.motivo;
        if (aderencia.aderenciaForcada) {
          auditoriaSemanticaMotivo = normalizarMotivoAuditoria(
            auditoriaSemanticaStatus,
            auditoriaSemanticaMotivo,
            auditoriaSemanticaMelhoriaIgnorada,
            true
          );
        }
        alertas.push(`Aderencia ao enunciado: ${aderencia.aderente ? "SIM" : "NAO"}. ${aderencia.motivo}`);

        if (!aderencia.aderente) {
          comentariosRejeitadosFugaTema++;
          erros = [`Comentario rejeitado por fuga de tema: ${aderencia.motivo}`];
          motivoRejeicaoProximaTentativa = `fuga de tema: ${aderencia.motivo}`;
        }
      }
    }

    if (erros.length === 0) {
      if (tentativaRegeneradaPorFugaTema) {
        alertas.push("REGERADO POR FUGA DE TEMA");
      }

      return {
        json: ultimaResposta,
        validacaoComentario: {
          tentativas: tentativa,
          erros: [],
          alertas,
          geradoDoZero: true,
          parecidoComAnterior,
          regeneradoPorFugaTema,
          autocorrecaoAvancadaStatus,
          autocorrecaoAvancadaMotivo,
          autocorrecaoAvancadaModelo,
          autocorrecaoAvancadaComentarioFinal,
          referenciasNormativasChecadas,
          referenciasNormativasAjustadas,
          auditoriaSemanticaExecutada,
          auditoriaSemanticaAprovada,
          auditoriaSemanticaCorrigida,
          auditoriaSemanticaMelhoriaIgnorada,
          auditoriaSemanticaMotivo,
          auditoriaSemanticaStatus,
          aderenciaEnunciadoExecutada,
          aderenteQuestao,
          aderenciaEnunciadoMotivo,
          comentariosRejeitadosFugaTema,
        } as ValidacaoComentario,
      };
    }

    if (tentativa < 2) {
      if (!motivoRejeicaoProximaTentativa) {
        motivoRejeicaoProximaTentativa = erros.join(" ");
      }
      await esperar(500);
    }
  }

  if (deveAcionarAutocorrecaoAvancada(erros, aderenteQuestao, aderenciaEnunciadoMotivo)) {
    const motivoAutocorrecao = motivoRejeicaoProximaTentativa || erros.join(" ");
    const falhaCache = fallbackForteFalhouHojeMesmoMotivo(questao, motivoAutocorrecao);
    if (falhaCache) {
      autocorrecaoAvancadaStatus = "FALHOU";
      autocorrecaoAvancadaMotivo = `fallback forte ja falhou hoje com o mesmo motivo: ${falhaCache.motivo}`;
      autocorrecaoAvancadaModelo = falhaCache.modelo;
      autocorrecaoAvancadaComentarioFinal =
        normalizarTexto(ultimaResposta.comentario) || normalizarTexto(questao.comentario);
      erros = [
        ...erros,
        `Autocorrecao avancada ignorada: fallback forte ja falhou hoje com o mesmo motivo.`,
      ];
      alertas = [
        ...alertas,
        `Fallback forte nao repetido no mesmo dia: ${falhaCache.modelo}.`,
      ];
    } else {
    const autocorrecao = await tentarAutocorrecaoAvancada(
      questao,
      gabaritoOficial,
      providerMode,
      normalizarTexto(ultimaResposta.comentario) || normalizarTexto(questao.comentario),
      motivoAutocorrecao,
      comentariosRejeitadosFugaTema
    );

    if (autocorrecao.validacaoComentario.autocorrecaoAvancadaStatus === "FALLBACK_FORTE_USADO") {
      return autocorrecao;
    }

    autocorrecaoAvancadaStatus = "FALHOU";
    autocorrecaoAvancadaMotivo = autocorrecao.validacaoComentario.autocorrecaoAvancadaMotivo;
    autocorrecaoAvancadaModelo = autocorrecao.validacaoComentario.autocorrecaoAvancadaModelo;
    autocorrecaoAvancadaComentarioFinal = autocorrecao.validacaoComentario.autocorrecaoAvancadaComentarioFinal;
    erros = [...erros, ...autocorrecao.validacaoComentario.erros];
    alertas = [...alertas, ...autocorrecao.validacaoComentario.alertas];
    }
  }

  return {
    json: ultimaResposta,
    validacaoComentario: {
      tentativas: 2,
      erros,
      alertas,
      geradoDoZero: false,
      parecidoComAnterior,
      regeneradoPorFugaTema,
      autocorrecaoAvancadaStatus,
      autocorrecaoAvancadaMotivo,
      autocorrecaoAvancadaModelo,
      autocorrecaoAvancadaComentarioFinal,
      referenciasNormativasChecadas,
      referenciasNormativasAjustadas,
      auditoriaSemanticaExecutada,
      auditoriaSemanticaAprovada,
      auditoriaSemanticaCorrigida,
      auditoriaSemanticaMelhoriaIgnorada,
      auditoriaSemanticaMotivo,
      auditoriaSemanticaStatus,
      aderenciaEnunciadoExecutada,
      aderenteQuestao,
      aderenciaEnunciadoMotivo,
      comentariosRejeitadosFugaTema,
    } as ValidacaoComentario,
  };
}

function normalizarRevisao(
  questao: Questao,
  json: Record<string, unknown>,
  gabaritoOficial: GabaritoOficialQuestao | null,
  validacaoComentario: ValidacaoComentario = {
    tentativas: 1,
    erros: [],
    alertas: [],
    geradoDoZero: false,
    parecidoComAnterior: false,
    regeneradoPorFugaTema: false,
    autocorrecaoAvancadaStatus: "NAO_NECESSARIA",
    autocorrecaoAvancadaMotivo: "comentario aprovado sem fallback forte",
    autocorrecaoAvancadaModelo: "",
    autocorrecaoAvancadaComentarioFinal: "",
    referenciasNormativasChecadas: false,
    referenciasNormativasAjustadas: false,
    auditoriaSemanticaExecutada: false,
    auditoriaSemanticaAprovada: false,
    auditoriaSemanticaCorrigida: false,
    auditoriaSemanticaMelhoriaIgnorada: false,
    auditoriaSemanticaMotivo: "",
    auditoriaSemanticaStatus: "APROVADO",
    aderenciaEnunciadoExecutada: false,
    aderenteQuestao: false,
    aderenciaEnunciadoMotivo: "",
    comentariosRejeitadosFugaTema: 0,
    regraLocalDinamicaStatus: "NAO_CRIADA",
    regraLocalDinamicaMotivo: "regra dinamica nao necessaria",
    regraLocalDinamicaCaminho: REGRAS_CONHECIDAS_DINAMICAS_FILE,
  }
): ResultadoQuestao {
  const enunciadoAntes = normalizarTexto(questao.enunciado);
  const alternativasAntes = normalizarAlternativas(questao.alternativas);
  const materiaAntes = normalizarTexto(questao.materia);
  const temaAntes = normalizarTexto(questao.tema);
  const dificuldadeAntes = normalizarDificuldade(questao.dificuldade);
  const gabaritoAntes = normalizarGabarito(questao.gabarito);
  const comentarioAntes = normalizarTexto(questao.comentario);
  const problemasLocais = detectarProblemasLocais(questao);
  const provedorIa = normalizarTexto(json._provedor_ia) || "IA";
  const modeloIa = normalizarTexto(json._modelo_ia) || MODELO_IA;
  const motivoProvedorIa = normalizarTexto(json._motivo_provedor_ia) || "provedor usado";
  const fallbackIaUsado = json._fallback_ia_usado === true;
  const regraLocalDinamicaStatus = validacaoComentario.regraLocalDinamicaStatus || "NAO_CRIADA";
  const regraLocalDinamicaMotivo =
    validacaoComentario.regraLocalDinamicaMotivo || "regra dinamica nao necessaria";
  const regraLocalDinamicaCaminho =
    validacaoComentario.regraLocalDinamicaCaminho || REGRAS_CONHECIDAS_DINAMICAS_FILE;
  const regraConhecidaLocalAprovada =
    json._regra_conhecida_local === true && validacaoComentario.erros.length === 0;
  const regraLocalDinamicaAprovada =
    regraConhecidaLocalAprovada && json._regra_local_dinamica === true;
  const regraConhecidaInstitutoCentral = normalizarTexto(json._regra_conhecida_instituto_central);
  const regraConhecidaEvitar = Array.isArray(json._regra_conhecida_evitar)
    ? json._regra_conhecida_evitar.map((item) => normalizarTexto(item)).filter(Boolean)
    : [];

  const materiaNova = normalizarMateria(String(json.materia || ""));
  if (!materiaNova) {
    throw new Error(`Materia invalida retornada pela IA: ${json.materia}`);
  }

  const temaNovo = normalizarTexto(json.tema) || "Tema nao identificado";
  const dificuldadeNova = normalizarDificuldade(json.dificuldade);
  const confiancaCorrecao = clampConfianca(json.confianca_correcao);
  const gabaritoSugerido = normalizarGabarito(json.gabarito_correto);
  const gabaritoOficialNumero =
    gabaritoOficial && gabaritoOficial.valor !== "ANULADA" ? gabaritoOficial.valor : null;
  const iaDiscordaDoOficial =
    gabaritoOficialNumero !== null &&
    gabaritoSugerido !== null &&
    gabaritoSugerido !== gabaritoOficialNumero;

  const corrigirEnunciado = json.corrigir_enunciado === true;
  const enunciadoCorrigido = normalizarTexto(json.enunciado_corrigido);
  const enunciadoNovo = corrigirEnunciado && enunciadoCorrigido ? enunciadoCorrigido : enunciadoAntes;

  const corrigirAlternativas = json.corrigir_alternativas === true;
  const alternativasCorrigidas = normalizarAlternativas(json.alternativas_corrigidas);
  const alternativasNovas =
    corrigirAlternativas && alternativasValidas(alternativasCorrigidas)
      ? alternativasCorrigidas
      : alternativasAntes;

  let revisaoHumanaNecessaria = false;
  const motivosHumanos: string[] = [];
  const problemasIa = extrairProblemasIa(json.problemas_qualidade);
  const problemasQualidade = juntarProblemas(problemasLocais, problemasIa);

  if (!enunciadoNovo) {
    revisaoHumanaNecessaria = true;
    motivosHumanos.push("Enunciado vazio apos revisao.");
  }

  if (problemasQualidade.enunciado.length > 0) {
    revisaoHumanaNecessaria = true;
    motivosHumanos.push("Enunciado com indicio de corte, incompletude, OCR ou corrupcao.");
  }

  if (!alternativasValidas(alternativasNovas)) {
    revisaoHumanaNecessaria = true;
    motivosHumanos.push("Alternativas invalidas apos revisao da IA.");
  }

  const problemasAlternativasBloqueantes = problemasQualidade.alternativas.filter((problema) =>
    /falt|vazia|invalid|duplicad|codifica|ocr|cortad|corromp/i.test(problema)
  );
  if (problemasAlternativasBloqueantes.length > 0) {
    revisaoHumanaNecessaria = true;
    motivosHumanos.push("Alternativas com indicio de falta, duplicidade, OCR ou corrupcao.");
  }

  let gabaritoNovo = gabaritoAntes;

  if (gabaritoOficial?.valor === "ANULADA") {
    revisaoHumanaNecessaria = true;
    problemasQualidade.gabarito.push("Gabarito oficial marcou a questao como anulada.");
    motivosHumanos.push("Questao anulada no gabarito oficial; nao deve ser liberada automaticamente.");
  } else if (gabaritoOficialNumero !== null) {
    gabaritoNovo = gabaritoOficialNumero;

    const alternativaOficial = alternativasNovas[gabaritoOficialNumero];
    if (!alternativaOficial || alternativaOficial.length < 2) {
      revisaoHumanaNecessaria = true;
      motivosHumanos.push(
        `Alternativa oficial ${formatarGabarito(gabaritoOficialNumero)} nao existe ou esta vazia/cortada.`
      );
    }
  } else {
    revisaoHumanaNecessaria = true;
    problemasQualidade.gabarito.push("Nao ha gabarito oficial em TXT para esta questao.");
    motivosHumanos.push("Nao ha gabarito oficial no TXT correspondente.");
  }

  const comentarioGeradoOriginal = normalizarTexto(json.comentario);
  const comentarioGerado = sanitizarReferenciasNormativasBloqueadas(comentarioGeradoOriginal);
  const autocorrecaoForteAprovada =
    validacaoComentario.autocorrecaoAvancadaStatus === "FALLBACK_FORTE_USADO" &&
    validacaoComentario.erros.length === 0;
  const comentarioRejeitadoPorFugaTema =
    validacaoComentario.aderenciaEnunciadoExecutada && !validacaoComentario.aderenteQuestao;
  const comentarioRejeitadoPorValidacao =
    validacaoComentario.erros.length > 0 && !autocorrecaoForteAprovada && !regraConhecidaLocalAprovada;
  const preservarEstruturaComentario =
    comentarioRejeitadoPorFugaTema || autocorrecaoForteAprovada || regraConhecidaLocalAprovada;
  if (comentarioGeradoOriginal && comentarioGerado !== comentarioGeradoOriginal) {
    validacaoComentario.referenciasNormativasChecadas = true;
    validacaoComentario.referenciasNormativasAjustadas = true;
    validacaoComentario.alertas.push(
      "Referencias normativas especificas removidas na sanitizacao final antes de salvar."
    );
  }
  const comentarioNovo =
    comentarioRejeitadoPorFugaTema && comentarioAntes
      ? comentarioAntes
      : comentarioRejeitadoPorValidacao && comentarioAntes
      ? comentarioAntes
      : comentarioRejeitadoPorFugaTema
      ? "Comentario pendente de revisao humana: a IA gerou explicacao fora do tema do enunciado."
      : comentarioRejeitadoPorValidacao
      ? "Comentario pendente de revisao humana: a IA nao gerou uma explicacao confiavel para o gabarito oficial."
      :
    comentarioGerado ||
    "Comentario pendente de revisao humana: a IA nao gerou uma explicacao confiavel para o gabarito oficial.";

  if (!comentarioGerado) {
    revisaoHumanaNecessaria = true;
    motivosHumanos.push("A IA nao gerou comentario novo.");
  }

  if (validacaoComentario.erros.length > 0) {
    revisaoHumanaNecessaria = true;
    motivosHumanos.push(
      `Comentario rejeitado apos ${validacaoComentario.tentativas} tentativa(s): ${validacaoComentario.erros.join(
        " "
      )}`
    );
  }

  if (comentarioRejeitadoPorFugaTema) {
    revisaoHumanaNecessaria = true;
    motivosHumanos.push(
      `Comentario rejeitado por fuga de tema: ${validacaoComentario.aderenciaEnunciadoMotivo || "nao aderente ao enunciado."}`
    );
  }

  const enunciadoFinal = preservarEstruturaComentario ? enunciadoAntes : enunciadoNovo;
  const alternativasFinais = preservarEstruturaComentario ? alternativasAntes : alternativasNovas;
  const materiaFinal = preservarEstruturaComentario ? materiaAntes : materiaNova;
  const temaFinal = preservarEstruturaComentario ? temaAntes : temaNovo;
  const dificuldadeFinal = preservarEstruturaComentario ? dificuldadeAntes : dificuldadeNova;
  const gabaritoFinal = preservarEstruturaComentario ? gabaritoAntes : gabaritoNovo;

  const motivoRevisaoHumana = motivosHumanos.filter(Boolean).join(" ");

  if (motivoRevisaoHumana) {
    revisaoHumanaNecessaria = true;
  }

  const motivoAlteracao = [
    gabaritoOficialNumero !== null
      ? regraLocalDinamicaAprovada
        ? `Gabarito oficial ${formatarGabarito(gabaritoOficialNumero)} confirmado; comentario corrigido por regra local dinamica e campos estruturais preservados.`
        : regraConhecidaLocalAprovada
        ? `Gabarito oficial ${formatarGabarito(gabaritoOficialNumero)} confirmado; comentario corrigido por regra conhecida local e campos estruturais preservados.`
        : autocorrecaoForteAprovada
        ? `Gabarito oficial ${formatarGabarito(gabaritoOficialNumero)} usado como fonte maxima do comentario; campos estruturais preservados.`
        : `Gabarito oficial ${formatarGabarito(gabaritoOficialNumero)} aplicado como fonte maxima de verdade.`
      : "Questao sem gabarito oficial aplicavel.",
    validacaoComentario.geradoDoZero
      ? validacaoComentario.parecidoComAnterior
        ? "Comentario aceito: parecido com anterior, mas coerente com o gabarito oficial."
        : "Comentario gerado do zero para explicar o gabarito oficial."
      : "Comentario nao foi aprovado automaticamente e exige revisao humana.",
    validacaoComentario.referenciasNormativasAjustadas
      ? "Referencias normativas especificas foram substituidas por termos genericos seguros."
      : validacaoComentario.referenciasNormativasChecadas
        ? "Referencias normativas especificas checadas pela camada anti-alucinacao."
        : "",
    iaDiscordaDoOficial
      ? `A IA sugeriu ${formatarGabarito(gabaritoSugerido)}, mas a divergencia foi ignorada para o campo gabarito.`
      : "",
    comentarioRejeitadoPorFugaTema
      ? "Comentario rejeitado por fuga de tema; enunciado, alternativas, materia, tema e gabarito foram preservados."
      : regraLocalDinamicaAprovada
        ? "Comentario corrigido por regra local dinamica; enunciado, alternativas, materia, tema e gabarito foram preservados."
      : regraConhecidaLocalAprovada
        ? "Comentario corrigido por regra conhecida local; enunciado, alternativas, materia, tema e gabarito foram preservados."
      : autocorrecaoForteAprovada
        ? "Comentario corrigido automaticamente por fallback forte; enunciado, alternativas, materia, tema e gabarito foram preservados."
      : normalizarTexto(json.motivo_alteracao),
  ]
    .filter(Boolean)
    .join(" ");

  const fallbackForteFalhou = validacaoComentario.autocorrecaoAvancadaStatus === "FALHOU";
  const fallbackForteFalhouEm = fallbackForteFalhou ? new Date().toISOString() : null;

  const depois: RevisaoNormalizada = {
    enunciadoNovo: enunciadoFinal,
    alternativasNovas: alternativasFinais,
    materiaNova: materiaFinal,
    temaNovo: temaFinal,
    dificuldadeNova: dificuldadeFinal,
    gabaritoNovo: gabaritoFinal,
    comentarioNovo,
    confiancaCorrecao,
    revisaoHumanaNecessaria,
    motivoAlteracao,
    motivoRevisaoHumana,
    problemasQualidade,
    gabaritoOficial: gabaritoOficialNumero,
    fonteGabarito: gabaritoOficial ? `${gabaritoOficial.arquivo}:${gabaritoOficial.linha}` : null,
    anulada: false,
    ativa: true,
    motivoAnulacao: null,
    anuladaOficial: false,
    inativa: false,
    fonteAnulacao: null,
    motivoInativacao: null,
    acao: null,
    modeloRevisao: modeloIa,
    comentarioAuditado: validacaoComentario.auditoriaSemanticaExecutada && validacaoComentario.erros.length === 0,
    comentarioAuditadoEm:
      validacaoComentario.auditoriaSemanticaExecutada && validacaoComentario.erros.length === 0
        ? new Date().toISOString()
        : null,
    comentarioAuditoriaMotivo: regraLocalDinamicaAprovada
      ? "corrigido por regra local dinamica"
      : regraConhecidaLocalAprovada
        ? "corrigido por regra conhecida local"
        : autocorrecaoForteAprovada
        ? "corrigido automaticamente por fallback forte"
        : validacaoComentario.auditoriaSemanticaMotivo || null,
    validacaoTripla: {
      banco: formatarGabarito(gabaritoAntes),
      provedor_ia: provedorIa,
      modelo_ia: modeloIa,
      motivo_provedor_ia: motivoProvedorIa,
      fallback_ia_usado: fallbackIaUsado,
      oficial: gabaritoOficial
        ? gabaritoOficial.valor === "ANULADA"
          ? "ANULADA"
          : formatarGabarito(gabaritoOficial.valor)
        : null,
      ia: formatarGabarito(gabaritoSugerido),
      ia_discordou_oficial: iaDiscordaDoOficial,
      confianca_ia: confiancaCorrecao,
      prova_codigo: gabaritoOficial?.codigoProva || null,
      numero_questao: gabaritoOficial?.numeroQuestao || null,
      numero_inferido: gabaritoOficial?.numeroInferido || false,
      fonte: gabaritoOficial ? `${gabaritoOficial.arquivo}:${gabaritoOficial.linha}` : null,
      comentario_gerado_do_zero: validacaoComentario.geradoDoZero,
      comentario_tentativas: validacaoComentario.tentativas,
      comentario_validacao_erros: validacaoComentario.erros,
      comentario_validacao_alertas: validacaoComentario.alertas,
      comentario_parecido_com_anterior: validacaoComentario.parecidoComAnterior,
      comentario_regenerado_por_fuga_tema: validacaoComentario.regeneradoPorFugaTema,
      comentario_corrigido_por_regra_conhecida_local: regraConhecidaLocalAprovada,
      comentario_corrigido_por_regra_local_dinamica: regraLocalDinamicaAprovada,
      regra_conhecida_instituto_central: regraConhecidaInstitutoCentral || null,
      regra_conhecida_evitar: regraConhecidaEvitar,
      regra_local_dinamica_status: regraLocalDinamicaStatus,
      regra_local_dinamica_motivo: regraLocalDinamicaMotivo,
      regra_local_dinamica_caminho: regraLocalDinamicaCaminho,
      autocorrecao_avancada_status: validacaoComentario.autocorrecaoAvancadaStatus,
      autocorrecao_avancada_motivo: validacaoComentario.autocorrecaoAvancadaMotivo,
      autocorrecao_avancada_modelo: validacaoComentario.autocorrecaoAvancadaModelo,
      autocorrecao_avancada_comentario_final: validacaoComentario.autocorrecaoAvancadaComentarioFinal,
      fallback_forte_falhou_em: fallbackForteFalhouEm,
      fallback_forte_motivo: fallbackForteFalhou ? validacaoComentario.autocorrecaoAvancadaMotivo : null,
      fallback_forte_modelo: fallbackForteFalhou ? validacaoComentario.autocorrecaoAvancadaModelo : null,
      referencias_normativas_checadas: validacaoComentario.referenciasNormativasChecadas,
      referencias_normativas_ajustadas: validacaoComentario.referenciasNormativasAjustadas,
      auditoria_semantica_executada: validacaoComentario.auditoriaSemanticaExecutada,
      auditoria_semantica_aprovada: validacaoComentario.auditoriaSemanticaAprovada,
      auditoria_semantica_corrigida: validacaoComentario.auditoriaSemanticaCorrigida,
      auditoria_semantica_melhoria_ignorada: validacaoComentario.auditoriaSemanticaMelhoriaIgnorada,
      auditoria_semantica_motivo: validacaoComentario.auditoriaSemanticaMotivo,
      auditoria_semantica_status: validacaoComentario.auditoriaSemanticaStatus,
      comentario_aderencia_executada: validacaoComentario.aderenciaEnunciadoExecutada,
      comentario_aderente_questao: validacaoComentario.aderenteQuestao,
      comentario_aderencia_motivo: validacaoComentario.aderenciaEnunciadoMotivo,
      comentarios_fuga_tema_rejeitados: validacaoComentario.comentariosRejeitadosFugaTema,
      status:
        gabaritoOficial?.valor === "ANULADA"
          ? "anulada"
          : gabaritoOficialNumero === null
            ? "sem_gabarito_oficial"
            : gabaritoFinal === gabaritoOficialNumero && !revisaoHumanaNecessaria
              ? "validada"
              : "revisao_humana",
    },
  };

  return {
    questao,
    antes: {
      enunciado: enunciadoAntes,
      alternativas: alternativasAntes,
      materia: materiaAntes,
      tema: temaAntes,
      dificuldade: dificuldadeAntes,
      gabarito: gabaritoAntes,
      comentario: comentarioAntes,
    },
    depois,
    mudancas: {
      enunciado: mudou(enunciadoAntes, depois.enunciadoNovo),
      alternativas: arraysMudaram(alternativasAntes, depois.alternativasNovas),
      materia: mudou(materiaAntes, depois.materiaNova),
      tema: mudou(temaAntes, depois.temaNovo),
      dificuldade: dificuldadeAntes !== depois.dificuldadeNova,
      gabarito: gabaritoAntes !== depois.gabaritoNovo,
      comentario: mudou(comentarioAntes, depois.comentarioNovo),
    },
  };
}

function criarResultadoSemIa(
  questao: Questao,
  gabaritoOficial: GabaritoOficialQuestao | null
): ResultadoQuestao {
  const enunciadoAntes = normalizarTexto(questao.enunciado);
  const alternativasAntes = normalizarAlternativas(questao.alternativas);
  const materiaAntes = normalizarTexto(questao.materia);
  const temaAntes = normalizarTexto(questao.tema);
  const dificuldadeAntes = normalizarDificuldade(questao.dificuldade);
  const gabaritoAntes = normalizarGabarito(questao.gabarito);
  const comentarioAntes = normalizarTexto(questao.comentario);
  const problemasQualidade = detectarProblemasLocais(questao);
  const gabaritoOficialNumero =
    gabaritoOficial && gabaritoOficial.valor !== "ANULADA" ? gabaritoOficial.valor : null;
  const numeroOficialAusente = obterNumeroQuestaoSalvo(questao) === null;
  const motivoRevisaoHumana =
    gabaritoOficial?.valor === "ANULADA"
      ? "Questao anulada no gabarito oficial; precisa de decisao humana antes de ir para os alunos."
      : numeroOficialAusente
        ? "numero oficial da questao ausente"
      : "Nao ha gabarito oficial no TXT correspondente.";

  problemasQualidade.gabarito.push(motivoRevisaoHumana);

  const depois: RevisaoNormalizada = {
    enunciadoNovo: enunciadoAntes,
    alternativasNovas: alternativasAntes,
    materiaNova: materiaAntes,
    temaNovo: temaAntes,
    dificuldadeNova: dificuldadeAntes,
    gabaritoNovo: gabaritoOficialNumero ?? gabaritoAntes,
    comentarioNovo: comentarioAntes,
    confiancaCorrecao: 0,
    revisaoHumanaNecessaria: true,
    motivoAlteracao: numeroOficialAusente
      ? "Questao nao enviada para IA porque o numero oficial da questao esta ausente."
      : "Questao nao enviada para IA porque nao ha gabarito oficial aplicavel.",
    motivoRevisaoHumana,
    problemasQualidade,
    gabaritoOficial: gabaritoOficialNumero,
    fonteGabarito: gabaritoOficial ? `${gabaritoOficial.arquivo}:${gabaritoOficial.linha}` : null,
    anulada: false,
    ativa: true,
    motivoAnulacao: null,
    anuladaOficial: false,
    inativa: false,
    fonteAnulacao: null,
    motivoInativacao: null,
    acao: null,
    modeloRevisao: "sem-ia",
    comentarioAuditado: false,
    comentarioAuditadoEm: null,
    comentarioAuditoriaMotivo: null,
    validacaoTripla: {
      banco: formatarGabarito(gabaritoAntes),
      oficial: gabaritoOficial
        ? gabaritoOficial.valor === "ANULADA"
          ? "ANULADA"
          : formatarGabarito(gabaritoOficial.valor)
        : null,
      ia: null,
      ia_discordou_oficial: false,
      confianca_ia: 0,
      prova_codigo: gabaritoOficial?.codigoProva || null,
      numero_questao: gabaritoOficial?.numeroQuestao || null,
      numero_inferido: gabaritoOficial?.numeroInferido || false,
      fonte: gabaritoOficial ? `${gabaritoOficial.arquivo}:${gabaritoOficial.linha}` : null,
      status: numeroOficialAusente
        ? "numero_oficial_ausente"
        : gabaritoOficial?.valor === "ANULADA"
          ? "anulada"
          : "sem_gabarito_oficial",
    },
  };

  return {
    questao,
    antes: {
      enunciado: enunciadoAntes,
      alternativas: alternativasAntes,
      materia: materiaAntes,
      tema: temaAntes,
      dificuldade: dificuldadeAntes,
      gabarito: gabaritoAntes,
      comentario: comentarioAntes,
    },
    depois,
    mudancas: {
      enunciado: false,
      alternativas: false,
      materia: false,
      tema: false,
      dificuldade: false,
      gabarito: gabaritoAntes !== depois.gabaritoNovo,
      comentario: false,
    },
  };
}

function criarResultadoAnulada(
  questao: Questao,
  anulacao: AnulacaoOficialQuestao
): ResultadoQuestao {
  const enunciadoAntes = normalizarTexto(questao.enunciado);
  const alternativasAntes = normalizarAlternativas(questao.alternativas);
  const materiaAntes = normalizarTexto(questao.materia);
  const temaAntes = normalizarTexto(questao.tema);
  const dificuldadeAntes = normalizarDificuldade(questao.dificuldade);
  const gabaritoAntes = normalizarGabarito(questao.gabarito);
  const comentarioAntes = normalizarTexto(questao.comentario);
  const problemasQualidade = detectarProblemasLocais(questao);
  const fonte = `${anulacao.fonte}:${anulacao.linha}`;
  const motivo = "Anulada oficialmente pela OAB/FGV";

  problemasQualidade.gabarito.push(motivo);

  const depois: RevisaoNormalizada = {
    enunciadoNovo: enunciadoAntes,
    alternativasNovas: alternativasAntes,
    materiaNova: materiaAntes,
    temaNovo: temaAntes,
    dificuldadeNova: dificuldadeAntes,
    gabaritoNovo: gabaritoAntes,
    comentarioNovo: comentarioAntes,
    confiancaCorrecao: 0,
    revisaoHumanaNecessaria: false,
    motivoAlteracao: `${motivo} Nao enviada para IA.`,
    motivoRevisaoHumana: "",
    problemasQualidade,
    gabaritoOficial: null,
    fonteGabarito: null,
    anulada: true,
    ativa: false,
    motivoAnulacao: motivo,
    anuladaOficial: true,
    inativa: true,
    fonteAnulacao: fonte,
    motivoInativacao: motivo,
    acao: "marcada como inativa",
    modeloRevisao: "sem-ia",
    comentarioAuditado: false,
    comentarioAuditadoEm: null,
    comentarioAuditoriaMotivo: null,
    validacaoTripla: {
      banco: formatarGabarito(gabaritoAntes),
      oficial: "ANULADA",
      ia: null,
      ia_discordou_oficial: false,
      confianca_ia: 0,
      prova_codigo: anulacao.codigoProva,
      numero_questao: anulacao.numeroQuestao,
      numero_inferido: anulacao.numeroInferido,
      fonte_anulacao: fonte,
      status: "anulada_oficial",
    },
  };

  return {
    questao,
    antes: {
      enunciado: enunciadoAntes,
      alternativas: alternativasAntes,
      materia: materiaAntes,
      tema: temaAntes,
      dificuldade: dificuldadeAntes,
      gabarito: gabaritoAntes,
      comentario: comentarioAntes,
    },
    depois,
    mudancas: {
      enunciado: false,
      alternativas: false,
      materia: false,
      tema: false,
      dificuldade: false,
      gabarito: false,
      comentario: false,
    },
  };
}

function houveMudanca(resultado: ResultadoQuestao) {
  return Object.values(resultado.mudancas).some(Boolean);
}

function formatarStatusAutocorrecaoAvancada(status: unknown) {
  const valor = String(status || "NAO_NECESSARIA");
  if (valor === "FALLBACK_FORTE_USADO") return "FALLBACK FORTE USADO";
  if (valor === "FALHOU") return "FALHOU";
  return "NAO NECESSARIA";
}

function inicializarRelatorioRevisoesHumanasPendentes() {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.writeFileSync(REVISOES_HUMANAS_PENDENTES_FILE, "", "utf8");
}

function inicializarRelatorioRegrasConhecidasSugeridas() {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
  fs.writeFileSync(REGRAS_CONHECIDAS_SUGERIDAS_FILE, "", "utf8");
}

function registrarRevisaoHumanaPendente(resultado: ResultadoQuestao) {
  if (!resultado.depois.revisaoHumanaNecessaria) return;

  const problema =
    resultado.depois.motivoRevisaoHumana ||
    String(resultado.depois.validacaoTripla.comentario_aderencia_motivo || "") ||
    "comentario nao aprovado automaticamente.";
  const blocoOperacional = [
    `REVIS\u00c3O MANUAL - QUEST\u00c3O ID ${resultado.questao.id}`,
    "",
    "Problema somente no coment\u00e1rio.",
    "",
    "Confirmado:",
    `- numero_questao: ${resultado.depois.validacaoTripla.numero_questao || "nao identificado"}`,
    `- fonte gabarito: ${resultado.depois.fonteGabarito || resultado.depois.fonteAnulacao || "nao encontrada"}`,
    `- gabarito oficial: ${formatarGabarito(resultado.depois.gabaritoOficial)}`,
    `- gabarito banco: ${formatarGabarito(resultado.antes.gabarito)}`,
    "",
    "N\u00c3O alterar:",
    "- enunciado",
    "- alternativas",
    "- gabarito",
    "- mat\u00e9ria",
    "- tema",
    "",
    "Problema encontrado:",
    problema,
    "",
    "A\u00e7\u00e3o:",
    "Corrigir apenas o coment\u00e1rio.",
    "Limpar revis\u00e3o humana ap\u00f3s corre\u00e7\u00e3o.",
    "",
  ].join("\n");

  fs.appendFileSync(REVISOES_HUMANAS_PENDENTES_FILE, `${blocoOperacional}\n`, "utf8");
}

function listaStrings(valor: unknown) {
  return Array.isArray(valor) ? valor.map((item) => String(item)).filter(Boolean) : [];
}

function revisaoHumanaPorComentarioDificil(resultado: ResultadoQuestao) {
  if (!resultado.depois.revisaoHumanaNecessaria) return false;

  const texto = normalizarParaComparacao(
    [
      resultado.depois.motivoRevisaoHumana,
      resultado.depois.validacaoTripla.comentario_aderencia_motivo,
      resultado.depois.validacaoTripla.autocorrecao_avancada_motivo,
      ...listaStrings(resultado.depois.validacaoTripla.comentario_validacao_erros),
      ...listaStrings(resultado.depois.validacaoTripla.comentario_validacao_alertas),
    ].join(" ")
  );

  return (
    resultado.depois.validacaoTripla.comentario_aderente_questao === false ||
    resultado.depois.validacaoTripla.autocorrecao_avancada_status === "FALHOU" ||
    texto.includes("fuga de tema") ||
    texto.includes("outro instituto") ||
    texto.includes("fallback forte") ||
    texto.includes("comentario rejeitado")
  );
}

function termosEvitarParaSugestao(resultado: ResultadoQuestao) {
  const texto = normalizarParaComparacao(
    [
      resultado.antes.comentario,
      resultado.depois.comentarioNovo,
      resultado.depois.motivoRevisaoHumana,
      resultado.depois.validacaoTripla.comentario_aderencia_motivo,
      resultado.depois.validacaoTripla.autocorrecao_avancada_motivo,
    ].join(" ")
  );
  const candidatos = [
    { termo: "Corte Interamericana", padrao: "corte interamericana" },
    { termo: "OEA", padrao: "oea" },
    { termo: "jurisdicao", padrao: "jurisdicao" },
    { termo: "tratados internacionais", padrao: "tratados internacionais" },
    { termo: "divorcio", padrao: "divorcio" },
    { termo: "separacao judicial", padrao: "separacao judicial" },
    { termo: "separacao de fato", padrao: "separacao de fato" },
    { termo: "usucapiao", padrao: "usucapiao" },
    { termo: "desapropriacao", padrao: "desapropriacao" },
    { termo: "principio do poluidor-pagador", padrao: "poluidor pagador" },
  ];
  const encontrados = candidatos
    .filter((item) => texto.includes(item.padrao))
    .map((item) => item.termo);

  return encontrados.length > 0 ? encontrados : ["preencher apos revisao do comentario rejeitado"];
}

function institutoProvavelParaSugestao(resultado: ResultadoQuestao) {
  const texto = normalizarParaComparacao(
    [resultado.antes.enunciado, resultado.antes.tema, resultado.depois.temaNovo].join(" ")
  );

  if (texto.includes("tortura")) return "proibicao absoluta da tortura";
  if (texto.includes("uniao estavel") || texto.includes("companheiro")) {
    return "uniao estavel e sucessao";
  }
  if (texto.includes("direito de vizinhanca")) return "direito de vizinhanca";
  if (texto.includes("responsabilidade") && texto.includes("ambiental")) {
    return "responsabilidade civil ambiental objetiva";
  }
  if (texto.includes("homicidio")) return "homicidio";
  if (texto.includes("regime") && texto.includes("pena")) return "regime de cumprimento de pena";

  return resultado.depois.temaNovo || resultado.antes.tema || "preencher manualmente";
}

function comentarioSeguroSugerido(resultado: ResultadoQuestao, institutoCentral: string) {
  const letra = formatarGabarito(resultado.depois.gabaritoOficial);
  return [
    `A alternativa ${letra} esta correta porque o ponto central da questao e ${institutoCentral}.`,
    "A regra local deve explicar esse instituto especificamente no contexto do enunciado e do gabarito oficial, sem tratar de instituto diverso e sem citar numero de lei, artigo, sumula ou jurisprudencia especifica.",
  ].join(" ");
}

function registrarRegraConhecidaSugerida(resultado: ResultadoQuestao) {
  if (!revisaoHumanaPorComentarioDificil(resultado)) return;

  const problema =
    resultado.depois.motivoRevisaoHumana ||
    String(resultado.depois.validacaoTripla.comentario_aderencia_motivo || "") ||
    String(resultado.depois.validacaoTripla.autocorrecao_avancada_motivo || "") ||
    "comentario rejeitado automaticamente.";
  const evitar = termosEvitarParaSugestao(resultado);
  const institutoCentral = institutoProvavelParaSugestao(resultado);
  const comentarioSugerido = comentarioSeguroSugerido(resultado, institutoCentral);
  const bloco = [
    `REGRA CONHECIDA SUGERIDA - QUEST\u00c3O ID ${resultado.questao.id}`,
    "",
    "Confirmado:",
    `* numero_questao: ${resultado.depois.validacaoTripla.numero_questao || "nao identificado"}`,
    `* fonte gabarito: ${resultado.depois.fonteGabarito || resultado.depois.fonteAnulacao || "nao encontrada"}`,
    `* gabarito oficial: ${formatarGabarito(resultado.depois.gabaritoOficial)}`,
    `* gabarito banco: ${formatarGabarito(resultado.antes.gabarito)}`,
    "",
    "Problema:",
    `Coment\u00e1rio rejeitado porque ${problema}`,
    "",
    "Evitar:",
    JSON.stringify(evitar),
    "",
    "Instituto central prov\u00e1vel:",
    institutoCentral,
    "",
    "Coment\u00e1rio seguro sugerido:",
    `"${comentarioSugerido}"`,
    "",
    "IMPORTANTE:",
    "Esse arquivo e apenas sugestao para virar regra local depois.",
    "Nao aplicar automaticamente sem passar pelo validador.",
    "",
  ].join("\n");

  fs.appendFileSync(REGRAS_CONHECIDAS_SUGERIDAS_FILE, `${bloco}\n`, "utf8");
}

function imprimirRelatorio(resultado: ResultadoQuestao, args?: ReturnType<typeof parseArgs>) {
  const { questao, antes, depois, mudancas } = resultado;
  const status = depois.anuladaOficial
    ? "ANULADA OFICIAL"
    : depois.revisaoHumanaNecessaria
    ? "REVISAO HUMANA"
    : houveMudanca(resultado)
      ? "CORRIGIDA"
      : "OK";

  console.log("");
  console.log(`QUESTAO ID ${questao.id}`);
  console.log("");
  console.log("STATUS:");
  console.log(status);

  console.log("");
  console.log("MAPEAMENTO:");
  console.log(`ID banco: ${questao.id}`);
  console.log(`Numero oficial prova: ${depois.validacaoTripla.numero_questao || "nao identificado"}`);
  console.log(`Fonte gabarito: ${depois.fonteGabarito || depois.fonteAnulacao || "nao encontrada"}`);
  if (!depois.validacaoTripla.numero_questao) {
    console.log("ERRO: numero oficial da questao ausente");
  }

  if (depois.anuladaOficial) {
    console.log("PROVA:");
    console.log(depois.validacaoTripla.prova_codigo || "nao identificada");
    console.log("NUMERO:");
    console.log(depois.validacaoTripla.numero_questao || "nao identificado");
    console.log("FONTE:");
    console.log(depois.fonteAnulacao || "nao encontrada");
    console.log("ACAO:");
    console.log(depois.acao || "marcada como inativa");
    return;
  }

  console.log("");
  console.log("GABARITO ANTES:");
  console.log(formatarGabarito(antes.gabarito));

  console.log("");
  console.log("GABARITO OFICIAL APLICADO:");
  if (depois.fonteGabarito) {
    console.log(`${depois.validacaoTripla.oficial} (${depois.fonteGabarito})`);
  } else {
    console.log("NAO ENCONTRADO");
  }

  console.log("");
  console.log("ALTERNATIVAS ALTERADAS:");
  console.log(mudancas.alternativas ? "SIM" : "NAO");

  console.log("");
  console.log("GABARITO ALTERADO:");
  console.log(mudancas.gabarito ? "SIM" : "NAO");

  console.log("");
  console.log("COMENTARIO:");
  if (depois.validacaoTripla.comentario_corrigido_por_regra_local_dinamica === true) {
    console.log("REGRA LOCAL DINAMICA");
  } else if (depois.validacaoTripla.comentario_corrigido_por_regra_conhecida_local === true) {
    console.log("REGRA CONHECIDA LOCAL");
  } else if (depois.validacaoTripla.comentario_parecido_com_anterior === true) {
    console.log("ACEITO - parecido com anterior, mas coerente com gabarito oficial");
  } else if (depois.validacaoTripla.comentario_gerado_do_zero === true) {
    console.log("GERADO DO ZERO");
  } else if (depois.modeloRevisao === "sem-ia") {
    console.log("NAO ENVIADO PARA IA");
  } else {
    console.log("REJEITADO - REVISAO HUMANA");
  }
  if (depois.validacaoTripla.comentario_regenerado_por_fuga_tema === true) {
    console.log("REGERADO POR FUGA DE TEMA");
  }
  const alertasComentario = Array.isArray(depois.validacaoTripla.comentario_validacao_alertas)
    ? depois.validacaoTripla.comentario_validacao_alertas
    : [];
  if (alertasComentario.length > 0) {
    console.log("ALERTA:");
    console.log(alertasComentario.map(String).join(" "));
  }

  if (depois.validacaoTripla.auditoria_semantica_executada === true) {
    console.log("");
    console.log("AUDITORIA SEMANTICA:");
    console.log(String(depois.validacaoTripla.auditoria_semantica_status || "APROVADO"));
    console.log("MOTIVO:");
    console.log(String(depois.validacaoTripla.auditoria_semantica_motivo || "Comentario auditado."));
  }
  if (depois.validacaoTripla.comentario_aderencia_executada === true) {
    console.log("");
    console.log("ADERENCIA AO ENUNCIADO:");
    console.log(depois.validacaoTripla.comentario_aderente_questao === true ? "SIM" : "NAO");
    console.log("MOTIVO:");
    console.log(String(depois.validacaoTripla.comentario_aderencia_motivo || "Aderencia checada."));
  }

  console.log("");
  console.log("REGRA LOCAL DINAMICA:");
  console.log(String(depois.validacaoTripla.regra_local_dinamica_status || "NAO_CRIADA").replace(/_/g, " "));
  console.log("MOTIVO:");
  console.log(String(depois.validacaoTripla.regra_local_dinamica_motivo || "regra dinamica nao necessaria"));

  console.log("");
  console.log("AUTOCORRECAO AVANCADA:");
  console.log(formatarStatusAutocorrecaoAvancada(depois.validacaoTripla.autocorrecao_avancada_status));
  console.log("MOTIVO:");
  console.log(String(depois.validacaoTripla.autocorrecao_avancada_motivo || "comentario aprovado sem fallback forte"));
  console.log("MODELO USADO:");
  console.log(String(depois.validacaoTripla.autocorrecao_avancada_modelo || "nao usado"));
  console.log("COMENTARIO FINAL:");
  console.log(`"${resumirTexto(String(depois.validacaoTripla.autocorrecao_avancada_comentario_final || depois.comentarioNovo), 260)}"`);

  console.log("");
  console.log("ANTES:");
  console.log(`"${resumirTexto(antes.comentario, 260)}"`);
  console.log("");
  console.log("DEPOIS:");
  console.log(`"${resumirTexto(depois.comentarioNovo, 260)}"`);

  if (status === "OK") {
    console.log("Nenhuma alteracao necessaria");
    return;
  }

  if (mudancas.materia) {
    console.log("");
    console.log("MATERIA:");
    console.log(`${antes.materia || "vazio"} -> ${depois.materiaNova}`);
  }

  if (mudancas.tema) {
    console.log("");
    console.log("TEMA:");
    console.log(`${antes.tema || "vazio"} -> ${depois.temaNovo}`);
  }

  if (mudancas.enunciado) {
    console.log("");
    console.log("ENUNCIADO:");
    console.log("Corrigido por indicio de extracao/OCR");
  }

  if (mudancas.alternativas) {
    console.log("");
    console.log("ALTERNATIVAS:");
    console.log("Corrigidas por indicio de extracao/OCR");
  }

  if (mudancas.gabarito) {
    console.log("");
    console.log("DEPOIS:");
    console.log(formatarGabarito(depois.gabaritoNovo));
  }

  console.log("");
  console.log("CONFIANCA IA:");
  console.log(`${depois.confiancaCorrecao}%`);

  console.log("");
  console.log("MOTIVO:");
  console.log(depois.motivoAlteracao);

  if (depois.revisaoHumanaNecessaria) {
    console.log("");
    console.log("REVISAO HUMANA:");
    console.log(depois.motivoRevisaoHumana || "Necessaria por problema objetivo de qualidade.");
  }

  if (mudancas.comentario) {
    console.log("");
    console.log("COMENTARIO ALTERADO:");
    console.log("SIM");
  }
}

async function checarAuditoria(dryRun: boolean) {
  if (dryRun) return;

  const { error } = await supabase.from("questoes_revisoes").select("id").limit(1);
  if (!error) return;

  throw new Error(
    [
      "Tabela de auditoria questoes_revisoes nao encontrada ou inacessivel.",
      "Antes de rodar o validador, execute sql/questoes_oab_ia_revisao.sql no Supabase.",
      `Detalhe Supabase: ${error.message}`,
    ].join(" ")
  );
}

async function checarSchemaQuestao(dryRun: boolean) {
  if (dryRun) return;

  const selectSchema = ["id", ...COLUNAS_OBRIGATORIAS_QUESTOES].join(", ");
  const { error } = await supabase.from("questoes_oab").select(selectSchema).limit(1);

  if (!error) return;

  throw new Error(
    [
      "A tabela questoes_oab ainda nao tem as colunas de revisao por IA no schema cache do Supabase.",
      "Execute sql/questoes_oab_ia_revisao.sql no SQL Editor do Supabase e aguarde alguns segundos antes de rodar novamente.",
      "Nenhuma questao foi enviada para a IA nesta execucao.",
      `Detalhe Supabase: ${error.message}`,
    ].join(" ")
  );
}

async function salvarResultado(resultado: ResultadoQuestao, dryRun: boolean) {
  if (dryRun) return;

  const { questao, antes, depois, mudancas } = resultado;
  const revisadoEm = new Date().toISOString();
  const updatePayload = {
    enunciado: depois.enunciadoNovo,
    alternativas: depois.alternativasNovas,
    materia: depois.materiaNova,
    tema: depois.temaNovo,
    dificuldade: depois.dificuldadeNova,
    gabarito: depois.gabaritoNovo ?? questao.gabarito,
    comentario: depois.comentarioNovo,
    revisado_ia: true,
    revisado_em: revisadoEm,
    confianca_correcao: depois.confiancaCorrecao,
    revisao_humana_necessaria: depois.revisaoHumanaNecessaria,
    motivo_revisao_humana: depois.motivoRevisaoHumana || null,
    modelo_ultima_revisao: depois.modeloRevisao,
    problemas_qualidade: depois.problemasQualidade,
    gabarito_oficial: depois.gabaritoOficial,
    fonte_gabarito: depois.fonteGabarito,
    anulada: depois.anulada,
    ativa: depois.ativa,
    motivo_anulacao: depois.motivoAnulacao,
    anulada_oficial: depois.anuladaOficial,
    inativa: depois.inativa,
    fonte_anulacao: depois.fonteAnulacao,
    motivo_inativacao: depois.motivoInativacao,
    validacao_tripla: depois.validacaoTripla,
    comentario_auditado: depois.comentarioAuditado,
    comentario_auditado_em: depois.comentarioAuditadoEm,
    comentario_auditoria_motivo: depois.comentarioAuditoriaMotivo,
  };

  const { error: updateError } = await supabase
    .from("questoes_oab")
    .update(updatePayload)
    .eq("id", questao.id);

  if (updateError) {
    throw new Error(
      [
        `Falha ao atualizar questao ${questao.id}: ${updateError.message}`,
        "Se o erro citar coluna inexistente, execute sql/questoes_oab_ia_revisao.sql no Supabase.",
      ].join(" ")
    );
  }

  const { error: logError } = await supabase.from("questoes_revisoes").insert({
    questao_id: String(questao.id),
    enunciado_antes: antes.enunciado,
    enunciado_depois: depois.enunciadoNovo,
    alternativas_antes: antes.alternativas,
    alternativas_depois: depois.alternativasNovas,
    materia_antes: antes.materia || null,
    materia_depois: depois.materiaNova,
    tema_antes: antes.tema || null,
    tema_depois: depois.temaNovo,
    dificuldade_antes: antes.dificuldade,
    dificuldade_depois: depois.dificuldadeNova,
    gabarito_antes: antes.gabarito,
    gabarito_depois: depois.gabaritoNovo,
    comentario_antes: antes.comentario || null,
    comentario_depois: depois.comentarioNovo,
    motivo_alteracao: depois.motivoAlteracao,
    motivo_revisao_humana: depois.motivoRevisaoHumana || null,
    problemas_qualidade: depois.problemasQualidade,
    validacao_tripla: depois.validacaoTripla,
    confianca_correcao: depois.confiancaCorrecao,
    gabarito_alterado: mudancas.gabarito,
    gabarito_oficial: depois.gabaritoOficial,
    fonte_gabarito: depois.fonteGabarito,
    anulada: depois.anulada,
    ativa: depois.ativa,
    motivo_anulacao: depois.motivoAnulacao,
    anulada_oficial: depois.anuladaOficial,
    inativa: depois.inativa,
    fonte_anulacao: depois.fonteAnulacao,
    motivo_inativacao: depois.motivoInativacao,
    comentario_auditado: depois.comentarioAuditado,
    comentario_auditado_em: depois.comentarioAuditadoEm,
    comentario_auditoria_motivo: depois.comentarioAuditoriaMotivo,
    modelo_ia: depois.modeloRevisao,
  });

  if (logError) {
    throw new Error(`Questao ${questao.id} atualizada, mas auditoria falhou: ${logError.message}`);
  }
}

async function buscarQuestoesPendentes() {
  const args = parseArgs();

  const query = args.id
    ? supabase.from("questoes_oab").select("*").eq("id", args.id).limit(1)
    : supabase.from("questoes_oab").select("*").order("id", { ascending: true });

  const { data, error } = await query;

  if (error) {
    throw new Error(`Erro Supabase ao buscar questoes: ${error.message}`);
  }

  const todasQuestoes = (data || []) as Questao[];
  if (args.id && todasQuestoes.length === 0) {
    throw new Error(`Questao ID ${args.id} nao encontrada.`);
  }

  const questoes = todasQuestoes.filter((questao) => questaoDeveEntrarNaFila(questao, args));

  if (args.id) {
    return { questoes, args };
  }

  if (args.limit > 0) {
    return { questoes: questoes.slice(0, args.limit), args };
  }

  return { questoes, args };
}

async function auditarComentariosExistentes() {
  const { questoes, args } = await buscarQuestoesPendentes();
  const gabaritosOficiais = carregarGabaritosOficiais();
  const anulacoesOficiais = carregarAnulacoesOficiais();

  console.log("AUDITORIA SEMANTICA - COMENTARIOS OAB");
  console.log(`Modelo: ${MODELO_IA}`);
  console.log(`Provider IA: ${args.provider}`);
  console.log(`Dry-run: ${args.dryRun ? "sim" : "nao"}`);
  console.log(`Force: ${args.force ? "sim" : "nao"}`);
  if (args.id) {
    console.log(`ID especifico: ${args.id}`);
    console.log("Limite: ignorado por ID especifico");
  } else {
    console.log(`Limite: ${args.limit > 0 ? args.limit : "sem limite"}`);
  }

  await checarAuditoria(args.dryRun);
  await checarSchemaQuestao(args.dryRun);

  let auditadas = 0;
  let corrigidas = 0;
  let melhoriasIgnoradas = 0;
  let puladas = 0;
  let falhas = 0;
  let pausadas = 0;
  let humanas = 0;

  for (const questao of questoes) {
    try {
      if (questaoAnuladaOuInativa(questao) || obterAnulacaoOficial(questao, anulacoesOficiais)) {
        puladas++;
        continue;
      }

      if (!args.force && comentarioJaAuditado(questao)) {
        puladas++;
        continue;
      }

      const gabaritoOficial = obterGabaritoOficial(questao, gabaritosOficiais);
      if (!gabaritoOficial || gabaritoOficial.valor === "ANULADA") {
        puladas++;
        continue;
      }

      const comentarioAntes = normalizarTexto(questao.comentario);
      if (!comentarioAntes) {
        puladas++;
        continue;
      }

      const auditoria = await auditarComentarioSemanticoComGroq(
        questao,
        comentarioAntes,
        gabaritoOficial,
        args.provider
      );
      const comentarioDepois = sanitizarReferenciasNormativasBloqueadas(auditoria.comentario);
      const gabaritoOficialNumero = gabaritoOficial.valor;
      const validacaoComentarioDepois = auditoria.corrigido
        ? validarComentarioGerado(comentarioDepois, comentarioAntes, gabaritoOficialNumero)
        : {
            erros: [] as string[],
            alertas: [] as string[],
            parecidoComAnterior: false,
            referenciasNormativasChecadas: false,
            referenciasNormativasAjustadas: false,
          };
      const errosAplicacao = auditoria.aprovado
        ? validacaoComentarioDepois.erros
        : [auditoria.motivo || "Comentario reprovado pela auditoria semantica."];
      const precisaRevisaoHumana = errosAplicacao.length > 0;
      const statusAuditoriaFinal: AuditoriaComentario["status"] = errosAplicacao.includes(
        MOTIVO_COMENTARIO_CONTRADIZ_GABARITO
      )
        ? "ERRO_JURIDICO"
        : auditoria.status;
      const motivoAuditoriaFinal = errosAplicacao.includes(MOTIVO_COMENTARIO_CONTRADIZ_GABARITO)
        ? MOTIVO_COMENTARIO_CONTRADIZ_GABARITO
        : errosAplicacao[0] || auditoria.motivo;
      const podeAplicarComentario = !precisaRevisaoHumana;
      const comentarioFinal = podeAplicarComentario ? comentarioDepois : comentarioAntes;
      const mudouComentario = comentarioFinal !== comentarioAntes;

      console.log("");
      console.log(`QUESTAO ID ${questao.id}`);
      console.log("STATUS:");
      console.log(statusAuditoriaFinal);
      console.log("GABARITO OFICIAL:");
      console.log(formatarGabaritoOficial(gabaritoOficial));
      console.log("MOTIVO:");
      console.log(motivoAuditoriaFinal);
      console.log("ANTES:");
      console.log(`"${resumirTexto(comentarioAntes, 260)}"`);
      console.log("DEPOIS:");
      console.log(`"${resumirTexto(comentarioFinal, 260)}"`);
      if (precisaRevisaoHumana) {
        console.log("REVISAO HUMANA:");
        console.log(motivoAuditoriaFinal);
      }

      if (!args.dryRun) {
        const auditadoEm = new Date().toISOString();
        const validacaoTripla =
          questao.validacao_tripla && typeof questao.validacao_tripla === "object"
            ? { ...(questao.validacao_tripla as Record<string, unknown>) }
            : {};
        validacaoTripla.auditoria_semantica_executada = true;
        validacaoTripla.auditoria_semantica_aprovada = !precisaRevisaoHumana;
        validacaoTripla.auditoria_semantica_corrigida = mudouComentario;
        validacaoTripla.auditoria_semantica_melhoria_ignorada =
          !precisaRevisaoHumana && auditoria.melhoriaIgnorada;
        validacaoTripla.auditoria_semantica_motivo = motivoAuditoriaFinal;
        validacaoTripla.auditoria_semantica_status = statusAuditoriaFinal;
        validacaoTripla.comentario_validacao_erros = errosAplicacao;
        validacaoTripla.comentario_validacao_alertas = [
          ...validacaoComentarioDepois.alertas,
          ...auditoria.alertas,
        ].filter(Boolean);

        const updatePayload: Record<string, unknown> = {
          comentario_auditado: !precisaRevisaoHumana,
          comentario_auditado_em: !precisaRevisaoHumana ? auditadoEm : null,
          comentario_auditoria_motivo: motivoAuditoriaFinal,
          validacao_tripla: validacaoTripla,
        };

        if (podeAplicarComentario) {
          updatePayload.comentario = comentarioFinal;
        } else {
          updatePayload.revisao_humana_necessaria = true;
          updatePayload.motivo_revisao_humana = motivoAuditoriaFinal;
        }

        const { error } = await supabase
          .from("questoes_oab")
          .update(updatePayload)
          .eq("id", questao.id);

        if (error) throw new Error(error.message);
      }

      auditadas++;
      if (statusAuditoriaFinal === "CORRIGIDO_ERRO_JURIDICO" && mudouComentario) corrigidas++;
      if (!precisaRevisaoHumana && auditoria.melhoriaIgnorada) melhoriasIgnoradas++;
      if (precisaRevisaoHumana) humanas++;
      await esperar(800);
    } catch (err) {
      if (err instanceof AiProviderPausedError) {
        pausadas++;
        console.log("");
        console.log(`QUESTAO ID ${questao.id}`);
        console.log("STATUS:");
        console.log("PAUSADO");
        console.log("MOTIVO:");
        console.log(err.message);
        break;
      }

      falhas++;
      console.log("");
      console.log(`QUESTAO ID ${questao.id}`);
      console.log("STATUS:");
      console.log("FALHA");
      console.log(err instanceof Error ? err.message : err);
    }
  }

  console.log("");
  console.log("--------------------------------");
  console.log("AUDITORIA FINALIZADA");
  console.log(`Auditadas: ${auditadas}`);
  console.log(`Corrigidas: ${corrigidas}`);
  console.log(`Correcoes juridicas reais: ${corrigidas}`);
  console.log(`Melhorias ignoradas: ${melhoriasIgnoradas}`);
  console.log(`Puladas: ${puladas}`);
  console.log(`Marcadas para revisao humana: ${humanas}`);
  console.log(`Pausadas por IA: ${pausadas}`);
  console.log(`Falhas: ${falhas}`);
}

async function validarQuestoes() {
  const argsModo = parseArgs();
  if (argsModo.auditarComentarios) {
    await auditarComentariosExistentes();
    return;
  }

  const { questoes, args } = await buscarQuestoesPendentes();
  const gabaritosOficiais = carregarGabaritosOficiais();
  const anulacoesOficiais = carregarAnulacoesOficiais();
  const totalRespostasOficiais = [...gabaritosOficiais.values()].reduce(
    (total, respostas) => total + respostas.size,
    0
  );
  const totalAnuladasOficiais = [...anulacoesOficiais.values()].reduce(
    (total, anulacoes) => total + anulacoes.questoes.size,
    0
  );

  console.log("VALIDADOR PROFISSIONAL - BANCO OAB");
  console.log(`Modelo: ${MODELO_IA}`);
  console.log(`Provider IA: ${args.provider}`);
  console.log(`Modo: ${args.id ? "id especifico" : args.force ? "force" : args.all ? "todas pendentes" : "pendentes"}`);
  console.log(`Dry-run: ${args.dryRun ? "sim" : "nao"}`);
  if (args.id) {
    console.log(`ID especifico: ${args.id}`);
    console.log("Limite: ignorado por ID especifico");
  } else {
    console.log(`Limite: ${args.limit > 0 ? args.limit : "sem limite"}`);
  }
  console.log(`Gabaritos oficiais: ${gabaritosOficiais.size} arquivo(s), ${totalRespostasOficiais} resposta(s)`);
  console.log(`Anuladas oficiais: ${anulacoesOficiais.size} arquivo(s), ${totalAnuladasOficiais} questao(oes)`);

  await checarAuditoria(args.dryRun);
  await checarSchemaQuestao(args.dryRun);
  inicializarRelatorioRevisoesHumanasPendentes();
  inicializarRelatorioRegrasConhecidasSugeridas();

  if (questoes.length === 0) {
    console.log("");
    console.log("Nenhuma questao pendente de revisao.");
    return;
  }

  let revisadas = 0;
  let alteradas = 0;
  let semMudanca = 0;
  let humanas = 0;
  let falhas = 0;
  let pausadas = 0;
  let gabaritosAlterados = 0;
  let anuladas = 0;
  let correcoesJuridicasReais = 0;
  let melhoriasIgnoradas = 0;
  let comentariosRejeitadosFugaTema = 0;
  const avisosAnuladas = new Set<string>();

  for (const questao of questoes) {
    try {
      const avisoAnuladas = obterAvisoArquivoAnuladas(questao, anulacoesOficiais);
      if (avisoAnuladas && !avisosAnuladas.has(avisoAnuladas)) {
        avisosAnuladas.add(avisoAnuladas);
        console.log("");
        console.log(`AVISO: ${avisoAnuladas}`);
      }

      const anulacaoOficial = obterAnulacaoOficial(questao, anulacoesOficiais);
      const gabaritoOficial = obterGabaritoOficial(questao, gabaritosOficiais);
      const regraConhecida =
        !anulacaoOficial && gabaritoOficial && gabaritoOficial.valor !== "ANULADA"
          ? obterRegraQuestaoConhecida(questao.id)
          : null;
      const regraDinamica =
        !regraConhecida && !anulacaoOficial && gabaritoOficial && gabaritoOficial.valor !== "ANULADA"
          ? obterRegraQuestaoDinamica(questao, gabaritoOficial)
          : null;
      const revisaoLocal =
        regraConhecida && gabaritoOficial && gabaritoOficial.valor !== "ANULADA"
          ? revisarPorRegraConhecidaLocal(questao, gabaritoOficial, regraConhecida)
          : regraDinamica && gabaritoOficial && gabaritoOficial.valor !== "ANULADA"
          ? revisarPorRegraConhecidaLocal(questao, gabaritoOficial, regraDinamica, { dinamica: true })
          : null;
      const revisaoIa =
        !revisaoLocal && !anulacaoOficial && gabaritoOficial && gabaritoOficial.valor !== "ANULADA"
          ? await revisarComGroqValidado(questao, gabaritoOficial, args.provider)
          : null;
      const resultado =
        anulacaoOficial
          ? criarResultadoAnulada(questao, anulacaoOficial)
          : !gabaritoOficial || gabaritoOficial.valor === "ANULADA"
          ? criarResultadoSemIa(questao, gabaritoOficial)
          : normalizarRevisao(
              questao,
              revisaoLocal?.json || revisaoIa?.json || {},
              gabaritoOficial,
              revisaoLocal?.validacaoComentario || revisaoIa?.validacaoComentario
            );

      promoverRegraDinamicaResultado(resultado, gabaritoOficial, args.dryRun);
      imprimirRelatorio(resultado, args);
      await salvarResultado(resultado, args.dryRun);
      registrarRevisaoHumanaPendente(resultado);
      registrarRegraConhecidaSugerida(resultado);

      revisadas++;
      if (houveMudanca(resultado)) alteradas++;
      else semMudanca++;
      if (resultado.depois.revisaoHumanaNecessaria) humanas++;
      if (resultado.mudancas.gabarito) gabaritosAlterados++;
      if (resultado.depois.anulada) anuladas++;
      if (
        resultado.depois.validacaoTripla.auditoria_semantica_status === "CORRIGIDO_ERRO_JURIDICO" &&
        resultado.depois.validacaoTripla.auditoria_semantica_corrigida === true
      ) {
        correcoesJuridicasReais++;
      }
      if (resultado.depois.validacaoTripla.auditoria_semantica_melhoria_ignorada === true) {
        melhoriasIgnoradas++;
      }
      comentariosRejeitadosFugaTema += Number(
        resultado.depois.validacaoTripla.comentarios_fuga_tema_rejeitados || 0
      );

      await esperar(1300);
    } catch (err) {
      if (err instanceof AiProviderPausedError) {
        pausadas++;
        console.log("");
        console.log(`QUESTAO ID ${questao.id}`);
        console.log("STATUS:");
        console.log("PAUSADO");
        console.log("MOTIVO:");
        console.log(err.message);
        break;
      }

      falhas++;
      console.log("");
      console.log(`QUESTAO ID ${questao.id}`);
      console.log("STATUS:");
      console.log("FALHA");
      console.log(err instanceof Error ? err.message : err);
      await esperar(2000);
    }
  }

  console.log("");
  console.log("--------------------------------");
  console.log("FINALIZADO");
  console.log(`Revisadas: ${revisadas}`);
  console.log(`Corrigidas: ${alteradas}`);
  console.log(`Sem alteracao: ${semMudanca}`);
  console.log(`Gabaritos alterados: ${gabaritosAlterados}`);
  console.log(`Anuladas oficiais marcadas: ${anuladas}`);
  console.log(`Correcoes juridicas reais: ${correcoesJuridicasReais}`);
  console.log(`Melhorias ignoradas: ${melhoriasIgnoradas}`);
  console.log(`Comentarios rejeitados por fuga de tema: ${comentariosRejeitadosFugaTema}`);
  console.log(`Marcadas para revisao humana: ${humanas}`);
  if (humanas > 0) {
    console.log(`Relatorio de revisoes humanas pendentes: ${REVISOES_HUMANAS_PENDENTES_FILE}`);
    console.log(`Sugestoes de regras conhecidas: ${REGRAS_CONHECIDAS_SUGERIDAS_FILE}`);
  }
  console.log(`Pausadas por IA: ${pausadas}`);
  console.log(`Falhas: ${falhas}`);
}

validarQuestoes()
  .then(() => {
    finalizarLogPersistente();
  })
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    finalizarLogPersistente();
    process.exit(1);
  });
