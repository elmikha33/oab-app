const fs = require('fs');
const path = require('path');

const ROOTS = ['app', 'components', 'context', 'lib'];
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);

const backupDir = path.join(
  '.fix-backups',
  new Date().toISOString().replace(/[:.]/g, '-')
);

fs.mkdirSync(backupDir, { recursive: true });

function walk(dir) {
  if (!fs.existsSync(dir)) return [];

  const out = [];

  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      if (['node_modules', '.next', '.git', 'dist', 'build', '.fix-backups'].includes(item)) continue;
      out.push(...walk(full));
      continue;
    }

    if (EXTS.has(path.extname(item))) {
      out.push(full);
    }
  }

  return out;
}

const cp1252Special = new Map([
  ['€', 0x80], ['‚', 0x82], ['ƒ', 0x83], ['„', 0x84], ['…', 0x85],
  ['†', 0x86], ['‡', 0x87], ['ˆ', 0x88], ['‰', 0x89], ['Š', 0x8a],
  ['‹', 0x8b], ['Œ', 0x8c], ['Ž', 0x8e], ['‘', 0x91], ['’', 0x92],
  ['“', 0x93], ['”', 0x94], ['•', 0x95], ['–', 0x96], ['—', 0x97],
  ['˜', 0x98], ['™', 0x99], ['š', 0x9a], ['›', 0x9b], ['œ', 0x9c],
  ['ž', 0x9e], ['Ÿ', 0x9f],
]);

function encodeCp1252(str) {
  const bytes = [];

  for (const ch of str) {
    const mapped = cp1252Special.get(ch);

    if (mapped !== undefined) {
      bytes.push(mapped);
      continue;
    }

    const code = ch.codePointAt(0);

    if (code <= 0xff) {
      bytes.push(code);
    } else {
      return null;
    }
  }

  return new Uint8Array(bytes);
}

function scoreMojibake(str) {
  const matches = str.match(/Ã|Â|�|�|Voc\?|voc\?|quest\?|Quest\?|mat\?|Mat\?|gr\?|N\?o|n\?o/g);
  return matches ? matches.length : 0;
}

function decodeCp1252AsUtf8(str) {
  const bytes = encodeCp1252(str);
  if (!bytes) return null;

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function fixMojibake(text) {
  let current = text;

  for (let i = 0; i < 4; i++) {
    const beforeScore = scoreMojibake(current);
    if (beforeScore === 0) break;

    const decoded = decodeCp1252AsUtf8(current);
    if (!decoded) break;

    const afterScore = scoreMojibake(decoded);

    if (afterScore <= beforeScore) {
      current = decoded;
    } else {
      break;
    }
  }

  current = current
    .replace(/Voc\?/g, 'Voce')
    .replace(/voc\?/g, 'voce')
    .replace(/quest\?es/g, 'questoes')
    .replace(/Quest\?es/g, 'Questoes')
    .replace(/gr\?tis/g, 'gratis')
    .replace(/Gr\?tis/g, 'Gratis')
    .replace(/mat\?ria/g, 'materia')
    .replace(/Mat\?ria/g, 'Materia')
    .replace(/mat\?rias/g, 'materias')
    .replace(/Mat\?rias/g, 'Materias')
    .replace(/N\?o/g, 'Nao')
    .replace(/n\?o/g, 'nao');

  return current;
}

function backup(file) {
  const dest = path.join(backupDir, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
}

function replaceFunction(text, functionName, replacement) {
  const start = text.indexOf(`function ${functionName}(`);
  if (start === -1) return text;

  let brace = text.indexOf('{', start);
  if (brace === -1) return text;

  let depth = 0;

  for (let i = brace; i < text.length; i++) {
    const ch = text[i];

    if (ch === '{') depth += 1;
    if (ch === '}') depth -= 1;

    if (depth === 0) {
      return text.slice(0, start) + replacement + text.slice(i + 1);
    }
  }

  return text;
}

function rewriteQuestaoType(text) {
  const start = text.indexOf('type Questao = {');
  if (start === -1) return text;

  const end = text.indexOf('};', start);
  if (end === -1) return text;

  const fixedType = `type Questao = {
  id: number | string;
  materia?: string | null;
  tema?: string | null;
  enunciado: string;
  alternativas: string[];
  gabarito: number | string | null;
  comentario?: string | null;
  explicacao?: string | null;
  comentario_ia?: string | null;
  comentarioIA?: string | null;
  explanation?: string | null;
  origem?: string | null;
  fonte?: string | null;
  arquivo?: string | null;
  prova?: string | number | null;
  exame?: string | number | null;
  edicao?: string | number | null;
  edicao_exame?: string | number | null;
  numero_exame?: string | number | null;
  numero_prova?: string | number | null;
};

`;

  return text.slice(0, start) + fixedType + text.slice(end + 3);
}

function fixQuestoesList(text) {
  text = rewriteQuestaoType(text);

  text = replaceFunction(
    text,
    'getComentarioQuestao',
    `function getComentarioQuestao(questao: Questao) {
  const possiveisComentarios = [
    questao.comentario,
    questao.explicacao,
    questao.comentario_ia,
    questao.comentarioIA,
    questao.explanation,
  ];

  const comentario = possiveisComentarios.find((valor) => String(valor ?? '').trim().length > 0);
  return String(comentario ?? '').trim();
}`
  );

  text = text
    .replace(/Você/g, 'Voce')
    .replace(/você/g, 'voce')
    .replace(/Questões/g, 'Questoes')
    .replace(/questões/g, 'questoes')
    .replace(/matérias/g, 'materias')
    .replace(/matéria/g, 'materia')
    .replace(/Matérias/g, 'Materias')
    .replace(/Matéria/g, 'Materia')
    .replace(/grátis/g, 'gratis')
    .replace(/Grátis/g, 'Gratis')
    .replace(/Não/g, 'Nao')
    .replace(/não/g, 'nao')
    .replace(/Ética/g, 'Etica')
    .replace(/ética/g, 'etica')
    .replace(/Edição/g, 'Edicao')
    .replace(/edição/g, 'edicao')
    .replace(/Comentário/g, 'Comentario')
    .replace(/comentário/g, 'comentario')
    .replace(/disponível/g, 'disponivel')
    .replace(/disponíveis/g, 'disponiveis');

  return text;
}

function fixLayoutShell(text) {
  text = text.replace(
    /\{showFloatingPremium && \(\s*<>\s*<FloatingPremiumCard \/>\s*<MobileFloatingPremiumCard \/>\s*<\/>\s*\)\}/s,
    `{false && showFloatingPremium && (
        <>
          <FloatingPremiumCard />
          <MobileFloatingPremiumCard />
        </>
      )}`
  );

  text = text.replace(/<FloatingPremiumCard \/>/g, '{false && <FloatingPremiumCard />}');
  text = text.replace(/<MobileFloatingPremiumCard \/>/g, '{false && <MobileFloatingPremiumCard />}');

  text = text.replace(
    /className="fixed bottom-[^"]*left-[^"]*z-\[9999\] hidden[^"]*md:inline-flex[^"]*"/g,
    `className="fixed right-20 top-4 z-[9999] hidden w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-4 py-2.5 text-sm font-black text-slate-700 shadow-2xl shadow-black/40 backdrop-blur-xl transition hover:border-rose-300/60 hover:bg-rose-50 hover:text-rose-700 md:inline-flex dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-300 dark:hover:border-rose-300/35 dark:hover:bg-rose-500/10 dark:hover:text-rose-200"`
  );

  return text;
}

function fixGameState(text) {
  text = text.replace(
    '    const accessToken = session?.access_token;',
    "    const accessToken = session?.access_token || '';"
  );

  text = text.replace(
    '        const result = await checarDispositivoAtivo(session.access_token);',
    '        const result = await checarDispositivoAtivo(accessToken);'
  );

  return text;
}

const files = ROOTS.flatMap(walk);

for (const file of files) {
  backup(file);

  let text = fs.readFileSync(file, 'utf8');
  let next = fixMojibake(text);

  if (file.endsWith(path.join('components', 'QuestoesList.tsx'))) {
    next = fixQuestoesList(next);
  }

  if (file.endsWith(path.join('components', 'LayoutShell.tsx'))) {
    next = fixLayoutShell(next);
  }

  if (file.endsWith(path.join('context', 'GameStateContext.tsx'))) {
    next = fixGameState(next);
  }

  if (next !== text) {
    fs.writeFileSync(file, next, 'utf8');
    console.log('Corrigido:', file);
  }
}

console.log('');
console.log('Backup salvo em:', backupDir);
console.log('Resgate concluido. Rode pnpm.cmd run build agora.');