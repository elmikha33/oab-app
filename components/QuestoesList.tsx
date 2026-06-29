'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  RotateCcw,
  Shuffle,
  Sparkles,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { useGameState } from '@/context/GameStateContext';
import useSoundEffects from '@/hooks/useSoundEffects';
import { supabase } from '@/lib/supabase';

const LIMIT_QUESTOES = 10000;
const FREE_DAILY_LIMIT = 5;
const DEMO_SAVE_PROMPT_THRESHOLD = 3;
const LETRAS = ['A', 'B', 'C', 'D'];
const TODAS_AS_MATERIAS = '__TODAS_AS_MATERIAS__';
const TODOS_OS_EXAMES = '__TODOS_OS_EXAMES__';

type AbaQuestoes = 'todas' | 'naoRespondidas' | 'feitas';
type RespostasState = Record<string, number>;
type RespondidasState = Record<string, true>;

type Questao = {
  id: number | string;
  banco_id?: number | string;
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

const DEMO_QUESTOES: Questao[] = [
  {
    id: 'demo-real-1',
    banco_id: 1031,
    materia: 'Ética Profissional',
    tema: 'Ética Profissional',
    enunciado:
      'Paloma, advogada gestante, compareceu ao Fórum da Comarca de Itaporanga, PB, para participar de uma audiência. Ao tentar estacionar no local, foi impedida de acessar a garagem sob a justificativa de que não havia vagas reservadas para gestantes. Além disso, foi obrigada a passar por um detector de metais, mesmo tendo informado de sua condição de gestante. Indignada, Paloma buscou esclarecer os seus direitos. Sobre a hipótese narrada, com base no Estatuto da OAB, assinale a afirmativa correta.',
    alternativas: [
      'Paloma, por ser advogada gestante, tem o direito de não ser submetida a detectores de metais, mas o estacionamento exclusivo só é garantido em Tribunais e Fóruns Federais, não nos Fóruns Estaduais.',
      'Os direitos de Paloma, como o de não ser submetida aos detectores de metais e à reserva de vagas, são aplicáveis apenas em Tribunais Superiores, e não se estendem a Fóruns de Comarcas Estaduais.',
      'Paloma, por ser advogada gestante, tem o direito de entrar em Fóruns e Tribunais sem ser submetida a detectores de metais e tem direito à reserva de vagas nas garagens dos Fóruns dos Tribunais.',
      'Paloma tem o direito de entrada no Fórum sem ser submetida a detectores de metais, mas o direito à reserva de vagas em garagens para gestantes é uma mera liberalidade do Tribunal e não é garantido por lei.',
    ],
    gabarito: 2,
    comentario:
      'A advogada gestante tem direito à reserva de vagas em garagens e não ser submetida a detectores de metais em Fóruns e Tribunais, conforme previsto no Estatuto da OAB.',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 1,
    origem: 'Cópia demo da questão real #1031',
  },
  {
    id: 'demo-real-2',
    banco_id: 1041,
    materia: 'Direito Constitucional',
    tema: 'Habeas Data',
    enunciado:
      'Maria descobriu que seu nome constava, erroneamente, em registros públicos estaduais como devedora de impostos, mesmo sem nada dever ao Fisco. Muito correta, procurou imediatamente a Secretaria de Estado da Fazenda do Estado Alfa, solicitando que fosse corrigida a informação. Porém, apesar das reiteradas solicitações, o órgão não realizou a retificação. Em razão disso, seu amigo Pedro sugeriu a impetração de um habeas data, o que seria feito diretamente por Maria, sem a presença de um(a) advogado(a). Insegura, Maria procurou você, como advogado(a), para saber se este seria o caminho adequado para a retificação desejada. Segundo o sistema jurídico-constitucional brasileiro, assinale a opção que apresenta, corretamente, a orientação a ser dada.',
    alternativas: [
      'A questão deve ser solucionada pela via do mandado de segurança, único remédio capaz de propiciar a retificação de dados, como no caso de Maria.',
      'O objetivo almejado por Maria deve ser atingido pela via de processo judicial sigiloso, não sendo o remédio sugerido hábil para solucionar o problema ventilado.',
      'Maria pode utilizar esse específico remédio constitucional, embora sua impetração vá depender da contratação de advogado(a), que possua capacidade postulatória.',
      'O remédio constitucional em questão não é o instrumento adequado para o caso, pois é direcionado a situações em que se queira ter acesso a informações de sua própria pessoa.',
    ],
    gabarito: 2,
    comentario:
      'O habeas data é um remédio constitucional que visa proteger a intimidade e a privacidade das pessoas, garantindo o acesso a informações sobre si mesmo. Nesse caso, Maria pode impetrar um habeas data para retificar a informação errada, desde que seja representada por um advogado com capacidade postulatória.',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 11,
    origem: 'Cópia demo da questão real #1041',
  },
  {
    id: 'demo-real-3',
    banco_id: 1060,
    materia: 'Direito Administrativo',
    tema: 'Recurso Administrativo em Licitação',
    enunciado:
      'A sociedade empresária Begônia deseja participar de um procedimento licitatório, na modalidade concorrência, para a contratação de uma obra, que adotará a sequência adotada como regra na Lei nº 14.133/2021, mas está com receio de ser prejudicada no julgamento das propostas, que antecede à fase de habilitação. Em razão disso, a sociedade empresária consultou você, como advogado(a), a fim de esclarecer a possibilidade de apresentar um recurso administrativo, o momento correto para fazê-lo e os efeitos dele decorrentes, caso tal receio venha a ser concretizado. Sobre essa situação hipotética, assinale a opção que indica, corretamente, o esclarecimento que você prestou.',
    alternativas: [
      'Não há a possibilidade de se apresentar um recurso administrativo contra o julgamento das propostas, diante da vedação expressa na aludida norma.',
      'Apenas depois da habilitação é que caberá a apresentação de um recurso administrativo contra o julgamento das propostas, de modo que é necessário aguardar o prosseguimento do certame para a manifestação da intenção de recorrer no momento oportuno.',
      'O pedido de reconsideração em relação ao julgamento das propostas deve ser prontamente apresentado ao fim da respectiva fase e possui efeito suspensivo, de modo que a licitação só seguirá para a fase de habilitação após a apreciação das irresignações apresentadas.',
      'A intenção de recorrer do julgamento das propostas deve ser imediatamente manifestada, mas o prazo para a apresentação das razões recursais será iniciado na data da intimação ou da lavratura da ata de habilitação ou inabilitação, pois sua apreciação dar-se-á em fase única.',
    ],
    gabarito: 3,
    comentario:
      'A intenção de recorrer do julgamento das propostas deve ser imediatamente manifestada, mas o prazo para a apresentação das razões recursais será iniciado na data da intimação ou da lavratura da ata de habilitação ou inabilitação, pois sua apreciação dar-se-á em fase única.',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 30,
    origem: 'Cópia demo da questão real #1060',
  },
  {
    id: 'demo-real-4',
    banco_id: 1068,
    materia: 'Direito Civil',
    tema: 'Direito Civil - Regimes de Bens',
    enunciado:
      'Joaquim, de 71 anos de idade, é viúvo de Marta há cerca de quatro anos, e não finalizou a partilha de bens deixados por sua falecida esposa, porque há um litígio entre o filho comum do ex-casal e a filha do primeiro casamento de Marta. Na semana passada, Joaquim procurou você, como advogado(a), para saber se ele poderia se casar com Daniela, que tem 65 anos de idade, e qual seria o regime de bens do casamento. Sobre a situação narrada, assinale a opção que apresenta, corretamente, sua orientação.',
    alternativas: [
      'Separação convencional de bens, ante a idade de Joaquim.',
      'Qualquer regime de bens, por força da autonomia que é assegurada a Joaquim.',
      'Comunhão parcial de bens, de forma a resguardar os bens ainda não partilhados.',
      'Separação obrigatória de bens, para evitar a confusão patrimonial entre os vínculos conjugais.',
    ],
    gabarito: 3,
    comentario:
      'A separação obrigatória de bens é a opção mais adequada para Joaquim, pois visa evitar a confusão patrimonial entre os vínculos conjugais, especialmente considerando a situação de litígio em relação à partilha de bens deixados pela falecida esposa.',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 38,
    origem: 'Cópia demo da questão real #1068',
  },
  {
    id: 'demo-real-5',
    banco_id: 1081,
    materia: 'Direito Processual Civil',
    tema: 'Recurso de Apelação e Liquidação de Sentença',
    enunciado:
      'Machado de Assis ajuizou ação indenizatória em face de Quincas Borba, pugnando pela condenação do réu ao pagamento de indenização por danos morais e materiais, resultantes do inadimplemento de contrato de prestação de serviços. O Juiz condenou o réu ao pagamento de indenização por danos morais no montante de R$ 5.000,00 (cinco mil reais) e danos materiais, a serem apurados em sede de liquidação de sentença, diante da necessidade de comprovação dos prejuízos que vêm sendo experimentados pelo autor, desde a ocorrência do ilícito. Quincas Borba contratou você, como advogado(a), para interpor recurso de apelação, buscando a reforma integral da sentença. Tomando o caso acima como premissa, assinale a opção que, corretamente, apresenta sua orientação.',
    alternativas: [
      'Enquanto não houver o julgamento do recurso de apelação, não será possível realizar a liquidação de sentença no capítulo referente aos danos materiais.',
      'Apesar de Quincas Borba ter ofertado apelação, Machado de Assis poderá requerer desde logo a liquidação do capítulo dos danos materiais em autos apartados.',
      'A liquidação de sentença somente poderá ser promovida por requerimento de Machado de Assis, pois o réu não detém legitimidade para requerer a liquidação de sentença.',
      'Quincas Borba, em liquidação de sentença, poderá rediscutir a obrigação de pagamento dos danos materiais, sendo lícito ao Juiz modificar a sentença anteriormente proferida.',
    ],
    gabarito: 1,
    comentario:
      'A liquidação de sentença pode ser requerida desde logo, mesmo em face de recurso de apelação, desde que o autor demonstre a necessidade de comprovação dos prejuízos experimentados, como ocorreu no caso de Machado de Assis.',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 51,
    origem: 'Cópia demo da questão real #1081',
  },
  {
    id: 'demo-real-6',
    banco_id: 1087,
    materia: 'Direito Penal',
    tema: 'Tentativa',
    enunciado:
      'Daniel chegou em casa embriagado e exigiu que sua esposa, Bianca, praticasse com ele conjunção carnal. Diante da recusa de Bianca, Daniel passou a empregar a coação física contra a sua esposa, porém, os gritos de Bianca foram ouvidos por vizinhos, que lograram entrar no imóvel e imobilizar Daniel, antes que consumasse o ato. Daniel foi denunciado pelo delito de estupro, mas, alguns meses após os fatos, e antes do recebimento da denúncia, Daniel e Bianca reataram o casamento. A você, na qualidade de advogado(a) de defesa de Daniel, cabe alegar',
    alternativas: [
      'a retratação tácita da representação da ofendida.',
      'a causa de diminuição de pena em razão da tentativa.',
      'a excludente de ilicitude ante o exercício regular de um direito.',
      'o perdão tácito em razão da manutenção da sociedade conjugal.',
    ],
    gabarito: 1,
    comentario:
      'A tentativa é configurada quando o agente, com dolo, pratique atos que, embora não consumados, estejam em consonância com o tipo penal e sejam suficientes para configurar a conduta típica, mesmo que não alcance o resultado final. Nesse caso, embora Daniel não tenha consumado o ato de estupro, os atos de coação física praticados contra Bianca, em conjunto com a intenção de consumar o ato, configuram a tentativa de estupro.',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 57,
    origem: 'Cópia demo da questão real #1087',
  },
  {
    id: 'demo-real-7',
    banco_id: 1093,
    materia: 'Direito Processual Penal',
    tema: 'Recebimento da denúncia e justa causa',
    enunciado:
      'Marivaldo foi denunciado por organização criminosa e peculato. A denúncia foi lastreada, exclusivamente, no depoimento de Sérgio, corréu, que celebrou acordo de colaboração premiada com o Ministério Público. Assim, recebida a denúncia, foram citados ambos os réus, sendo que a citação de Marivaldo ocorreu no dia 10/05, e a de Sérgio, no dia 20/05 do corrente ano. De acordo com o caso narrado, na qualidade de advogado(a) de Marivaldo, assinale a opção que apresenta a conduta adequada a ser adotada.',
    alternativas: [
      'O prazo de apresentação da resposta à acusação é de dez dias a contar da citação do último corréu, tratando-se de prazo comum às partes.',
      'O prazo de apresentação da resposta à acusação é de dez dias a contar da citação de Marivaldo, podendo ser encerrado antes do prazo de Sérgio.',
      'Deve ser alegada a violação ao contraditório, pois o corréu delatado deve participar das tratativas de celebração do acordo de colaboração premiada.',
      'Deve ser alegada a ausência de justa causa para o recebimento da denúncia, pois a palavra do colaborador, sem provas de corroboração, é insuficiente para o recebimento da denúncia.',
    ],
    gabarito: 3,
    comentario:
      'A denúncia deve ser recebida com base em elementos de convicção, não apenas em depoimentos de colaboradores, devendo haver elementos de corroboração para garantir a justa causa.',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 63,
    origem: 'Cópia demo da questão real #1093',
  },
  {
    id: 'demo-real-8',
    banco_id: 1100,
    materia: 'Direito do Trabalho',
    tema: 'Acidente de Trabalho e Benefício Previdenciário',
    enunciado:
      'Manuela Dias, empregada doméstica, procurou você, como advogado(a), para receber orientação jurídica para uma demanda relacionada a acidente de trabalho, que ocorreu durante os seus afazeres diários na residência da empregadora doméstica, que gerou incapacidade temporária. Assinale a opção que indica a orientação correta.',
    alternativas: [
      'Manuela poderá usufruir de benefício previdenciário por incapacidade temporária, ainda que possua menos de 12 contribuições mensais.',
      'O acidente de trabalho somente será reconhecido como tal caso haja incapacidade mínima de seis meses para o trabalho, avaliada por perícia médica.',
      'A conexão da incapacidade com o trabalho poderá ser aferida pelo INSS, mas nunca com a aplicação do Nexo Técnico Epidemiológico Previdenciário – NTEP.',
      'A incapacidade de Manuela, na situação narrada, nunca poderia ser decorrente de doenças, pois o acidente de trabalho é sempre súbito, imediato e instantâneo.',
    ],
    gabarito: 0,
    comentario:
      'A opção A é correta, pois a legislação previdenciária brasileira não exige que o trabalhador tenha contribuições mensais para receber benefício por incapacidade temporária decorrente de acidente de trabalho.',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 70,
    origem: 'Cópia demo da questão real #1100',
  },
  {
    id: 'demo-real-9',
    banco_id: 1106,
    materia: 'Direito Processual do Trabalho',
    tema: 'Direito Processual do Trabalho',
    enunciado:
      'Jorge Lucas trabalhou por um ano na sociedade empresária Alfa Beta Gama Ltda. Insatisfeito por trabalhar várias horas extras diárias sem recebê-las, apesar de consignar corretamente a sobrejornada nos controles de ponto, Jorge Lucas pediu demissão. Na rescisão do contrato de trabalho, por um equívoco do Departamento de Pessoal, foi pago um valor equivalente ao aviso prévio. Dias depois, Jorge Lucas ajuizou reclamação trabalhista pleiteando horas extras. A sociedade empresária contratou você, como advogado(a), para defendê-la. Acerca do que poderá ser alegado sobre o equívoco do pagamento a mais de aviso prévio, à luz do entendimento consolidado na jurisprudência do Tribunal Superior do Trabalho (TST), assinale a afirmativa correta.',
    alternativas: [
      'Tendo sido pago o valor do aviso prévio espontaneamente pela sociedade empresária, está preclusa qualquer argumentação a esse respeito.',
      'Deverá ser alegada a dedução dos valores pagos a título de aviso prévio da condenação ao pagamento dos valores relativos às horas extras.',
      'Deverá ser alegada a compensação do valor pago a título do aviso prévio com eventual condenação em horas extras, o que deverá ser feito em sede de contestação.',
      'Deverá ser alegada a quitação do valor pago a título do aviso prévio com eventual condenação em horas extras, o que poderá ser feito em qualquer momento processual na instância ordinária.',
    ],
    gabarito: 2,
    comentario:
      'A sociedade empresária pode alegar a compensação do valor pago a título do aviso prévio com eventual condenação em horas extras, o que deve ser feito em sede de contestação, de acordo com o entendimento consolidado na jurisprudência do Tribunal Superior do Trabalho (TST).',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 76,
    origem: 'Cópia demo da questão real #1106',
  },
  {
    id: 'demo-real-10',
    banco_id: 1055,
    materia: 'Direito Tributário',
    tema: 'Direito Tributário',
    enunciado:
      'Com necessidade de ampliar os gastos na área da seguridade social, a União criou uma nova contribuição de seguridade social, por meio da Lei Ordinária nº XXX/2024, publicada em 1º de setembro de 2024, cuja cobrança se iniciou em 1º de novembro de 2024. Diante desse cenário, assinale a afirmativa correta.',
    alternativas: [
      'A Lei Ordinária nº XXX/2024 é inconstitucional por violar tanto a reserva de lei complementar como os princípios da anterioridade tributária anual e nonagesimal.',
      'Embora não viole o princípio da anterioridade tributária anual, a Lei Ordinária nº XXX/2024 é inconstitucional por violar tanto a reserva de lei complementar como o princípio da anterioridade tributária nonagesimal.',
      'Não há qualquer inconstitucionalidade na Lei Ordinária nº XXX/2024, uma vez que as novas contribuições de seguridade social são instituídas por meio de lei ordinária e constituem exceção aos princípios da anterioridade tributária anual e nonagesimal.',
      'As novas contribuições de seguridade social constituem exceção aos princípios da anterioridade tributária anual e nonagesimal, de modo que a única inconstitucionalidade formal presente na Lei Ordinária nº XXX/2024 é a de violar a reserva de lei complementar.',
    ],
    gabarito: 1,
    comentario:
      'A Lei Ordinária nº XXX/2024 é inconstitucional por violar a reserva de lei complementar e o princípio da anterioridade tributária nonagesimal, pois a instituição de novas contribuições de seguridade social deve ser feita por meio de lei complementar e com antecedência de noventa dias em relação ao início da sua cobrança.',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 25,
    origem: 'Cópia demo da questão real #1055',
  },
  {
    id: 'demo-real-11',
    banco_id: 1077,
    materia: 'Direito Empresarial',
    tema: 'Nota Promissória e Protesto Cambial',
    enunciado:
      'Mercado Barra Velha Ltda. emitiu nota promissória no valor de R$ 19.800,00 (dezenove mil e oitocentos reais), com vencimento no dia 19 de dezembro de 2021. Não houve pagamento na data do vencimento e o credor somente levou o título a protesto no dia 2 de dezembro de 2023, sendo o protesto lavrado dois dias após. Sobre o caso, com base na legislação de regência da nota promissória e das condições para sua cobrança em face do emitente, assinale a afirmativa correta.',
    alternativas: [
      'O credor ainda poderá promover a execução da nota promissória em face do emitente em razão da interrupção da prescrição pelo protesto cambial.',
      'O credor poderá promover a execução da nota promissória em face do emitente, considerando-se que ainda não expirou o prazo de cinco anos para a propositura da ação cambial.',
      'O credor não pode promover a execução da nota promissória, em razão do protesto para a cobrança do emitente ser facultativo e do decurso do prazo de três anos da data do vencimento.',
      'O título deveria ter sido apresentado até o primeiro dia útil após o vencimento, acarretando a perda do direito de ação em caso de inobservância dessa regra, embora o protesto seja facultativo para a cobrança.',
    ],
    gabarito: 0,
    comentario:
      'A nota promissória é um título de crédito que pode ser protestado, o que interrompe a prescrição. Nesse caso, o protesto foi lavrado dentro do prazo de cinco anos do vencimento, permitindo que o credor promova a execução da nota promissória em face do emitente.',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 47,
    origem: 'Cópia demo da questão real #1077',
  },
  {
    id: 'demo-real-12',
    banco_id: 1048,
    materia: 'Direitos Humanos',
    tema: 'Status normativo dos Tratados e Convenções Internacionais sobre Direitos Humanos incorporados ao ordenamento jurídico brasileiro',
    enunciado:
      'Após a edição da Emenda Constitucional nº 45/2004, com a inserção do § 3º no Art. 5º da Constituição Federal de 1988, muito se discutiu acerca do status normativo que deveria ser atribuído aos Tratados e Convenções Internacionais sobre Direitos Humanos já incorporados ao ordenamento jurídico nacional em momento anterior à referida alteração constitucional. Diante desse cenário, assinale a opção correta.',
    alternativas: [
      'Diante da impossibilidade de adoção do rito constitucionalmente exigido para a aprovação de emendas constitucionais, os Tratados e as Convenções Internacionais sobre Direitos Humanos incorporados ao ordenamento jurídico nacional antes da EC nº 45/2004 possuem status de lei ordinária.',
      'Diante da ausência de previsão constitucional expressa em relação à matéria, em razão dos compromissos assumidos pelo Estado brasileiro no plano internacional, os Tratados e as Convenções Internacionais sobre Direitos Humanos incorporados ao ordenamento jurídico nacional antes da EC nº 45/2004 possuem status de norma supraconstitucional.',
      'Em razão da cláusula aberta contida no Art. 5º, § 2º, da Constituição Federal de 1988, ao admitir expressamente a existência de outros direitos fundamentais para além daqueles expressamente elencados no texto constitucional, os Tratados e as Convenções Internacionais sobre Direitos Humanos incorporados ao ordenamento jurídico nacional antes da EC nº 45/2004 possuem status de norma constitucional.',
      'Em razão da necessidade de interpretação do texto constitiucional, notadamente as previsões insertas nos parágrafos do art. 5º da Constituição Federal de 1988, à luz do Art. 7º, § 7º, da Convenção Americana de Direitos Humanos (Pacto de São José da Costa Rica), os Tratados e as Convenções Internacionais sobre Direitos Humanos incorporados ao ordenamento jurídico nacional antes da edição da EC nº 45/2004 possuem status supralegal.',
    ],
    gabarito: 3,
    comentario:
      'Os Tratados e Convenções Internacionais sobre Direitos Humanos incorporados ao ordenamento jurídico nacional antes da edição da EC nº 45/2004 possuem status supralegal, em razão da necessidade de interpretação do texto constitucional à luz de outros tratados internacionais, como o Art. 7º, § 7º, da Convenção Americana de Direitos Humanos (Pacto de São José da Costa Rica).',
    edicao_exame: 46,
    numero_exame: 46,
    numero_prova: 18,
    origem: 'Cópia demo da questão real #1048',
  },
];

type DemoAchievementRule = 'answered' | 'mistake' | 'warmup' | 'locked';

const DEMO_ACHIEVEMENTS: Array<{
  emoji: string;
  title: string;
  description: string;
  requirement: string;
  unlockWhen: DemoAchievementRule;
}> = [
  {
    emoji: '🎯',
    title: 'Primeira questão',
    description: 'O aluno já entende o ciclo: responder, ver gabarito e aprender com o comentário.',
    requirement: 'Responda 1 questão',
    unlockWhen: 'answered',
  },
  {
    emoji: '🧠',
    title: 'Erro vira revisão',
    description: 'Quando erra, a pessoa percebe que o OAPlay completo transforma erro em treino direcionado.',
    requirement: 'Erre uma questão',
    unlockWhen: 'mistake',
  },
  {
    emoji: '⚔️',
    title: 'Aquecimento concluído',
    description: 'Depois de algumas respostas, a rodada começa a parecer uma missão de estudo.',
    requirement: 'Responda 3 questões',
    unlockWhen: 'warmup',
  },
  {
    emoji: '🔥',
    title: 'Sequência diária',
    description: 'Na conta completa, a constância aparece em metas, sequência e evolução salva.',
    requirement: 'Treine em dias seguidos',
    unlockWhen: 'locked',
  },
  {
    emoji: '💎',
    title: 'Domínio por matéria',
    description: 'O sistema completo acompanha desempenho por matéria para mostrar onde evoluir.',
    requirement: 'Acumule acertos',
    unlockWhen: 'locked',
  },
  {
    emoji: '🏆',
    title: 'Maratonista OAB',
    description: 'Conquista de longo prazo para quem mantém o ritmo até a aprovação.',
    requirement: 'Complete grandes metas',
    unlockWhen: 'locked',
  },
];


type MateriaResumo = {
  materia: string;
  total: number;
  feitas: number;
  naoRespondidas: number;
  firstId: number | string;
  peso: number;
  prioridade: number;
  temas: Array<{
    tema: string;
    total: number;
    feitas: number;
    naoRespondidas: number;
    firstId: number | string;
  }>;
};

type ExameResumo = {
  key: string;
  label: string;
  numero: number;
  total: number;
};

const PRIORIDADES = [
  { peso: 8, prioridade: 1, nomes: ['etica', 'estatuto da oab', 'codigo de etica'] },
  { peso: 6, prioridade: 2, nomes: ['direito civil'] },
  { peso: 6, prioridade: 3, nomes: ['direito processual civil', 'processo civil'] },
  { peso: 6, prioridade: 4, nomes: ['direito constitucional'] },
  { peso: 6, prioridade: 5, nomes: ['direito penal'] },
  { peso: 6, prioridade: 6, nomes: ['direito processual penal', 'processo penal'] },
  { peso: 5, prioridade: 7, nomes: ['direito administrativo'] },
  { peso: 5, prioridade: 8, nomes: ['direito do trabalho'] },
  { peso: 5, prioridade: 9, nomes: ['direito processual do trabalho', 'processo do trabalho'] },
  { peso: 5, prioridade: 10, nomes: ['direito tributario'] },
  { peso: 4, prioridade: 11, nomes: ['direito empresarial'] },
  { peso: 2, prioridade: 12, nomes: ['direitos humanos'] },
  { peso: 2, prioridade: 13, nomes: ['filosofia do direito'] },
  { peso: 2, prioridade: 14, nomes: ['direito internacional'] },
  { peso: 2, prioridade: 15, nomes: ['direito financeiro'] },
  { peso: 2, prioridade: 16, nomes: ['direito eleitoral'] },
  { peso: 2, prioridade: 17, nomes: ['direito ambiental'] },
  { peso: 2, prioridade: 18, nomes: ['direito do consumidor'] },
  { peso: 2, prioridade: 19, nomes: ['eca', 'crianca e adolescente'] },
  { peso: 2, prioridade: 20, nomes: ['direito previdenciario'] },
];

function normalizarTexto(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function getMateriaNome(questao: Questao) {
  return String(questao.materia || 'Sem matéria').trim();
}

function getTemaNome(questao: Questao) {
  return String(questao.tema || 'Sem tema').trim();
}

function getKey(questao: Questao) {
  return String(questao.id);
}

function questaoFoiRespondida(
  questao: Questao,
  respostas: RespostasState,
  respondidasSalvas: RespondidasState
) {
  const key = getKey(questao);
  return respostas[key] !== undefined || Boolean(respondidasSalvas[key]);
}

function getConfigMateria(materia: string) {
  const texto = normalizarTexto(materia);

  return (
    PRIORIDADES.find((item) => item.nomes.some((nome) => texto.includes(nome))) ?? {
      peso: 0,
      prioridade: 999,
      nomes: [],
    }
  );
}

function isEtica(materia: string) {
  return getConfigMateria(materia).prioridade === 1;
}

function numeroParaRomano(valor: number) {
  const partes: Array<[number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let numero = Math.floor(valor);
  let romano = '';

  for (const [decimal, letra] of partes) {
    while (numero >= decimal) {
      romano += letra;
      numero -= decimal;
    }
  }

  return romano;
}

function extrairNumeroExame(questao: Questao) {
  const campos = [
    questao.edicao_exame,
    questao.numero_exame,
    questao.numero_prova,
    questao.exame,
    questao.edicao,
    questao.prova,
    questao.origem,
    questao.fonte,
    questao.arquivo,
  ];

  for (const campo of campos) {
    const texto = String(campo ?? '').trim();
    if (!texto) continue;

    if (/^\d{1,3}$/.test(texto)) {
      const numero = Number(texto);
      if (numero > 0) return numero;
    }

    const match =
      texto.match(/(?:prova|oab|exame|edicao|edição|gabarito)[_\-\s]*(\d{1,3})/i) ||
      texto.match(/(?:prova|oab|exame|edicao|edição|gabarito).*?(\d{1,3})/i) ||
      texto.match(/\b(\d{2,3})\b/);

    if (match?.[1]) {
      const numero = Number(match[1]);
      if (Number.isFinite(numero) && numero > 0) return numero;
    }
  }

  return null;
}

function getExameInfo(questao: Questao) {
  const numero = extrairNumeroExame(questao);

  if (!numero) {
    return { key: 'sem-exame', label: 'Exame não identificado', numero: 0 };
  }

  return { key: String(numero), label: `Exame (${numero}) ${numeroParaRomano(numero)}`, numero };
}

function ordenarQuestoes(questoes: Questao[]) {
  return [...questoes].sort((a, b) => {
    const exameA = getExameInfo(a).numero;
    const exameB = getExameInfo(b).numero;
    if (exameA !== exameB) return exameB - exameA;

    const configA = getConfigMateria(getMateriaNome(a));
    const configB = getConfigMateria(getMateriaNome(b));
    if (configA.prioridade !== configB.prioridade) return configA.prioridade - configB.prioridade;

    const temaCompare = getTemaNome(a).localeCompare(getTemaNome(b));
    if (temaCompare !== 0) return temaCompare;

    return String(a.id).localeCompare(String(b.id), undefined, { numeric: true });
  });
}

function normalizarGabarito(valor: Questao['gabarito']) {
  if (typeof valor === 'number' && valor >= 0 && valor <= 3) return valor;

  const texto = String(valor ?? '').trim().toUpperCase();
  const letraMatch = texto.match(/[A-D]/);
  if (letraMatch?.[0]) {
    const letraIndex = LETRAS.indexOf(letraMatch[0]);
    if (letraIndex >= 0) return letraIndex;
  }

  const numeroMatch = texto.match(/\d+/);
  const numero = numeroMatch ? Number(numeroMatch[0]) : Number(texto);
  if (Number.isInteger(numero) && numero >= 0 && numero <= 3) return numero;
  if (Number.isInteger(numero) && numero >= 1 && numero <= 4) return numero - 1;

  return null;
}

function getComentarioQuestao(questao: Questao) {
  const possiveisComentarios = [
    questao.comentario,
    questao.explicacao,
    questao.comentario_ia,
    questao.comentarioIA,
    questao.explanation,
  ];

  const comentario = possiveisComentarios.find((valor) => String(valor ?? '').trim().length > 0);
  return String(comentario ?? '').trim();
}

function scrollToQuestoes() {
  window.setTimeout(() => {
    document.getElementById('questoes-em-jogo')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 120);
}

function scrollToResumo() {
  window.setTimeout(() => {
    document.getElementById('resumo-rodada')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 80);
}

function scrollFeedbackIntoView(elementId: string) {
  window.setTimeout(() => {
    const element = document.getElementById(elementId);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const topPadding = 88;
    const bottomPadding = 36;

    if (rect.top >= topPadding && rect.bottom <= viewportHeight - bottomPadding) return;

    const targetY =
      rect.height > viewportHeight - topPadding - bottomPadding
        ? window.scrollY + rect.top - topPadding
        : window.scrollY + rect.bottom - viewportHeight + bottomPadding;

    window.scrollTo({
      top: Math.max(0, targetY),
      behavior: 'smooth',
    });
  }, 140);
}

function optionClass(index: number, selected: number | null, correct: number | null) {
  const answered = selected !== null;

  if (answered && correct === index) {
    return 'border-emerald-600 bg-emerald-50 text-emerald-950 dark:border-emerald-400 dark:bg-emerald-500/20 dark:text-emerald-50';
  }

  if (answered && selected === index && selected !== correct) {
    return 'border-rose-600 bg-rose-50 text-rose-950 dark:border-rose-400 dark:bg-rose-500/20 dark:text-rose-50';
  }

  if (answered) {
    return 'border-slate-300 bg-slate-100 text-slate-600 opacity-75 dark:border-white/10 dark:bg-slate-800 dark:text-slate-400';
  }

  return 'border-slate-300 bg-white text-slate-900 hover:border-cyan-600 hover:bg-cyan-50 dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700';
}

function letterClass(index: number, selected: number | null, correct: number | null) {
  const answered = selected !== null;

  if (answered && correct === index) return 'border-emerald-600 bg-emerald-500 text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950';
  if (answered && selected === index && selected !== correct) return 'border-rose-600 bg-rose-500 text-white dark:border-rose-300 dark:bg-rose-300 dark:text-rose-950';

  return 'border-slate-300 bg-slate-100 text-slate-900 dark:border-white/15 dark:bg-slate-950 dark:text-slate-100';
}

function tabClass(active: boolean) {
  if (active) {
    return 'border-emerald-700 bg-emerald-600 text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950';
  }

  return 'border-slate-300 bg-white text-slate-900 hover:border-emerald-500 hover:bg-emerald-50 dark:border-white/15 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700';
}

function QuestaoCard({
  questao,
  index,
  total,
  selected,
  reviewSuccessPending,
  onResponder,
  onConfirmarAcertoRevisao,
}: {
  questao: Questao;
  index: number;
  total: number;
  selected: number | null;
  reviewSuccessPending?: boolean;
  onResponder: (questao: Questao, alternativaIndex: number) => void;
  onConfirmarAcertoRevisao?: (questao: Questao) => void;
}) {
  const correct = normalizarGabarito(questao.gabarito);
  const answered = selected !== null;
  const acertou = answered && selected === correct;
  const exame = getExameInfo(questao);
  const comentario = getComentarioQuestao(questao);

  return (
    <article
      id={`questao-${questao.id}`}
      className="scroll-mt-24 rounded-2xl border border-slate-300 bg-white p-3 shadow-sm dark:border-white/15 dark:bg-slate-900 md:p-6"
    >
      <div className="mb-5 flex flex-wrap items-center gap-2 text-xs font-black uppercase">
        <span className="rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-slate-700 dark:border-white/15 dark:bg-slate-800 dark:text-slate-200">
          Questão {index + 1} de {total}
        </span>

        <span
          className={
            isEtica(getMateriaNome(questao))
              ? 'rounded-md border border-emerald-500 bg-emerald-100 px-2.5 py-1 text-emerald-950 dark:border-amber-300/45 dark:bg-amber-300/15 dark:text-amber-100'
              : 'rounded-md border border-cyan-500 bg-cyan-50 px-2.5 py-1 text-cyan-950 dark:border-cyan-300/35 dark:bg-cyan-300/10 dark:text-cyan-100'
          }
        >
          {getMateriaNome(questao)}
        </span>

        <span className="rounded-md border border-violet-500 bg-violet-50 px-2.5 py-1 text-violet-950 dark:border-violet-300/35 dark:bg-violet-300/10 dark:text-violet-100">
          {exame.label}
        </span>

        <span className="rounded-md border border-emerald-500 bg-emerald-50 px-2.5 py-1 text-emerald-950 dark:border-emerald-300/35 dark:bg-emerald-300/10 dark:text-emerald-100">
          {getTemaNome(questao)}
        </span>
      </div>

      <h2 className="mb-5 whitespace-pre-line text-left text-[15px] font-semibold leading-7 tracking-normal text-slate-950 dark:text-white md:mb-6 md:text-justify md:text-lg md:leading-9 md:tracking-wide">
        {questao.enunciado}
      </h2>

      <div className="space-y-2 md:space-y-3">
        {questao.alternativas.map((alt, alternativaIndex) => {
          const isCorrect = answered && correct === alternativaIndex;
          const isWrongSelection = answered && selected === alternativaIndex && selected !== correct;

          return (
            <button
              key={`${questao.id}-${alternativaIndex}`}
              type="button"
              onClick={() => onResponder(questao, alternativaIndex)}
              disabled={answered}
              className={`grid w-full grid-cols-[2.25rem_1fr_1.25rem] items-start gap-2.5 rounded-xl border px-3 py-3 text-left transition md:grid-cols-[2.5rem_1fr_1.5rem] md:gap-4 md:px-5 md:py-5 ${optionClass(
                alternativaIndex,
                selected,
                correct
              )}`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-black md:h-10 md:w-10 ${letterClass(alternativaIndex, selected, correct)}`}>
                {LETRAS[alternativaIndex]}
              </span>

              <span className="min-w-0 whitespace-pre-line text-left text-sm leading-6 tracking-normal md:text-justify md:text-base md:leading-8 md:tracking-wide">{alt}</span>

              <span className="flex justify-end">
                {isCorrect && <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />}
                {isWrongSelection && <XCircle className="h-5 w-5 text-rose-600 dark:text-rose-300" />}
              </span>
            </button>
          );
        })}
      </div>

      {answered && (
        <section
          className={`mt-5 rounded-xl border p-4 ${
            acertou
              ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-300/40 dark:bg-emerald-400/10'
              : 'border-rose-500 bg-rose-50 dark:border-rose-300/40 dark:bg-rose-400/10'
          }`}
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-black text-slate-950 dark:text-white">
              {acertou ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              ) : (
                <XCircle className="h-5 w-5 text-rose-700 dark:text-rose-300" />
              )}
              <span>{acertou ? 'Correta' : 'Resposta incorreta'}</span>
            </div>

            <span className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-black ${acertou ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
              <Sparkles className="h-3.5 w-3.5" />
              {acertou ? 'Acertou' : 'Revisar'}
            </span>
          </div>

          {correct !== null ? (
            <p className={`mb-3 text-sm font-black ${acertou ? 'text-emerald-800 dark:text-emerald-100' : 'text-rose-800 dark:text-rose-100'}`}>
              Resposta correta: {LETRAS[correct]}
            </p>
          ) : (
            <p className="mb-3 text-sm font-black text-amber-800 dark:text-amber-100">
              Gabarito não identificado para esta questão.
            </p>
          )}

          <div className="rounded-lg border border-slate-300 bg-white p-3 dark:border-white/15 dark:bg-slate-950">
            <p className="mb-1 text-xs font-black uppercase text-slate-600 dark:text-slate-400">
              Comentário
            </p>
            <p
              id={`comentario-${questao.id}`}
              className="whitespace-pre-line text-left text-sm leading-6 tracking-normal text-slate-800 dark:text-slate-100 md:text-justify md:text-[15px] md:leading-8 md:tracking-wide"
            >
              {comentario || 'Comentário ainda não cadastrado para esta questão.'}
            </p>
          </div>

          {reviewSuccessPending && (
            <div className="mt-4 rounded-xl border border-emerald-300 bg-white p-3 dark:border-emerald-300/30 dark:bg-slate-950">
              <p className="text-sm font-bold leading-relaxed text-emerald-900 dark:text-emerald-100">
                Você acertou esta questão de revisão. Ela só será removida da revisão quando você continuar.
              </p>

              <button
                type="button"
                onClick={() => onConfirmarAcertoRevisao?.(questao)}
                className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-emerald-700 bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200 md:w-auto"
              >
                Continuar e remover da revisão
              </button>
            </div>
          )}
        </section>
      )}
    </article>
  );
}

function Summary({
  todasQuestoes,
  questoesDoExame,
  respostas,
  respondidasSalvas,
  aba,
  activeMateria,
  activeExame,
  activeTema,
  exames,
  onChangeAba,
  onSelectMateria,
  onSelectTema,
  onSelectExame,
  onResetMateria,
  onResetTodas,
  onShuffle,
}: {
  todasQuestoes: Questao[];
  questoesDoExame: Questao[];
  respostas: RespostasState;
  respondidasSalvas: RespondidasState;
  aba: AbaQuestoes;
  activeMateria: string;
  activeExame: string;
  activeTema: string | null;
  exames: ExameResumo[];
  onChangeAba: (aba: AbaQuestoes) => void;
  onSelectMateria: (materia: string) => void;
  onSelectTema: (materia: string, tema: string) => void;
  onSelectExame: (exame: string) => void;
  onResetMateria: (materia: string) => void;
  onResetTodas: () => void;
  onShuffle: () => void;
}) {
  const [openMaterias, setOpenMaterias] = useState<Record<string, boolean>>({});

  const questoesDoModoAtual = useMemo(() => {
    const base =
      activeMateria === TODAS_AS_MATERIAS
        ? questoesDoExame
        : questoesDoExame.filter((questao) => getMateriaNome(questao) === activeMateria);

    if (!activeTema) return base;

    return base.filter((questao) => getTemaNome(questao) === activeTema);
  }, [questoesDoExame, activeMateria, activeTema]);

  const totalFeitas = questoesDoModoAtual.filter((questao) =>
    questaoFoiRespondida(questao, respostas, respondidasSalvas)
  ).length;
  const totalNaoRespondidas = questoesDoModoAtual.length - totalFeitas;
  const totalFeitasExame = questoesDoExame.filter((questao) =>
    questaoFoiRespondida(questao, respostas, respondidasSalvas)
  ).length;

  const materias = useMemo<MateriaResumo[]>(() => {
    const map = new Map<
      string,
      {
        total: number;
        feitas: number;
        naoRespondidas: number;
        firstId: number | string;
        temas: Map<string, { total: number; feitas: number; naoRespondidas: number; firstId: number | string }>;
      }
    >();

    for (const questao of questoesDoExame) {
      const materia = getMateriaNome(questao);
      const tema = getTemaNome(questao);
      const respondida = questaoFoiRespondida(questao, respostas, respondidasSalvas);

      if (!map.has(materia)) {
        map.set(materia, { total: 0, feitas: 0, naoRespondidas: 0, firstId: questao.id, temas: new Map() });
      }

      const materiaInfo = map.get(materia)!;
      materiaInfo.total += 1;
      if (respondida) materiaInfo.feitas += 1;
      else materiaInfo.naoRespondidas += 1;

      if (!materiaInfo.temas.has(tema)) {
        materiaInfo.temas.set(tema, { total: 0, feitas: 0, naoRespondidas: 0, firstId: questao.id });
      }

      const temaInfo = materiaInfo.temas.get(tema)!;
      temaInfo.total += 1;
      if (respondida) temaInfo.feitas += 1;
      else temaInfo.naoRespondidas += 1;
    }

    return Array.from(map.entries())
      .map(([materia, info]) => {
        const config = getConfigMateria(materia);

        return {
          materia,
          total: info.total,
          feitas: info.feitas,
          naoRespondidas: info.naoRespondidas,
          firstId: info.firstId,
          peso: config.peso,
          prioridade: config.prioridade,
          temas: Array.from(info.temas.entries())
            .map(([tema, temaInfo]) => ({
              tema,
              total: temaInfo.total,
              feitas: temaInfo.feitas,
              naoRespondidas: temaInfo.naoRespondidas,
              firstId: temaInfo.firstId,
            }))
            .sort((a, b) => b.total - a.total || a.tema.localeCompare(b.tema)),
        };
      })
      .sort((a, b) => {
        if (a.prioridade !== b.prioridade) return a.prioridade - b.prioridade;
        return b.total - a.total || a.materia.localeCompare(b.materia);
      });
  }, [questoesDoExame, respostas, respondidasSalvas]);

  return (
    <section id="resumo-rodada" className="scroll-mt-24 rounded-2xl border border-slate-200 bg-white/95 p-2.5 shadow-sm dark:border-white/10 dark:bg-slate-900/95 md:p-4">
      <div className="mb-2.5 flex flex-col gap-2.5 md:mb-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-black leading-tight text-slate-950 dark:text-white md:text-2xl">
            {activeMateria === TODAS_AS_MATERIAS
              ? 'Todas as matérias'
              : activeTema
                ? `${activeMateria} · ${activeTema}`
                : activeMateria}
          </h1>
          <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-700 dark:text-slate-300 md:text-sm">
            {activeMateria === TODAS_AS_MATERIAS
              ? 'Você está treinando todas as matérias juntas. Toque em uma matéria abaixo para focar nela.'
              : 'Matéria selecionada. Para trocar, toque em outra matéria na lista abaixo ou use 📚 Todas as matérias.'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 md:justify-end">
          <button
            type="button"
            onClick={onShuffle}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs font-black text-emerald-800 shadow-sm transition hover:border-emerald-500 hover:bg-emerald-50 dark:border-emerald-300/25 dark:bg-slate-800 dark:text-emerald-200 dark:hover:bg-emerald-300/10 md:min-h-10 md:px-3.5 md:text-sm"
          >
            <Shuffle className="h-4 w-4" strokeWidth={3} />
            Embaralhar
          </button>
        </div>
      </div>

      <div className="mb-2.5 rounded-2xl border border-emerald-200 bg-slate-50/80 p-2 dark:border-emerald-300/20 dark:bg-slate-800/70 md:mb-3 md:p-2.5">
        <div className="mb-1.5 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800 dark:text-emerald-100 md:text-[11px] md:tracking-[0.16em]">
          <FileText className="h-4 w-4" strokeWidth={3} />
          Edicao do exame
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => onSelectExame(TODOS_OS_EXAMES)}
            className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
              activeExame === TODOS_OS_EXAMES
                ? 'border-emerald-700 bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950'
                : 'border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-slate-900 dark:text-emerald-100 dark:hover:bg-emerald-300/10'
            }`}
          >
            Todos os exames
          </button>

          {exames.map((exame) => (
            <button
              key={exame.key}
              type="button"
              onClick={() => onSelectExame(exame.key)}
              className={`shrink-0 rounded-xl border px-3 py-1.5 text-xs font-black transition ${
                activeExame === exame.key
                  ? 'border-emerald-700 bg-emerald-600 text-white shadow-sm shadow-emerald-500/20 dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950'
                  : 'border-emerald-300 bg-white text-emerald-950 hover:bg-emerald-100 dark:border-emerald-300/25 dark:bg-slate-900 dark:text-emerald-100 dark:hover:bg-emerald-300/10'
              }`}
            >
              {exame.label} · {exame.total} questões
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2.5 grid grid-cols-2 gap-2 md:mb-3 lg:grid-cols-4">
        <button type="button" onClick={() => onChangeAba('todas')} className={`rounded-xl border px-2 py-2 text-xs font-black transition md:px-4 md:py-2.5 md:text-sm ${tabClass(aba === 'todas')}`}>
          Todas · {questoesDoModoAtual.length}
        </button>
        <button type="button" onClick={() => onChangeAba('naoRespondidas')} className={`rounded-xl border px-2 py-2 text-xs font-black transition md:px-4 md:py-2.5 md:text-sm ${tabClass(aba === 'naoRespondidas')}`}>
          Não respondidas · {totalNaoRespondidas}
        </button>
        <button type="button" onClick={() => onChangeAba('feitas')} className={`rounded-xl border px-2 py-2 text-xs font-black transition md:px-4 md:py-2.5 md:text-sm ${tabClass(aba === 'feitas')}`}>
          Feitas · {totalFeitas}
        </button>
        <button
          type="button"
          onClick={onResetTodas}
          className="col-span-2 inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-3 py-2 text-xs font-black text-rose-700 shadow-sm transition hover:border-rose-500 hover:bg-rose-50 dark:border-rose-300/40 dark:bg-slate-900 dark:text-rose-200 dark:hover:bg-rose-400/10 lg:col-span-1 md:min-h-10 md:px-4 md:py-2.5 md:text-sm"
        >
          <RotateCcw className="h-4 w-4" strokeWidth={3} />
          Resetar {todasQuestoes.length} questões
        </button>
      </div>

      <div className="mb-2.5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-950 shadow-sm dark:border-white/10 dark:bg-slate-800/80 dark:text-white md:mb-3 md:p-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700 shadow-sm dark:border-emerald-300/30 dark:bg-slate-950 dark:text-emerald-200">
              <ChevronDown className="h-5 w-5" strokeWidth={2.8} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 md:text-xs">
                Trocar matéria
              </p>
              <p className="mt-1 text-sm font-black leading-snug text-slate-950 dark:text-white">
                A lista abaixo é o seletor de matérias.
              </p>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                Toque no nome para abrir a matéria. Use a setinha para ver os temas e o reset para limpar só aquela matéria.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-1.5 text-[11px] font-black">
            <span className="rounded-full border border-emerald-200 bg-white px-2.5 py-1 text-emerald-800 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100">
              Atual = borda verde
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={3} />
              abre temas
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-white px-2.5 py-1 text-rose-700 dark:border-rose-300/25 dark:bg-rose-300/10 dark:text-rose-100">
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={3} />
              reseta a matéria
            </span>
            <span className="rounded-full border border-cyan-200 bg-white px-2.5 py-1 text-cyan-800 dark:border-cyan-300/25 dark:bg-cyan-300/10 dark:text-cyan-100">
              📚 mistura tudo
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div
          className={
            activeMateria === TODAS_AS_MATERIAS
              ? 'rounded-xl border-2 border-emerald-500 bg-white p-2.5 dark:border-emerald-300/50 dark:bg-slate-800 md:p-3'
              : 'rounded-xl border border-emerald-200 bg-white p-2.5 dark:border-emerald-300/20 dark:bg-slate-800/80 md:p-3'
          }
        >
          <button
            type="button"
            onClick={() => onSelectMateria(TODAS_AS_MATERIAS)}
            className="flex w-full items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50 via-white to-cyan-50 px-3 py-2.5 text-left text-sm font-black text-emerald-950 shadow-sm shadow-emerald-950/5 ring-1 ring-emerald-100 transition hover:border-emerald-500 hover:from-emerald-100 hover:to-cyan-100 dark:border-emerald-300/25 dark:from-emerald-300/10 dark:via-slate-900 dark:to-cyan-300/10 dark:text-emerald-100 dark:ring-emerald-300/10 dark:hover:bg-emerald-300/10"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span aria-hidden="true" className="text-base leading-none">
                📚
              </span>
              <span>Todas as matérias · {questoesDoExame.length}</span>
            </span>

            <span className="ml-auto rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-900 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100">
              modo todas
            </span>
          </button>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-emerald-100 dark:bg-slate-950">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-300"
              style={{
                width: `${questoesDoExame.length > 0 ? Math.round((totalFeitasExame / questoesDoExame.length) * 100) : 0}%`,
              }}
            />
          </div>

          <p className="mt-1.5 text-xs font-bold text-emerald-900 dark:text-emerald-100">
            Estude todas as matérias misturadas, simulando melhor o ritmo da prova.
          </p>
        </div>

        {materias.map((item) => {
          const isOpen = Boolean(openMaterias[item.materia]);
          const isActive = activeMateria === item.materia;
          const progresso = item.total > 0 ? Math.round((item.feitas / item.total) * 100) : 0;

          return (
            <div
              key={item.materia}
              className={
                isActive
                  ? 'rounded-xl border-2 border-emerald-500 bg-white p-2.5 dark:border-emerald-300/50 dark:bg-slate-800 md:p-3'
                  : 'rounded-xl border border-slate-200 bg-white p-2.5 dark:border-white/10 dark:bg-slate-800/80 md:p-3'
              }
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectMateria(item.materia)}
                  className="flex min-h-10 min-w-0 flex-1 items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-black text-slate-950 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-700"
                >
                  <span className="min-w-0">
                    {isEtica(item.materia) ? '⚡ ' : item.peso >= 6 ? '🔥 ' : ''}
                    {item.materia} · {item.total}
                  </span>

                  {isActive ? (
                    <span className="ml-auto rounded-full border border-emerald-300 bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-900 dark:border-emerald-300/30 dark:bg-emerald-300/10 dark:text-emerald-100">
                      Atual
                    </span>
                  ) : (
                    <span className="ml-auto hidden rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-[11px] font-black text-slate-900 md:inline-flex dark:border-white/10 dark:bg-slate-950 dark:text-slate-200">
                      Peso {item.peso || '-'}
                    </span>
                  )}
                </button>

                <div className="flex shrink-0 gap-1.5 md:gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setOpenMaterias((current) => ({ ...current, [item.materia]: !current[item.materia] }))
                    }
                    aria-expanded={isOpen}
                    aria-label={isOpen ? 'Recolher temas' : 'Expandir temas'}
                    title={isOpen ? 'Recolher temas' : 'Expandir temas'}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-900 transition hover:bg-slate-100 dark:border-white/10 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-700"
                  >
                    <ChevronDown className={`h-4 w-4 transition ${isOpen ? 'rotate-180' : ''}`} strokeWidth={3} />
                  </button>

                  <button
                    type="button"
                    onClick={() => onResetMateria(item.materia)}
                    aria-label={`Resetar ${item.materia}`}
                    title={`Resetar ${item.materia}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-rose-300/45 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={3} />
                  </button>
                </div>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-300 dark:bg-slate-950">
                <div className="h-full rounded-full bg-emerald-600 dark:bg-emerald-300" style={{ width: `${progresso}%` }} />
              </div>

              <p className="mt-1.5 text-[11px] font-black text-slate-700 dark:text-slate-300">
                Feitas: {item.feitas} · Não respondidas: {item.naoRespondidas}
              </p>

              {isOpen && (
                <div className="mt-3 flex flex-wrap gap-2 rounded-xl border border-slate-300 bg-white p-3 dark:border-white/15 dark:bg-slate-950">
                  {item.temas.map((tema) => (
                    <button
                      key={`${item.materia}-${tema.tema}`}
                      type="button"
                      onClick={() => onSelectTema(item.materia, tema.tema)}
                      className={`rounded-full border px-2.5 py-1 text-xs font-black transition hover:bg-amber-50 dark:border-white/15 dark:hover:bg-slate-700 ${
                        activeTema === tema.tema && activeMateria === item.materia
                          ? 'border-emerald-700 bg-emerald-600 text-white dark:bg-emerald-300 dark:text-emerald-950'
                          : 'border-slate-300 bg-white text-slate-900 dark:bg-slate-800 dark:text-white'
                      }`}
                    >
                      {tema.tema} · {tema.total}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}


function lerUserGameDataLocal() {
  if (typeof window === 'undefined') return {};

  try {
    const raw = localStorage.getItem('user-game-data');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function questaoEstaEmRevisaoLocal(idQuestao: number | string) {
  const current = lerUserGameDataLocal();
  const id = String(idQuestao);

  const revisaoIds = Array.isArray(current.revisaoIds)
    ? current.revisaoIds.map(String)
    : [];

  const questoesErradas = Array.isArray(current.questoesErradas)
    ? current.questoesErradas.map(String)
    : [];

  return revisaoIds.includes(id) || questoesErradas.includes(id);
}

function removerQuestaoDaRevisaoLocal(idQuestao: number | string) {
  const current = lerUserGameDataLocal();
  const id = String(idQuestao);

  const revisaoIds = Array.isArray(current.revisaoIds)
    ? current.revisaoIds.map(String).filter((item: string) => item !== id)
    : [];

  const questoesErradas = Array.isArray(current.questoesErradas)
    ? current.questoesErradas.map(String).filter((item: string) => item !== id)
    : [];

  localStorage.setItem(
    'user-game-data',
    JSON.stringify({
      ...current,
      revisaoIds,
      questoesErradas,
    })
  );

  window.dispatchEvent(new Event('oaplay-revisao-atualizada'));
  window.dispatchEvent(new StorageEvent('storage', { key: 'user-game-data' }));
}


function resetarAcertosDoDashboard() {
  const keys = ['user-game-data', 'oaplay:user', 'oaplay-user'];

  for (const key of keys) {
    const raw = localStorage.getItem(key);
    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      const next = {
        ...parsed,
        acertos: 0,
      };

      localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // ignora chaves que não forem JSON
    }
  }

  window.dispatchEvent(new Event('oaplay-reset-acertos'));
  window.dispatchEvent(new StorageEvent('storage', { key: 'user-game-data' }));
}


function hashStringForShuffle(valor: string) {
  let hash = 0;

  for (let index = 0; index < valor.length; index += 1) {
    hash = (hash * 31 + valor.charCodeAt(index)) >>> 0;
  }

  return hash;
}

function criarRandomSeeded(seed: number) {
  let value = seed >>> 0;

  return () => {
    value = (value + 0x6d2b79f5) >>> 0;

    let mixed = value;
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1);
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61);

    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

function ordenarEmbaralhado(questoes: Questao[], seed: number) {
  if (!seed) return questoes;

  const embaralhadas = [...questoes];
  const random = criarRandomSeeded(hashStringForShuffle(String(seed)));

  for (let index = embaralhadas.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [embaralhadas[index], embaralhadas[target]] = [embaralhadas[target], embaralhadas[index]];
  }

  return embaralhadas;
}

function lerRespondidasSalvasParaOrdenacao(): Record<string, true> {
  const current = lerUserGameDataLocal();
  const ids = new Set<string>();

  if (Array.isArray(current.questoesRespondidas)) {
    current.questoesRespondidas.forEach((id: number | string) => ids.add(String(id)));
  }

  if (current.respostasQuestoes && typeof current.respostasQuestoes === 'object') {
    Object.keys(current.respostasQuestoes).forEach((id) => ids.add(String(id)));
  }

  return Array.from(ids).reduce<Record<string, true>>((acc, id) => {
    acc[id] = true;
    return acc;
  }, {});
}

function moverRespondidasSalvasParaFinal(
  questoes: Questao[],
  respondidasSalvas: Record<string, true>
) {
  if (!Object.keys(respondidasSalvas).length) return questoes;

  return [...questoes].sort((a, b) => {
    const aRespondida = Boolean(respondidasSalvas[getKey(a)]);
    const bRespondida = Boolean(respondidasSalvas[getKey(b)]);

    if (aRespondida === bRespondida) return 0;
    return aRespondida ? 1 : -1;
  });
}

type QuestoesListProps = {
  demoMode?: boolean;
};

export default function QuestoesList({ demoMode = false }: QuestoesListProps) {
  const [data, setData] = useState<Questao[] | null>(null);
  const [error, setError] = useState('');
  const [respostas, setRespostas] = useState<RespostasState>({});
  const [loading, setLoading] = useState(false);
  const [aba, setAba] = useState<AbaQuestoes>('naoRespondidas');
  const [activeMateria, setActiveMateria] = useState<string>('');
  const [activeTema, setActiveTema] = useState<string | null>(null);
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const [activeExame, setActiveExame] = useState<string>(TODOS_OS_EXAMES);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [reviewSuccessPending, setReviewSuccessPending] = useState<Record<string, boolean>>({});
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [showFreeLimitModal, setShowFreeLimitModal] = useState(false);
  const [showDemoSignupModal, setShowDemoSignupModal] = useState(false);
  const [demoSignupDismissed, setDemoSignupDismissed] = useState(false);
  const [respondidasSalvasAoCarregar, setRespondidasSalvasAoCarregar] = useState<Record<string, true>>({});

  const { user, setUser, registrarAcerto, registrarErro, registrarRespostaFreeHoje, registrarQuestaoRevisada, resetarAcertos } = useGameState() || {};
  const { playSuccess, playError } = useSoundEffects();
  const isDemoGuest = demoMode && !user;

  const freeDailyCount = user?.freeDailyAnswers?.date === new Date().toISOString().split('T')[0]
    ? user?.freeDailyAnswers?.count || 0
    : 0;

  const freeLimitReached = !demoMode && !user?.isPremium && freeDailyCount >= FREE_DAILY_LIMIT;

  const respondidasConhecidas = useMemo<RespondidasState>(() => {
    const ids = new Set<string>(Object.keys(respondidasSalvasAoCarregar));

    if (Array.isArray(user?.questoesRespondidas)) {
      user.questoesRespondidas.forEach((id: number | string) => ids.add(String(id)));
    }

    if (user?.respostasQuestoes && typeof user.respostasQuestoes === 'object') {
      Object.keys(user.respostasQuestoes).forEach((id) => ids.add(String(id)));
    }

    return Array.from(ids).reduce<RespondidasState>((acc, id) => {
      acc[id] = true;
      return acc;
    }, {});
  }, [respondidasSalvasAoCarregar, user?.questoesRespondidas, user?.respostasQuestoes]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const pathname = window.location.pathname.toLowerCase();
    setIsReviewMode(pathname.includes('review') || pathname.includes('revisao') || pathname.includes('revisão'));
  }, []);

  useEffect(() => {
    let cancel = false;

    async function load() {
      setLoading(true);
      setError('');

      try {
        if (demoMode) {
          const ordenadas = ordenarQuestoes(DEMO_QUESTOES);

          if (!cancel) {
            setData(ordenadas);
            setRespostas({});
            setRespondidasSalvasAoCarregar({});
            setReviewSuccessPending({});
            setShowDemoSignupModal(false);
            setDemoSignupDismissed(false);
            setAba('naoRespondidas');
            setActiveExame(TODOS_OS_EXAMES);
            setActiveTema(null);
            setActiveMateria(TODAS_AS_MATERIAS);
          }

          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          throw new Error('Entre na conta para carregar as questões.');
        }

        const params = new URLSearchParams({ page: '0', limit: String(LIMIT_QUESTOES) });
        const res = await fetch(`/api/questoes?${params.toString()}`, {
          cache: 'no-store',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const json = await res.json().catch(() => null);

        if (!res.ok) throw new Error(json?.error || `Falha ao buscar questões (${res.status})`);
        if (!Array.isArray(json)) throw new Error('Resposta inválida ao buscar questões');

        const ordenadas = ordenarQuestoes(json);
        const respondidasSalvas = lerRespondidasSalvasParaOrdenacao();

        if (!cancel) {
          setData(ordenadas);
          setRespostas({});
          setRespondidasSalvasAoCarregar(respondidasSalvas);
          setReviewSuccessPending({});
          setAba('naoRespondidas');
          setActiveMateria(getMateriaNome(ordenadas[0]));
        }
      } catch (err: unknown) {
        if (!cancel) {
          setData([]);
          setError(err instanceof Error ? err.message : 'Erro ao carregar questões');
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    load();

    return () => {
      cancel = true;
    };
  }, [demoMode]);

  const exames = useMemo<ExameResumo[]>(() => {
    if (!data) return [];

    const map = new Map<string, ExameResumo>();

    for (const questao of data) {
      const exame = getExameInfo(questao);
      const atual = map.get(exame.key);

      if (atual) {
        atual.total += 1;
      } else {
        map.set(exame.key, { key: exame.key, label: exame.label, numero: exame.numero, total: 1 });
      }
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.key === 'sem-exame') return 1;
      if (b.key === 'sem-exame') return -1;
      return b.numero - a.numero;
    });
  }, [data]);

  const questoesDoExame = useMemo(() => {
    if (!data) return [];
    if (activeExame === TODOS_OS_EXAMES) return data;
    return data.filter((questao) => getExameInfo(questao).key === activeExame);
  }, [data, activeExame]);

  const materiasOrdenadas = useMemo(() => {
    return Array.from(new Set(questoesDoExame.map((questao) => getMateriaNome(questao)))).sort((a, b) => {
      const configA = getConfigMateria(a);
      const configB = getConfigMateria(b);

      if (configA.prioridade !== configB.prioridade) return configA.prioridade - configB.prioridade;
      return a.localeCompare(b);
    });
  }, [questoesDoExame]);

  useEffect(() => {
    if (!materiasOrdenadas.length) return;
    if (activeMateria === TODAS_AS_MATERIAS) return;

    if (!materiasOrdenadas.includes(activeMateria)) {
      setActiveMateria(materiasOrdenadas[0]);
      setActiveTema(null);
      setAba('naoRespondidas');
    }
  }, [materiasOrdenadas, activeMateria]);

  const questoesDaMateria = useMemo(() => {
    const base =
      activeMateria === TODAS_AS_MATERIAS
        ? questoesDoExame
        : questoesDoExame.filter((questao) => getMateriaNome(questao) === activeMateria);

    if (!activeTema) return base;

    return base.filter((questao) => getTemaNome(questao) === activeTema);
  }, [questoesDoExame, activeMateria, activeTema]);

  const questoesVisiveis = useMemo(() => {
    let base = questoesDaMateria;

    if (aba === 'feitas') {
      base = questoesDaMateria.filter((questao) =>
        questaoFoiRespondida(questao, respostas, respondidasConhecidas)
      );
    } else if (aba === 'naoRespondidas') {
      base = questoesDaMateria.filter((questao) => {
        const key = getKey(questao);

        // No modo revisão, quando o usuário acerta, a questão precisa continuar
        // aparecendo até ele clicar em "Continuar e remover da revisão".
        // Sem isso, a aba "Não respondidas" remove a questão assim que a resposta
        // é registrada e o usuário não consegue ver gabarito nem comentário.
        const respondidaNaSessao = respostas[key] !== undefined;
        return respondidaNaSessao || !respondidasConhecidas[key] || Boolean(reviewSuccessPending[key]);
      });
    }

    return moverRespondidasSalvasParaFinal(
      ordenarEmbaralhado(base, shuffleSeed),
      respondidasSalvasAoCarregar
    );
  }, [aba, questoesDaMateria, respostas, respondidasConhecidas, respondidasSalvasAoCarregar, reviewSuccessPending, shuffleSeed]);

  const demoSummary = useMemo(() => {
    const todas = data || [];
    const respondidas = Object.keys(respostas).length;
    let acertos = 0;
    let erros = 0;
    const materiasMap = new Map<string, { materia: string; total: number; feitas: number }>();

    for (const questao of todas) {
      const key = getKey(questao);
      const materia = getMateriaNome(questao);
      const selecionada = respostas[key];
      const entry = materiasMap.get(materia) || { materia, total: 0, feitas: 0 };

      entry.total += 1;

      if (selecionada !== undefined) {
        entry.feitas += 1;

        if (normalizarGabarito(questao.gabarito) === selecionada) {
          acertos += 1;
        } else {
          erros += 1;
        }
      }

      materiasMap.set(materia, entry);
    }

    const total = todas.length;
    const progresso = total ? Math.round((respondidas / total) * 100) : 0;
    const aproveitamento = respondidas ? Math.round((acertos / respondidas) * 100) : 0;
    const materias = Array.from(materiasMap.values()).sort((a, b) => {
      const configA = getConfigMateria(a.materia);
      const configB = getConfigMateria(b.materia);

      if (configA.prioridade !== configB.prioridade) return configA.prioridade - configB.prioridade;
      return a.materia.localeCompare(b.materia);
    });

    return {
      total,
      respondidas,
      naoRespondidas: Math.max(total - respondidas, 0),
      acertos,
      erros,
      progresso,
      aproveitamento,
      materias,
    };
  }, [data, respostas]);

  const demoAchievements = useMemo(() => {
    return DEMO_ACHIEVEMENTS.map((achievement) => {
      const unlocked =
        achievement.unlockWhen === 'answered'
          ? demoSummary.respondidas >= 1
          : achievement.unlockWhen === 'mistake'
            ? demoSummary.erros >= 1
            : achievement.unlockWhen === 'warmup'
              ? demoSummary.respondidas >= DEMO_SAVE_PROMPT_THRESHOLD
              : false;

      return {
        ...achievement,
        unlocked,
      };
    });
  }, [demoSummary.respondidas, demoSummary.erros]);

  function responder(questao: Questao, alternativaIndex: number) {
    const key = getKey(questao);
    if (respostas[key] !== undefined) return;

    if (freeLimitReached) {
      setShowFreeLimitModal(true);
      return;
    }

    const estaRevisandoQuestao = !isDemoGuest && (isReviewMode || questaoEstaEmRevisaoLocal(questao.id));

    if (estaRevisandoQuestao) {
      registrarQuestaoRevisada?.(questao.id);
    }

    setRespostas((current) => ({ ...current, [key]: alternativaIndex }));
    scrollFeedbackIntoView(`comentario-${questao.id}`);

    const correct = normalizarGabarito(questao.gabarito);
    const acertou = correct !== null && alternativaIndex === correct;
    const totalRespondidasAgora = Object.keys(respostas).length + 1;

    if (acertou) {
      playSuccess();
    } else {
      playError();
    }

    if (isDemoGuest) {
      if (totalRespondidasAgora >= DEMO_SAVE_PROMPT_THRESHOLD && !demoSignupDismissed) {
        window.setTimeout(() => {
          setShowDemoSignupModal(true);
        }, 650);
      }

      return;
    }

    registrarRespostaFreeHoje?.();

    if (acertou) {
      if (estaRevisandoQuestao) {
        setReviewSuccessPending((current) => ({ ...current, [key]: true }));
        return;
      }

      registrarAcerto?.(questao.id);
    } else {
      setReviewSuccessPending((current) => {
        const next = { ...current };
        delete next[key];
        return next;
      });

      registrarErro?.(questao.id);

      const raw = localStorage.getItem('user-game-data');
      const current = raw ? JSON.parse(raw) : {};

      const id = String(questao.id);
      const revisaoIds = Array.isArray(current.revisaoIds)
        ? current.revisaoIds.map(String)
        : [];

      const questoesErradas = Array.isArray(current.questoesErradas)
        ? current.questoesErradas.map(String)
        : [];

      localStorage.setItem(
        'user-game-data',
        JSON.stringify({
          ...current,
          revisaoIds: [...new Set([...revisaoIds, id])],
          questoesErradas: [...new Set([...questoesErradas, id])],
        })
      );

      window.dispatchEvent(new Event('oaplay-revisao-atualizada'));
      window.dispatchEvent(new StorageEvent('storage', { key: 'user-game-data' }));
    }
  }

  function confirmarAcertoRevisao(questao: Questao) {
    const key = getKey(questao);

    registrarAcerto?.(questao.id);
    removerQuestaoDaRevisaoLocal(questao.id);

    setReviewSuccessPending((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });

    scrollToQuestoes();
  }

  function consolidarRespostasDaSessaoAtual() {
    const idsRespondidosAgora = Object.keys(respostas);

    if (!idsRespondidosAgora.length) return;

    setRespondidasSalvasAoCarregar((current) => {
      const next = { ...current };

      idsRespondidosAgora.forEach((id) => {
        next[id] = true;
      });

      return next;
    });
  }

  function selecionarMateria(materia: string) {
    if (materia !== activeMateria || activeTema) {
      consolidarRespostasDaSessaoAtual();
    }

    setActiveMateria(materia);
    setActiveTema(null);
    setAba('naoRespondidas');
    scrollToQuestoes();
  }

  function embaralharQuestoes() {
    setShuffleSeed(Date.now());
    setAba('naoRespondidas');
    scrollToQuestoes();
  }

  function selecionarTema(materia: string, tema: string) {
    if (materia !== activeMateria || tema !== activeTema) {
      consolidarRespostasDaSessaoAtual();
    }

    setActiveMateria(materia);
    setActiveTema(tema);
    setAba('naoRespondidas');
    scrollToQuestoes();
  }

  function selecionarExame(exame: string) {
    if (exame !== activeExame) {
      consolidarRespostasDaSessaoAtual();
    }

    setActiveExame(exame);
    setActiveMateria('');
    setActiveTema(null);
    setAba('naoRespondidas');
    scrollToResumo();
  }


  function resetarMateria(materia: string) {
    const idsParaResetar = questoesDoExame
      .filter((questao) => getMateriaNome(questao) === materia)
      .map(getKey);
    const idsSet = new Set(idsParaResetar);

    setRespostas((current) => {
      const next = { ...current };

      for (const id of idsParaResetar) delete next[id];

      return next;
    });

    setReviewSuccessPending((current) => {
      const next = { ...current };

      for (const id of idsParaResetar) delete next[id];

      return next;
    });

    setRespondidasSalvasAoCarregar((current) => {
      const next = { ...current };

      for (const id of idsParaResetar) delete next[id];

      return next;
    });

    setUser?.((prev: any) => {
      if (!prev) return prev;

      const respostasQuestoes =
        prev.respostasQuestoes && typeof prev.respostasQuestoes === 'object'
          ? { ...prev.respostasQuestoes }
          : {};

      for (const id of idsParaResetar) delete respostasQuestoes[id];

      return {
        ...prev,
        questoesRespondidas: Array.isArray(prev.questoesRespondidas)
          ? prev.questoesRespondidas.map(String).filter((id: string) => !idsSet.has(id))
          : [],
        respostasQuestoes,
      };
    });

    try {
      const current = lerUserGameDataLocal();
      const respostasQuestoes =
        current.respostasQuestoes && typeof current.respostasQuestoes === 'object'
          ? { ...current.respostasQuestoes }
          : {};

      for (const id of idsParaResetar) delete respostasQuestoes[id];

      localStorage.setItem(
        'user-game-data',
        JSON.stringify({
          ...current,
          questoesRespondidas: Array.isArray(current.questoesRespondidas)
            ? current.questoesRespondidas.map(String).filter((id: string) => !idsSet.has(id))
            : [],
          respostasQuestoes,
        })
      );

      window.dispatchEvent(new StorageEvent('storage', { key: 'user-game-data' }));
    } catch {
      // ignora falha de localStorage
    }

    setActiveMateria(materia);
    setActiveTema(null);
    setAba('naoRespondidas');
    scrollToResumo();
  }

  function resetarTodas() {
    setShowResetConfirm(true);
  }

  function confirmarResetarTodas() {
    setRespostas({});
    setRespondidasSalvasAoCarregar({});
    setReviewSuccessPending({});
    resetarAcertos?.();

    setActiveExame(TODOS_OS_EXAMES);
    setAba('naoRespondidas');
    setActiveTema(null);
    setShowResetConfirm(false);

    const primeiraMateria = Array.from(
      new Set((data || []).map((questao) => getMateriaNome(questao)))
    ).sort((a, b) => {
      const configA = getConfigMateria(a);
      const configB = getConfigMateria(b);

      if (configA.prioridade !== configB.prioridade) return configA.prioridade - configB.prioridade;
      return a.localeCompare(b);
    })[0];

    if (primeiraMateria) setActiveMateria(primeiraMateria);
    scrollToResumo();
  }

  if (loading || !data) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-3xl items-center justify-center p-4 text-slate-700 dark:text-slate-300">
        <p className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando questões...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <div className="rounded-lg border border-rose-500 bg-rose-50 p-4 font-semibold text-rose-900 dark:border-rose-300/40 dark:bg-rose-400/10 dark:text-rose-100">
          {error}
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="mx-auto max-w-5xl p-4">
        <div className="rounded-lg border border-slate-300 bg-white p-4 font-semibold text-slate-700 dark:border-white/15 dark:bg-slate-900 dark:text-slate-300">
          Nenhuma questão disponível.
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-2.5 py-3 sm:px-4 md:space-y-6 md:py-8">
      {isDemoGuest ? (
        <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm dark:border-emerald-300/25 dark:bg-slate-900 md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">
                Sumário da rodada demo
              </p>
              <h2 className="mt-1 text-2xl font-black leading-tight text-slate-950 dark:text-white">
                Veja como o Play organiza seu treino
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-300">
                Esta demo usa cópias estáticas de questões reais do banco. No OAPlay completo, o treino fica mais aprimorado: filtros por prova, matéria e tema, progresso salvo, revisão automática dos erros, sequência diária, conquistas e ranking.
              </p>

              <a
                href="/auth"
                className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200"
              >
                Criar conta grátis
                <ArrowRight className="h-4 w-4" strokeWidth={3} />
              </a>
            </div>

            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950 md:max-w-[17rem]">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                <span>Progresso demo</span>
                <span>{demoSummary.progresso}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all dark:bg-emerald-300"
                  style={{
                    width: `${demoSummary.progresso}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                {demoSummary.respondidas} de {demoSummary.total} questões respondidas nesta amostra.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Questões
              </p>
              <p className="mt-1 text-2xl font-black text-slate-950 dark:text-white">
                {demoSummary.total}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                questões reais
              </p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-300/25 dark:bg-emerald-300/10">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-200">
                Acertos
              </p>
              <p className="mt-1 text-2xl font-black text-emerald-900 dark:text-emerald-100">
                {demoSummary.acertos}
              </p>
              <p className="mt-1 text-xs font-semibold text-emerald-800 dark:text-emerald-100">
                {demoSummary.aproveitamento}% de aproveitamento
              </p>
            </div>

            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-300/25 dark:bg-rose-300/10">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-rose-700 dark:text-rose-200">
                Revisão
              </p>
              <p className="mt-1 text-2xl font-black text-rose-900 dark:text-rose-100">
                {demoSummary.erros}
              </p>
              <p className="mt-1 text-xs font-semibold text-rose-800 dark:text-rose-100">
                erros viram treino
              </p>
            </div>

            <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-300/25 dark:bg-cyan-300/10">
              <p className="text-[11px] font-black uppercase tracking-[0.12em] text-cyan-700 dark:text-cyan-200">
                Matérias
              </p>
              <p className="mt-1 text-2xl font-black text-cyan-900 dark:text-cyan-100">
                {demoSummary.materias.length}
              </p>
              <p className="mt-1 text-xs font-semibold text-cyan-800 dark:text-cyan-100">
                filtro simplificado
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Como funciona
              </p>
              <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white dark:bg-emerald-300 dark:text-emerald-950">
                    1
                  </span>
                  <span>Escolha uma matéria ou treine tudo misturado.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white dark:bg-emerald-300 dark:text-emerald-950">
                    2
                  </span>
                  <span>Responda e veja o gabarito comentado na hora.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-black text-white dark:bg-emerald-300 dark:text-emerald-950">
                    3
                  </span>
                  <span>Na conta completa, seus erros alimentam revisão, metas e evolução diária.</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-950">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                Filtro por matéria
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => selecionarMateria(TODAS_AS_MATERIAS)}
                  className={`rounded-full border px-3 py-2 text-xs font-black transition ${
                    activeMateria === TODAS_AS_MATERIAS
                      ? 'border-emerald-700 bg-emerald-600 text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950'
                      : 'border-slate-300 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-emerald-300/10'
                  }`}
                >
                  Todas · {demoSummary.total}
                </button>

                {demoSummary.materias.map((item) => (
                  <button
                    key={item.materia}
                    type="button"
                    onClick={() => selecionarMateria(item.materia)}
                    className={`rounded-full border px-3 py-2 text-xs font-black transition ${
                      activeMateria === item.materia
                        ? 'border-emerald-700 bg-emerald-600 text-white dark:border-emerald-300 dark:bg-emerald-300 dark:text-emerald-950'
                        : 'border-slate-300 bg-white text-slate-800 hover:border-emerald-300 hover:bg-emerald-50 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-emerald-300/10'
                    }`}
                  >
                    {item.materia} · {item.feitas}/{item.total}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-br from-slate-50 via-white to-amber-50 p-4 shadow-sm dark:border-amber-300/25 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/40 md:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-black uppercase text-amber-700 dark:text-amber-200">
                  Conquistas no OAPlay
                </p>
                <h3 className="mt-1 text-xl font-black leading-tight text-slate-950 dark:text-white md:text-2xl">
                  Badges para transformar estudo em missão
                </h3>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
                  Na demo, você vê uma prévia das conquistas. Na conta completa, os badges ficam salvos e acompanham sua rotina, seus acertos, suas revisões e sua sequência diária.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2 rounded-2xl border border-white bg-white/85 p-2 shadow-sm dark:border-white/10 dark:bg-slate-950/80">
                {demoAchievements.slice(0, 4).map((achievement) => (
                  <span
                    key={`preview-${achievement.title}`}
                    aria-hidden="true"
                    className={`flex h-11 w-11 items-center justify-center rounded-xl border text-2xl shadow-sm ${
                      achievement.unlocked
                        ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-300/35 dark:bg-emerald-300/10'
                        : 'border-slate-200 bg-slate-100 grayscale dark:border-white/10 dark:bg-slate-900'
                    }`}
                  >
                    {achievement.emoji}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {demoAchievements.map((achievement) => (
                <div
                  key={achievement.title}
                  className={`rounded-2xl border p-3 transition ${
                    achievement.unlocked
                      ? 'border-emerald-300 bg-white shadow-sm shadow-emerald-950/5 dark:border-emerald-300/35 dark:bg-emerald-300/10'
                      : 'border-slate-200 bg-white/70 opacity-80 dark:border-white/10 dark:bg-slate-950/70'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border text-3xl ${
                        achievement.unlocked
                          ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-300/35 dark:bg-emerald-300/10'
                          : 'border-slate-200 bg-slate-100 grayscale dark:border-white/10 dark:bg-slate-900'
                      }`}
                    >
                      <span aria-hidden="true">{achievement.emoji}</span>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-black ${
                        achievement.unlocked
                          ? 'border-emerald-300 bg-emerald-100 text-emerald-900 dark:border-emerald-300/35 dark:bg-emerald-300/15 dark:text-emerald-100'
                          : 'border-slate-300 bg-slate-100 text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300'
                      }`}
                    >
                      {achievement.unlocked ? 'Desbloqueada' : 'Bloqueada'}
                    </span>
                  </div>

                  <h4 className="mt-3 text-base font-black leading-snug text-slate-950 dark:text-white">
                    {achievement.title}
                  </h4>
                  <p className="mt-1 text-sm font-semibold leading-relaxed text-slate-700 dark:text-slate-300">
                    {achievement.description}
                  </p>
                  <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-200">
                    {achievement.requirement}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-300/25 dark:bg-emerald-300/10 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold leading-relaxed text-emerald-950 dark:text-emerald-100">
                As conquistas completas ficam guardadas na conta e ajudam o aluno a voltar para estudar no dia seguinte.
              </p>
              <a
                href="/auth"
                className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-black text-white transition hover:bg-emerald-700 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200"
              >
                Salvar conquistas
                <ArrowRight className="h-4 w-4" strokeWidth={3} />
              </a>
            </div>
          </div>
        </section>
      ) : (
        <Summary
          todasQuestoes={data}
          questoesDoExame={questoesDoExame}
          respostas={respostas}
          respondidasSalvas={respondidasConhecidas}
          aba={aba}
          activeMateria={activeMateria}
          activeExame={activeExame}
          activeTema={activeTema}
          exames={exames}
          onChangeAba={setAba}
          onSelectMateria={selecionarMateria}
          onSelectTema={selecionarTema}
          onSelectExame={selecionarExame}
          onResetMateria={resetarMateria}
          onResetTodas={resetarTodas}
          onShuffle={embaralharQuestoes}
        />
      )}

      {!isDemoGuest && !user?.isPremium && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 shadow-sm dark:border-amber-300/30 dark:bg-amber-300/10 dark:text-amber-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em]">
                Plano gratuito
              </p>

              <p className="mt-1 text-sm font-bold leading-relaxed">
                Você usou {freeDailyCount} de {FREE_DAILY_LIMIT} questões grátis hoje.
              </p>
            </div>

            <a
              href="/premium"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-amber-400 px-4 py-2 text-sm font-black text-slate-950 transition hover:bg-amber-300"
            >
              Liberar Premium
            </a>
          </div>
        </section>
      )}

      <section id="questoes-em-jogo" className="scroll-mt-24 rounded-2xl border border-slate-300 bg-white p-3 shadow-sm dark:border-white/15 dark:bg-slate-900 md:p-5">
        <div className="mb-4">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-800 dark:text-cyan-300">
            Questões em jogo
          </p>
          <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">
            {activeMateria === TODAS_AS_MATERIAS
              ? 'Todas as matérias'
              : activeTema
                ? `${activeMateria} · ${activeTema}`
                : activeMateria}
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            Exibindo {questoesVisiveis.length} questão(ões) {activeMateria === TODAS_AS_MATERIAS ? 'misturadas de todas as matérias' : activeTema ? `do tema ${activeTema}` : 'da matéria selecionada'}.
          </p>
        </div>

        {questoesVisiveis.length ? (
          <div className="space-y-6">
            {questoesVisiveis.map((questao, index) => (
              <QuestaoCard
                key={questao.id}
                questao={questao}
                index={index}
                total={questoesVisiveis.length}
                selected={respostas[getKey(questao)] ?? null}
                reviewSuccessPending={Boolean(reviewSuccessPending[getKey(questao)])}
                onResponder={responder}
                onConfirmarAcertoRevisao={confirmarAcertoRevisao}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-500 bg-emerald-50 p-4 text-sm font-black text-emerald-900 dark:border-emerald-300/35 dark:bg-emerald-300/10 dark:text-emerald-100">
            {aba === 'naoRespondidas'
              ? 'Tudo concluído nesta seleção. Use a aba Feitas para revisar o que já respondeu ou escolha outra matéria.'
              : 'Nenhuma questão nesta seleção. Troque a edição do exame, a matéria ou a aba.'}
          </div>
        )}
      </section>

      {isDemoGuest && showDemoSignupModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 px-4 backdrop-blur-xl">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-emerald-300/30 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl shadow-black ring-1 ring-white/10">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-300 via-cyan-300 to-amber-300" />

            <div className="relative p-6 text-center md:p-8">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-300/35 bg-emerald-300/15 text-emerald-200 shadow-lg shadow-black/30">
                <UserPlus className="h-8 w-8" strokeWidth={2.8} />
              </div>

              <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-emerald-200">
                OAPlay grátis
              </p>

              <h2 className="text-2xl font-black tracking-normal text-white md:text-3xl">
                Salve seu progresso grátis
              </h2>

              <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-relaxed text-slate-300 md:text-base">
                Crie sua conta para manter sua sequência, revisar seus erros e continuar evoluindo no OAPlay.
              </p>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href="/auth"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-emerald-950 shadow-lg shadow-emerald-400/15 transition hover:-translate-y-0.5 hover:bg-emerald-200"
                >
                  Criar conta grátis
                  <ArrowRight className="h-4 w-4" strokeWidth={3} />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setDemoSignupDismissed(true);
                    setShowDemoSignupModal(false);
                  }}
                  className="min-h-12 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
                >
                  Continuar testando
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showFreeLimitModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/90 px-4 backdrop-blur-xl">
          <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-amber-300/30 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 text-white shadow-2xl shadow-black ring-1 ring-white/10">
            <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-300 via-emerald-300 to-cyan-300" />
            <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-amber-300/10 blur-3xl" />
            <div className="pointer-events-none absolute bottom-[-6rem] -right-20 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />

            <div className="relative p-6 text-center md:p-8">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/35 bg-amber-300/15 text-amber-200 shadow-lg shadow-black/30">
                <AlertTriangle className="h-8 w-8" strokeWidth={2.8} />
              </div>

              <p className="mb-2 text-xs font-black uppercase tracking-[0.24em] text-amber-200">
                Plano gratuito
              </p>

              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl">
                Limite diário atingido
              </h2>

              <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-relaxed text-slate-300 md:text-base">
                Você respondeu suas {FREE_DAILY_LIMIT} questões gratuitas de hoje. Assine o Premium para continuar estudando sem limite.
              </p>

              <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left">
                <div className="rounded-xl bg-slate-950/60 p-3">
                  <p className="text-xl font-black text-amber-200">5</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    grátis por dia
                  </p>
                </div>

                <div className="rounded-xl border border-amber-200/30 bg-gradient-to-br from-amber-300/20 via-emerald-300/10 to-cyan-300/10 p-3 shadow-lg shadow-emerald-950/20 ring-1 ring-white/10">
                  <p className="text-3xl font-black leading-none text-amber-100 drop-shadow-[0_0_14px_rgba(253,224,71,0.35)]">
                    &infin;
                  </p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-amber-100/85">
                    no Premium
                  </p>
                </div>

                <div className="rounded-xl bg-slate-950/60 p-3">
                  <p className="text-xl font-black text-cyan-200">24h</p>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    renova amanhã
                  </p>
                </div>
              </div>

              <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowFreeLimitModal(false)}
                  className="min-h-12 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
                >
                  Continuar amanhã
                </button>

                <a
                  href="/premium"
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-amber-100/50 bg-gradient-to-r from-amber-200 via-emerald-300 to-cyan-300 px-4 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-400/20 transition hover:-translate-y-0.5 hover:from-amber-100 hover:via-emerald-200 hover:to-cyan-200 hover:shadow-emerald-300/30"
                >
                  Desbloquear Premium
                </a>
              </div>

              <p className="mt-5 text-xs font-medium leading-relaxed text-slate-500">
                Premium libera questões ilimitadas e remove essa trava diária.
              </p>
            </div>
          </div>
        </div>
      )}

      {showResetConfirm && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/85 px-4 backdrop-blur-lg">
          <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-rose-300/25 bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950/60 text-white shadow-2xl shadow-rose-950/50 ring-1 ring-white/10">
            <div className="relative p-5 md:p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500 via-orange-400 to-emerald-300" />

              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-300/35 bg-rose-500/15 text-rose-300 shadow-lg shadow-rose-950/30">
                <AlertTriangle className="h-8 w-8" strokeWidth={2.7} />
              </div>

              <h2 className="text-center text-xl font-black tracking-tight md:text-2xl">
                Resetar todas as {data.length} questões?
              </h2>

              <p className="mx-auto mt-3 max-w-sm text-center text-sm font-medium leading-relaxed text-slate-300">
                Isso vai limpar suas respostas, acertos e revisão local. O ranking permanente não será apagado.
              </p>

              <div className="mt-5 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-center text-sm font-black text-rose-200">
                Essa ação não pode ser desfeita.
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="min-h-12 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-black text-slate-100 transition hover:bg-white/10"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={confirmarResetarTodas}
                  className="min-h-12 rounded-2xl border border-rose-300/40 bg-gradient-to-r from-rose-600 to-rose-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-rose-950/30 transition hover:from-rose-500 hover:to-rose-400"
                >
                  Sim, resetar tudo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
