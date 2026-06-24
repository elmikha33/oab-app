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

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ ERRO: Variáveis de ambiente faltando.");
  process.exit(1);
}

if (!GROQ_KEY) {
  console.warn("⚠️ GROQ_API_KEY ausente. Tema e comentário usarão fallback local.");
}

const groq = GROQ_KEY ? new Groq({ apiKey: GROQ_KEY }) : null;
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

  return null;
}

function materiaPorOrdemOab(numero) {
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

function normalizarParaComparacao(texto) {
  return limparTexto(texto)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function removerBom(texto) {
  return String(texto || "").replace(/^\uFEFF/, "");
}

function extrairCodigoProva(file) {
  const match = file.match(/^prova_(\d{1,4})\.txt$/i);
  return match ? match[1] : null;
}

function arquivoEhProva(file) {
  return /^prova_\d{1,4}\.txt$/i.test(file);
}

function gabaritoParaIndice(letra) {
  return {
    A: 0,
    B: 1,
    C: 2,
    D: 3,
  }[String(letra || "").toUpperCase()];
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

  const texto = removerBom(fs.readFileSync(arquivo, "utf8"));
  const mapa = new Map();
  const linhas = texto.split(/\r?\n/);

  linhas.forEach((linha, index) => {
    const textoLinha = linha.trim();
    if (!textoLinha || textoLinha.startsWith("#")) return;

    const m = textoLinha.match(/^(?:quest[ãa]o\s*)?0*(\d{1,3})\s*(?:[=):.\-]|\s)\s*([A-D])\b/i);
    if (!m) return;

    const numero = Number(m[1]);
    const letra = m[2].toUpperCase();
    const indice = gabaritoParaIndice(letra);
    const existente = mapa.get(numero);

    if (existente && existente.letra !== letra) {
      throw new Error(`Gabarito conflitante para prova ${provaCodigo}, questão ${numero}`);
    }

    mapa.set(numero, {
      indice,
      letra,
      arquivo,
      fonte: path.relative(path.resolve(__dirname, ".."), arquivo).replace(/\\/g, "/"),
      linha: index + 1,
    });
  });

  if (mapa.size === 0) {
    throw new Error(`Gabarito sem respostas A-D para prova ${provaCodigo}`);
  }

  return mapa;
}

function splitQuestoes(text) {
  const texto = removerBom(text).replace(/\r\n?/g, "\n");
  const regex = /(?:^|\n)\s*\[?\s*QUEST[ÃA]O\s+0*(\d{1,3})\s*\]?\s*(?:\n|$)/gi;
  const marcadores = [];
  const questoes = [];
  let match;

  while ((match = regex.exec(texto)) !== null) {
    marcadores.push({
      numero: Number(match[1]),
      inicio: match.index,
      conteudoInicio: regex.lastIndex,
    });
  }

  for (let i = 0; i < marcadores.length; i += 1) {
    const atual = marcadores[i];
    const proximo = marcadores[i + 1];
    const bloco = texto.slice(atual.conteudoInicio, proximo ? proximo.inicio : texto.length);

    if (atual.numero && bloco.trim().length > 0) {
      questoes.push({ numero: atual.numero, bloco });
    }
  }

  return questoes;
}

function extrairMateriaExplicita(bloco) {
  const match = bloco.match(/(?:^|\n)\s*Mat[eé]ria\s*:\s*([^\n]+)/i);
  if (!match) return null;

  return normalizarMateria(limparTexto(match[1]));
}

function extrairEnunciado(bloco) {
  const texto = removerBom(bloco).replace(/\r\n?/g, "\n");
  const primeiraAlternativa = texto.match(/(?:^|\n)\s*\(A\)\s+/i);

  if (!primeiraAlternativa) return "";

  const antesDaAlternativa = texto.slice(0, primeiraAlternativa.index).trim();
  const matchEnunciado = antesDaAlternativa.match(/(?:^|\n)\s*Enunciado\s*:\s*([\s\S]*)$/i);

  if (matchEnunciado) {
    return limparTexto(matchEnunciado[1]);
  }

  const linhas = antesDaAlternativa.split("\n");

  while (
    linhas.length > 0 &&
    /^\s*(Mat[eé]ria|Tema|Incid[eê]ncia(?:\s+Estimada)?|Coment[aá]rio|Gabarito|Resposta)\s*:/i.test(linhas[0])
  ) {
    linhas.shift();
  }

  return limparTexto(linhas.join("\n"));
}

function extrairAlternativas(bloco) {
  const texto = removerBom(bloco).replace(/\r\n?/g, "\n");
  const regex =
    /(?:^|\n)\s*\(([A-D])\)\s*([\s\S]*?)(?=\n\s*\([A-D]\)\s*|\s*$)/gi;

  const alternativas = {};
  const duplicadas = [];
  let match;

  while ((match = regex.exec(texto)) !== null) {
    const letra = match[1].toUpperCase();

    if (alternativas[letra]) {
      duplicadas.push(letra);
      continue;
    }

    alternativas[letra] = limparTexto(match[2]);
  }

  return {
    valores: [
      alternativas.A || "",
      alternativas.B || "",
      alternativas.C || "",
      alternativas.D || "",
    ],
    letrasEncontradas: Object.keys(alternativas),
    duplicadas,
  };
}

function pareceAlternativa(texto, alternativas = []) {
  const original = limparTexto(texto);
  const t = normalizarParaComparacao(original);

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

  if (/^(?:\([A-D]\)|[A-D][).:-])\s+/i.test(original)) {
    return true;
  }

  if (/(^|\n)\s*\([A-D]\)\s+/.test(original)) {
    return true;
  }

  if (suspeitos.some((s) => t.startsWith(normalizarParaComparacao(s)))) {
    return true;
  }

  return alternativas.some((alternativa) => {
    const alt = normalizarParaComparacao(alternativa);
    if (!alt || alt.length < 25) return false;

    return t === alt || t.startsWith(alt.slice(0, Math.min(80, alt.length)));
  });
}

function alternativaPareceEnunciado(alternativa, enunciado) {
  const alt = normalizarParaComparacao(alternativa);
  const en = normalizarParaComparacao(enunciado);

  if (!alt || !en || en.length < 80) return false;

  return alt.startsWith(en.slice(0, Math.min(120, en.length)));
}

function validarQuestao(q) {
  if (!Number.isInteger(q.numero_questao) || q.numero_questao < 1 || q.numero_questao > 80) {
    return "numero_questao inválido";
  }

  if (!q.enunciado || q.enunciado.length < 40) {
    return "enunciado vazio ou curto";
  }

  if (pareceAlternativa(q.enunciado, q.alternativas)) {
    return "enunciado parece alternativa";
  }

  if (!Array.isArray(q.alternativas) || q.alternativas.length !== 4) {
    return "alternativas inválidas";
  }

  if (q.alternativasMeta?.duplicadas?.length) {
    return `alternativas duplicadas: ${q.alternativasMeta.duplicadas.join(", ")}`;
  }

  if (q.alternativasMeta?.letrasEncontradas?.length !== 4) {
    return "alternativas incompletas";
  }

  if (q.alternativas.some((a) => !a || a.length < 2)) {
    return "alternativa vazia";
  }

  if (q.alternativas.some((a) => alternativaPareceEnunciado(a, q.enunciado))) {
    return "alternativa parece conter o enunciado";
  }

  if (![0, 1, 2, 3].includes(q.gabarito)) {
    return "gabarito oficial ausente";
  }

  if (!q.materia) {
    return "matéria ausente";
  }

  return null;
}

async function analisarIA(q) {
  if (!groq) {
    return null;
  }

  try {
    const res = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `Você complementa questões da OAB.

Retorne APENAS JSON válido:
{
  "tema": "...",
  "comentario": "..."
}

Regras:
- NÃO reescreva enunciado.
- NÃO altere alternativas.
- NÃO altere gabarito.
- NÃO classifique matéria.
- Gere um comentário curto, jurídico e aderente ao gabarito oficial.`,
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

Matéria principal já definida pelo parser: ${q.materia}

Informe tema e comentário.
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

async function questaoJaExiste(origem, numeroQuestao) {
  const { data, error } = await supabase
    .from("questoes_oab")
    .select("id")
    .eq("origem", origem)
    .eq("numero_questao", numeroQuestao)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao checar duplicidade de ${origem} Q${numeroQuestao}: ${error.message}`);
  }

  return Boolean(data);
}

function moverParaProcessadas(file) {
  const origem = path.join(PROVAS_DIR, file);
  const destino = path.join(PROCESSADAS_DIR, file);

  if (fs.existsSync(destino)) {
    console.log(`⚠️ ${file} já existe em /provas/processadas. Arquivo mantido em /provas.`);
    return;
  }

  fs.renameSync(origem, destino);
  console.log(`✅ Arquivo ${file} movido para /provas/processadas.`);
}

async function run() {
  const files = fs
    .readdirSync(PROVAS_DIR)
    .filter((f) => arquivoEhProva(f));

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
    const resumo = {
      salvas: 0,
      duplicadas: 0,
      bloqueadas: 0,
      erros: 0,
    };

    console.log(`🔎 Blocos encontrados: ${blocos.length}`);
    console.log(`✅ Gabaritos carregados: ${gabarito.size}`);

    for (const item of blocos) {
      console.log(`-> Questão ${item.numero}`);

      const gabaritoOficial = gabarito.get(item.numero);
      const alternativasExtraidas = extrairAlternativas(item.bloco);
      const materiaExplicita = extrairMateriaExplicita(item.bloco);
      const materiaFinal = materiaExplicita || materiaPorOrdemOab(item.numero);
      const q = {
        numero_questao: item.numero,
        enunciado: extrairEnunciado(item.bloco),
        alternativas: alternativasExtraidas.valores,
        alternativasMeta: alternativasExtraidas,
        gabarito: gabaritoOficial?.indice,
        gabarito_oficial_letra: gabaritoOficial?.letra,
        materia: materiaFinal,
      };

      const erro = validarQuestao(q);

      if (erro) {
        console.log(`⛔ BLOQUEADA Q${item.numero}: ${erro}`);
        resumo.bloqueadas += 1;
        continue;
      }

      if (await questaoJaExiste(file, q.numero_questao)) {
        console.log("⚠️ Já existe no banco.");
        resumo.duplicadas += 1;
        continue;
      }

      const ia = await analisarIA(q);
      const hash = gerarHash(`${file}-${q.numero_questao}-${q.enunciado}`);

      const { error } = await supabase.from("questoes_oab").insert([
        {
          enunciado: q.enunciado,
          alternativas: q.alternativas,
          gabarito: q.gabarito,
          gabarito_oficial: q.gabarito,
          fonte_gabarito: `${gabaritoOficial.fonte}:${gabaritoOficial.linha}`,
          materia: materiaFinal,
          tema: limparTexto(ia?.tema) || "Geral",
          comentario: limparTexto(ia?.comentario) || "Comentário não disponível.",
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
        resumo.erros += 1;
      } else {
        console.log(`💾 Salvo Q${item.numero} (${materiaFinal})`);
        resumo.salvas += 1;
      }

      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log(
      `📊 Resumo ${file}: ${resumo.salvas} salvas, ${resumo.duplicadas} duplicadas, ${resumo.bloqueadas} bloqueadas, ${resumo.erros} erros.`
    );

    if (resumo.bloqueadas === 0 && resumo.erros === 0) {
      moverParaProcessadas(file);
    } else {
      console.log(`⚠️ ${file} mantido em /provas para revisão; nada foi apagado.`);
    }
  }

  console.log("\n🏁 Finalizado.");
}

if (require.main === module) {
  run().catch((err) => {
    console.error("❌ ERRO FATAL:", err.message);
    process.exit(1);
  });
}

module.exports = {
  arquivoEhProva,
  carregarGabarito,
  extrairAlternativas,
  extrairCodigoProva,
  extrairEnunciado,
  extrairMateriaExplicita,
  materiaPorOrdemOab,
  splitQuestoes,
  validarQuestao,
};
