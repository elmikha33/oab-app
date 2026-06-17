const { exec } = require('child_process');
const path = require('path');

const PDF_PATH = path.join(__dirname, "../provas/oab_46.pdf"); // Ajuste o nome do arquivo aqui
const OUTPUT = path.join(__dirname, "page");

// Tenta converter diretamente pelo terminal
const comando = `pdftoppm -png -f 3 -l 5 "${PDF_PATH}" "${OUTPUT}"`;

console.log("Tentando executar:", comando);

exec(comando, (error, stdout, stderr) => {
    if (error) {
        console.error("❌ ERRO AO EXECUTAR:", error.message);
        console.error("⚠️ O erro sugere que o 'pdftoppm' não foi encontrado ou falhou.");
        return;
    }
    if (stderr) {
        console.log("⚠️ stderr (aviso):", stderr);
    }
    console.log("✅ Comando executado! Verifique a pasta do projeto por arquivos 'page-3.png' etc.");
});