const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createClient } = require("@supabase/supabase-js");

// 1. CONFIGURAÇÃO (Preencha com seus dados)
const GEMINI_API_KEY = "";
const SUPABASE_URL = "";
const SUPABASE_KEY = "";

// Inicialização
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Lista de modelos para testar (caso um dê erro 404)
const modelosParaTentar = ["gemini-1.5-flash-latest", "gemini-1.5-flash", "gemini-1.5-pro"];

async function gerar() {
  console.log("Iniciando processo de geração...");

  for (const nomeModelo of modelosParaTentar) {
    try {
      console.log(`Tentando usar o modelo: ${nomeModelo}...`);
      
      const model = genAI.getGenerativeModel({ model: nomeModelo });
      
      const prompt = `Crie uma questão de múltipla escolha sobre Direito (OAB). 
      Retorne APENAS um JSON (sem texto adicional, sem markdown) com as chaves: 
      enunciado, materia, opcao_a, opcao_b, opcao_c, opcao_d, gabarito.`;
      
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      
      // Limpeza robusta: remove blocos de markdown e espaços extras
      const jsonText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      const questao = JSON.parse(jsonText);

      // Inserção no Supabase
      const { error } = await supabase.from('questoes').insert([questao]);
      
      if (error) {
        console.error("Erro ao salvar no banco (Supabase):", error.message);
        return; // Para o loop se o erro for no banco
      }

      console.log("SUCESSO: Questão gerada e salva no banco!");
      return; // Finaliza com sucesso

    } catch (err) {
      console.warn(`Falha no modelo ${nomeModelo}: ${err.message.substring(0, 100)}...`);
    }
  }
  
  console.error("--- ERRO FATAL: Todos os modelos falharam. Verifique sua API KEY ou cota diária. ---");
}

gerar();
