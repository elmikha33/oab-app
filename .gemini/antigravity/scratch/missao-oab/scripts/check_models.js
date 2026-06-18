const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = "SUA_API_KEY_AQUI"; // Cole sua chave aqui
const genAI = new GoogleGenerativeAI(API_KEY);

async function listar() {
  try {
    const models = await genAI.listModels();
    console.log("Modelos disponíveis:");
    models.forEach(m => console.log(`- ${m.name}`));
  } catch (err) {
    console.error("Erro ao listar modelos:", err.message);
  }
}

listar();