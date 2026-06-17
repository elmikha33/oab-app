const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const fs = require("fs");
const crypto = require("crypto");
const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const PROVAS_DIR = path.resolve(__dirname, "../provas");

const gerarHash = (texto) => crypto.createHash("sha1").update(texto.replace(/\s+/g, "").trim().toLowerCase()).digest("hex");

function splitQuestoes(text) {
    const splitRegex = /(?:\n\s*\[QUESTÃO\s*\d+\])/gi;
    let partes = text.split(splitRegex);
    return partes.filter(p => p.trim().length > 200); 
}

async function analisarIA(texto) {
    try {
        const textoLimitado = texto.substring(0, 3500); 

        const res = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{
                role: "system",
                content: `Você é um motor de extração JSON. NÃO escreva explicações, NÃO escreva 'Aqui está', NÃO use markdown. 
                Sua resposta deve começar com '{' e terminar com '}'.
                Estrutura exata: { "enunciado": "...", "alternativas": {"A":"...", "B":"...", "C":"...", "D":"..."}, "gabarito": "A", "comentario": "...", "tema": "...", "materia": "..." }`
            },
            { role: "user", content: `Analise a questão e retorne APENAS o JSON:\n${textoLimitado}` }],
            temperature: 0,
            response_format: { type: "json_object" }
        });

        let content = res.choices[0].message.content;
        
        // Extração por Regex: procura qualquer coisa entre a primeira '{' e a última '}'
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            content = jsonMatch[0];
        }

        // Sanitização de caracteres de controle que quebram o JSON
        content = content.replace(/[\u0000-\u001F]+/g, " "); 
        
        return JSON.parse(content);
    } catch (e) {
        console.error("❌ Erro na IA:", e.message);
        return null;
    }
}

async function run() {
    const files = fs.readdirSync(PROVAS_DIR).filter(f => f.toLowerCase().endsWith(".txt"));
    
    for (const file of files) {
        console.log(`\n📄 Processando arquivo: ${file}`);
        const text = fs.readFileSync(path.join(PROVAS_DIR, file), "utf8");
        const blocos = splitQuestoes(text);
        
        console.log(`✅ Questões detectadas: ${blocos.length}`);

        let contador = 1;

        for (const bloco of blocos) {
            console.log(`-> Analisando questão ${contador}/${blocos.length}`);
            
            const ia = await analisarIA(bloco);

            if (!ia || !ia.enunciado) {
                console.log("⏭️ Pulado: Falha na IA.");
                contador++;
                continue;
            }

            const hash = gerarHash(ia.enunciado);
            const { data: existe } = await supabase.from("questoes_oab").select("id").eq("hash", hash).maybeSingle();
            
            if (!existe) {
                await supabase.from("questoes_oab").insert([{
                    enunciado: ia.enunciado,
                    alternativas: [ia.alternativas?.A, ia.alternativas?.B, ia.alternativas?.C, ia.alternativas?.D],
                    gabarito: { A: 0, B: 1, C: 2, D: 3 }[ia.gabarito] ?? 0,
                    materia: ia.materia || "Direito Geral",
                    tema: ia.tema || "Geral",
                    comentario: ia.comentario || "Comentário não disponível.",
                    hash,
                    origem: file
                }]);
                console.log(`💾 Salvo (Item ${contador}).`);
            } else {
                console.log(`⚠️ Já existe (Item ${contador}).`);
            }
            
            contador++;
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

run();