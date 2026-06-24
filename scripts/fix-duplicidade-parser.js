const fs = require("fs");

const file = "scripts/parserInteligenteV2.js";
let txt = fs.readFileSync(file, "utf8");

txt = txt.replace(
`.from("questoes_oab")
        .select("id")
        .eq("hash", hash)
        .maybeSingle();`,
`.from("questoes_oab")
        .select("id")
        .eq("origem", file)
        .eq("numero_questao", q.numero_questao)
        .maybeSingle();`
);

fs.writeFileSync(file, txt, "utf8");
console.log("OK - parser agora evita duplicar por origem + numero_questao");
