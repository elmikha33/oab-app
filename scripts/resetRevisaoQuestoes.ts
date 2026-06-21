import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error("NEXT_PUBLIC_SUPABASE_URL nao encontrada.");
if (!supabaseKey) throw new Error("Chave Supabase nao encontrada.");

const supabase = createClient(supabaseUrl, supabaseKey);

const CAMPOS_RESET = [
  ["revisado_ia", false],
  ["revisado_em", null],
  ["confianca_ia", null],
  ["confianca_correcao", null],
  ["revisao_humana_necessaria", false],
  ["motivo_revisao_humana", null],
  ["observacao_revisao", null],
  ["fonte_gabarito", null],
  ["modelo_ultima_revisao", null],
  ["problemas_qualidade", {}],
  ["validacao_tripla", {}],
  ["comentario_auditado", false],
  ["comentario_auditado_em", null],
  ["comentario_auditoria_motivo", null],
] as const;

const CAMPOS_OBRIGATORIOS = new Set(["revisado_ia", "revisado_em"]);

type QuestaoAtual = {
  id: string | number;
  comentario?: string | null;
};

type RevisaoAuditoria = {
  questao_id: string | number;
  comentario_antes?: string | null;
  comentario_depois?: string | null;
  data?: string | null;
};

function parseArgs() {
  const args = process.argv.slice(2);
  return {
    dryRun: args.includes("--dry-run"),
    comentariosOnly: args.includes("--comentarios-only"),
  };
}

function normalizarTexto(valor: unknown) {
  return String(valor || "")
    .replace(/\s+/g, " ")
    .trim();
}

function erroDeColunaInexistente(error: { message?: string; code?: string }) {
  const mensagem = (error.message || "").toLowerCase();
  return (
    error.code === "PGRST204" ||
    mensagem.includes("could not find") ||
    mensagem.includes("column") ||
    mensagem.includes("schema cache")
  );
}

async function colunaExiste(coluna: string) {
  const { error } = await supabase.from("questoes_oab").select(coluna).limit(1);

  if (!error) return true;
  if (erroDeColunaInexistente(error)) return false;

  throw new Error(`Falha ao verificar coluna ${coluna}: ${error.message}`);
}

async function restaurarComentariosDaUltimaRevisao(dryRun: boolean) {
  const colunaComentarioExiste = await colunaExiste("comentario");
  if (!colunaComentarioExiste) {
    return {
      restaurados: 0,
      candidatos: 0,
      ignorados: 0,
      aviso: "Coluna comentario nao encontrada em questoes_oab.",
    };
  }

  const { data: questoes, error: questoesError } = await supabase
    .from("questoes_oab")
    .select("id, comentario");

  if (questoesError) {
    throw new Error(`Falha ao buscar comentarios atuais: ${questoesError.message}`);
  }

  const { data: revisoes, error: revisoesError } = await supabase
    .from("questoes_revisoes")
    .select("questao_id, comentario_antes, comentario_depois, data")
    .order("data", { ascending: false })
    .limit(20000);

  if (revisoesError) {
    throw new Error(
      [
        "Nao foi possivel consultar questoes_revisoes para restaurar comentarios com seguranca.",
        `Detalhe Supabase: ${revisoesError.message}`,
      ].join(" ")
    );
  }

  const questoesPorId = new Map(
    ((questoes || []) as QuestaoAtual[]).map((questao) => [String(questao.id), questao])
  );
  const ultimaRevisaoPorQuestao = new Map<string, RevisaoAuditoria>();

  for (const revisao of (revisoes || []) as RevisaoAuditoria[]) {
    const id = String(revisao.questao_id);
    if (!ultimaRevisaoPorQuestao.has(id)) {
      ultimaRevisaoPorQuestao.set(id, revisao);
    }
  }

  const restauracoes: Array<{ id: string; comentario: string | null }> = [];
  let ignorados = 0;

  for (const [id, revisao] of ultimaRevisaoPorQuestao) {
    const questao = questoesPorId.get(id);
    if (!questao) continue;

    const comentarioAtual = normalizarTexto(questao.comentario);
    const comentarioGerado = normalizarTexto(revisao.comentario_depois);

    if (!comentarioGerado || comentarioAtual !== comentarioGerado) {
      ignorados++;
      continue;
    }

    restauracoes.push({
      id,
      comentario: revisao.comentario_antes || null,
    });
  }

  if (!dryRun) {
    for (const restauracao of restauracoes) {
      const { error } = await supabase
        .from("questoes_oab")
        .update({ comentario: restauracao.comentario })
        .eq("id", restauracao.id);

      if (error) {
        throw new Error(`Falha ao restaurar comentario da questao ${restauracao.id}: ${error.message}`);
      }
    }
  }

  return {
    restaurados: restauracoes.length,
    candidatos: ultimaRevisaoPorQuestao.size,
    ignorados,
    aviso: "",
  };
}

async function resetarRevisoes() {
  const args = parseArgs();
  const payload: Record<string, unknown> = {};
  const camposIgnorados: string[] = [];

  for (const [campo, valor] of CAMPOS_RESET) {
    if (
      args.comentariosOnly &&
      ![
        "revisado_ia",
        "revisado_em",
        "confianca_ia",
        "confianca_correcao",
        "revisao_humana_necessaria",
        "motivo_revisao_humana",
        "observacao_revisao",
        "problemas_qualidade",
        "validacao_tripla",
        "comentario_auditado",
        "comentario_auditado_em",
        "comentario_auditoria_motivo",
      ].includes(campo)
    ) {
      continue;
    }

    if (await colunaExiste(campo)) {
      payload[campo] = valor;
      continue;
    }

    if (CAMPOS_OBRIGATORIOS.has(campo)) {
      throw new Error(
        [
          `Coluna obrigatoria ausente em questoes_oab: ${campo}.`,
          "Execute sql/questoes_oab_ia_revisao.sql no Supabase antes do reset.",
        ].join(" ")
      );
    }

    camposIgnorados.push(campo);
  }

  const { count: total, error: countError } = await supabase
    .from("questoes_oab")
    .select("id", { count: "exact", head: true });

  if (countError) {
    throw new Error(`Falha ao contar questoes: ${countError.message}`);
  }

  console.log("RESET DE REVISAO IA - QUESTOES OAB");
  console.log(`Dry-run: ${args.dryRun ? "sim" : "nao"}`);
  console.log(`Somente comentarios/auditoria: ${args.comentariosOnly ? "sim" : "nao"}`);
  console.log(`Questoes encontradas: ${total ?? "desconhecido"}`);
  console.log(`Campos que serao resetados: ${Object.keys(payload).join(", ")}`);

  if (camposIgnorados.length > 0) {
    console.log(`Campos inexistentes ignorados: ${camposIgnorados.join(", ")}`);
  }

  console.log("");
  console.log("Preservado:");
  console.log("- enunciado");
  console.log("- alternativas");
  console.log("- gabarito");
  console.log("- materia");
  console.log("- tema");
  console.log("- historico em questoes_revisoes");

  const comentarios = await restaurarComentariosDaUltimaRevisao(args.dryRun);
  console.log("");
  console.log("Comentarios da ultima revisao:");
  console.log(`Candidatos na auditoria: ${comentarios.candidatos}`);
  console.log(`Restaurados/limpos com seguranca: ${comentarios.restaurados}`);
  console.log(`Ignorados por divergencia manual ou falta de correspondencia: ${comentarios.ignorados}`);
  if (comentarios.aviso) {
    console.log(`Aviso: ${comentarios.aviso}`);
  }

  if (args.dryRun) {
    console.log("");
    console.log("Dry-run concluido. Nenhuma questao foi alterada.");
    return;
  }

  const { count: alteradas, error: updateError } = await supabase
    .from("questoes_oab")
    .update(payload, { count: "exact" })
    .not("id", "is", null);

  if (updateError) {
    throw new Error(`Falha ao resetar revisoes: ${updateError.message}`);
  }

  console.log("");
  console.log(`Revisoes resetadas: ${alteradas ?? "desconhecido"}`);
  console.log("Agora rode o validador para reconstruir comentarios com gabarito oficial.");
}

resetarRevisoes().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
