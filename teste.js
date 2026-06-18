const { GoogleGenerativeAI } = require("@google/generative-ai");

<<<<<<< HEAD
// Substitua PELA NOVA CHAVE que você acabou de criar
=======
// Substitua PELA NOVA CHAVE que vocÃª acabou de criar
>>>>>>> e1e1b23 (primeira versao)
const GEMINI_API_KEY = "AIzaSyBeGtrZ4z91A6axRqWSD4zXkSW8EceLI98"; 

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testar() {
  try {
<<<<<<< HEAD
    console.log("Iniciando teste de conexão...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent("Diga apenas 'Conexão funcionando'");
=======
    console.log("Iniciando teste de conexÃ£o...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent("Diga apenas 'ConexÃ£o funcionando'");
>>>>>>> e1e1b23 (primeira versao)
    console.log("Sucesso! Resposta do Gemini:", result.response.text());
    
  } catch (err) {
    console.error("--- ERRO DETALHADO ---");
<<<<<<< HEAD
    // Se ainda der erro, esta mensagem vai nos dizer EXATAMENTE o que é
=======
    // Se ainda der erro, esta mensagem vai nos dizer EXATAMENTE o que Ã©
>>>>>>> e1e1b23 (primeira versao)
    console.error(err.message);
  }
}

testar();