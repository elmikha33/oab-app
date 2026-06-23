/* eslint-disable no-console */

require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LETRAS = ["A", "B", "C", "D"];

function getArg(nome, padrao = null) {
  const arg = process.argv.find((a) => a.startsWith(`--${nome}=`));
  return arg ? arg.split("=")[1] : padrao;
}

function limparJson(txt) {
  return String(txt || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
}

async function auditarComentario(q) {
  const letra = LETRAS[Number(q.gabarito)];
  const alternativa = q.alternativas?.[Number(q.gabarito)] || "";

  const prompt = `
Você é auditor profissional de comentários da OAB.

REGRAS:
- O gabarito oficial é ${letra}
- NUNCA altere o gabarito
- Apenas veja se o comentário explica corretamente a alternativa oficial
- Corrija somente se houver erro, contradição ou explicação ruim

Responda APENAS JSON:

{
 "status":"ok|suspeito",
 "motivo":"curto",
 "comentario_corrigido":"novo comentário ou vazio"
}

MATÉRIA:
${q.materia}

TEMA:
${q.tema}

ENUNCIADO:
${q.enunciado}

A) ${q.alternativas?.[0] || ""}
B) ${q.alternativas?.[1] || ""}
C) ${q.alternativas?.[2] || ""}
D) ${q.alternativas?.[3] || ""}

GABARITO:
${letra}) ${alternativa}

COMENTÁRIO:
${q.comentario}
`;

  const r = await openai.chat.completions.create({
    model:
      process.env.OPENAI_MODEL_STRONG ||
      process.env.OPENAI_MODEL_FALLBACK ||
      "gpt-4o-mini",

    temperature: 0,

    messages: [
      {
        role: "system",
        content:
          "Você audita comentários OAB. O gabarito informado é oficial.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return JSON.parse(
    limparJson(r.choices[0].message.content)
  );
}

function salvarLog(resultado) {
  const pasta = path.join(process.cwd(), "logs");

  if (!fs.existsSync(pasta)) {
    fs.mkdirSync(pasta);
  }

  const arquivo = path.join(
    pasta,
    "auditoria-comentarios-IA.json"
  );

  fs.writeFileSync(
    arquivo,
    JSON.stringify(resultado, null, 2),
    "utf8"
  );

  return arquivo;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const force = process.argv.includes("--force");
  const all = process.argv.includes("--all");

  const limit = Number(getArg("limit", 10));
  const from = getArg("from");
  const id = getArg("id");

  let query = supabase
    .from("questoes_oab")
    .select(`
      id,
      numero_questao,
      materia,
      tema,
      enunciado,
      alternativas,
      gabarito,
      comentario,
      auditoria_ia
    `)
    .order("id", { ascending: true });

  if (!force) {
    query = query.eq("auditoria_ia", false);
  }

  if (id) {
    query = query.eq("id", Number(id));
  } else {
    if (from) {
      query = query.gte("id", Number(from));
    }

    if (!all) {
      query = query.limit(limit);
    }
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return;
  }

  console.log("");
  console.log("🧠 AUDITOR IA COM SELO");
  console.log("");

  console.log("Questões encontradas:", data.length);
  console.log("");

  const resultado = {
    data: new Date().toISOString(),
    modo: apply ? "APLICANDO" : "TESTE",
    analisadas: data.length,
    corrigidas: [],
    aprovadas: [],
    erros: [],
  };

  for (const q of data) {
    try {
      console.log(`🔎 ID ${q.id}`);

      const r = await auditarComentario(q);

      if (
        r.status === "suspeito" &&
        r.comentario_corrigido
      ) {
        console.log("⚠️ Corrigindo comentário");

        if (apply) {
          await supabase
            .from("questoes_oab")
            .update({
              comentario: r.comentario_corrigido,
              auditoria_ia: true,
              auditoria_data: new Date().toISOString(),
            })
            .eq("id", q.id);
        }

        resultado.corrigidas.push({
          id: q.id,
          motivo: r.motivo,
        });

      } else {

        console.log("✅ aprovado");

        if (apply) {
          await supabase
            .from("questoes_oab")
            .update({
              auditoria_ia: true,
              auditoria_data: new Date().toISOString(),
            })
            .eq("id", q.id);
        }

        resultado.aprovadas.push(q.id);
      }

    } catch (e) {

      console.log("❌", e.message);

      resultado.erros.push({
        id: q.id,
        erro: e.message,
      });
    }
  }

  const log = salvarLog(resultado);

  console.log("");
  console.log("====== FINAL ======");
  console.log("Analisadas:", resultado.analisadas);
  console.log("Aprovadas:", resultado.aprovadas.length);
  console.log("Corrigidas:", resultado.corrigidas.length);
  console.log("Erros:", resultado.erros.length);
  console.log("");
  console.log("Log:", log);
}

main();