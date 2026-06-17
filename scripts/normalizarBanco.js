const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, '../.env.local') });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const DE_PARA = {
    "Direito da Criança e do Adolescente": "Direito Civil",
    "Introdução ao Estudo do Direito": "Filosofia do Direito",
    "Direito Eleitoral": "Direito Constitucional",
    "Direito Financeiro": "Direito Tributário",
    "Direito do Processo do Trabalho": "Direito Processual do Trabalho",
    // Se houver outras, adicione aqui:
    "Direito da Advocacia": "Ética Profissional",
    "Estatuto da OAB": "Ética Profissional"
};

async function normalizar() {
    console.log("🔍 Buscando questões...");
    const { data: questoes, error } = await supabase.from("questoes_oab").select("id, materia");
    
    if (error) { console.error(error); return; }

    for (const q of questoes) {
        const novaMateria = DE_PARA[q.materia];
        
        if (novaMateria) {
            console.log(`Corrigindo ID ${q.id}: ${q.materia} -> ${novaMateria}`);
            await supabase.from("questoes_oab").update({ materia: novaMateria }).eq("id", q.id);
        }
    }
    console.log("✅ Limpeza concluída!");
}

normalizar();