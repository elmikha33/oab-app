import fs from "node:fs";
import path from "node:path";

const LOGS_DIR = path.resolve(process.cwd(), "logs");
const ARQUIVOS = [
  {
    titulo: "REVISOES HUMANAS PENDENTES",
    caminho: path.join(LOGS_DIR, "revisoes_humanas_pendentes.txt"),
  },
  {
    titulo: "REGRAS CONHECIDAS SUGERIDAS",
    caminho: path.join(LOGS_DIR, "regras_conhecidas_sugeridas.txt"),
  },
];

function lerArquivo(caminho: string) {
  if (!fs.existsSync(caminho)) return "";
  return fs.readFileSync(caminho, "utf8").trim();
}

let encontrouSugestoes = false;

for (const arquivo of ARQUIVOS) {
  const conteudo = lerArquivo(arquivo.caminho);
  if (!conteudo) continue;

  encontrouSugestoes = true;
  console.log("");
  console.log(arquivo.titulo);
  console.log("=".repeat(arquivo.titulo.length));
  console.log(conteudo);
}

if (!encontrouSugestoes) {
  console.log("Nenhuma sugestao de regra conhecida encontrada nos logs atuais.");
}
