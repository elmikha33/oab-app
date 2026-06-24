const fs = require("fs");

const file = "scripts/parserInteligenteV2.js";
let txt = fs.readFileSync(file, "utf8");

const func = `
function materiaPorNumeroProva44(numero) {
  if (numero >= 1 && numero <= 8) return "Ética Profissional";
  if (numero >= 9 && numero <= 10) return "Filosofia do Direito";
  if (numero >= 11 && numero <= 16) return "Direito Constitucional";
  if (numero >= 17 && numero <= 18) return "Direitos Humanos";
  if (numero >= 19 && numero <= 20) return "Direito Constitucional";
  if (numero >= 21 && numero <= 22) return "Direito Internacional";
  if (numero >= 23 && numero <= 29) return "Direito Tributário";
  if (numero >= 30 && numero <= 34) return "Direito Administrativo";
  if (numero >= 35 && numero <= 36) return "Direito Ambiental";
  if (numero >= 37 && numero <= 44) return "Direito Civil";
  if (numero >= 45 && numero <= 46) return "Direito do Consumidor";
  if (numero >= 47 && numero <= 50) return "Direito Empresarial";
  if (numero >= 51 && numero <= 56) return "Direito Processual Civil";
  if (numero >= 57 && numero <= 62) return "Direito Penal";
  if (numero >= 63 && numero <= 68) return "Direito Processual Penal";
  if (numero >= 69 && numero <= 76) return "Direito do Trabalho";
  if (numero >= 77 && numero <= 80) return "Direito Processual do Trabalho";
  return null;
}
`;

if (!txt.includes("function materiaPorNumeroProva44")) {
  txt = txt.replace("async function run()", func + "\nasync function run()");
}

txt = txt.replace(
  "const materiaFinal = normalizarMateria(ia.materia);",
  "const materiaFinal = file.toLowerCase() === 'prova_44.txt' ? materiaPorNumeroProva44(q.numero_questao) : normalizarMateria(ia.materia);"
);

fs.writeFileSync(file, txt, "utf8");

console.log("✅ parser ajustado: prova_44 agora usa matéria fixa por número");
