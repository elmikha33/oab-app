import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";
import {
  AiProviderPausedError,
  gerarJsonComFallback,
  getPrimaryModelLabel,
  parseAiProviderMode,
  type AiMessage,
  type AiProviderMode,
} from "./aiProvider";

const LETRAS = ["A", "B", "C", "D"] as const;
const DEFAULT_LIMIT = 80;
const RELATORIOS_DIR = path.resolve(process.cwd(), "relatorios");
const RELATORIO_JSON = path.join(RELATORIOS_DIR, "auditoria-gabarito-juridico.json");
const RELATORIO_TXT = path.join(RELATORIOS_DIR, "auditoria-gabarito-juridico.txt");

type Letra = (typeof LETRAS)[number];
type Confianca = "alta" | "media" | "baixa";
type OrigemAuditoria = "deterministica" | "ia" | "falha";
type StatusAuditoria =
  | "OK"
  | "SUSPEITA"
  | "CORRIGIVEL"
  | "REVISAO_HUMANA"
  | "BAIXA_CONFIANCA"
  | "FALHA";

type Questao = {
  id: string | number;
  enunciado?: string | null;
  alternativas?: unknown;
  materia?: string | null;
  tema?: string | null;
  gabarito?: unknown;
  gabarito_oficial?: unknown;
  comentario?: string | null;
  origem?: string | null;
  edicao_exame?: string | number | null;
  numero_questao?: string | number | null;
  ativa?: boolean | null;
  inativa?: boolean | null;
};

type Args = {
  prova?: number | string;
  origem?: string;
  limit: number;
  dryRun: boolean;
  apply: boolean;
  onlySuspects: boolean;
  provider: AiProviderMode;
};

type AvaliacaoGabarito = {
  gabaritoAtualCorreto: boolean;
  alternativaCorreta: Letra;
  indiceCorreto: number;
  confianca: Confianca;
  motivoJuridico: string;
  comentarioSugerido: string;
  precisaRevisaoHumana: boolean;
  origemAuditoria: OrigemAuditoria;
  alertas: string[];
};

type ResultadoAuditoria = {
  questao: {
    id: string | number;
    origem: string;
    edicao_exame: string | number | null;
    numero_questao: string | number | null;
    enunciado: string;
  };
  status: StatusAuditoria;
  origem_auditoria: OrigemAuditoria;
  gabarito_atual: string;
  gabarito_atual_indice: number | null;
  alternativa_correta: Letra | null;
  indice_correto: number | null;
  confianca: Confianca | "indefinida";
  motivo_juridico: string;
  comentario_sugerido: string;
  precisa_revisao_humana: boolean;
  corrigir_automaticamente: boolean;
  aplicado: boolean;
  alertas: string[];
};

function parseArgs(): Args {
  const raw = process.argv.slice(2);
  const has = (flag: string) => raw.includes(flag);
  const value = (name: string) => {
    const inline = raw.find((arg) => arg.startsWith(`${name}=`));
    if (inline) return inline.slice(name.length + 1);

    const index = raw.indexOf(name);
    if (index >= 0 && raw[index + 1] && !raw[index + 1].startsWith("--")) {
      return raw[index + 1];
    }

    return undefined;
  };

  const limitRaw = value("--limit");
  const limit = limitRaw ? Number(limitRaw) : DEFAULT_LIMIT;
  const provaRaw = value("--prova");
  const provaNumero = provaRaw ? Number(provaRaw) : NaN;
  const apply = has("--apply");

  return {
    prova: provaRaw
      ? Number.isInteger(provaNumero)
        ? provaNumero
        : provaRaw
      : undefined,
    origem: value("--origem"),
    limit: Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT,
    dryRun: !apply || has("--dry-run"),
    apply,
    onlySuspects: has("--only-suspects"),
    provider: parseAiProviderMode(value("--provider") || process.env.AI_PROVIDER || "auto"),
  };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL nao encontrada.");
  if (!key) {
    throw new Error(
      "Nenhuma chave Supabase encontrada. Configure SUPABASE_SERVICE_ROLE_KEY, SUPABASE_KEY ou NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
    },
  });
}

function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .replace(/\s+/g, " ")
    .trim();
}

function removerAcentos(texto: string) {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function normalizarParaComparacao(valor: unknown) {
  return removerAcentos(normalizarTexto(valor))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizarGabarito(valor: unknown) {
  if (typeof valor === "number" && Number.isInteger(valor) && valor >= 0 && valor <= 3) {
    return valor;
  }

  const texto = String(valor ?? "").trim().toUpperCase();
  const letraIndex = LETRAS.indexOf(texto as Letra);
  if (letraIndex >= 0) return letraIndex;

  const numero = Number(texto);
  if (Number.isInteger(numero) && numero >= 0 && numero <= 3) return numero;

  return null;
}

function formatarGabarito(indice: number | null): string {
  return indice === null ? "INVALIDO" : LETRAS[indice] || "INVALIDO";
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

function resumirTexto(texto: unknown, limite = 260) {
  const normalizado = normalizarTexto(texto);
  if (normalizado.length <= limite) return normalizado;
  return `${normalizado.slice(0, limite - 3)}...`;
}

function textoIncluiTodos(texto: string, termos: string[]) {
  return termos.every((termo) => texto.includes(termo));
}

function comentarioMencionaAlternativaCorreta(comentario: string, letra: Letra) {
  const texto = normalizarParaComparacao(comentario);
  const l = letra.toLowerCase();
  return (
    texto.includes(`alternativa ${l} esta correta`) ||
    texto.includes(`alternativa correta e ${l}`) ||
    texto.includes(`opcao ${l} esta correta`) ||
    texto.includes(`opcao correta e ${l}`) ||
    texto.includes(`gabarito ${l}`)
  );
}

function comentarioGenerico(comentario: string, letra: Letra) {
  const texto = normalizarParaComparacao(comentario);
  if (texto.length < 90) return true;
  if (!comentarioMencionaAlternativaCorreta(comentario, letra)) return true;

  const temConector = /\b(porque|pois|uma vez que|conforme|nos termos|ja que|haja vista)\b/.test(texto);
  const temTermoJuridico =
    /\b(crime|ilicitude|punibilidade|agente|legitima defesa|dever legal|reincidencia|culpa|dolo|direito|obrigacao|competencia|processo|recurso|contrato|responsabilidade|constitucional|penal|civil|administrativo|trabalho)\b/.test(
      texto
    );
  const somenteFormula =
    /^a alternativa [a-d] esta correta porque (e|trata se de|corresponde a|esta de acordo com) (a )?(legislacao|norma|regra|questao|alternativa correta)/.test(
      texto
    );

  return !temConector || !temTermoJuridico || somenteFormula;
}

function motivoJuridicoEspecifico(motivo: string) {
  const texto = normalizarParaComparacao(motivo);
  if (texto.length < 80) return false;
  if (/^(comentario|gabarito|alternativa) (correto|incorreto|adequado|inadequado)\b/.test(texto)) {
    return false;
  }

  return /\b(crime|ilicitude|punibilidade|legitima defesa|dever legal|morte do agente|reincidencia|responsabilidade|competencia|prazo|nulidade|recurso|obrigacao|direito)\b/.test(
    texto
  );
}

function comentarioContradizGabarito(comentario: string, gabaritoAtual: number | null) {
  if (gabaritoAtual === null) return false;

  const texto = normalizarParaComparacao(comentario);
  const letraAtual = formatarGabarito(gabaritoAtual).toLowerCase();
  const corretas = [
    ...texto.matchAll(/\balternativa\s+correta\s+(?:e|eh|seria)?\s*(?:a\s+|letra\s+)?([a-d])\b/g),
    ...texto.matchAll(/\b(?:a\s+)?alternativa\s+([a-d])\s+(?:esta|e|eh|seria)\s+correta\b/g),
    ...texto.matchAll(/\bgabarito\s+(?:e|eh|seria)?\s*(?:a\s+|letra\s+)?([a-d])\b/g),
    ...texto.matchAll(/\bopcao\s+([a-d])\b/g),
  ].map((match) => match[1]);
  const incorretas = [
    ...texto.matchAll(/\b(?:a\s+)?alternativa\s+([a-d])\s+(?:esta|e|eh|seria)\s+incorreta\b/g),
    ...texto.matchAll(/\b(?:a\s+)?alternativa\s+([a-d])\s+nao\s+(?:esta|e|eh|seria)\s+correta\b/g),
  ].map((match) => match[1]);

  return corretas.some((letra) => letra !== letraAtual) || incorretas.includes(letraAtual);
}

function montarComentario(letra: Letra, motivo: string) {
  return `A alternativa ${letra} esta correta porque ${motivo}`;
}

function avaliarDeterministicamente(questao: Questao): AvaliacaoGabarito | null {
  const alternativas = normalizarAlternativas(questao.alternativas);
  const gabaritoAtual = normalizarGabarito(questao.gabarito);
  const contexto = normalizarParaComparacao(
    [questao.enunciado, questao.materia, questao.tema, questao.comentario, alternativas.join(" ")].join(" ")
  );
  const candidatosCorretos = new Map<number, string>();
  const alternativasFalsas = new Set<number>();

  const contextoExcludentes =
    contexto.includes("excludente") ||
    contexto.includes("ilicitude") ||
    contexto.includes("legitima defesa") ||
    contexto.includes("estrito cumprimento do dever legal");
  const contextoPunibilidade =
    contexto.includes("extincao da punibilidade") ||
    (contexto.includes("punibilidade") && (contexto.includes("morte do agente") || contexto.includes("reincidencia")));

  alternativas.forEach((alternativa, index) => {
    const texto = normalizarParaComparacao(alternativa);

    if (
      contextoExcludentes &&
      texto.includes("legitima defesa") &&
      texto.includes("desproporcional") &&
      /\b(sempre|qualquer|ilimitad|sem limite|automaticamente)\b/.test(texto)
    ) {
      alternativasFalsas.add(index);
    }

    if (
      contextoExcludentes &&
      textoIncluiTodos(texto, ["estrito", "cumprimento", "dever", "legal"]) &&
      /\b(exclui|afasta|elimina|nao ha|inexiste)\b/.test(texto) &&
      /\b(crime|ilicitude|antijuridicidade)\b/.test(texto)
    ) {
      candidatosCorretos.set(
        index,
        "o estrito cumprimento do dever legal e causa de exclusao da ilicitude, afastando a caracterizacao juridica do crime quando a conduta se limita ao dever imposto pela norma."
      );
    }

    if (
      contextoPunibilidade &&
      textoIncluiTodos(texto, ["morte", "agente"]) &&
      texto.includes("punibilidade") &&
      /\b(extingue|extincao|causa extintiva|extinta)\b/.test(texto)
    ) {
      candidatosCorretos.set(
        index,
        "a morte do agente extingue a punibilidade, pois a pretensao punitiva estatal nao se transmite a terceiros."
      );
    }

    if (
      contextoPunibilidade &&
      texto.includes("reincidencia") &&
      texto.includes("punibilidade") &&
      /\b(impede|obsta|afasta|inviabiliza)\b/.test(texto) &&
      /\b(extincao|extinguir|extingue)\b/.test(texto)
    ) {
      alternativasFalsas.add(index);
    }
  });

  const corretos = [...candidatosCorretos.entries()];
  if (corretos.length === 1) {
    const [indiceCorreto, motivo] = corretos[0];
    const letra = LETRAS[indiceCorreto];
    return {
      gabaritoAtualCorreto: gabaritoAtual === indiceCorreto,
      alternativaCorreta: letra,
      indiceCorreto,
      confianca: "alta",
      motivoJuridico: motivo,
      comentarioSugerido: montarComentario(letra, motivo),
      precisaRevisaoHumana: false,
      origemAuditoria: "deterministica",
      alertas: ["Padrao deterministico juridico inequivoco aplicado antes da IA."],
    };
  }

  if (gabaritoAtual !== null && alternativasFalsas.has(gabaritoAtual)) {
    return {
      gabaritoAtualCorreto: false,
      alternativaCorreta: LETRAS[gabaritoAtual],
      indiceCorreto: gabaritoAtual,
      confianca: "alta",
      motivoJuridico:
        "A alternativa marcada pelo gabarito atual coincide com uma afirmacao juridicamente falsa detectada por regra deterministica, mas nao houve alternativa correta inequivoca para correcao automatica.",
      comentarioSugerido: "",
      precisaRevisaoHumana: true,
      origemAuditoria: "deterministica",
      alertas: ["Gabarito atual aponta alternativa falsa por regra deterministica."],
    };
  }

  return null;
}

function suspeitaAntesDaIa(questao: Questao, deterministica: AvaliacaoGabarito | null) {
  const gabaritoAtual = normalizarGabarito(questao.gabarito);
  const alternativas = normalizarAlternativas(questao.alternativas);
  return (
    Boolean(deterministica && (!deterministica.gabaritoAtualCorreto || deterministica.precisaRevisaoHumana)) ||
    gabaritoAtual === null ||
    alternativas.length !== 4 ||
    alternativas.some((alternativa) => alternativa.length < 2) ||
    comentarioContradizGabarito(normalizarTexto(questao.comentario), gabaritoAtual)
  );
}

function normalizarConfianca(valor: unknown): Confianca | null {
  const texto = normalizarParaComparacao(valor);
  if (texto === "alta") return "alta";
  if (texto === "media" || texto === "medio") return "media";
  if (texto === "baixa" || texto === "baixo") return "baixa";
  return null;
}

function normalizarRespostaIa(json: Record<string, unknown>, gabaritoAtual: number | null): AvaliacaoGabarito | null {
  const indiceRaw = Number(json.indice_correto);
  const letraRaw = normalizarTexto(json.alternativa_correta).toUpperCase();
  const indiceDaLetra = LETRAS.indexOf(letraRaw as Letra);
  const indiceCorreto =
    Number.isInteger(indiceRaw) && indiceRaw >= 0 && indiceRaw <= 3
      ? indiceRaw
      : indiceDaLetra >= 0
      ? indiceDaLetra
      : null;

  if (indiceCorreto === null) return null;
  if (indiceDaLetra >= 0 && indiceDaLetra !== indiceCorreto) return null;

  const alternativaCorreta = LETRAS[indiceCorreto];
  const gabaritoAtualCorreto = json.gabarito_atual_correto === true;
  const confianca = normalizarConfianca(json.confianca);
  const motivoJuridico = normalizarTexto(json.motivo_juridico);
  const comentarioSugerido = normalizarTexto(json.comentario_sugerido);

  if (!confianca || typeof json.gabarito_atual_correto !== "boolean") return null;
  if (gabaritoAtualCorreto && gabaritoAtual !== indiceCorreto) return null;
  if (!gabaritoAtualCorreto && gabaritoAtual === indiceCorreto) return null;

  return {
    gabaritoAtualCorreto,
    alternativaCorreta,
    indiceCorreto,
    confianca,
    motivoJuridico,
    comentarioSugerido,
    precisaRevisaoHumana: json.precisa_revisao_humana === true,
    origemAuditoria: "ia",
    alertas: [],
  };
}

async function auditarComIa(
  questao: Questao,
  providerMode: AiProviderMode
): Promise<AvaliacaoGabarito | null> {
  const alternativas = normalizarAlternativas(questao.alternativas);
  const gabaritoAtual = normalizarGabarito(questao.gabarito);
  const letraAtual = formatarGabarito(gabaritoAtual);
  const messages: AiMessage[] = [
    {
      role: "system",
      content: `
Voce e auditor juridico senior de questoes da OAB.

Objetivo:
- verificar se o gabarito atual faz sentido juridicamente;
- avaliar enunciado, alternativas, materia, tema, gabarito atual e comentario atual;
- em caso de duvida, use confianca "media" ou "baixa" e marque revisao humana;
- nao altere enunciado, alternativas, materia, tema, origem ou hash;
- responda apenas JSON estrito, sem markdown.

Regras:
- "alta" somente quando a resposta correta for juridicamente inequivoca.
- "media" ou "baixa" nunca deve autorizar correcao automatica.
- motivo_juridico deve explicar a regra juridica especifica.
- comentario_sugerido deve mencionar expressamente a alternativa correta.

Formato obrigatorio:
{
  "gabarito_atual_correto": true,
  "alternativa_correta": "A",
  "indice_correto": 0,
  "confianca": "alta",
  "motivo_juridico": "fundamento juridico especifico",
  "comentario_sugerido": "A alternativa A esta correta porque...",
  "precisa_revisao_humana": false
}
`,
    },
    {
      role: "user",
      content: `
Questao ID: ${questao.id}

Materia: ${questao.materia || "vazio"}
Tema: ${questao.tema || "vazio"}

Enunciado:
${questao.enunciado || ""}

Alternativas:
${JSON.stringify(alternativas, null, 2)}

Gabarito atual:
${letraAtual} (${gabaritoAtual === null ? "invalido" : gabaritoAtual})

Comentario atual:
${questao.comentario || "vazio"}
`,
    },
  ];

  const resposta = await gerarJsonComFallback({
    messages,
    providerMode,
    responseLabel: "auditoria_gabarito_juridico",
  });

  return normalizarRespostaIa(resposta.json, gabaritoAtual);
}

function decidirResultado(questao: Questao, avaliacao: AvaliacaoGabarito | null): ResultadoAuditoria {
  const gabaritoAtual = normalizarGabarito(questao.gabarito);
  const enunciado = normalizarTexto(questao.enunciado);

  if (!avaliacao) {
    return {
      questao: {
        id: questao.id,
        origem: normalizarTexto(questao.origem),
        edicao_exame: questao.edicao_exame ?? null,
        numero_questao: questao.numero_questao ?? null,
        enunciado,
      },
      status: "FALHA",
      origem_auditoria: "falha",
      gabarito_atual: formatarGabarito(gabaritoAtual),
      gabarito_atual_indice: gabaritoAtual,
      alternativa_correta: null,
      indice_correto: null,
      confianca: "indefinida",
      motivo_juridico: "IA nao retornou JSON valido ou coerente com o formato exigido.",
      comentario_sugerido: "",
      precisa_revisao_humana: true,
      corrigir_automaticamente: false,
      aplicado: false,
      alertas: ["Questao marcada para revisao humana por falha de auditoria."],
    };
  }

  const comentarioValido =
    !comentarioGenerico(avaliacao.comentarioSugerido, avaliacao.alternativaCorreta) &&
    comentarioMencionaAlternativaCorreta(avaliacao.comentarioSugerido, avaliacao.alternativaCorreta);
  const motivoEspecifico = motivoJuridicoEspecifico(avaliacao.motivoJuridico);
  const podeCorrigir =
    avaliacao.confianca === "alta" &&
    !avaliacao.gabaritoAtualCorreto &&
    motivoEspecifico &&
    comentarioValido &&
    !avaliacao.precisaRevisaoHumana;
  const baixaConfianca = avaliacao.confianca === "baixa" || avaliacao.confianca === "media";
  const precisaRevisaoHumana =
    avaliacao.precisaRevisaoHumana ||
    baixaConfianca ||
    (!avaliacao.gabaritoAtualCorreto && !podeCorrigir);

  const alertas = [...avaliacao.alertas];
  if (!motivoEspecifico) alertas.push("Motivo juridico insuficientemente especifico para correcao automatica.");
  if (!comentarioValido) alertas.push("Comentario sugerido generico ou sem mencao expressa a alternativa correta.");
  if (baixaConfianca) alertas.push("Confianca baixa/media: correcao automatica bloqueada.");

  const status: StatusAuditoria = avaliacao.gabaritoAtualCorreto
    ? baixaConfianca || precisaRevisaoHumana
      ? "REVISAO_HUMANA"
      : "OK"
    : podeCorrigir
    ? "CORRIGIVEL"
    : baixaConfianca
    ? "BAIXA_CONFIANCA"
    : "REVISAO_HUMANA";

  return {
    questao: {
      id: questao.id,
      origem: normalizarTexto(questao.origem),
      edicao_exame: questao.edicao_exame ?? null,
      numero_questao: questao.numero_questao ?? null,
      enunciado,
    },
    status,
    origem_auditoria: avaliacao.origemAuditoria,
    gabarito_atual: formatarGabarito(gabaritoAtual),
    gabarito_atual_indice: gabaritoAtual,
    alternativa_correta: avaliacao.alternativaCorreta,
    indice_correto: avaliacao.indiceCorreto,
    confianca: avaliacao.confianca,
    motivo_juridico: avaliacao.motivoJuridico,
    comentario_sugerido: avaliacao.comentarioSugerido,
    precisa_revisao_humana: precisaRevisaoHumana,
    corrigir_automaticamente: podeCorrigir,
    aplicado: false,
    alertas,
  };
}

async function buscarQuestoes(args: Args) {
  const supabase = getSupabase();
  let query = supabase
    .from("questoes_oab")
    .select(
      "id,enunciado,alternativas,materia,tema,gabarito,gabarito_oficial,comentario,origem,edicao_exame,numero_questao,ativa,inativa"
    )
    .eq("ativa", true)
    .eq("inativa", false)
    .order("edicao_exame", { ascending: false, nullsFirst: false })
    .order("numero_questao", { ascending: true, nullsFirst: false })
    .order("id", { ascending: true })
    .range(0, args.limit - 1);

  if (args.prova !== undefined) {
    query = query.eq("edicao_exame", args.prova);
  }

  if (args.origem) {
    query = query.eq("origem", args.origem);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Erro Supabase ao buscar questoes: ${error.message}`);

  return { questoes: (data || []) as Questao[], supabase };
}

async function aplicarResultado(
  supabase: ReturnType<typeof getSupabase>,
  resultado: ResultadoAuditoria,
  dryRun: boolean
) {
  if (dryRun) return;

  if (resultado.corrigir_automaticamente && resultado.indice_correto !== null) {
    const { error } = await supabase
      .from("questoes_oab")
      .update({
        gabarito: resultado.indice_correto,
        gabarito_oficial: resultado.indice_correto,
        comentario: resultado.comentario_sugerido,
        revisao_humana_necessaria: false,
      })
      .eq("id", resultado.questao.id);

    if (error) throw new Error(`Falha ao corrigir questao ${resultado.questao.id}: ${error.message}`);
    resultado.aplicado = true;
    return;
  }

  if (resultado.precisa_revisao_humana) {
    const { error } = await supabase
      .from("questoes_oab")
      .update({
        revisao_humana_necessaria: true,
      })
      .eq("id", resultado.questao.id);

    if (error) {
      throw new Error(`Falha ao marcar revisao humana na questao ${resultado.questao.id}: ${error.message}`);
    }
    resultado.aplicado = true;
  }
}

function itemRelatorio(resultado: ResultadoAuditoria) {
  return {
    id: resultado.questao.id,
    origem: resultado.questao.origem,
    edicao_exame: resultado.questao.edicao_exame,
    numero_questao: resultado.questao.numero_questao,
    status: resultado.status,
    origem_auditoria: resultado.origem_auditoria,
    gabarito_atual: resultado.gabarito_atual,
    alternativa_correta: resultado.alternativa_correta,
    confianca: resultado.confianca,
    motivo_juridico: resultado.motivo_juridico,
    comentario_sugerido: resultado.comentario_sugerido,
    aplicado: resultado.aplicado,
    alertas: resultado.alertas,
    enunciado: resultado.questao.enunciado,
  };
}

function montarRelatorioTxt(params: {
  args: Args;
  resultados: ResultadoAuditoria[];
  falhas: ResultadoAuditoria[];
}) {
  const suspeitas = params.resultados.filter((resultado) => resultado.status !== "OK");
  const corrigidas = params.resultados.filter((resultado) => resultado.corrigir_automaticamente);
  const humanas = params.resultados.filter((resultado) => resultado.precisa_revisao_humana);
  const baixaConfianca = params.resultados.filter(
    (resultado) => resultado.confianca === "baixa" || resultado.confianca === "media"
  );
  const linhas: string[] = [];
  const secao = (titulo: string, itens: ResultadoAuditoria[]) => {
    linhas.push("");
    linhas.push(titulo);
    linhas.push("-".repeat(titulo.length));
    if (itens.length === 0) {
      linhas.push("Nenhuma.");
      return;
    }

    itens.forEach((resultado) => {
      linhas.push(
        [
          `ID ${resultado.questao.id}`,
          `prova ${resultado.questao.edicao_exame ?? "?"}`,
          `numero ${resultado.questao.numero_questao ?? "?"}`,
          `origem ${resultado.questao.origem || "?"}`,
        ].join(" | ")
      );
      linhas.push(`Status: ${resultado.status}`);
      linhas.push(`Gabarito atual: ${resultado.gabarito_atual}`);
      linhas.push(`Alternativa correta auditada: ${resultado.alternativa_correta || "indefinida"}`);
      linhas.push(`Confianca: ${resultado.confianca}`);
      linhas.push(`Motivo: ${resultado.motivo_juridico}`);
      if (resultado.comentario_sugerido) {
        linhas.push(`Comentario sugerido: ${resultado.comentario_sugerido}`);
      }
      if (resultado.alertas.length > 0) {
        linhas.push(`Alertas: ${resultado.alertas.join(" | ")}`);
      }
      linhas.push(`Enunciado: ${resumirTexto(resultado.questao.enunciado, 360)}`);
      linhas.push("");
    });
  };

  linhas.push("AUDITORIA DE GABARITO JURIDICO");
  linhas.push(`Gerado em: ${new Date().toISOString()}`);
  linhas.push(`Modo: ${params.args.dryRun ? "dry-run" : "apply"}`);
  linhas.push(`Modelo IA: ${getPrimaryModelLabel()}`);
  linhas.push(`Filtro prova: ${params.args.prova ?? "todos"}`);
  linhas.push(`Filtro origem: ${params.args.origem ?? "todos"}`);
  linhas.push(`Limit: ${params.args.limit}`);
  linhas.push(`Only suspects: ${params.args.onlySuspects ? "sim" : "nao"}`);
  linhas.push("");
  linhas.push("RESUMO");
  linhas.push(`Auditadas: ${params.resultados.length}`);
  linhas.push(`Suspeitas: ${suspeitas.length}`);
  linhas.push(`Corrigidas${params.args.dryRun ? " (seriam corrigidas)" : ""}: ${corrigidas.length}`);
  linhas.push(`Marcadas para revisao humana: ${humanas.length}`);
  linhas.push(`Baixa/media confianca: ${baixaConfianca.length}`);
  linhas.push(`Falhas: ${params.falhas.length}`);
  linhas.push(`Relatorio JSON: ${RELATORIO_JSON}`);
  linhas.push(`Relatorio TXT: ${RELATORIO_TXT}`);

  secao("QUESTOES SUSPEITAS", suspeitas);
  secao("QUESTOES CORRIGIDAS", corrigidas);
  secao("QUESTOES MARCADAS PARA REVISAO HUMANA", humanas);
  secao("QUESTOES COM BAIXA/MEDIA CONFIANCA", baixaConfianca);
  secao("FALHAS", params.falhas);

  return `${linhas.join("\n")}\n`;
}

function salvarRelatorios(args: Args, resultados: ResultadoAuditoria[], falhas: ResultadoAuditoria[]) {
  const suspeitas = resultados.filter((resultado) => resultado.status !== "OK");
  const corrigidas = resultados.filter((resultado) => resultado.corrigir_automaticamente);
  const humanas = resultados.filter((resultado) => resultado.precisa_revisao_humana);
  const baixaConfianca = resultados.filter(
    (resultado) => resultado.confianca === "baixa" || resultado.confianca === "media"
  );

  const relatorio = {
    gerado_em: new Date().toISOString(),
    modo: args.dryRun ? "dry-run" : "apply",
    modelo_ia: getPrimaryModelLabel(),
    filtros: {
      prova: args.prova ?? null,
      origem: args.origem ?? null,
      limit: args.limit,
      only_suspects: args.onlySuspects,
    },
    resumo: {
      auditadas: resultados.length,
      suspeitas: suspeitas.length,
      corrigidas: corrigidas.length,
      marcadas_para_revisao_humana: humanas.length,
      baixa_media_confianca: baixaConfianca.length,
      falhas: falhas.length,
    },
    questoes_suspeitas: suspeitas.map(itemRelatorio),
    questoes_corrigidas: corrigidas.map(itemRelatorio),
    questoes_marcadas_para_revisao_humana: humanas.map(itemRelatorio),
    questoes_com_baixa_media_confianca: baixaConfianca.map(itemRelatorio),
    falhas: falhas.map(itemRelatorio),
  };

  fs.mkdirSync(RELATORIOS_DIR, { recursive: true });
  fs.writeFileSync(RELATORIO_JSON, `${JSON.stringify(relatorio, null, 2)}\n`, "utf8");
  fs.writeFileSync(RELATORIO_TXT, montarRelatorioTxt({ args, resultados, falhas }), "utf8");

  return relatorio.resumo;
}

async function auditarGabaritoJuridico() {
  const args = parseArgs();
  const { questoes, supabase } = await buscarQuestoes(args);
  const resultados: ResultadoAuditoria[] = [];
  const falhas: ResultadoAuditoria[] = [];

  console.log("AUDITORIA DE GABARITO JURIDICO");
  console.log(`Modelo IA: ${getPrimaryModelLabel()}`);
  console.log(`Provider IA: ${args.provider}`);
  console.log(`Modo: ${args.dryRun ? "dry-run" : "apply"}`);
  console.log(`Filtro prova: ${args.prova ?? "todos"}`);
  console.log(`Filtro origem: ${args.origem ?? "todos"}`);
  console.log(`Limit: ${args.limit}`);
  console.log(`Only suspects: ${args.onlySuspects ? "sim" : "nao"}`);
  console.log(`Questoes carregadas: ${questoes.length}`);

  for (const questao of questoes) {
    let avaliacao: AvaliacaoGabarito | null = null;

    try {
      const deterministica = avaliarDeterministicamente(questao);
      if (args.onlySuspects && !suspeitaAntesDaIa(questao, deterministica)) {
        continue;
      }

      avaliacao = deterministica;
      if (!avaliacao) {
        avaliacao = await auditarComIa(questao, args.provider);
      }

      const resultado = decidirResultado(questao, avaliacao);
      await aplicarResultado(supabase, resultado, args.dryRun);
      resultados.push(resultado);

      console.log("");
      console.log(`QUESTAO ID ${questao.id}`);
      console.log(`STATUS: ${resultado.status}`);
      console.log(`GABARITO ATUAL: ${resultado.gabarito_atual}`);
      console.log(`ALTERNATIVA AUDITADA: ${resultado.alternativa_correta || "indefinida"}`);
      console.log(`CONFIANCA: ${resultado.confianca}`);
      console.log(`MOTIVO: ${resultado.motivo_juridico}`);
    } catch (err) {
      const motivo =
        err instanceof AiProviderPausedError
          ? err.message
          : err instanceof Error
          ? err.message
          : String(err);
      const resultado = decidirResultado(questao, null);
      resultado.motivo_juridico = motivo;
      resultado.alertas = ["Falha durante auditoria; questao deve ser revisada manualmente."];

      try {
        await aplicarResultado(supabase, resultado, args.dryRun);
      } catch (applyErr) {
        resultado.alertas.push(
          applyErr instanceof Error ? applyErr.message : `Falha ao aplicar marcacao: ${String(applyErr)}`
        );
      }

      resultados.push(resultado);
      falhas.push(resultado);

      console.log("");
      console.log(`QUESTAO ID ${questao.id}`);
      console.log("STATUS: FALHA");
      console.log(`MOTIVO: ${motivo}`);
    }
  }

  const resumo = salvarRelatorios(args, resultados, falhas);

  console.log("");
  console.log("--------------------------------");
  console.log("AUDITORIA FINALIZADA");
  console.log(`Auditadas: ${resumo.auditadas}`);
  console.log(`Suspeitas: ${resumo.suspeitas}`);
  console.log(`Corrigidas${args.dryRun ? " (seriam corrigidas)" : ""}: ${resumo.corrigidas}`);
  console.log(`Marcadas para revisao humana: ${resumo.marcadas_para_revisao_humana}`);
  console.log(`Falhas: ${resumo.falhas}`);
  console.log(`Relatorio JSON: ${RELATORIO_JSON}`);
  console.log(`Relatorio TXT: ${RELATORIO_TXT}`);
}

auditarGabaritoJuridico().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
