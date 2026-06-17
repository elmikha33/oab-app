const { GoogleGenerativeAI } = require("@google/generative-ai");

// Substitua PELA NOVA CHAVE que você acabou de criar
const GEMINI_API_KEY = "AIzaSyBeGtrZ4z91A6axRqWSD4zXkSW8EceLI98"; 

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testar() {
  try {
    console.log("Iniciando teste de conexão...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent("Diga apenas 'Conexão funcionando'");
    console.log("Sucesso! Resposta do Gemini:", result.response.text());
    
  } catch (err) {
    console.error("--- ERRO DETALHADO ---");
    // Se ainda der erro, esta mensagem vai nos dizer EXATAMENTE o que é
    console.error(err.message);
  }
}

testar();