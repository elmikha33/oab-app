require("dotenv").config({ path: ".env.local" });

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// ajuste automático das pastas possíveis
const POSSIVEIS_PASTAS = [
  path.join(process.cwd(), "provas"),
  path.join(process.cwd(), "provas", "txt"),
  path.join(process.cwd(), "data"),
];

function acharTxts() {
  let arquivos = [];

  for (const pasta of POSSIVEIS_PASTAS) {
    if (!fs.existsSync(pasta)) continue;

    const encontrados = fs
      .readdirSync(pasta)
      .filter((a) => a.toLowerCase().endsWith(".txt"))
      .map((a) => path.join(pasta, a));

    arquivos.push(...encontrados);
  }

  return arquivos;
}

function limpar(txt) {
  return String(txt || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function pegarQuestoes(txt) {
  const partes = txt.split(/\[QUEST[ÃA]O\s+(\d+)\]/gi);

  const resultado = [];

  for (let i = 1; i < partes.length; i += 2) {
    const numero = Number(partes[i]);
    const bloco = partes[i + 1];

    if (!numero || !bloco) continue;

    const achou = bloco.match(
      /Enunciado:\s*([\s\S]*?)(?=\n\s*\(?A\)|\n\s*Alternativas)/i
    );

    if (!achou) continue;

    const enunciado = limpar(achou[1]);

    resultado.push({
      numero,
      enunciado,
    });
  }

  return resultado;
}


//
// 🔒 TRAVA DEFINITIVA
// Nunca deixa alternativa virar enunciado de novo
//
function enunciadoValido(texto) {
  texto = limpar(texto).toLowerCase();

  if (texto.length < 100) return false;

  if (
    texto.startsWith("os advogados") &&
    !texto.includes("assinale")
  ) {
    return false;
  }

  if (
    texto.startsWith("é correto") ||
    texto.startsWith("não é correto")
  ) {
    return false;
  }

  return true;
}


async function executar() {
  console.log("🔧 Reparando enunciados...");

  const arquivos = acharTxts();

  console.log(`📄 TXT encontrados: ${arquivos.length}`);

  let corrigidas = 0;

  for (const arquivo of arquivos) {
    console.log("\nLendo:", arquivo);

    const txt = fs.readFileSync(arquivo, "utf8");

    const questoes = pegarQuestoes(txt);

    console.log("Questões:", questoes.length);

    for (const q of questoes) {

      if (!enunciadoValido(q.enunciado)) {
        console.log(
          `⛔ TXT ignorado questão ${q.numero}: enunciado suspeito`
        );
        continue;
      }


      const { data } = await supabase
        .from("questoes_oab")
        .select("id,enunciado")
        .eq("numero_questao", q.numero);


      if (!data) continue;


      for (const banco of data) {

        if (enunciadoValido(banco.enunciado)) {
          continue;
        }


        const { error } = await supabase
          .from("questoes_oab")
          .update({
            enunciado: q.enunciado,
          })
          .eq("id", banco.id);


        if (!error) {
          corrigidas++;
          console.log(
            `✅ Corrigida questão ${q.numero} (ID ${banco.id})`
          );
        } else {
          console.log(error.message);
        }
      }
    }
  }


  console.log("\n======================");
  console.log("FINALIZADO");
  console.log("Corrigidas:", corrigidas);
  console.log("======================");
}

executar();