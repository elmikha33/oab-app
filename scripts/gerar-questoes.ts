import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

// 1. Interfaces para tipagem forte
interface QuestaoOAB {
  enunciado: string;
  alternativas: string[];
  gabarito: number;
  explicacao: string;
  materia: string;
  tema: string;
  nivel: 'Facil' | 'Medio' | 'Dificil';
  exame: string;
  incidenciaTema: number;
  probabilidade: 'Alta' | 'Media' | 'Baixa';
}

<<<<<<< HEAD
// 2. Validação de segurança das variáveis
if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY não definida no .env");
=======
// 2. ValidaÃ§Ã£o de seguranÃ§a das variÃ¡veis
if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY nÃ£o definida no .env");
>>>>>>> e1e1b23 (primeira versao)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) 
  throw new Error("Credenciais do Supabase faltando no .env");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

<<<<<<< HEAD
// Modelo com saída forçada em JSON (muito mais estável)
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", // Use "gemini-2.0-flash" se disponível na sua região
=======
// Modelo com saÃ­da forÃ§ada em JSON (muito mais estÃ¡vel)
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", // Use "gemini-2.0-flash" se disponÃ­vel na sua regiÃ£o
>>>>>>> e1e1b23 (primeira versao)
  generationConfig: { responseMimeType: "application/json" } 
});

const MATERIAS_OAB = [
  "Direito Administrativo", "Direito Constitucional", "Direito Civil", "Direito Processual Civil",
  "Direito Penal", "Direito Processual Penal", "Direito do Trabalho", "Direito Processual do Trabalho",
  "Direito Tributario", "Direito Empresarial", "Direitos Humanos", "Codigo de Etica e Estatuto da OAB",
  "Direito Ambiental", "Direito Internacional", "Direito do Consumidor", "Filosofia do Direito",
  "Direito Eleitoral", "Direito Financeiro"
];

async function gerarESalvarQuestao() {
  const materia = MATERIAS_OAB[Math.floor(Math.random() * MATERIAS_OAB.length)];
<<<<<<< HEAD
  console.log(`-> Iniciando geração: ${materia}`);

  const prompt = `Gere uma questão da OAB sobre ${materia}. Siga estritamente este JSON: {
=======
  console.log(`-> Iniciando geraÃ§Ã£o: ${materia}`);

  const prompt = `Gere uma questÃ£o da OAB sobre ${materia}. Siga estritamente este JSON: {
>>>>>>> e1e1b23 (primeira versao)
    "enunciado": "string",
    "alternativas": ["A", "B", "C", "D"],
    "gabarito": 0,
    "explicacao": "string",
    "materia": "${materia}",
    "tema": "string",
    "nivel": "Medio",
    "exame": "OAB XLI",
    "incidenciaTema": 35,
    "probabilidade": "Alta"
<<<<<<< HEAD
  }. Nível deve ser 'Facil'|'Medio'|'Dificil'. Probabilidade deve ser 'Alta'|'Media'|'Baixa'.`;
=======
  }. NÃ­vel deve ser 'Facil'|'Medio'|'Dificil'. Probabilidade deve ser 'Alta'|'Media'|'Baixa'.`;
>>>>>>> e1e1b23 (primeira versao)

  try {
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const novaQuestao: QuestaoOAB = JSON.parse(responseText);

<<<<<<< HEAD
    console.log("-> Questão gerada. Salvando no banco...");
=======
    console.log("-> QuestÃ£o gerada. Salvando no banco...");
>>>>>>> e1e1b23 (primeira versao)

    const { error } = await supabase.from('questoes').insert([
      {
        enunciado: novaQuestao.enunciado,
        alternativas: novaQuestao.alternativas,
        gabarito: novaQuestao.gabarito,
        explicacao: novaQuestao.explicacao,
        materia: novaQuestao.materia,
        tema: novaQuestao.tema,
        nivel: novaQuestao.nivel,
        exame: novaQuestao.exame,
        incidencia_tema: novaQuestao.incidenciaTema,
        probabilidade: novaQuestao.probabilidade
      }
    ]);

    if (error) throw error;
<<<<<<< HEAD
    console.log("-> Sucesso! Questão salva.");
=======
    console.log("-> Sucesso! QuestÃ£o salva.");
>>>>>>> e1e1b23 (primeira versao)

  } catch (err) {
    console.error("-> Erro no processo:", err);
  }
}

gerarESalvarQuestao();