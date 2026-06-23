/* eslint-disable no-console */

require("dotenv").config({
  path: ".env.local",
});

const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const letras = ["A", "B", "C", "D"];

function detectarComentario(texto) {
  texto = String(texto || "").toUpperCase();

  const match =
    texto.match(/ALTERNATIVA CORRETA É A ([ABCD])/) ||
    texto.match(/ALTERNATIVA ([ABCD]) ESTÁ CORRETA/);

  if (!match) return null;

  return letras.indexOf(match[1]);
}

async function main() {
  console.log("");
  console.log("🔎 AUDITORIA FINAL DOS COMENTÁRIOS");
  console.log("");

  const { data, error } = await supabase
    .from("questoes_oab")
    .select("*");

  if (error) {
    console.error(error);
    return;
  }

  const problemas = [];

  for (const q of data) {
    const comentario = detectarComentario(q.comentario);

    if (
      comentario !== null &&
      comentario !== Number(q.gabarito)
    ) {
      problemas.push({
        id: q.id,
        numero: q.numero_questao,
        materia: q.materia,
        banco: letras[q.gabarito],
        comentario: letras[comentario],
      });
    }
  }

  if (!problemas.length) {
    console.log("✅ APROVADO");
    console.log("Nenhuma divergência encontrada.");
  } else {
    console.log("❌ DIVERGÊNCIAS:");
    console.table(problemas);
  }

  console.log("");
  console.log("FINALIZADO.");
}

main();