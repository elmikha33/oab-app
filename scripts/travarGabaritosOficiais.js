/* eslint-disable no-console */

/*
  TRAVA FINAL DOS GABARITOS OFICIAIS

  NÃO muda seu fluxo atual.

  Ordem correta:
  1 - Parser importa questão
  2 - IA cria/revisa comentário
  3 - Auditoria roda
  4 - ESTE SCRIPT garante que o TXT oficial manda

  Ele altera SOMENTE:
  - coluna gabarito

  Nunca altera:
  - enunciado
  - alternativas
  - comentário
*/

require("dotenv").config({
  path: ".env.local",
});

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const PASTA_GABARITOS = path.join(process.cwd(), "provas", "gabaritos");

const MAPA = {
  A: 0,
  B: 1,
  C: 2,
  D: 3,
};

const LETRA = ["A", "B", "C", "D"];

function pegarNumero(txt) {
  const m = String(txt || "").match(/\d+/);
  return m ? Number(m[0]) : null;
}

function carregarGabaritos() {
  const resultado = {};

  const arquivos = fs
    .readdirSync(PASTA_GABARITOS)
    .filter((a) => a.endsWith(".TXT") || a.endsWith(".txt"));

  for (const arquivo of arquivos) {
    const exame = pegarNumero(arquivo);

    if (!exame) continue;

    resultado[exame] = {};

    const linhas = fs
      .readFileSync(path.join(PASTA_GABARITOS, arquivo), "utf8")
      .split(/\r?\n/);

    for (const linha of linhas) {
      const match = linha.match(/(\d+)\D+([ABCD])\b/i);

      if (!match) continue;

      const numeroQuestao = Number(match[1]);
      const letraGabarito = match[2].toUpperCase();

      resultado[exame][numeroQuestao] = MAPA[letraGabarito];
    }

    console.log(
      "Gabarito carregado:",
      arquivo,
      Object.keys(resultado[exame]).length,
      "respostas"
    );
  }

  return resultado;
}

async function main() {
  console.log("");
  console.log("🔒 TRAVANDO GABARITOS OFICIAIS");
  console.log("");

  const oficiais = carregarGabaritos();

  const { data, error } = await supabase.from("questoes_oab").select("*");

  if (error) {
    console.error(error);
    return;
  }

  let corrigidas = 0;
  let ok = 0;
  let ignoradas = 0;

  for (const q of data) {
    const exame = pegarNumero(q.edicao_exame) || pegarNumero(q.origem);
    const numero = Number(q.numero_questao);

    if (!exame || !numero || oficiais[exame]?.[numero] === undefined) {
      ignoradas++;
      continue;
    }

    const oficial = oficiais[exame][numero];

    if (Number(q.gabarito) === oficial) {
      ok++;
      continue;
    }

    console.log(
      `Corrigindo ID ${q.id}:`,
      `Q${numero}`,
      `Exame ${exame}`,
      `${LETRA[Number(q.gabarito)] ?? q.gabarito} -> ${LETRA[oficial]}`
    );

    const { error: erroUpdate } = await supabase
      .from("questoes_oab")
      .update({
        gabarito: oficial,
      })
      .eq("id", q.id);

    if (!erroUpdate) {
      corrigidas++;
    }
  }

  console.log("");
  console.log("====== RESULTADO ======");
  console.log("Certas:", ok);
  console.log("Corrigidas:", corrigidas);
  console.log("Ignoradas:", ignoradas);
  console.log("");
  console.log("FINALIZADO.");
}

main();