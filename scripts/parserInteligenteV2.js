const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Groq = require("groq-sdk");
const { createClient } = require("@supabase/supabase-js");

require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });

const GROQ_KEY = process.env.GROQ_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!GROQ_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ERRO: Variáveis de ambiente faltando.");
  process.exit(1);
}

const groq = new Groq({ apiKey: GROQ_KEY });
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const MATERIAS_OFICIAIS = [
  "Direito Administrativo",
  "Direito Ambiental",
  "Direito Civil",
  "Direito Constitucional",
  "Direito do Consumidor",
  "Direito do Trabalho",
  "Direito Empresarial",
  "Direito Internacional",
  "Direito Penal",
  "Direito Previdenciário",
  "Direito Processual Civil",
  "Direito Processual do Trabalho",
  "Direito Processual Penal",
  "Direito Tributário",
  "Direitos Humanos",
  "Ética Profissional",
  "Filosofia do Direito",
];

function normalizarMateria(materiaEntrada) {
  const mapeamento = {
    "Direito da Criança e do Adolescente": "Direito Civil",
    "Introdução ao Estudo do Direito": "Filosofia do Direito",
    "Direito Eleitoral": "Direito Constitucional",
    "Direito Financeiro": "Direito Tributário",
    "Direito Internacional Privado": "Direito Internacional",
    "Direito do Processo do Trabalho": "Direito Processual do Trabalho",
    "Processo do Trabalho": "Direito Processual do Trabalho",
    "Direito da Advocacia": "Ética Profissional",
    "Estatuto da OAB": "Ética Profissional",
    "Processo Civil": "Direito Processual Civil",
    "Processo Penal": "Direito Processual Penal",
  };

  const materiaFormatada = mapeamento[materiaEntrada] || materiaEntrada;

  if (MATERIAS_OFICIAIS.includes(materiaFormatada)) {
    return materiaFormatada;
  }

  return "Direito Civil";
}

const PROVAS_DIR = path.resolve(__dirname, "../provas");
const GABARITOS_DIR = path.resolve(__dirname, "../provas/gabaritos");
const PROCESSADAS_DIR = path.resolve(__dirname, "../provas/processadas");

if (!fs.existsSync(PROCESSADAS_DIR)) {
  fs.mkdirSync(PROCESSADAS_DIR, { recursive: true });
}

const gerarHash = (texto) =>
  crypto
    .createHash("sha1")
    .update(String(texto || "").replace(/\s+/g, "").trim().toLowerCase())
    .digest("hex");

function limparTexto(texto) {
  return String(texto || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extrairCodigoProva(file) {
  const match = file.match(/(\d{1,4})/);
  return match ? match[1] : null;
}

function carregarGabarito(provaCodigo) {
  const caminhos = [
    path.join(GABARITOS_DIR, `gabarito_${provaCodigo}.TXT`),
    path.join(GABARITOS_DIR, `gabarito_${provaCodigo}.txt`),
  ];

  const arquivo = caminhos.find((p) => fs.existsSync(p));

  if (!arquivo) {
    throw new Error(`Gabarito não encontrado para prova ${provaCodigo}`);
  }

  const texto = fs.readFileSync(arquivo, "utf8").replace(/^\uFEFF/, "");
  const mapa = new Map();

  const pares = texto.match(/\b\d{1,3}\s+[A-D]\b/gi) || [];

  for (const par of pares) {
    const m = par.trim().match(/^(\d{1,3})\s+([A-D])$/i);

    if (m) {
      mapa.set(Number(m[1]), {
        A: 0,
        B: 1,
        C: 2,
        D: 3,
      }[m[2].toUpperCase()]);
    }
  }

  return mapa;
}

function splitQuestoes(text) {
  const partes = text.split(/\[QUEST[ÃA]O\s+(\d+)\]/gi);
  const questoes = [];

  for (let i = 1; i < partes.length; i += 2) {
    const numero = Number(partes[i]);
    const bloco = partes[i + 1] || "";

    if (numero && bloco.trim().length > 200) {
      questoes.push({ numero, bloco });
    }
  }

  return questoes;
}

function extrairEnunciado(bloco) {
  const match = bloco.match(/Enunciado:\s*([\s\S]*?)(?=\n\s*\(A\))/i);

  if (!match) return "";

  return limparTexto(match[1]);
}

function extrairAlternativas(bloco) {
  const regex =
    /(?:^|\n)\s*\(([A-D])\)\s*([\s\S]*?)(?=\n\s*\([A-D]\)|\n\s*\[QUEST[ÃA]O\s+\d+\]|\s*$)/gi;

  const alternativas = {};
  let match;

  while ((match = regex.exec(bloco)) !== null) {
    alternativas[match[1].toUpperCase()] = limparTexto(match[2]);
  }

  return [
    alternativas.A || "",
    alternativas.B || "",
    alternativas.C || "",
    alternativas.D || "",
  ];
}

function pareceAlternativa(texto) {
  const t = limparTexto(texto).toLowerCase();

  const suspeitos = [
    "paloma, por ser",
    "alfredo pode",
    "abelardo poderá",
    "pedro poderá",
    "maria pode utilizar",
    "o governador do estado deve",
    "a câmara municipal de alfa, ao constat",
    "o município alfa não pode",
    "considerando a ausência",
    "a quebra da cadeia",
    "a parte não requereu",
    "os advogados eduardo e diogo podem continuar",
  ];

  return suspeitos.some((s) => t.startsWith(s));
}

function validarQuestao(q) {
  if (!q.enunciado || q.enunciado.length < 40) {
    return "enunciado vazio ou curto";
  }

  if (pareceAlternativa(q.enunciado)) {
    return "enunciado parece alternativa";
  }

  if (!Array.isArray(q.alternativas) || q.alternativas.length !== 4) {
    return "alternativas inválidas";
  }

  if (q.alternativas.some((a) => !a || a.length < 2)) {
    return "alternativa vazia";
  }

  if (![0, 1, 2, 3].includes(q.gabarito)) {
    return "gabarito oficial ausente";
  }

  return null;
}

async function analisarIA(q) {
  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `Você classifica questões da OAB.

Retorne APENAS JSON válido:
{
  "materia": "...",
  "tema": "...",
  "comentario": "..."
}

Matérias permitidas:
${MATERIAS_OFICIAIS.join(", ")}

Regras:
- Se for Estatuto da OAB, Advocacia, honorários, sociedade de advogados, infração disciplinar, use "Ética Profissional".
- Se for Filosofia, Locke, interpretação, zetética/dogmática, use "Filosofia do Direito".
- Se for eleitoral, use "Direito Constitucional".
- Se for financeiro/orçamento/LRF/tributo, use "Direito Tributário".
- NÃO reescreva enunciado.
- NÃO altere alternativas.
- NÃO altere gabarito.`,
        },
        {
          role: "user",
          content: `
Enunciado:
${q.enunciado}

Alternativas:
A) ${q.alternativas[0]}
B) ${q.alternativas[1]}
C) ${q.alternativas[2]}
D) ${q.alternativas[3]}

Gabarito oficial: ${["A", "B", "C", "D"][q.gabarito]}

Classifique matéria, tema e gere comentário.
`,
        },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = res.choices[0].message.content.match(/\{[\s\S]*\}/)?.[0];
    return content ? JSON.parse(content) : null;
  } catch {
    return null;
  }
}


function materiaPorNumeroProva44(numero) {
  if (numero >= 1 && numero <= 8) return "Ética Profissional";
  if (numero >= 9 && numero <= 10) return "Filosofia do Direito";
  if (numero >= 11 && numero <= 16) return "Direito Constitucional";
  if (numero >= 17 && numero <= 18) return "Direitos Humanos";
  if (numero >= 19 && numero <= 20) return "Direito Constitucional";
  if (numero >= 21 && numero <= 22) return "Direito Internacional";
  if (numero >= 23 && numero <= 29) return "Direito Tributário";
  if (numero >= 30 && numero <= 34) return "Direito Administrativo";
  if (numero >= 35 && numero <= 36) return "Direito Ambiental";
  if (numero >= 37 && numero <= 44) return "Direito Civil";
  if (numero >= 45 && numero <= 46) return "Direito do Consumidor";
  if (numero >= 47 && numero <= 50) return "Direito Empresarial";
  if (numero >= 51 && numero <= 56) return "Direito Processual Civil";
  if (numero >= 57 && numero <= 62) return "Direito Penal";
  if (numero >= 63 && numero <= 68) return "Direito Processual Penal";
  if (numero >= 69 && numero <= 76) return "Direito do Trabalho";
  if (numero >= 77 && numero <= 80) return "Direito Processual do Trabalho";
  return null;
}

async function run() {
  const files = fs
    .readdirSync(PROVAS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".txt"))
    .filter((f) => !f.toLowerCase().startsWith("gabarito_"));

  for (const file of files) {
    const provaCodigo = extrairCodigoProva(file);

    if (!provaCodigo) {
      console.log(`⏭️ Pulado: ${file}`);
      continue;
    }

    console.log(`\n📄 Processando arquivo: ${file}`);

    const gabarito = carregarGabarito(provaCodigo);
    const text = fs.readFileSync(path.join(PROVAS_DIR, file), "utf8");
    const blocos = splitQuestoes(text);

    console.log(`🔎 Blocos encontrados: ${blocos.length}`);
    console.log(`✅ Gabaritos carregados: ${gabarito.size}`);

    for (const item of blocos) {
      console.log(`-> Questão ${item.numero}`);

      const q = {
        numero_questao: item.numero,
        enunciado: extrairEnunciado(item.bloco),
        alternativas: extrairAlternativas(item.bloco),
        gabarito: gabarito.get(item.numero),
      };

      const erro = validarQuestao(q);

      if (erro) {
        console.log(`⛔ BLOQUEADA Q${item.numero}: ${erro}`);
        continue;
      }

      const ia = await analisarIA(q);

      if (!ia) {
        console.log("⏭️ Pulado: Falha na IA.");
        continue;
      }

      const materiaFinal = file.toLowerCase() === 'prova_44.txt' ? materiaPorNumeroProva44(q.numero_questao) : normalizarMateria(ia.materia);
      const hash = gerarHash(`${file}-${q.numero_questao}-${q.enunciado}`);

      const { data: existe } = await supabase
        .from("questoes_oab")
        .select("id")
        .eq("origem", file)
        .eq("numero_questao", q.numero_questao)
        .maybeSingle();

      if (!existe) {
        const { error } = await supabase.from("questoes_oab").insert([
          {
            enunciado: q.enunciado,
            alternativas: q.alternativas,
            gabarito: q.gabarito,
            gabarito_oficial: q.gabarito,
            fonte_gabarito: `provas/gabaritos/gabarito_${provaCodigo}.TXT:${q.numero_questao}`,
            materia: materiaFinal,
            tema: ia.tema || "Geral",
            comentario: ia.comentario || "Comentário não disponível.",
            hash,
            origem: file,
            prova_codigo: provaCodigo,
            edicao_exame: Number(provaCodigo),
            numero_questao: q.numero_questao,
            revisado_ia: false,
            anulada: false,
            anulada_oficial: false,
            ativa: true,
            inativa: false,
            revisao_humana_necessaria: false,
          },
        ]);

        if (error) {
          console.log(`❌ Erro salvando Q${item.numero}: ${error.message}`);
        } else {
          console.log(`💾 Salvo Q${item.numero} (${materiaFinal})`);
        }
      } else {
        console.log("⚠️ Já existe no banco.");
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    fs.renameSync(path.join(PROVAS_DIR, file), path.join(PROCESSADAS_DIR, file));
    console.log(`✅ Arquivo ${file} movido para /provas/processadas.`);
  }

  console.log("\n🏁 Finalizado.");
}

run().catch((err) => {
  console.error("❌ ERRO FATAL:", err.message);
  process.exit(1);
});