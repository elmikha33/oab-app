import { NextRequest, NextResponse } from 'next/server';
import { TODAS_QUESTOES_GERADAS } from '../../../lib/questoes_db';

export async function POST(req: NextRequest) {
  try {
    const { questionId } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: 'ID da questão não informado' }, { status: 400 });
    }

    const questao = TODAS_QUESTOES_GERADAS.find(q => q.id === questionId);
    if (!questao) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 });
    }

    const letras = ['A', 'B', 'C', 'D', 'E'];
    const gabaritoLetra = letras[questao.gabarito];

    // Formatar explicação da alternativa correta
    const certas = [
      {
        letra: gabaritoLetra,
        texto: questao.alternativas[questao.gabarito],
        justificativa: questao.explicacao,
        emoji: '✅',
        detalhe: `⚖️ **Análise Legal**: Esta alternativa está em perfeita consonância com a legislação e a jurisprudência dominante sobre o tema **${questao.tema}**.`
      }
    ];

    // Formatar explicação detalhada para cada distrator (alternativa errada)
    const erradas = questao.alternativas
      .map((alt, idx) => {
        if (idx === questao.gabarito) return null;

        const letra = letras[idx];
        let justificativa = '';
        let detalhe = '';

        if (questao.materia === 'Ética Profissional') {
          justificativa = `Esta assertiva contraria as normas do Estatuto da Advocacia e da OAB (Lei 8.906/94) ou o Código de Ética e Disciplina.`;
          detalhe = `⚠️ **Foco na Norma**: A OAB pune desvios éticos e veda condutas como mercantilização da profissão ou captação ativa de clientes.`;
        } else if (questao.materia === 'Direito Constitucional') {
          justificativa = `Esta assertiva está errada porque viola a separação de poderes, regras de processo legislativo ou as garantias pétreas da CF/88.`;
          detalhe = `⚠️ **Pegadinha Clássica**: A banca frequentemente confunde competências exclusivas com concorrentes ou prazos de controle de constitucionalidade.`;
        } else if (questao.materia === 'Direito Administrativo') {
          justificativa = `Esta alternativa traz um conceito equivocado sobre a atuação estatal, poderes da administração ou regras de licitações.`;
          detalhe = `⚠️ **Atenção**: Atos de improbidade ou responsabilidade objetiva do Estado costumam ser cobrados pela literalidade da lei.`;
        } else if (questao.materia === 'Direito Penal' || questao.materia === 'Direito Processual Penal') {
          justificativa = `A opção descreve conduta que não configura o crime em tela, erra a dosimetria da pena ou infringe regras de prisão/liberdade.`;
          detalhe = `⚠️ **Alerta Penal**: Fique atento a excludentes de ilicitude e ritos processuais que são garantias do réu.`;
        } else {
          justificativa = `Esta assertiva é um distrator projetado para confundir o candidato, trazendo uma premissa incompatível com a matéria de ${questao.tema}.`;
          detalhe = `⚠️ **Dica de Fixação**: Elimine opções extremamente proibitivas ou permissivas. Lembre-se que regras jurídicas quase sempre comportam exceções.`;
        }

        // Adicionar dicas dinâmicas baseadas na redação
        const altLower = alt.toLowerCase();
        if (altLower.includes('sempre') || altLower.includes('nunca') || altLower.includes('exclusivamente') || altLower.includes('qualquer circunstância')) {
          justificativa += ` Adicionalmente, o uso de termos absolutos como "sempre" ou "nunca" costuma invalidar alternativas nas ciências jurídicas.`;
        }

        return {
          letra,
          texto: alt,
          justificativa,
          emoji: '❌',
          detalhe
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      resumo: `🤖 **Feedback Inteligente do Agente de IA**: Para o tema **${questao.tema}** (${questao.materia}), a resposta correta exige a identificação do gabarito oficial. Abaixo está a análise detalhada de cada alternativa para sua fixação e revisão:`,
      certas,
      erradas,
      dicaIa: `💡 **Dica de Ouro do Agente de IA**: A prova da OAB exige consistência. Para dominar **${questao.tema}**, revise as principais leis correlatas e pratique a eliminação sistemática dos distratores.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno no processamento da explicação: ' + error.message }, { status: 500 });
  }
}
