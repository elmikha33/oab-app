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

async function main() {
  console.log("");
  console.log("🔎 AUDITORIA FINAL DOS COMENTÁRIOS");
  console.log("");

  const { data, error } = await supabase
    .from("questoes_oab")
    .select(
      `
      id,
      numero_questao,
      materia,
      tema,
      gabarito,
      comentario
      `
    );

  if (error) {
    console.error(error);
    return;
  }

  const erros = [];

  for (const q of data) {
    const inicio = String(q.comentario || "")
      .slice(0, 120)
      .toLowerCase();

    if (
      (inicio.includes("alternativa a está correta") && q.gabarito !== 0) ||
      (inicio.includes("alternativa b está correta") && q.gabarito !== 1) ||
      (inicio.includes("alternativa c está correta") && q.gabarito !== 2) ||
      (inicio.includes("alternativa d está correta") && q.gabarito !== 3)
    ) {
      erros.push(q);
    }
  }

  if (erros.length === 0) {
    console.log("✅ APROVADO");
    console.log("Nenhum comentário contradiz o gabarito oficial.");
  } else {
    console.log("❌ ENCONTRADOS:", erros.length);

    for (const erro of erros) {
      console.log("");
      console.log("ID:", erro.id);
      console.log("Questão:", erro.numero_questao);
      console.log("Matéria:", erro.materia);
      console.log("Gabarito:", erro.gabarito);
      console.log(
        "Comentário:",
        erro.comentario.slice(0, 100)
      );
    }
  }

  console.log("");
  console.log("FINALIZADO.");
}

main();