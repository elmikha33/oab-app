import { NextRequest, NextResponse } from 'next/server';
import { TODAS_QUESTOES_GERADAS } from '../../../lib/questoes_db';

export async function POST(req: NextRequest) {
  try {
    const { questionId } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: 'ID da questÃ£o nÃ£o informado' }, { status: 400 });
    }

    const questao = TODAS_QUESTOES_GERADAS.find(q => q.id === questionId);
    if (!questao) {
      return NextResponse.json({ error: 'QuestÃ£o nÃ£o encontrada' }, { status: 404 });
    }

    const letras = ['A', 'B', 'C', 'D', 'E'];
    const gabaritoLetra = letras[questao.gabarito];

    // Formatar explicaÃ§Ã£o da alternativa correta
    const certas = [
      {
        letra: gabaritoLetra,
        texto: questao.alternativas[questao.gabarito],
        justificativa: questao.explicacao,
        emoji: 'âœ…',
        detalhe: `âš–ï¸ **AnÃ¡lise Legal**: Esta alternativa estÃ¡ em perfeita consonÃ¢ncia com a legislaÃ§Ã£o e a jurisprudÃªncia dominante sobre o tema **${questao.tema}**.`
      }
    ];

    // Formatar explicaÃ§Ã£o detalhada para cada distrator (alternativa errada)
    const erradas = questao.alternativas
      .map((alt, idx) => {
        if (idx === questao.gabarito) return null;

        const letra = letras[idx];
        let justificativa = '';
        let detalhe = '';

        if (questao.materia === 'Ã‰tica Profissional') {
          justificativa = `Esta assertiva contraria as normas do Estatuto da Advocacia e da OAB (Lei 8.906/94) ou o CÃ³digo de Ã‰tica e Disciplina.`;
          detalhe = `âš ï¸ **Foco na Norma**: A OAB pune desvios Ã©ticos e veda condutas como mercantilizaÃ§Ã£o da profissÃ£o ou captaÃ§Ã£o ativa de clientes.`;
        } else if (questao.materia === 'Direito Constitucional') {
          justificativa = `Esta assertiva estÃ¡ errada porque viola a separaÃ§Ã£o de poderes, regras de processo legislativo ou as garantias pÃ©treas da CF/88.`;
          detalhe = `âš ï¸ **Pegadinha ClÃ¡ssica**: A banca frequentemente confunde competÃªncias exclusivas com concorrentes ou prazos de controle de constitucionalidade.`;
        } else if (questao.materia === 'Direito Administrativo') {
          justificativa = `Esta alternativa traz um conceito equivocado sobre a atuaÃ§Ã£o estatal, poderes da administraÃ§Ã£o ou regras de licitaÃ§Ãµes.`;
          detalhe = `âš ï¸ **AtenÃ§Ã£o**: Atos de improbidade ou responsabilidade objetiva do Estado costumam ser cobrados pela literalidade da lei.`;
        } else if (questao.materia === 'Direito Penal' || questao.materia === 'Direito Processual Penal') {
          justificativa = `A opÃ§Ã£o descreve conduta que nÃ£o configura o crime em tela, erra a dosimetria da pena ou infringe regras de prisÃ£o/liberdade.`;
          detalhe = `âš ï¸ **Alerta Penal**: Fique atento a excludentes de ilicitude e ritos processuais que sÃ£o garantias do rÃ©u.`;
        } else {
          justificativa = `Esta assertiva Ã© um distrator projetado para confundir o candidato, trazendo uma premissa incompatÃ­vel com a matÃ©ria de ${questao.tema}.`;
          detalhe = `âš ï¸ **Dica de FixaÃ§Ã£o**: Elimine opÃ§Ãµes extremamente proibitivas ou permissivas. Lembre-se que regras jurÃ­dicas quase sempre comportam exceÃ§Ãµes.`;
        }

        // Adicionar dicas dinÃ¢micas baseadas na redaÃ§Ã£o
        const altLower = alt.toLowerCase();
        if (altLower.includes('sempre') || altLower.includes('nunca') || altLower.includes('exclusivamente') || altLower.includes('qualquer circunstÃ¢ncia')) {
          justificativa += ` Adicionalmente, o uso de termos absolutos como "sempre" ou "nunca" costuma invalidar alternativas nas ciÃªncias jurÃ­dicas.`;
        }

        return {
          letra,
          texto: alt,
          justificativa,
          emoji: 'âŒ',
          detalhe
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      resumo: `ðŸ¤– **Feedback Inteligente do Agente de IA**: Para o tema **${questao.tema}** (${questao.materia}), a resposta correta exige a identificaÃ§Ã£o do gabarito oficial. Abaixo estÃ¡ a anÃ¡lise detalhada de cada alternativa para sua fixaÃ§Ã£o e revisÃ£o:`,
      certas,
      erradas,
      dicaIa: `ðŸ’¡ **Dica de Ouro do Agente de IA**: A prova da OAB exige consistÃªncia. Para dominar **${questao.tema}**, revise as principais leis correlatas e pratique a eliminaÃ§Ã£o sistemÃ¡tica dos distratores.`
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Erro interno no processamento da explicaÃ§Ã£o: ' + error.message }, { status: 500 });
  }
}
