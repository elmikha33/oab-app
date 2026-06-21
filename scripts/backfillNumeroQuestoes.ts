import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const PROVAS_DIRS = [
  path.resolve(process.cwd(), "provas"),
  path.resolve(process.cwd(), "provas", "processadas"),
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL nao encontrada.");
if (!supabaseKey) throw new Error("Chave Supabase nao encontrada.");

const supabase = createClient(supabaseUrl, supabaseKey);

type QuestaoDb = Record<string, unknown> & {
  id: string | number;
  enunciado?: string | null;
  origem?: string | null;
  prova_codigo?: string | null;
  numero_questao?: number | string | null;
  created_at?: string | null;
  fonte_gabarito?: string | null;
  validacao_tripla?: unknown;
};

type QuestaoArquivo = {
  numero: number;
  enunciado: string;
  tokens: Set<string>;
};

type ProvaArquivo = {
  codigo: string;
  arquivo: string;
  totalQuestoes: number;
  questoes: QuestaoArquivo[];
};

type CandidatoNumero = {
  numero: number;
  fonte: string;
  prioridade: number;
};

type PlanoBackfill = {
  questao: QuestaoDb;
  codigoProva: string;
  numeroInferido: number | null;
  fonteInferencia: string;
  atualizarNumero: boolean;
  atualizarValidacao: boolean;
  motivoIgnorado: string;
};

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
  };
}

function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .replace(/\s+/g, " ")
    .trim();
}

function removerAcentos(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function numeroInteiroPositivo(valor: unknown) {
  const numero = Number(valor);
  return Number.isInteger(numero) && numero > 0 ? numero : null;
}

function resumirTexto(texto: unknown, limite = 90) {
  const normalizado = normalizarTexto(texto);
  if (!normalizado) return "sem enunciado";
  return normalizado.length > limite ? `${normalizado.slice(0, limite)}...` : normalizado;
}

function tokensParaMatch(texto: unknown) {
  const normalizado = removerAcentos(normalizarTexto(texto))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

  return new Set(
    normalizado
      .split(" ")
      .filter((token) => token.length >= 4 && !["sobre", "assinale", "alternativa", "correta"].includes(token))
  );
}

function pontuarSimilaridade(a: Set<string>, b: Set<string>) {
  if (a.size === 0 || b.size === 0) return 0;

  let intersecao = 0;
  for (const token of a) {
    if (b.has(token)) intersecao++;
  }

  return intersecao / Math.min(a.size, b.size);
}

function extrairCodigoArquivo(texto: unknown) {
  const valor = normalizarTexto(texto);
  const match = valor.match(/(?:questoes|prova|gabarito|anuladas)[_\-\s]*(\d{1,4})/i);
  return match?.[1] || null;
}

function extrairCodigoDireto(texto: unknown) {
  const valor = normalizarTexto(texto);
  if (/^\d{1,4}$/.test(valor)) return valor;

  const match = valor.match(/\b(?:prova|exame)\s*(\d{1,4})\b/i);
  return match?.[1] || null;
}

function extrairNumeroFonteGabarito(texto: unknown) {
  const valor = normalizarTexto(texto);
  const match = valor.match(/gabarito[_\-]?\d{1,4}\.txt:(\d{1,3})/i);
  return match ? numeroInteiroPositivo(match[1]) : null;
}

function validacaoTripla(questao: QuestaoDb) {
  return questao.validacao_tripla && typeof questao.validacao_tripla === "object"
    ? (questao.validacao_tripla as Record<string, unknown>)
    : {};
}

function obterCodigoProva(questao: QuestaoDb) {
  const validacao = validacaoTripla(questao);
  const candidatos = [
    extrairCodigoDireto(questao.prova_codigo),
    extrairCodigoDireto(validacao.prova_codigo),
    extrairCodigoArquivo(questao.fonte_gabarito),
    extrairCodigoArquivo(validacao.fonte),
    extrairCodigoArquivo(questao.origem),
    extrairCodigoArquivo(questao.prova),
    extrairCodigoArquivo(questao.exame),
    extrairCodigoDireto(questao.prova),
    extrairCodigoDireto(questao.exame),
  ].filter(Boolean) as string[];

  const unicos = [...new Set(candidatos.map((codigo) => codigo.replace(/^0+/, "") || codigo))];
  return unicos.length === 1 ? unicos[0] : null;
}

function obterNumeroExistente(questao: QuestaoDb) {
  return numeroInteiroPositivo(questao.numero_questao);
}

function candidatosPersistidos(questao: QuestaoDb) {
  const validacao = validacaoTripla(questao);
  const candidatos: CandidatoNumero[] = [];
  const campos = [
    ["numero_questao", questao.numero_questao, 100],
    ["numero", questao.numero, 90],
    ["ordem", questao.ordem, 90],
    ["questao", questao.questao, 90],
    ["validacao_tripla.numero_questao", validacao.numero_questao, 80],
    ["fonte_gabarito", extrairNumeroFonteGabarito(questao.fonte_gabarito), 70],
    ["validacao_tripla.fonte", extrairNumeroFonteGabarito(validacao.fonte), 70],
  ] as const;

  for (const [fonte, valor, prioridade] of campos) {
    const numero = numeroInteiroPositivo(valor);
    if (numero) candidatos.push({ numero, fonte, prioridade });
  }

  return candidatos;
}

function candidatosDiretos(questao: QuestaoDb) {
  return candidatosPersistidos(questao).filter((candidato) => candidato.prioridade >= 90);
}

function listarArquivosProva() {
  const porCodigo = new Map<string, string>();

  for (const dir of PROVAS_DIRS) {
    if (!fs.existsSync(dir)) continue;

    for (const arquivo of fs.readdirSync(dir)) {
      const codigo = extrairCodigoArquivo(arquivo);
      if (!codigo || porCodigo.has(codigo)) continue;

      porCodigo.set(codigo, path.join(dir, arquivo));
    }
  }

  return porCodigo;
}

function extrairEnunciadoBloco(bloco: string) {
  const match = bloco.match(/Enunciado:\s*([\s\S]*?)(?:\r?\n\s*\(?A\)|\r?\n\s*\(A\)|$)/i);
  return normalizarTexto(match?.[1] || "");
}

function carregarProvasLocais() {
  const provas = new Map<string, ProvaArquivo>();
  const arquivos = listarArquivosProva();

  for (const [codigo, arquivo] of arquivos) {
    const conteudo = fs.readFileSync(arquivo, "utf8");
    const markerRegex = /\[\s*QUEST[^\d\]]*(\d{1,3})\s*\]/gi;
    const matches = [...conteudo.matchAll(markerRegex)];
    const questoes: QuestaoArquivo[] = [];

    for (let index = 0; index < matches.length; index++) {
      const match = matches[index];
      const proximo = matches[index + 1];
      const inicio = match.index || 0;
      const fim = proximo?.index || conteudo.length;
      const numero = numeroInteiroPositivo(match[1]);
      const enunciado = extrairEnunciadoBloco(conteudo.slice(inicio, fim));

      if (!numero || !enunciado) continue;
      questoes.push({
        numero,
        enunciado,
        tokens: tokensParaMatch(enunciado),
      });
    }

    if (questoes.length > 0) {
      provas.set(codigo, {
        codigo,
        arquivo: path.relative(process.cwd(), arquivo).replace(/\\/g, "/"),
        totalQuestoes: matches.length,
        questoes: questoes.sort((a, b) => a.numero - b.numero),
      });
    }
  }

  return provas;
}

function inferirPorEnunciado(questao: QuestaoDb, prova: ProvaArquivo | undefined): CandidatoNumero | null {
  if (!prova) return null;

  const tokens = tokensParaMatch(questao.enunciado);
  const pontuadas = prova.questoes
    .map((questaoArquivo) => ({
      numero: questaoArquivo.numero,
      score: pontuarSimilaridade(tokens, questaoArquivo.tokens),
    }))
    .sort((a, b) => b.score - a.score);

  const melhor = pontuadas[0];
  const segundo = pontuadas[1];

  if (!melhor || melhor.score < 0.7) return null;
  if (segundo && melhor.score - segundo.score < 0.12) return null;

  return {
    numero: melhor.numero,
    fonte: `enunciado:${prova.arquivo}`,
    prioridade: 85,
  };
}

function ordenarQuestoesGrupo(questoes: QuestaoDb[]) {
  return [...questoes].sort((a, b) => {
    const dataA = normalizarTexto(a.created_at);
    const dataB = normalizarTexto(b.created_at);
    if (dataA && dataB && dataA !== dataB) return dataA.localeCompare(dataB);
    if (dataA && !dataB) return -1;
    if (!dataA && dataB) return 1;
    return Number(a.id) - Number(b.id);
  });
}

function resolverCandidato(candidatos: CandidatoNumero[]) {
  if (candidatos.length === 0) return null;

  const porNumero = new Map<number, CandidatoNumero[]>();
  for (const candidato of candidatos) {
    const atuais = porNumero.get(candidato.numero) || [];
    atuais.push(candidato);
    porNumero.set(candidato.numero, atuais);
  }

  if (porNumero.size > 1) return null;

  return [...candidatos].sort((a, b) => b.prioridade - a.prioridade)[0];
}

function montarPlanosGrupo(
  codigoProva: string,
  questoes: QuestaoDb[],
  provaLocal: ProvaArquivo | undefined,
  force: boolean
) {
  const ordenadas = ordenarQuestoesGrupo(questoes);
  const candidatosPersistidosPorId = new Map<string, CandidatoNumero[]>();
  const candidatosDiretosPorId = new Map<string, CandidatoNumero[]>();
  const candidatosTextoPorId = new Map<string, CandidatoNumero>();

  for (const questao of ordenadas) {
    candidatosPersistidosPorId.set(String(questao.id), candidatosPersistidos(questao));
    candidatosDiretosPorId.set(String(questao.id), candidatosDiretos(questao));

    const candidatoTexto = inferirPorEnunciado(questao, provaLocal);
    if (candidatoTexto) {
      candidatosTextoPorId.set(String(questao.id), candidatoTexto);
    }
  }

  const conflitosPersistidos = new Set<string>();
  const candidatosDiretosResolvidos = new Map<string, CandidatoNumero>();
  for (const questao of ordenadas) {
    const id = String(questao.id);
    const candidatos = candidatosDiretosPorId.get(id) || [];
    const resolvido = resolverCandidato(candidatos);

    if (candidatos.length > 0 && !resolvido) {
      conflitosPersistidos.add(id);
      continue;
    }

    if (resolvido) candidatosDiretosResolvidos.set(id, resolvido);
  }

  const ancorasTextoOk = [...candidatosTextoPorId.entries()].filter(([id, candidato]) => {
    const posicao = ordenadas.findIndex((questao) => String(questao.id) === id);
    return posicao >= 0 && candidato.numero === posicao + 1;
  }).length;
  const minimoAncorasTexto = Math.min(5, Math.max(1, Math.floor(ordenadas.length * 0.1)));
  const podeUsarOrdemEstavel =
    Boolean(provaLocal) &&
    provaLocal?.totalQuestoes === ordenadas.length &&
    (candidatosDiretosResolvidos.size > 0 || ancorasTextoOk >= minimoAncorasTexto);

  const candidatosResolvidos = new Map<string, CandidatoNumero>();

  if (podeUsarOrdemEstavel) {
    for (let index = 0; index < ordenadas.length; index++) {
      const questao = ordenadas[index];
      const id = String(questao.id);
      const candidatoDireto = candidatosDiretosResolvidos.get(id);
      const numeroPorOrdem = index + 1;

      if (candidatoDireto && candidatoDireto.numero !== numeroPorOrdem) {
        conflitosPersistidos.add(id);
      }

      candidatosResolvidos.set(id, {
        numero: candidatoDireto?.numero || numeroPorOrdem,
        fonte: candidatoDireto?.fonte || `ordem_estavel:${provaLocal?.arquivo}`,
        prioridade: candidatoDireto?.prioridade || 75,
      });
    }
  } else {
    for (const questao of ordenadas) {
      const id = String(questao.id);
      const candidatos = [
        ...(candidatosPersistidosPorId.get(id) || []),
        ...(candidatosTextoPorId.has(id) ? [candidatosTextoPorId.get(id)!] : []),
      ];
      const resolvido = resolverCandidato(candidatos);
      if (resolvido) candidatosResolvidos.set(id, resolvido);
    }
  }

  return ordenadas.map<PlanoBackfill>((questao) => {
    const id = String(questao.id);
    const candidatos = [
      ...(podeUsarOrdemEstavel ? candidatosDiretosPorId.get(id) || [] : candidatosPersistidosPorId.get(id) || []),
      ...(podeUsarOrdemEstavel ? [] : candidatosTextoPorId.has(id) ? [candidatosTextoPorId.get(id)!] : []),
    ];
    const resolvido = candidatosResolvidos.get(id) || null;
    const numeroExistente = obterNumeroExistente(questao);
    const validacao = validacaoTripla(questao);
    const numeroValidacao = numeroInteiroPositivo(validacao.numero_questao);
    const conflito = conflitosPersistidos.has(id) || (!podeUsarOrdemEstavel && candidatos.length > 0 && !resolverCandidato(candidatos));
    const numeroInferido = resolvido?.numero || null;
    const fonteInferencia = resolvido?.fonte || "sem inferencia confiavel";

    let motivoIgnorado = "";
    if (conflito) {
      motivoIgnorado = "candidatos de numero_questao conflitantes";
    } else if (!numeroInferido) {
      motivoIgnorado = "numero oficial da questao ausente";
    } else if (!provaLocal) {
      motivoIgnorado = "arquivo original da prova nao encontrado";
    } else if (numeroInferido > provaLocal.totalQuestoes) {
      motivoIgnorado = "numero inferido fora do tamanho da prova";
    }

    const atualizarNumero =
      !motivoIgnorado && numeroInferido !== null && (force || !numeroExistente) && numeroExistente !== numeroInferido;
    const atualizarValidacao =
      !motivoIgnorado && numeroInferido !== null && (force || !numeroValidacao) && numeroValidacao !== numeroInferido;

    return {
      questao,
      codigoProva,
      numeroInferido,
      fonteInferencia,
      atualizarNumero,
      atualizarValidacao,
      motivoIgnorado,
    };
  });
}

async function buscarQuestoes() {
  const { data, error } = await supabase
    .from("questoes_oab")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw new Error(`Falha ao buscar questoes_oab: ${error.message}`);
  return (data || []) as QuestaoDb[];
}

async function aplicarPlano(plano: PlanoBackfill) {
  if (!plano.numeroInferido) return;

  const validacao = {
    ...validacaoTripla(plano.questao),
    numero_questao: plano.numeroInferido,
  };
  const payload: Record<string, unknown> = {
    validacao_tripla: validacao,
  };

  if (plano.atualizarNumero) {
    payload.numero_questao = plano.numeroInferido;
  }

  const { error } = await supabase
    .from("questoes_oab")
    .update(payload)
    .eq("id", plano.questao.id);

  if (error) {
    throw new Error(`Falha ao atualizar questao ${plano.questao.id}: ${error.message}`);
  }
}

function imprimirGrupo(codigoProva: string, planos: PlanoBackfill[]) {
  console.log("");
  console.log(`PROVA ${codigoProva}`);
  console.log("ID banco | numero_questao inferido | acao | trecho enunciado");

  for (const plano of planos) {
    const numero = plano.numeroInferido ? String(plano.numeroInferido).padStart(2, "0") : "??";
    const acao = plano.motivoIgnorado
      ? `pular: ${plano.motivoIgnorado}`
      : plano.atualizarNumero || plano.atualizarValidacao
        ? "atualizar"
        : "ok";

    console.log(
      `${plano.questao.id} -> ${numero} | ${acao} | ${resumirTexto(plano.questao.enunciado)}`
    );
  }
}

async function backfillNumeroQuestoes() {
  const args = parseArgs();
  const provasLocais = carregarProvasLocais();
  const questoes = await buscarQuestoes();
  const grupos = new Map<string, QuestaoDb[]>();
  const semGrupo: QuestaoDb[] = [];

  for (const questao of questoes) {
    const codigoProva = obterCodigoProva(questao);
    if (!codigoProva) {
      semGrupo.push(questao);
      continue;
    }

    const grupo = grupos.get(codigoProva) || [];
    grupo.push(questao);
    grupos.set(codigoProva, grupo);
  }

  console.log("BACKFILL NUMERO_QUESTAO");
  console.log(`Dry-run: ${args.dryRun ? "sim" : "nao"}`);
  console.log(`Force: ${args.force ? "sim" : "nao"}`);
  console.log(`Provas locais: ${[...provasLocais.keys()].sort().join(", ") || "nenhuma"}`);

  if (semGrupo.length > 0) {
    console.log("");
    console.log(`Questoes sem grupo de prova confiavel: ${semGrupo.length}`);
  }

  let totalPlanos = 0;
  let totalAtualizarNumero = 0;
  let totalAtualizarValidacao = 0;
  let totalIgnoradas = 0;

  for (const [codigoProva, questoesGrupo] of [...grupos.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const provaLocal = provasLocais.get(codigoProva);
    const planos = montarPlanosGrupo(codigoProva, questoesGrupo, provaLocal, args.force);

    imprimirGrupo(codigoProva, planos);

    for (const plano of planos) {
      totalPlanos++;
      if (plano.motivoIgnorado) totalIgnoradas++;
      if (plano.atualizarNumero) totalAtualizarNumero++;
      if (plano.atualizarValidacao) totalAtualizarValidacao++;

      if (!args.dryRun && (plano.atualizarNumero || plano.atualizarValidacao)) {
        await aplicarPlano(plano);
      }
    }
  }

  console.log("");
  console.log("--------------------------------");
  console.log("RESUMO");
  console.log(`Questoes analisadas: ${totalPlanos}`);
  console.log(`Atualizariam numero_questao: ${totalAtualizarNumero}`);
  console.log(`Atualizariam validacao_tripla.numero_questao: ${totalAtualizarValidacao}`);
  console.log(`Ignoradas por baixa confianca/conflito: ${totalIgnoradas}`);
  console.log(args.dryRun ? "Nenhuma alteracao aplicada." : "Backfill aplicado.");
}

backfillNumeroQuestoes().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
