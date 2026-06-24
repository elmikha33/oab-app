const fs = require("fs");
const cp = require("child_process");

const file = "components/QuestoesList.tsx";
const libFile = "lib/questoes.ts";

function run(cmd) {
  return cp.execSync(cmd, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 80,
  });
}

function lineCount(text) {
  return text.split(/\r?\n/).length;
}

function firstLine(text) {
  return text.replace(/^\uFEFF/, "").split(/\r?\n/)[0];
}

const badPieces = [
  "\uFFFD",
  "mat\u00C3",
  "quest\u00C3",
  "Edi\u00C3",
  "N\u00C3",
  "Voc\u00C3",
  "\u00C3\u2030",
  "\u00F0\u0178",
  "\u00E2\u0161",
  "\u00E2\u0153",
  "\u00C2\u00B7"
];

function hasEncodingTrash(text) {
  return badPieces.some((piece) => text.includes(piece));
}

function fixCommonMojibake(text) {
  const fixes = [
    ["mat\u00C3\u00A9rias", "matérias"],
    ["mat\u00C3\u00A9ria", "matéria"],
    ["quest\u00C3\u00B5es", "questões"],
    ["quest\u00C3\u00A3o", "questão"],
    ["Edi\u00C3\u00A7\u00C3\u00A3o", "Edição"],
    ["edi\u00C3\u00A7\u00C3\u00A3o", "edição"],
    ["N\u00C3\u00A3o", "Não"],
    ["n\u00C3\u00A3o", "não"],
    ["Voc\u00C3\u00AA", "Você"],
    ["voc\u00C3\u00AA", "você"],
    ["sele\u00C3\u00A7\u00C3\u00A3o", "seleção"],
    ["import\u00C3\u00A2ncia", "importância"],
    ["\u00C3\u2030tica", "Ética"],
    ["\u00C3\u00A9tica", "ética"],
    ["\u00C2\u00B7", "·"],
    ["\u00F0\u0178\u017D\u00AF", "🎯"],
    ["\u00E2\u0161\u00A1", "⚡"],
    ["\u00F0\u0178\u201D\u00A5", "🔥"]
  ];

  let out = text;
  for (const [bad, good] of fixes) {
    out = out.split(bad).join(good);
  }
  return out;
}

if (!fs.existsSync(file)) {
  console.error("ERRO: nao achei " + file);
  process.exit(1);
}

const brokenBackup = file + ".broken." + Date.now() + ".bak";
fs.copyFileSync(file, brokenBackup);
console.log("Backup do arquivo quebrado:", brokenBackup);

const commits = run("git log --format=%H -- " + file)
  .trim()
  .split(/\r?\n/)
  .filter(Boolean);

if (!commits.length) {
  console.error("ERRO: nao achei historico git para " + file);
  process.exit(1);
}

let bestStrict = null;
let bestLoose = null;

for (const commit of commits) {
  try {
    const text = run("git show " + commit + ":" + file);
    const first = firstLine(text);
    const lines = lineCount(text);

    if (first !== "'use client';") continue;
    if (lines < 1000) continue;

    const item = { commit, text, lines, trash: hasEncodingTrash(text) };

    if (!item.trash) {
      if (!bestStrict || item.lines > bestStrict.lines) bestStrict = item;
    }

    if (!bestLoose || item.lines > bestLoose.lines) bestLoose = item;
  } catch {
    // ignora commit sem o arquivo
  }
}

const selected = bestStrict || bestLoose;

if (!selected) {
  console.error("ERRO: nao encontrei uma versao boa de " + file + " no git.");
  console.error("Nesse caso, use: git log --oneline -- " + file);
  process.exit(1);
}

let restored = selected.text.replace(/^\uFEFF/, "");
restored = fixCommonMojibake(restored);

restored = restored.replace(
  /const LIMIT_QUESTOES = \d+;/,
  "const LIMIT_QUESTOES = 10000;"
);

restored = restored.replace(
  /Resetar todas as \d+ quest(?:ões|oes)\?/g,
  "Resetar todas as {data.length} questões?"
);

fs.writeFileSync(file, restored, "utf8");

console.log("Restaurado de commit:", selected.commit);
console.log("Linhas restauradas:", lineCount(restored));
console.log("Primeira linha:", JSON.stringify(firstLine(restored)));

if (fs.existsSync(libFile)) {
  let lib = fs.readFileSync(libFile, "utf8");
  lib = lib.replace(/\.limit\(\d+\)/g, ".limit(10000)");
  lib = fixCommonMojibake(lib);
  fs.writeFileSync(libFile, lib, "utf8");
  console.log("lib/questoes.ts ajustado para .limit(10000)");
}

const finalText = fs.readFileSync(file, "utf8");

if (firstLine(finalText) !== "'use client';") {
  console.error("ERRO: primeira linha ainda esta errada:", JSON.stringify(firstLine(finalText)));
  process.exit(1);
}

if (finalText.includes("\uFFFD")) {
  console.error("ERRO: ainda existe caractere invalido no arquivo.");
  process.exit(1);
}

console.log("OK - QuestoesList restaurado, UTF-8 limpo e limite 10000 mantido.");
