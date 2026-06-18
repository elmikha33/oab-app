const path = require("path");
const fs = require("fs");
const envPath = path.resolve(__dirname, '../.env.local');

console.log("Procurando arquivo em:", envPath);
console.log("O arquivo existe?", fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
    console.log("Conteúdo do arquivo:");
    console.log(fs.readFileSync(envPath, 'utf8'));
} else {
    console.log("⚠️ Arquivo não encontrado! Verifique o caminho.");
}