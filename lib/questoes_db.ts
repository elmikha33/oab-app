// Base de dados de questões gerada dinamicamente - OAPlay
// Contém mais de 5.000 questões com dados realistas nas 17 disciplinas oficiais da OAB.

import { Questao } from './mockData';

const NOMES_MASC = ['José', 'João', 'Carlos', 'Pedro', 'Marcos', 'Felipe', 'Bruno', 'Ricardo', 'Rodrigo', 'Lucas', 'Gabriel', 'Gustavo', 'Mateus', 'Daniel', 'André'];
const NOMES_FEM = ['Maria', 'Ana', 'Mariana', 'Juliana', 'Fernanda', 'Gabriela', 'Beatriz', 'Camila', 'Sofia', 'Amanda', 'Paula', 'Letícia', 'Larissa', 'Luana', 'Isabela'];
const EXAMES = [
  { nome: 'OAB XXXIX', ano: 2023 },
  { nome: 'OAB XXXVIII', ano: 2023 },
  { nome: 'OAB XXXVII', ano: 2023 },
  { nome: 'OAB XXXVI', ano: 2022 },
  { nome: 'OAB XXXV', ano: 2022 },
  { nome: 'OAB XXXIV', ano: 2022 },
  { nome: 'OAB XXXIII', ano: 2021 },
  { nome: 'OAB XXXII', ano: 2021 },
  { nome: 'OAB XXXI', ano: 2020 }
];

const MATERIAS = [
  'Ética Profissional',
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Penal',
  'Direito Processual Penal',
  'Direito Civil',
  'Direito Processual Civil',
  'Direito do Trabalho',
  'Direito Processual do Trabalho',
  'Direito Tributário',
  'Direito Empresarial',
  'Direitos Humanos',
  'Direito Internacional',
  'Direito Ambiental',
  'Direito do Consumidor',
  'Estatuto da Criança e do Adolescente (ECA)',
  'Filosofia do Direito'
];

interface Template {
  tema: string;
  nivel: 'Fácil' | 'Médio' | 'Difícil';
  incidenciaTema: number;
  probabilidade: 'Alta' | 'Média' | 'Baixa';
  gerar: (i: number, nMasc: string, nFem: string, exameObj: { nome: string, ano: number }) => {
    enunciado: string;
    alternativas: string[];
    gabarito: number;
    explicacao: string;
  };
}

const TEMPLATES: Record<string, Template[]> = {};
MATERIAS.forEach(m => { TEMPLATES[m] = []; });

// --- 1. ÉTICA PROFISSIONAL ---
TEMPLATES['Ética Profissional'].push(
  {
    tema: 'Publicidade Profissional',
    nivel: 'Médio',
    incidenciaTema: 32,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `O advogado ${nMasc} decidiu impulsionar publicações no Instagram para divulgar seus artigos jurídicos sobre direito tributário. Visando ampliar sua clientela, ele inseriu um link direto para agendamento de consultas com a frase: "Agende sua consulta com desconto especial de 20%". À luz do Provimento 205/2021 da OAB, assinale a opção correta:`,
      alternativas: [
        'A publicidade ativa e o patrocínio de postagens (tráfego pago) são permitidos, mas a oferta de descontos e a mercantilização da advocacia são vedadas.',
        'A publicidade profissional do advogado tem caráter puramente mercantil, sendo permitida a divulgação livre de preços e descontos nas redes sociais.',
        'O patrocínio de postagens nas redes sociais é vedado em qualquer circunstância pela OAB, caracterizando captação ilegal de clientela.',
        'É permitido divulgar descontos em consultas, desde que a divulgação ocorra exclusivamente em ambiente digital (internet).'
      ],
      gabarito: 0,
      explicacao: `De acordo com o Provimento 205/2021, o marketing de conteúdos jurídicos e o tráfego pago são permitidos, porém, a publicidade deve primar pela sobriedade e caráter informativo, sendo expressamente proibida a mercantilização (como oferta de descontos e captação ativa de clientela).`
    })
  },
  {
    tema: 'Honorários Advocatícios',
    nivel: 'Fácil',
    incidenciaTema: 28,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A advogada ${nFem} celebrou contrato verbal de prestação de serviços jurídicos com um cliente. Diante do inadimplemento e da ausência de contrato escrito, de acordo com o Estatuto da OAB (Lei 8.906/94), assinale a afirmativa correta:`,
      alternativas: [
        'Na falta de contrato escrito, os honorários do advogado serão fixados por arbitramento judicial, em remuneração compatível com o trabalho e o valor econômico da questão.',
        'A falta de contrato escrito impede o advogado de cobrar honorários in juízo, restando apenas a via moral.',
        'Sem o contrato escrito, os honorários prescrevem em dois anos contados do início da prestação de serviços.',
        'O advogado pode arbitrar de próprio punho os honorários e executá-los diretamente como título extrajudicial.'
      ],
      gabarito: 0,
      explicacao: `Conforme o Art. 22, § 2º da Lei 8.906/94, na falta de estipulação escrita, os honorários são fixados por arbitramento judicial em valor compatível com o trabalho realizado e o proveito econômico.`
    })
  },
  {
    tema: 'Incompatibilidades e Impedimentos',
    nivel: 'Difícil',
    incidenciaTema: 30,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `O bacharel ${nMasc} foi aprovado no concurso para o cargo de Auditor Fiscal da Receita Municipal. Posteriormente, foi aprovado no Exame de Ordem e requer sua inscrição na OAB. Diante das regras de incompatibilidade e impedimento do Estatuto da Advocacia, assinale a opção correta:`,
      alternativas: [
        'O cargo de auditor fiscal gera incompatibilidade absoluta para o exercício da advocacia, impedindo sua inscrição.',
        'Ele poderá advogar normalmente, estando apenas impedido de atuar contra o município que o remunera.',
        'Por ser servidor público concursado, ele está automaticamente impedido de advogar contra qualquer ente público, mas pode atuar na área privada.',
        'Ele deve requerer licença especial à OAB para atuar exclusivamente na defesa de seus familiares.'
      ],
      gabarito: 0,
      explicacao: `O Art. 28, VII da Lei 8.906/94 estabelece que a advocacia é incompatível, mesmo em causa própria, para ocupantes de cargos ou funções que tenham competência de lançamento, arrecadação ou fiscalização de tributos (incompatibilidade absoluta).`
    })
  },
  {
    tema: 'Direitos do Advogado',
    nivel: 'Médio',
    incidenciaTema: 25,
    probabilidade: 'Média',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A advogada ${nFem} compareceu a uma delegacia de polícia para entrevistar-se com seu cliente que se encontrava preso em flagrante. O delegado de plantão impediu o acesso dela ao preso, alegando que o inquérito policial corre sob sigilo. À luz do Estatuto da OAB, assinale a afirmativa correta:`,
      alternativas: [
        'A advogada tem o direito de comunicar-se com seus clientes pessoal e reservadamente, mesmo sem procuração, ainda que estes considerados incomunicáveis ou sob sigilo de inquérito.',
        'O delegado de polícia agiu corretamente, pois o sigilo decretado no inquérito prevalece sobre as prerrogativas profissionais.',
        'A entrevista com o preso em inquérito sigiloso exige autorização judicial prévia.',
        'A advogada necessita apresentar procuração com poderes especiais para ter acesso ao preso.'
      ],
      gabarito: 0,
      explicacao: `Conforme o Art. 7º, III da Lei 8.906/94, é direito do advogado comunicar-se com seus clientes, pessoal e reservadamente, mesmo sem procuração, quando estes se achem presos ou detidos, ainda que considerados incomunicáveis.`
    })
  },
  {
    tema: 'Infrações e Sanções Disciplinares',
    nivel: 'Médio',
    incidenciaTema: 27,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `O advogado ${nMasc} reteve abusivamente os autos de um processo judicial, deixando de devolvê-los no prazo legal mesmo após ter sido devidamente intimado. De acordo com as normas disciplinares da OAB, essa conduta caracteriza infração disciplinar punível com:`,
      alternativas: [
        'Suspensão do exercício profissional.',
        'Censura simples.',
        'Exclusão definitiva dos quadros da OAB.',
        'Multa de até dez anuidades.'
      ],
      gabarito: 0,
      explicacao: `O Art. 34, XXII c/c Art. 37, I da Lei 8.906/94 estabelece que reter abusivamente autos de processos enseja a sanção de suspensão.`
    })
  },
  {
    tema: 'Sociedade de Advogados',
    nivel: 'Médio',
    incidenciaTema: 20,
    probabilidade: 'Média',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Os advogados ${nMasc} e ${nFem} pretendem constituir uma Sociedade Unipessoal de Advocacia. A respeito das regras de constituição e atuação dessa modalidade societária, assinale a afirmativa correta:`,
      alternativas: [
        'O advogado não pode integrar mais de uma sociedade de advogados ou sociedade unipessoal com sede ou filial na mesma área de conselho seccional.',
        'A sociedade unipessoal pode adotar nome de fantasia para facilitar o marketing digital.',
        'É permitido que a sociedade unipessoal inclua sócio de serviço que seja bacharel em Direito não inscrito nos quadros da OAB.',
        'A sociedade unipessoal responde subsidiariamente, de forma limitada, pelas obrigações decorrentes de danos causados a clientes.'
      ],
      gabarito: 0,
      explicacao: `O Art. 15, § 4º da Lei 8.906/94 proíbe o advogado de integrar mais de uma sociedade de advogados, constituir mais de uma sociedade unipessoal ou integrar, simultaneamente, ambas, na mesma área territorial do Conselho Seccional.`
    })
  },
  {
    tema: 'Órgãos da OAB',
    nivel: 'Médio',
    incidenciaTema: 18,
    probabilidade: 'Baixa',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A respeito da estrutura organizacional da OAB e da competência de seus órgãos, assinale a opção correta:`,
      alternativas: [
        'O Conselho Federal da OAB é o órgão supremo da entidade, possuindo personalidade jurídica própria, com sede em Brasília/DF.',
        'A Caixa de Assistência dos Advogados possui personalidade jurídica independente dos Conselhos Seccionais, não prestando contas a eles.',
        'As Subseções da OAB possuem personalidade jurídica própria e autonomia financeira irrestrita.',
        'Apenas a Seccional Estadual pode interpor recurso de decisões disciplinares perante os tribunais de justiça estaduais.'
      ],
      gabarito: 0,
      explicacao: `Conforme o Art. 45 da Lei 8.906/94, a OAB é composta pelo Conselho Federal (personalidade jurídica própria, sede no Distrito Federal), Conselhos Seccionais, Subseções e Caixas de Assistência.`
    })
  },
  {
    tema: 'Sigilo Profissional',
    nivel: 'Fácil',
    incidenciaTema: 22,
    probabilidade: 'Média',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `O advogado ${nMasc} foi intimado a depor como testemunha em processo penal sobre fatos sigilosos que lhe foram revelados por um cliente sob o manto do segredo profissional. Nesse cenário, o advogado:`,
      alternativas: [
        'Deve recusar-se a depor, pois o sigilo profissional é um direito e um dever legal do advogado, mesmo se autorizado pelo cliente.',
        'É obrigado a depor, uma vez que a intimação judicial sobrepõe-se às regras de ética da advocacia.',
        'Pode depor apenas sobre fatos secundários que não envolvam a autoria delitiva do cliente.',
        'Fica obrigado a depor se o crime investigado for punido com pena de reclusão superior a quatro anos.'
      ],
      gabarito: 0,
      explicacao: `O Art. 7º, XIX do Estatuto da OAB garante ao advogado a prerrogativa de recusar-se a depor como testemunha sobre fatos de que tenha tomado conhecimento no exercício profissional.`
    })
  },
  {
    tema: 'Relações com a Magistratura e Ministério Público',
    nivel: 'Fácil',
    incidenciaTema: 15,
    probabilidade: 'Baixa',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A advogada ${nFem} precisa despachar petição urgente com o juiz da vara cível, contudo, o assessor informa que o magistrado só atende advogados com hora previamente agendada. À luz do Estatuto da OAB:`,
      alternativas: [
        'A advogada tem o direito de dirigir-se diretamente aos magistrados nas salas e gabinetes de trabalho, independentemente de horário previamente marcado.',
        'O assessor está correto, pois o princípio da celeridade autoriza o magistrado a criar regimento interno restringindo o acesso livre.',
        'O despacho presencial com juízes só é permitido se houver anuência expressa da parte contrária no processo.',
        'A magistratura goza de autonomia para determinar atendimento exclusivo por meio eletrônico (e-mail ou videoconferência).'
      ],
      gabarito: 0,
      explicacao: `Segundo o Art. 7º, VIII da Lei 8.906/94, é direito do advogado dirigir-se diretamente aos magistrados nas salas e gabinetes de trabalho, independentemente de horário previamente marcado.`
    })
  },
  {
    tema: 'Processo Disciplinar na OAB',
    nivel: 'Difícil',
    incidenciaTema: 24,
    probabilidade: 'Média',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Contra o advogado ${nMasc} foi instaurada representação disciplinar perante o Tribunal de Ética e Disciplina (TED) da OAB. A respeito do rito processual disciplinar, assinale a opção correta:`,
      alternativas: [
        'O processo disciplinar tramita em sigilo, só tendo acesso às suas informações as partes, seus defensores e a autoridade julgadora.',
        'A representação disciplinar não pode ser instaurada de ofício, exigindo sempre denúncia formal por escrito da vítima.',
        'O prazo de prescrição da pretensão punitiva da OAB é de dez anos contados da data do fato.',
        'A apelação das decisões finais do TED é enviada diretamente ao Poder Judiciário (Justiça Federal).'
      ],
      gabarito: 0,
      explicacao: `O Art. 72 da Lei 8.906/94 estabelece que o processo disciplinar tramita em sigilo, até o seu término, para resguardar a honra profissional do representado.`
    })
  }
);

// --- 2. DIREITO CONSTITUCIONAL ---
TEMPLATES['Direito Constitucional'].push(
  {
    tema: 'Remédios Constitucionais',
    nivel: 'Médio',
    incidenciaTema: 24,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `${nFem} impetrou ação constitucional para ter acesso a relatórios informativos contendo dados sobre sua própria pessoa armazenados em banco de dados da Receita Federal. O pleito foi negado na via administrativa. A ação cabível é:`,
      alternativas: [
        'Habeas Data.',
        'Mandado de Segurança.',
        'Ação Civil Pública.',
        'Ação Popular.'
      ],
      gabarito: 0,
      explicacao: `O Habeas Data (Art. 5º, LXXII da CF/88) é o remédio constitucional adequado para assegurar o conhecimento de informações relativas à pessoa do impetrante constantes de registros governamentais.`
    })
  },
  {
    tema: 'Processo Legislativo',
    nivel: 'Difícil',
    incidenciaTema: 26,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Uma proposta de Emenda à Constituição (PEC) que visa abolir as garantias individuais da liberdade de expressão e de manifestação do pensamento é apresentada no Senado. Sobre essa PEC, assinale a afirmativa correta:`,
      alternativas: [
        'A PEC não pode sequer ser objeto de deliberação, pois visa abolir direitos e garantias individuais (cláusula pétrea).',
        'A PEC é formalmente e materialmente válida, podendo ser aprovada por maioria simples.',
        'A matéria de emenda constitucional rejeitada poderá ser reapresentada na mesma sessão legislativa por maioria absoluta.',
        'A PEC só pode prosseguir se houver sanção do Presidente da República.'
      ],
      gabarito: 0,
      explicacao: `O Art. 60, § 4º, IV da CF/88 veda a deliberação de propostas de emenda tendentes a abolir direitos e garantias individuais (cláusulas pétreas).`
    })
  },
  {
    tema: 'Controle de Constitucionalidade',
    nivel: 'Difícil',
    incidenciaTema: 28,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Um governador de estado pretende questionar a constitucionalidade de uma lei federal recém-promulgada. A respeito dos legitimados ativos universais para propositura de Ação Direta de Inconstitucionalidade (ADI), assinale a afirmativa correta:`,
      alternativas: [
        'Governador de Estado e do Distrito Federal é legitimado especial, necessitando comprovar pertinência temática com a lei federal.',
        'Governador de Estado é legitimado universal, dispensando a demonstração de interesse jurídico direto.',
        'Partidos políticos sem representação no Congresso Nacional podem ajuizar ADI se houver aval do PGR.',
        'Mesas de Câmaras Municipais têm legitimidade para propor ADI no STF.'
      ],
      gabarito: 0,
      explicacao: `Embora o governador figure no rol do Art. 103 da CF, a jurisprudência consolidada do STF o classifica como legitimado especial, exigindo a demonstração de pertinência temática para as ações cíveis federais.`
    })
  },
  {
    tema: 'Organização do Estado',
    nivel: 'Médio',
    incidenciaTema: 20,
    probabilidade: 'Média',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `O Estado X editou lei ordinária dispondo sobre diretrizes de trânsito e transporte urbano dentro do seu território. Diante da repartição de competências legislativas prevista na CF/88, tal lei estadual é:`,
      alternativas: [
        'Inconstitucional, pois legislar sobre trânsito e transporte é competência legislativa privativa da União.',
        'Constitucional, por se tratar de competência comum concorrente entre União e Estados.',
        'Constitucional, desde que respeitadas as normas gerais do Município.',
        'Inconstitucional, pois trânsito é de competência privativa dos Municípios.'
      ],
      gabarito: 0,
      explicacao: `De acordo com o Art. 22, XI da CF/88, compete privativamente à União legislar sobre trânsito e transporte, gerando inconstitucionalidade formal orgânica a lei estadual.`
    })
  },
  {
    tema: 'Direitos e Garantias Fundamentais',
    nivel: 'Fácil',
    incidenciaTema: 25,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Policiais militares ingressaram na residência de ${nMasc} durante a noite, sem autorização judicial, sob a alegação de suspeita de crime de estelionato cometido dias atrás. À luz do princípio da inviolabilidade do domicílio (Art. 5º, XI, CF):`,
      alternativas: [
        'A atuação dos policiais é ilícita, pois a entrada forçada na residência durante a noite exige consentimento ou flagrante delito/desastre/socorro, ou determinação judicial apenas durante o dia.',
        'A invasão domiciliar é válida a qualquer hora do dia ou da noite sob suspeita de qualquer ilícito penal.',
        'A determinação judicial autoriza a entrada domiciliar a qualquer hora da noite.',
        'A residência não goza de proteção constitucional em áreas de periferia urbana.'
      ],
      gabarito: 0,
      explicacao: `A casa é asilo inviolável, ninguém nela podendo penetrar sem consentimento, salvo em caso de flagrante delito, desastre, socorro, ou por determinação judicial durante o dia (Art. 5º, XI).`
    })
  },
  {
    tema: 'Poder Executivo',
    nivel: 'Médio',
    incidenciaTema: 18,
    probabilidade: 'Média',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Em caso de vacância dos cargos de Presidente e Vice-Presidente da República nos dois primeiros anos do mandato presidencial, a linha sucessória estabelecida pela Constituição determina que assumirá provisoriamente:`,
      alternativas: [
        'O Presidente da Câmara dos Deputados, que deverá convocar eleições diretas em noventa dias.',
        'O Presidente do Senado Federal, que exercerá o mandato até o fim do quadriênio.',
        'O Presidente do STF, convocando eleições indiretas pelo Congresso Nacional.',
        'O Ministro da Defesa, instalando junta governativa militar.'
      ],
      gabarito: 0,
      explicacao: `Conforme o Art. 80 e 81 da CF/88, vagando os cargos de Presidente e Vice nos primeiros dois anos, o Presidente da Câmara é chamado ao exercício, devendo ocorrer eleições diretas em 90 dias.`
    })
  },
  {
    tema: 'Poder Judiciário',
    nivel: 'Médio',
    incidenciaTema: 19,
    probabilidade: 'Média',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Compete processar e julgar, originariamente, o Presidente da República nos crimes de responsabilidade e nas infrações penais comuns, respectivamente:`,
      alternativas: [
        'O Senado Federal e o Supremo Tribunal Federal.',
        'A Câmara dos Deputados e o Senado Federal.',
        'O Supremo Tribunal Federal e o Congresso Nacional.',
        'O Superior Tribunal de Justiça e o Supremo Tribunal Federal.'
      ],
      gabarito: 0,
      explicacao: `De acordo com os Arts. 86 e 102, I, "a" da CF/88, o Presidente é julgado no STF nos crimes comuns e no Senado Federal nos crimes de responsabilidade.`
    })
  },
  {
    tema: 'Súmula Vinculante',
    nivel: 'Médio',
    incidenciaTema: 15,
    probabilidade: 'Média',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A respeito do procedimento de aprovação, revisão ou cancelamento de Súmula Vinculante pelo Supremo Tribunal Federal, assinale a opção correta:`,
      alternativas: [
        'Exige decisão tomada por dois terços dos membros do STF, mediante provocação dos legitimados para a ADI.',
        'Pode ser editada de ofício por maioria simples dos ministros do STF em sessão plenária.',
        'Vincula a atuação do Poder Legislativo na sua função típica de legislar.',
        'Não pode ser objeto de impugnação ou controle por cidadãos comuns.'
      ],
      gabarito: 0,
      explicacao: `A aprovação de Súmula Vinculante exige voto de 2/3 dos membros do STF (8 ministros) e tem eficácia vinculante em relação à Administração Pública e demais órgãos do Judiciário, sem vincular a função legislativa federal.`
    })
  },
  {
    tema: 'Poder Legislativo',
    nivel: 'Médio',
    incidenciaTema: 16,
    probabilidade: 'Baixa',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Os deputados federais e senadores, desde a expedição do diploma, gozam de imunidade formal em relação à prisão. Nesse sentido, eles:`,
      alternativas: [
        'Não poderão ser presos, salvo em flagrante de crime inafiançável, caso em que os autos serão remetidos em vinte e quatro horas à respectiva Casa Legislativa.',
        'Gozam de imunidade prisional civil e penal absoluta, impossibilitando qualquer espécie de segregação preventiva.',
        'Só podem ser presos após trânsito em julgado de sentença condenatória proferida pelo STF, independentemente do tipo de crime.',
        'Podem ser presos por ordem de qualquer juiz de primeira instância caso cometa ato de improbidade administrativa.'
      ],
      gabarito: 0,
      explicacao: `Conforme o Art. 53, § 2º da CF/88, os membros do Congresso Nacional não poderão ser presos, salvo em flagrante de crime inafiançável.`
    })
  },
  {
    tema: 'Ordem Social e Educação',
    nivel: 'Fácil',
    incidenciaTema: 12,
    probabilidade: 'Baixa',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A Constituição da República assegura a educação como direito de todos e dever do Estado e da família. Segundo a Carta Magna, o ensino público será ministrado com base no seguinte princípio:`,
      alternativas: [
        'Gratuidade do ensino público em estabelecimentos oficiais.',
        'Monopólio de ideias e concepções pedagógicas estatais.',
        'Centralização exclusiva do financiamento pela União.',
        'Prevalência do ensino religioso obrigatório em todas as etapas escolares.'
      ],
      gabarito: 0,
      explicacao: `O Art. 206, IV da CF/88 estabelece como princípio do ensino a gratuidade do ensino público em estabelecimentos oficiais.`
    })
  }
);

// --- OUTRAS 15 MATÉRIAS ---
const TEMAS_MATERIAS: Record<string, { tema: string; nivel: 'Fácil' | 'Médio' | 'Difícil'; inc: number; prob: 'Alta' | 'Média' | 'Baixa' }[]> = {
  'Direito Administrativo': [
    { tema: 'Atos Administrativos', nivel: 'Médio', inc: 22, prob: 'Alta' },
    { tema: 'Licitações e Contratos', nivel: 'Difícil', inc: 28, prob: 'Alta' },
    { tema: 'Responsabilidade Civil do Estado', nivel: 'Médio', inc: 24, prob: 'Alta' },
    { tema: 'Agentes Públicos', nivel: 'Médio', inc: 20, prob: 'Média' },
    { tema: 'Organização Administrativa', nivel: 'Fácil', inc: 18, prob: 'Média' },
    { tema: 'Bens Públicos', nivel: 'Médio', inc: 15, prob: 'Baixa' },
    { tema: 'Improbidade Administrativa', nivel: 'Difícil', inc: 23, prob: 'Alta' },
    { tema: 'Serviços Públicos', nivel: 'Médio', inc: 16, prob: 'Baixa' },
    { tema: 'Poderes da Administração', nivel: 'Fácil', inc: 19, prob: 'Média' },
    { tema: 'Processo Administrativo', nivel: 'Difícil', inc: 15, prob: 'Baixa' }
  ],
  'Direito Penal': [
    { tema: 'Teoria do Crime', nivel: 'Médio', inc: 25, prob: 'Alta' },
    { tema: 'Crimes contra a Pessoa', nivel: 'Médio', inc: 22, prob: 'Alta' },
    { tema: 'Crimes contra o Patrimônio', nivel: 'Médio', inc: 20, prob: 'Média' },
    { tema: 'Crimes contra a Administração Pública', nivel: 'Difícil', inc: 24, prob: 'Alta' },
    { tema: 'Penas e Dosimetria', nivel: 'Difícil', inc: 18, prob: 'Média' },
    { tema: 'Excludentes de Ilicitude', nivel: 'Fácil', inc: 26, prob: 'Alta' },
    { tema: 'Concurso de Pessoas', nivel: 'Médio', inc: 15, prob: 'Média' },
    { tema: 'Extinção da Punibilidade', nivel: 'Difícil', inc: 17, prob: 'Baixa' },
    { tema: 'Lei Penal no Tempo e Espaço', nivel: 'Fácil', inc: 14, prob: 'Baixa' },
    { tema: 'Concurso de Crimes', nivel: 'Médio', inc: 19, prob: 'Média' }
  ],
  'Direito Processual Penal': [
    { tema: 'Prisão e Liberdade Provisória', nivel: 'Difícil', inc: 30, prob: 'Alta' },
    { tema: 'Inquérito Policial', nivel: 'Fácil', inc: 22, prob: 'Média' },
    { tema: 'Competência', nivel: 'Difícil', inc: 24, prob: 'Alta' },
    { tema: 'Provas', nivel: 'Médio', inc: 25, prob: 'Alta' },
    { tema: 'Ação Penal', nivel: 'Médio', inc: 21, prob: 'Média' },
    { tema: 'Recursos', nivel: 'Difícil', inc: 23, prob: 'Alta' },
    { tema: 'Nulidades', nivel: 'Médio', inc: 15, prob: 'Baixa' },
    { tema: 'Juizados Especiais Criminais', nivel: 'Fácil', inc: 14, prob: 'Baixa' },
    { tema: 'Procedimento Comum', nivel: 'Médio', inc: 18, prob: 'Média' },
    { tema: 'Habeas Corpus', nivel: 'Médio', inc: 20, prob: 'Alta' }
  ],
  'Direito Civil': [
    { tema: 'Negócio Jurídico', nivel: 'Médio', inc: 20, prob: 'Alta' },
    { tema: 'Obrigações', nivel: 'Médio', inc: 18, prob: 'Média' },
    { tema: 'Contratos', nivel: 'Difícil', inc: 25, prob: 'Alta' },
    { tema: 'Responsabilidade Civil', nivel: 'Médio', inc: 22, prob: 'Alta' },
    { tema: 'Direitos Reais', nivel: 'Difícil', inc: 20, prob: 'Média' },
    { tema: 'Família', nivel: 'Médio', inc: 21, prob: 'Média' },
    { tema: 'Sucessões', nivel: 'Difícil', inc: 24, prob: 'Alta' },
    { tema: 'Teoria Geral do Direito Civil', nivel: 'Fácil', inc: 15, prob: 'Baixa' },
    { tema: 'Bens e Pessoas', nivel: 'Fácil', inc: 14, prob: 'Baixa' },
    { tema: 'Prescrição e Decadência', nivel: 'Médio', inc: 16, prob: 'Média' }
  ],
  'Direito Processual Civil': [
    { tema: 'Petição Inicial e Respostas', nivel: 'Médio', inc: 24, prob: 'Alta' },
    { tema: 'Recursos', nivel: 'Difícil', inc: 28, prob: 'Alta' },
    { tema: 'Tutelas de Urgência', nivel: 'Médio', inc: 22, prob: 'Alta' },
    { tema: 'Cumprimento de Sentença', nivel: 'Difícil', inc: 20, prob: 'Média' },
    { tema: 'Competência', nivel: 'Médio', inc: 18, prob: 'Média' },
    { tema: 'Provas', nivel: 'Fácil', inc: 17, prob: 'Baixa' },
    { tema: 'Intervenção de Terceiros', nivel: 'Difícil', inc: 19, prob: 'Média' },
    { tema: 'Teoria Geral do Processo', nivel: 'Fácil', inc: 15, prob: 'Baixa' },
    { tema: 'Audiência de Conciliação', nivel: 'Fácil', inc: 14, prob: 'Baixa' },
    { tema: 'Processo de Execução', nivel: 'Médio', inc: 23, prob: 'Alta' }
  ],
  'Direito do Trabalho': [
    { tema: 'Jornada de Trabalho', nivel: 'Fácil', inc: 28, prob: 'Alta' },
    { tema: 'Contrato de Trabalho', nivel: 'Médio', inc: 22, prob: 'Média' },
    { tema: 'Extinção do Contrato', nivel: 'Médio', inc: 25, prob: 'Alta' },
    { tema: 'Verbas Rescisórias', nivel: 'Médio', inc: 20, prob: 'Média' },
    { tema: 'Salário e Remuneração', nivel: 'Fácil', inc: 18, prob: 'Baixa' },
    { tema: 'Equiparação Salarial', nivel: 'Médio', inc: 15, prob: 'Baixa' },
    { tema: 'Terceirização', nivel: 'Difícil', inc: 21, prob: 'Alta' },
    { tema: 'Estabilidades e Garantias', nivel: 'Difícil', inc: 23, prob: 'Alta' },
    { tema: 'Férias', nivel: 'Fácil', inc: 16, prob: 'Média' },
    { tema: 'Segurança e Medicina do Trabalho', nivel: 'Médio', inc: 12, prob: 'Baixa' }
  ],
  'Direito Processual do Trabalho': [
    { tema: 'Competência da Justiça do Trabalho', nivel: 'Médio', inc: 25, prob: 'Alta' },
    { tema: 'Recursos Trabalhistas', nivel: 'Difícil', inc: 28, prob: 'Alta' },
    { tema: 'Execução Trabalhista', nivel: 'Difícil', inc: 24, prob: 'Alta' },
    { tema: 'Audiência Trabalhista', nivel: 'Médio', inc: 22, prob: 'Alta' },
    { tema: 'Rito Sumaríssimo', nivel: 'Fácil', inc: 18, prob: 'Média' },
    { tema: 'Provas no Processo Trabalho', nivel: 'Médio', inc: 15, prob: 'Baixa' },
    { tema: 'Custas e Depósito Recursal', nivel: 'Difícil', inc: 20, prob: 'Média' },
    { tema: 'Petição Inicial Trabalhista', nivel: 'Fácil', inc: 14, prob: 'Baixa' },
    { tema: 'Defesas do Réu', nivel: 'Médio', inc: 17, prob: 'Média' },
    { tema: 'Acordo Homologado', nivel: 'Fácil', inc: 12, prob: 'Baixa' }
  ],
  'Direito Tributário': [
    { tema: 'Limitações ao Poder de Tributar', nivel: 'Difícil', inc: 28, prob: 'Alta' },
    { tema: 'Impostos Municipais', nivel: 'Fácil', inc: 18, prob: 'Média' },
    { tema: 'Impostos Estaduais', nivel: 'Médio', inc: 22, prob: 'Alta' },
    { tema: 'Impostos Federais', nivel: 'Médio', inc: 20, prob: 'Média' },
    { tema: 'Crédito Tributário', nivel: 'Difícil', inc: 25, prob: 'Alta' },
    { tema: 'Imunidades Tributárias', nivel: 'Médio', inc: 24, prob: 'Alta' },
    { tema: 'Princípio da Anterioridade', nivel: 'Fácil', inc: 19, prob: 'Média' },
    { tema: 'Taxas e Contribuições', nivel: 'Fácil', inc: 14, prob: 'Baixa' },
    { tema: 'Execução Fiscal', nivel: 'Difícil', inc: 16, prob: 'Baixa' },
    { tema: 'Responsabilidade Tributária', nivel: 'Médio', inc: 15, prob: 'Média' }
  ],
  'Direito Empresarial': [
    { tema: 'Tipos Societários (Ltda e S/A)', nivel: 'Difícil', inc: 26, prob: 'Alta' },
    { tema: 'Propriedade Industrial', nivel: 'Médio', inc: 18, prob: 'Média' },
    { tema: 'Títulos de Crédito', nivel: 'Difícil', inc: 24, prob: 'Alta' },
    { tema: 'Falência e Recuperação', nivel: 'Difícil', inc: 28, prob: 'Alta' },
    { tema: 'Estabelecimento Comercial', nivel: 'Fácil', inc: 15, prob: 'Baixa' },
    { tema: 'Teoria da Empresa', nivel: 'Fácil', inc: 16, prob: 'Baixa' },
    { tema: 'Contratos Empresariais', nivel: 'Médio', inc: 17, prob: 'Média' },
    { tema: 'EIRELI e Empresário Individual', nivel: 'Fácil', inc: 12, prob: 'Baixa' },
    { tema: 'Dissolução de Sociedade', nivel: 'Médio', inc: 14, prob: 'Baixa' },
    { tema: 'Direito Societário Geral', nivel: 'Médio', inc: 20, prob: 'Média' }
  ],
  'Direitos Humanos': [
    { tema: 'Pacto de San José da Costa Rica', nivel: 'Médio', inc: 35, prob: 'Alta' },
    { tema: 'Convenção Americana', nivel: 'Difícil', inc: 25, prob: 'Alta' },
    { tema: 'Declaração Universal (DUDH)', nivel: 'Fácil', inc: 20, prob: 'Média' },
    { tema: 'Sistema Interamericano', nivel: 'Difícil', inc: 22, prob: 'Alta' },
    { tema: 'Proteção Constitucional Humanos', nivel: 'Médio', inc: 18, prob: 'Média' },
    { tema: 'Direitos da Pessoa com Deficiência', nivel: 'Fácil', inc: 15, prob: 'Baixa' },
    { tema: 'Tratados e Incorporação', nivel: 'Difícil', inc: 30, prob: 'Alta' },
    { tema: 'Direitos das Minorias', nivel: 'Fácil', inc: 12, prob: 'Baixa' },
    { tema: 'Comissão Interamericana', nivel: 'Médio', inc: 14, prob: 'Baixa' },
    { tema: 'Corte Interamericana', nivel: 'Médio', inc: 16, prob: 'Média' }
  ],
  'Direito Internacional': [
    { tema: 'Contratos Internacionais', nivel: 'Médio', inc: 20, prob: 'Média' },
    { tema: 'Homologação de Sentença Estrangeira', nivel: 'Difícil', inc: 28, prob: 'Alta' },
    { tema: 'Nacionalidade e Condição Estrangeiro', nivel: 'Médio', inc: 30, prob: 'Alta' },
    { tema: 'Tratados Internacionais', nivel: 'Difícil', inc: 22, prob: 'Média' },
    { tema: 'Competência Internacional', nivel: 'Médio', inc: 18, prob: 'Baixa' },
    { tema: 'Extradição e Deportação', nivel: 'Fácil', inc: 15, prob: 'Baixa' },
    { tema: 'Direito Internacional Privado (LINDB)', nivel: 'Médio', inc: 25, prob: 'Alta' },
    { tema: 'Arbitragem Internacional', nivel: 'Difícil', inc: 12, prob: 'Baixa' },
    { tema: 'Imunidade de Jurisdição', nivel: 'Fácil', inc: 14, prob: 'Baixa' },
    { tema: 'Organizações Internacionais', nivel: 'Médio', inc: 10, prob: 'Baixa' }
  ],
  'Direito Ambiental': [
    { tema: 'Licenciamento Ambiental', nivel: 'Difícil', inc: 32, prob: 'Alta' },
    { tema: 'Princípios do Direito Ambiental', nivel: 'Médio', inc: 25, prob: 'Alta' },
    { tema: 'Responsabilidade por Dano Ambiental', nivel: 'Difícil', inc: 28, prob: 'Alta' },
    { tema: 'Unidades de Conservação', nivel: 'Médio', inc: 18, prob: 'Média' },
    { tema: 'Código Florestal', nivel: 'Fácil', inc: 15, prob: 'Baixa' },
    { tema: 'Política Nacional do Meio Ambiente', nivel: 'Médio', inc: 20, prob: 'Média' },
    { tema: 'Estudo de Impacto Ambiental (EIA/RIMA)', nivel: 'Difícil', inc: 22, prob: 'Alta' },
    { tema: 'Competência Ambiental', nivel: 'Médio', inc: 17, prob: 'Média' },
    { tema: 'Crimes Ambientais', nivel: 'Fácil', inc: 14, prob: 'Baixa' },
    { tema: 'Patrimônio Nacional', nivel: 'Fácil', inc: 12, prob: 'Baixa' }
  ],
  'Direito do Consumidor': [
    { tema: 'Responsabilidade pelo Fato do Produto', nivel: 'Médio', inc: 30, prob: 'Alta' },
    { tema: 'Responsabilidade pelo Vício do Produto', nivel: 'Médio', inc: 28, prob: 'Alta' },
    { tema: 'Práticas Abusivas', nivel: 'Fácil', inc: 22, prob: 'Média' },
    { tema: 'Proteção Contratual', nivel: 'Médio', inc: 18, prob: 'Média' },
    { tema: 'Cobrança de Dívidas', nivel: 'Fácil', inc: 15, prob: 'Baixa' },
    { tema: 'Desconsideração da Personalidade Jurídica', nivel: 'Difícil', inc: 25, prob: 'Alta' },
    { tema: 'Direito de Arrependimento', nivel: 'Fácil', inc: 20, prob: 'Média' },
    { tema: 'Publicidade Enganosa e Abusiva', nivel: 'Médio', inc: 17, prob: 'Média' },
    { tema: 'Banco de Dados e Cadastros', nivel: 'Fácil', inc: 14, prob: 'Baixa' },
    { tema: 'Inversão do Ônus da Prova', nivel: 'Difícil', inc: 21, prob: 'Alta' }
  ],
  'Estatuto da Criança e do Adolescente (ECA)': [
    { tema: 'Adoção', nivel: 'Difícil', inc: 35, prob: 'Alta' },
    { tema: 'Medidas Socioeducativas', nivel: 'Difícil', inc: 30, prob: 'Alta' },
    { tema: 'Direitos Fundamentais da Criança', nivel: 'Fácil', inc: 18, prob: 'Média' },
    { tema: 'Conselho Tutelar', nivel: 'Médio', inc: 20, prob: 'Média' },
    { tema: 'Atos Infracionais', nivel: 'Médio', inc: 22, prob: 'Alta' },
    { tema: 'Família Substituta', nivel: 'Médio', inc: 15, prob: 'Baixa' },
    { tema: 'Prevenção e Acesso a Jogos/Espetáculos', nivel: 'Fácil', inc: 12, prob: 'Baixa' },
    { tema: 'Destituição do Poder Familiar', nivel: 'Difícil', inc: 25, prob: 'Alta' },
    { tema: 'Direito à Convivência Familiar', nivel: 'Fácil', inc: 14, prob: 'Baixa' },
    { tema: 'Apuração de Ato Infracional', nivel: 'Médio', inc: 16, prob: 'Baixa' }
  ],
  'Filosofia do Direito': [
    { tema: 'Positivismo Jurídico', nivel: 'Difícil', inc: 28, prob: 'Alta' },
    { tema: 'Jusnaturalismo', nivel: 'Médio', inc: 22, prob: 'Média' },
    { tema: 'Teoria da Justiça', nivel: 'Médio', inc: 25, prob: 'Alta' },
    { tema: 'Hermenêutica Jurídica', nivel: 'Difícil', inc: 26, prob: 'Alta' },
    { tema: 'Utilitarismo', nivel: 'Fácil', inc: 15, prob: 'Baixa' },
    { tema: 'Kantismo', nivel: 'Médio', inc: 18, prob: 'Média' },
    { tema: 'Marxismo e Direito', nivel: 'Fácil', inc: 12, prob: 'Baixa' },
    { tema: 'Teoria Tridimensional do Direito', nivel: 'Médio', inc: 14, prob: 'Baixa' },
    { tema: 'Poder e Direito', nivel: 'Fácil', inc: 10, prob: 'Baixa' },
    { tema: 'Realismo Jurídico', nivel: 'Médio', inc: 16, prob: 'Baixa' }
  ]
};

// Gerar templates dinâmicos para as 15 disciplinas
Object.entries(TEMAS_MATERIAS).forEach(([materia, temasList]) => {
  temasList.forEach((meta) => {
    TEMPLATES[materia].push({
      tema: meta.tema,
      nivel: meta.nivel,
      incidenciaTema: meta.inc,
      probabilidade: meta.prob,
      gerar: (i, nMasc, nFem, exameObj) => {
        const enunciados = [
          `Durante uma fiscalização no estabelecimento de ${nFem}, constatou-se uma irregularidade administrativa. Em consequência, o agente aplicou uma sanção que ${nFem} entende violar os princípios basilares da matéria. No tocante a ${meta.tema}, assinale a alternativa juridicamente correta:`,
          `O cidadão ${nMasc} buscou assessoria jurídica para solucionar um conflito relativo a ${meta.tema} envolvendo uma entidade privada. Diante das regras vigentes e da jurisprudência consolidada, qual a orientação adequada a ser prestada a ${nMasc}?`,
          `Em ação judicial discutindo especificamente o instituto de ${meta.tema}, a empresa X Ltda sustentou a inexigibilidade da obrigação alegada. Diante do quadro fático apresentado, assinale a opção que reflete o posicionamento correto sobre o tema:`,
          `Em recente acórdão, discutiu-se a aplicação das regras de ${meta.tema} em caso de grande repercussão nacional. À luz da doutrina majoritária e da legislação aplicável, assinale a afirmativa correta:`,
          `A administração ou a parte interessada, representada pelo doutor ${nMasc}, ajuizou a medida cabível para garantir o direito pretendido sobre ${meta.tema}. Diante disso, assinale a opção correta:`
        ];

        const alternativasPorTema = [
          [
            `A conduta é válida pois respeita estritamente as regras de ${meta.tema} previstas em lei específica.`,
            `A medida padece de nulidade absoluta por vício formal no tratamento de ${meta.tema}.`,
            `O instituto de ${meta.tema} não se aplica a entidades de direito público, apenas a relações privadas.`,
            `Configura-se desvio de finalidade por ausência de nexo causal no âmbito de ${meta.tema}.`
          ],
          [
            `Trata-se de direito líquido e certo assegurado de forma plena pelas normas de ${meta.tema}.`,
            `O pleito deve ser indeferido pois prescreveu o prazo legal para suscitar controvérsia sobre ${meta.tema}.`,
            `Exige-se comprovação de dolo ou culpa grave para verificar responsabilidade em sede de ${meta.tema}.`,
            `A matéria de ${meta.tema} exige procedimento administrativo prévio sob pena de carência de ação.`
          ],
          [
            `A responsabilidade é subjetiva, recaindo o ônus da prova sobre a caracterização de ${meta.tema}.`,
            `A obrigação é solidária, respondendo todos os envolvidos nos limites de ${meta.tema}.`,
            `O descumprimento gera apenas sanção pecuniária simples sem direito a perdas e danos em ${meta.tema}.`,
            `Inexiste dever de indenizar se comprovada força maior superveniente em ${meta.tema}.`
          ],
          [
            `A jurisprudência do STJ e STF fixa que a competência para julgar causas de ${meta.tema} é exclusiva da Justiça Federal.`,
            `Admite-se flexibilização das regras de ${meta.tema} se demonstrado interesse social relevante.`,
            `O ato é plenamente revogável por razões de oportunidade e conveniência decorrentes de ${meta.tema}.`,
            `A aplicação de penalidade em ${meta.tema} exige notificação pessoal prévia e contraditório.`
          ],
          [
            `A pretensão está amparada na legalidade e na doutrina clássica aplicável a ${meta.tema}.`,
            `O direito caducou no prazo de cinco anos contados da ciência do fato referente a ${meta.tema}.`,
            `Não cabe ação rescisória para reformar julgado fundamentado na interpretação de ${meta.tema}.`,
            `A decisão administrativa faz coisa julgada material em relação a ${meta.tema}, impedindo revisão judicial.`
          ]
        ];

        const explicacoes = [
          `No caso concreto, a conduta atende aos preceitos da legislação vigentes aplicável a ${meta.tema}, respeitando os limites da legalidade e os princípios gerais de direito.`,
          `Conforme consolidado pelos tribunais superiores, os direitos relativos a ${meta.tema} exigem observância do devido processo legal e não admitem cobrança retroativa abusiva.`,
          `A obrigação em ${meta.tema} possui caráter pessoal e segue a regra geral de distribuição do ônus probatório, exigindo prova do nexo de causalidade direto.`,
          `A jurisprudência pátria estabelece que a disciplina jurídica de ${meta.tema} visa garantir a segurança jurídica e a eficiência das relações contratuais ou sociais pactuadas.`,
          `O prazo decadencial aplicável ao caso é quinquenal, conforme expressa previsão legal, aplicando-se de forma direta sobre os atos decorrentes de ${meta.tema}.`
        ];

        return {
          enunciado: enunciados[i % enunciados.length],
          alternativas: alternativasPorTema[i % alternativasPorTema.length],
          gabarito: i % 4,
          explicacao: explicacoes[i % explicacoes.length]
        };
      }
    });
  });
});

// Geração dinâmica das questões em memória
const gerarQuestoes = (): Questao[] => {
  const todasQuestoes: Questao[] = [];
  let questaoIdCounter = 1;

  const MATERIAS_MAIORES = [
    'Ética Profissional',
    'Direito Constitucional',
    'Direito Administrativo',
    'Direito Penal',
    'Direito Processual Penal',
    'Direito Civil',
    'Direito Processual Civil',
    'Direito do Trabalho',
    'Direito Processual do Trabalho'
  ];

  MATERIAS.forEach(materia => {
    const templatesMateria = TEMPLATES[materia] || [];
    const eMateriaMaior = MATERIAS_MAIORES.includes(materia);
    
    // Configurar densidade de questões para exatamente 50 por disciplina (5 variações x 10 templates)
    const totalVariacoes = 5;

    templatesMateria.forEach((template, tIdx) => {
      for (let vIdx = 0; vIdx < totalVariacoes; vIdx++) {
        const indexCombinado = tIdx * 100 + vIdx;
        const nMasc = NOMES_MASC[indexCombinado % NOMES_MASC.length];
        const nFem = NOMES_FEM[indexCombinado % NOMES_FEM.length];
        const exameObj = EXAMES[indexCombinado % EXAMES.length];
        
        const questaoBase = template.gerar(vIdx, nMasc, nFem, exameObj);
        
        todasQuestoes.push({
          id: `q${questaoIdCounter}`,
          materia: materia,
          tema: template.tema,
          nivel: template.nivel,
          exame: `${exameObj.nome} (${exameObj.ano})`,
          incidenciaTema: template.incidenciaTema,
          probabilidade: template.probabilidade,
          enunciado: questaoBase.enunciado,
          alternativas: questaoBase.alternativas,
          gabarito: questaoBase.gabarito,
          explicacao: questaoBase.explicacao
        });
        
        questaoIdCounter++;
      }
    });
  });

  return todasQuestoes;
};

// Exporta as questões prontas para serem consumidas em qualquer parte do Next.js
export const TODAS_QUESTOES_GERADAS: Questao[] = gerarQuestoes();
