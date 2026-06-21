const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

// 1. Configuração de Ambiente
require("dotenv").config({ path: path.resolve(__dirname, '../.env.local') });

const GROQ_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!GROQ_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    console.error("❌ ERRO: Variáveis de ambiente faltando.");
    process.exit(1);
}

const groq = new Groq({ apiKey: GROQ_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 2. Definição estrita das 17 Matérias OAB
const MATERIAS_OFICIAIS = [
    "Direito Administrativo", "Direito Ambiental", "Direito Civil", "Direito Constitucional", 
    "Direito do Consumidor", "Direito do Trabalho", "Direito Empresarial", "Direito Internacional", 
    "Direito Penal", "Direito Previdenciário", "Direito Processual Civil", "Direito Processual do Trabalho", 
    "Direito Processual Penal", "Direito Tributário", "Direitos Humanos", "Ética Profissional", "Filosofia do Direito"
];

// 3. Função "Censura" (Impede a IA de criar categorias extras)
function normalizarMateria(materiaEntrada) {
    const mapeamento = {
        "Direito da Criança e do Adolescente": "Direito Civil",
        "Introdução ao Estudo do Direito": "Filosofia do Direito",
        "Direito Eleitoral": "Direito Constitucional",
        "Direito Financeiro": "Direito Tributário",
        "Direito do Processo do Trabalho": "Direito Processual do Trabalho",
        "Processo do Trabalho": "Direito Processual do Trabalho",
        "Direito da Advocacia": "Ética Profissional",
        "Estatuto da OAB": "Ética Profissional",
        "Processo Civil": "Direito Processual Civil",
        "Processo Penal": "Direito Processual Penal"
    };

    const materiaFormatada = mapeamento[materiaEntrada] || materiaEntrada;
    
    if (MATERIAS_OFICIAIS.includes(materiaFormatada)) {
        return materiaFormatada;
    }
    
    return "Direito Civil"; // Fallback de segurança
}

const PROVAS_DIR = path.resolve(__dirname, "../provas");
const PROCESSADAS_DIR = path.resolve(__dirname, "../provas/processadas");

if (!fs.existsSync(PROCESSADAS_DIR)) fs.mkdirSync(PROCESSADAS_DIR);

const gerarHash = (texto) => crypto.createHash("sha1").update(texto.replace(/\s+/g, "").trim().toLowerCase()).digest("hex");

function splitQuestoes(text) {
    const splitRegex = /(?:\n\s*\[QUESTÃO\s*\d+\])/gi;
    return text.split(splitRegex).filter(p => p.trim().length > 200); 
}

async function analisarIA(texto) {
    try {
        const res = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant",
            messages: [{
                role: "system",
                content: `Você é um motor de extração JSON. 
                Sua tarefa é classificar a questão em UMA das 17 matérias oficiais da OAB: ${MATERIAS_OFICIAIS.join(", ")}.
                Se a questão for sobre "Estatuto da OAB" ou "Advocacia", use "Ética Profissional".
                Se a questão for sobre "Processo", use a variante processual correspondente.
                Estrutura exata: { "enunciado": "...", "alternativas": {"A":"...", "B":"...", "C":"...", "D":"..."}, "gabarito": "A", "comentario": "...", "tema": "...", "materia": "..." }`
            },
            { role: "user", content: `Analise a questão e retorne APENAS o JSON:\n${texto.substring(0, 3500)}` }],
            temperature: 0,
            response_format: { type: "json_object" }
        });

        let content = res.choices[0].message.content.match(/\{[\s\S]*\}/)[0];
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
}

async function run() {
    const files = fs.readdirSync(PROVAS_DIR).filter(f => f.toLowerCase().endsWith(".txt"));
    
    for (const file of files) {
        const provaCodigo = (file.match(/(\d{1,4})/) || [])[1] || null;
        console.log(`\n📄 Processando arquivo: ${file}`);
        const text = fs.readFileSync(path.join(PROVAS_DIR, file), "utf8");
        const blocos = splitQuestoes(text);
        
        for (let i = 0; i < blocos.length; i++) {
            console.log(`-> Analisando questão ${i + 1}/${blocos.length}`);
            
            const ia = await analisarIA(blocos[i]);
            if (!ia || !ia.enunciado) {
                console.log("⏭️ Pulado: Falha na IA.");
                continue;
            }

            const materiaFinal = normalizarMateria(ia.materia);
            const hash = gerarHash(ia.enunciado);
            
            const { data: existe } = await supabase.from("questoes_oab").select("id").eq("hash", hash).maybeSingle();
            
            if (!existe) {
                await supabase.from("questoes_oab").insert([{
                    enunciado: ia.enunciado,
                    alternativas: [ia.alternativas?.A, ia.alternativas?.B, ia.alternativas?.C, ia.alternativas?.D],
                    gabarito: { A: 0, B: 1, C: 2, D: 3 }[ia.gabarito] ?? 0,
                    materia: materiaFinal,
                    tema: ia.tema || "Geral",
                    comentario: ia.comentario || "Comentário não disponível.",
                    hash,
                    origem: file,
                    prova_codigo: provaCodigo,
                    numero_questao: i + 1,
                    revisado_ia: false,
                    anulada: false,
                    ativa: true
                }]);
                console.log(`💾 Salvo (${materiaFinal})`);
            } else {
                console.log(`⚠️ Já existe no banco.`);
            }
            await new Promise(r => setTimeout(r, 1000));
        }
        fs.renameSync(path.join(PROVAS_DIR, file), path.join(PROCESSADAS_DIR, file));
        console.log(`✅ Arquivo ${file} movido para 'processadas'.`);
    }
    console.log("\n🏁 Finalizado.");
}

run();
