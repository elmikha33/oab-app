/* eslint-disable no-console */

/**
 * FLUXO COMPLETO LEGⅠ / MISSÃO OAB
 *
 * Roda tudo em um comando.
 *
 * NÃO altera gabarito diretamente.
 *
 * Ordem:
 * 1 - Importa questões
 * 2 - Aplica regras conhecidas
 * 3 - Segunda camada de regras
 * 4 - IA revisa IA
 * 5 - Auditoria final comentário x gabarito
 *
 * Rodar:
 * node scripts/fluxoCompletoOab.js
 */

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ROOT = process.cwd();

const etapas = [
  {
    nome: "Gerar/importar questões do PDF",
    arquivo: "scripts/parserInteligenteV2.js",
    obrigatorio: true,
  },

  {
    nome: "Aplicar regras conhecidas",
    arquivo: "scripts/questoesRegrasConhecidas.js",
    obrigatorio: false,
  },

  {
    nome: "Seguir regras conhecidas",
    arquivo: "scripts/seguirRegrasConhecidas.js",
    obrigatorio: false,
  },

  {
    nome: "Validador IA contra IA",
    arquivo: "scripts/validateQuestoes.js",
    obrigatorio: false,
  },

  {
    nome: "Auditoria final dos comentários",
    arquivo: "scripts/auditarComentarios.js",
    obrigatorio: true,
  },
];

function linha() {
  console.log("=".repeat(70));
}

function existeArquivo(arquivo) {
  return fs.existsSync(path.join(ROOT, arquivo));
}

function rodarEtapa(etapa) {
  linha();
  console.log("▶ " + etapa.nome);
  console.log("Arquivo:", etapa.arquivo);
  linha();

  if (!existeArquivo(etapa.arquivo)) {
    if (etapa.obrigatorio) {
      console.error(
        "❌ Arquivo obrigatório não encontrado:",
        etapa.arquivo
      );
      process.exit(1);
    }

    console.log(
      "⚠️ Etapa opcional ignorada:",
      etapa.arquivo
    );

    return;
  }

  const resultado = spawnSync(
    "node",
    [etapa.arquivo],
    {
      cwd: ROOT,
      stdio: "inherit",
      shell: true,
    }
  );

  if (resultado.status !== 0) {
    console.error("");
    console.error(
      "❌ Falhou:",
      etapa.nome
    );

    console.error(
      "Fluxo parado para evitar erro no banco."
    );

    process.exit(1);
  }

  console.log("");
  console.log(
    "✅ Concluído:",
    etapa.nome
  );
  console.log("");
}

function main() {
  console.clear();

  linha();

  console.log(
    "🚀 LEGⅠ - FLUXO COMPLETO OAB"
  );

  linha();

  console.log("");
  console.log(
    "Gabarito permanece o importado oficialmente."
  );

  console.log(
    "Última etapa garante comentário compatível."
  );

  console.log("");

  for (const etapa of etapas) {
    rodarEtapa(etapa);
  }

  linha();

  console.log(
    "✅ PROCESSO FINALIZADO COM SUCESSO"
  );

  linha();

  console.log("");
  console.log(
    "Esperado:"
  );

  console.log(
    "✅ APROVADO"
  );

  console.log(
    "Nenhum comentário contradiz o gabarito oficial."
  );
}

main();