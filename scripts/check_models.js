const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "SUA_API_KEY_AQUI"; // Cole sua chave aqui
const genAI = new GoogleGenerativeAI(API_KEY);

async function listar() {
  try {
    const models = await genAI.listModels();
<<<<<<< HEAD
    console.log("Modelos disponíveis:");
=======
    console.log("Modelos disponÃ­veis:");
>>>>>>> e1e1b23 (primeira versao)
    models.forEach(m => console.log(`- ${m.name}`));
  } catch (err) {
    console.error("Erro ao listar modelos:", err.message);
  }
}

listar();