const fs = require("fs");
const path = require("path");
const Tesseract = require("tesseract.js");
const poppler = require("pdf-poppler");

const PDF_PATH = path.join(__dirname, "provas/oab_46.pdf");
const tempDir = path.join(__dirname, "temp_debug");

async function debugOCR() {
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    console.log("🛠️ Convertendo PDFs...");
    await poppler.convert(PDF_PATH, { format: 'png', out_dir: tempDir, out_prefix: 'page', first_page: 3, last_page: 5 });

    const files = fs.readdirSync(tempDir).filter(f => f.endsWith(".png")).sort();
    
    for (const file of files) {
        console.log(`\n--- LENDO IMAGEM: ${file} ---`);
        const { data: { text } } = await Tesseract.recognize(path.join(tempDir, file), 'por');
        console.log(text); // Aqui veremos exatamente o que o computador leu
    }

    // Limpeza
    fs.rmSync(tempDir, { recursive: true, force: true });
}

debugOCR();