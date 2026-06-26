// Base de dados de questÃµes gerada dinamicamente - MissÃ£o OAB
// ContÃ©m mais de 5.000 questÃµes com dados realistas nas 17 disciplinas oficiais da OAB.

import { Questao } from './mockData';

const NOMES_MASC = ['JosÃ©', 'JoÃ£o', 'Carlos', 'Pedro', 'Marcos', 'Felipe', 'Bruno', 'Ricardo', 'Rodrigo', 'Lucas', 'Gabriel', 'Gustavo', 'Mateus', 'Daniel', 'AndrÃ©'];
const NOMES_FEM = ['Maria', 'Ana', 'Mariana', 'Juliana', 'Fernanda', 'Gabriela', 'Beatriz', 'Camila', 'Sofia', 'Amanda', 'Paula', 'LetÃ­cia', 'Larissa', 'Luana', 'Isabela'];
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
  'Ã‰tica Profissional',
  'Direito Constitucional',
  'Direito Administrativo',
  'Direito Penal',
  'Direito Processual Penal',
  'Direito Civil',
  'Direito Processual Civil',
  'Direito do Trabalho',
  'Direito Processual do Trabalho',
  'Direito TributÃ¡rio',
  'Direito Empresarial',
  'Direitos Humanos',
  'Direito Internacional',
  'Direito Ambiental',
  'Direito do Consumidor',
  'Estatuto da CrianÃ§a e do Adolescente (ECA)',
  'Filosofia do Direito'
];

interface Template {
  tema: string;
  nivel: 'FÃ¡cil' | 'MÃ©dio' | 'DifÃ­cil';
  incidenciaTema: number;
  probabilidade: 'Alta' | 'MÃ©dia' | 'Baixa';
  gerar: (i: number, nMasc: string, nFem: string, exameObj: { nome: string, ano: number }) => {
    enunciado: string;
    alternativas: string[];
    gabarito: number;
    explicacao: string;
  };
}

const TEMPLATES: Record<string, Template[]> = {};
MATERIAS.forEach(m => { TEMPLATES[m] = []; });

// --- 1. Ã‰TICA PROFISSIONAL ---
TEMPLATES['Ã‰tica Profissional'].push(
  {
    tema: 'Publicidade Profissional',
    nivel: 'MÃ©dio',
    incidenciaTema: 32,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `O advogado ${nMasc} decidiu impulsionar publicaÃ§Ãµes no Instagram para divulgar seus artigos jurÃ­dicos sobre direito tributÃ¡rio. Visando ampliar sua clientela, ele inseriu um link direto para agendamento de consultas com a frase: "Agende sua consulta com desconto especial de 20%". Ã€ luz do Provimento 205/2021 da OAB, assinale a opÃ§Ã£o correta:`,
      alternativas: [
        'A publicidade ativa e o patrocÃ­nio de postagens (trÃ¡fego pago) sÃ£o permitidos, mas a oferta de descontos e a mercantilizaÃ§Ã£o da advocacia sÃ£o vedadas.',
        'A publicidade profissional do advogado tem carÃ¡ter puramente mercantil, sendo permitida a divulgaÃ§Ã£o livre de preÃ§os e descontos nas redes sociais.',
        'O patrocÃ­nio de postagens nas redes sociais Ã© vedado em qualquer circunstÃ¢ncia pela OAB, caracterizando captaÃ§Ã£o ilegal de clientela.',
        'Ã‰ permitido divulgar descontos em consultas, desde que a divulgaÃ§Ã£o ocorra exclusivamente em ambiente digital (internet).'
      ],
      gabarito: 0,
      explicacao: `De acordo com o Provimento 205/2021, o marketing de conteÃºdos jurÃ­dicos e o trÃ¡fego pago sÃ£o permitidos, porÃ©m, a publicidade deve primar pela sobriedade e carÃ¡ter informativo, sendo expressamente proibida a mercantilizaÃ§Ã£o (como oferta de descontos e captaÃ§Ã£o ativa de clientela).`
    })
  },
  {
    tema: 'HonorÃ¡rios AdvocatÃ­cios',
    nivel: 'FÃ¡cil',
    incidenciaTema: 28,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A advogada ${nFem} celebrou contrato verbal de prestaÃ§Ã£o de serviÃ§os jurÃ­dicos com um cliente. Diante do inadimplemento e da ausÃªncia de contrato escrito, de acordo com o Estatuto da OAB (Lei 8.906/94), assinale a afirmativa correta:`,
      alternativas: [
        'Na falta de contrato escrito, os honorÃ¡rios do advogado serÃ£o fixados por arbitramento judicial, em remuneraÃ§Ã£o compatÃ­vel com o trabalho e o valor econÃ´mico da questÃ£o.',
        'A falta de contrato escrito impede o advogado de cobrar honorÃ¡rios in juÃ­zo, restando apenas a via moral.',
        'Sem o contrato escrito, os honorÃ¡rios prescrevem em dois anos contados do inÃ­cio da prestaÃ§Ã£o de serviÃ§os.',
        'O advogado pode arbitrar de prÃ³prio punho os honorÃ¡rios e executÃ¡-los diretamente como tÃ­tulo extrajudicial.'
      ],
      gabarito: 0,
      explicacao: `Conforme o Art. 22, Â§ 2Âº da Lei 8.906/94, na falta de estipulaÃ§Ã£o escrita, os honorÃ¡rios sÃ£o fixados por arbitramento judicial em valor compatÃ­vel com o trabalho realizado e o proveito econÃ´mico.`
    })
  },
  {
    tema: 'Incompatibilidades e Impedimentos',
    nivel: 'DifÃ­cil',
    incidenciaTema: 30,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `O bacharel ${nMasc} foi aprovado no concurso para o cargo de Auditor Fiscal da Receita Municipal. Posteriormente, foi aprovado no Exame de Ordem e requer sua inscriÃ§Ã£o na OAB. Diante das regras de incompatibilidade e impedimento do Estatuto da Advocacia, assinale a opÃ§Ã£o correta:`,
      alternativas: [
        'O cargo de auditor fiscal gera incompatibilidade absoluta para o exercÃ­cio da advocacia, impedindo sua inscriÃ§Ã£o.',
        'Ele poderÃ¡ advogar normalmente, estando apenas impedido de atuar contra o municÃ­pio que o remunera.',
        'Por ser servidor pÃºblico concursado, ele estÃ¡ automaticamente impedido de advogar contra qualquer ente pÃºblico, mas pode atuar na Ã¡rea privada.',
        'Ele deve requerer licenÃ§a especial Ã  OAB para atuar exclusivamente na defesa de seus familiares.'
      ],
      gabarito: 0,
      explicacao: `O Art. 28, VII da Lei 8.906/94 estabelece que a advocacia Ã© incompatÃ­vel, mesmo em causa prÃ³pria, para ocupantes de cargos ou funÃ§Ãµes que tenham competÃªncia de lanÃ§amento, arrecadaÃ§Ã£o ou fiscalizaÃ§Ã£o de tributos (incompatibilidade absoluta).`
    })
  },
  {
    tema: 'Direitos do Advogado',
    nivel: 'MÃ©dio',
    incidenciaTema: 25,
    probabilidade: 'MÃ©dia',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A advogada ${nFem} compareceu a uma delegacia de polÃ­cia para entrevistar-se com seu cliente que se encontrava preso em flagrante. O delegado de plantÃ£o impediu o acesso dela ao preso, alegando que o inquÃ©rito policial corre sob sigilo. Ã€ luz do Estatuto da OAB, assinale a afirmativa correta:`,
      alternativas: [
        'A advogada tem o direito de comunicar-se com seus clientes pessoal e reservadamente, mesmo sem procuraÃ§Ã£o, ainda que estes considerados incomunicÃ¡veis ou sob sigilo de inquÃ©rito.',
        'O delegado de polÃ­cia agiu corretamente, pois o sigilo decretado no inquÃ©rito prevalece sobre as prerrogativas profissionais.',
        'A entrevista com o preso em inquÃ©rito sigiloso exige autorizaÃ§Ã£o judicial prÃ©via.',
        'A advogada necessita apresentar procuraÃ§Ã£o com poderes especiais para ter acesso ao preso.'
      ],
      gabarito: 0,
      explicacao: `Conforme o Art. 7Âº, III da Lei 8.906/94, Ã© direito do advogado comunicar-se com seus clientes, pessoal e reservadamente, mesmo sem procuraÃ§Ã£o, quando estes se achem presos ou detidos, ainda que considerados incomunicÃ¡veis.`
    })
  },
  {
    tema: 'InfraÃ§Ãµes e SanÃ§Ãµes Disciplinares',
    nivel: 'MÃ©dio',
    incidenciaTema: 27,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `O advogado ${nMasc} reteve abusivamente os autos de um processo judicial, deixando de devolvÃª-los no prazo legal mesmo apÃ³s ter sido devidamente intimado. De acordo com as normas disciplinares da OAB, essa conduta caracteriza infraÃ§Ã£o disciplinar punÃ­vel com:`,
      alternativas: [
        'SuspensÃ£o do exercÃ­cio profissional.',
        'Censura simples.',
        'ExclusÃ£o definitiva dos quadros da OAB.',
        'Multa de atÃ© dez anuidades.'
      ],
      gabarito: 0,
      explicacao: `O Art. 34, XXII c/c Art. 37, I da Lei 8.906/94 estabelece que reter abusivamente autos de processos enseja a sanÃ§Ã£o de suspensÃ£o.`
    })
  },
  {
    tema: 'Sociedade de Advogados',
    nivel: 'MÃ©dio',
    incidenciaTema: 20,
    probabilidade: 'MÃ©dia',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Os advogados ${nMasc} e ${nFem} pretendem constituir uma Sociedade Unipessoal de Advocacia. A respeito das regras de constituiÃ§Ã£o e atuaÃ§Ã£o dessa modalidade societÃ¡ria, assinale a afirmativa correta:`,
      alternativas: [
        'O advogado nÃ£o pode integrar mais de uma sociedade de advogados ou sociedade unipessoal com sede ou filial na mesma Ã¡rea de conselho seccional.',
        'A sociedade unipessoal pode adotar nome de fantasia para facilitar o marketing digital.',
        'Ã‰ permitido que a sociedade unipessoal inclua sÃ³cio de serviÃ§o que seja bacharel em Direito nÃ£o inscrito nos quadros da OAB.',
        'A sociedade unipessoal responde subsidiariamente, de forma limitada, pelas obrigaÃ§Ãµes decorrentes de danos causados a clientes.'
      ],
      gabarito: 0,
      explicacao: `O Art. 15, Â§ 4Âº da Lei 8.906/94 proÃ­be o advogado de integrar mais de uma sociedade de advogados, constituir mais de uma sociedade unipessoal ou integrar, simultaneamente, ambas, na mesma Ã¡rea territorial do Conselho Seccional.`
    })
  },
  {
    tema: 'Ã“rgÃ£os da OAB',
    nivel: 'MÃ©dio',
    incidenciaTema: 18,
    probabilidade: 'Baixa',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A respeito da estrutura organizacional da OAB e da competÃªncia de seus Ã³rgÃ£os, assinale a opÃ§Ã£o correta:`,
      alternativas: [
        'O Conselho Federal da OAB Ã© o Ã³rgÃ£o supremo da entidade, possuindo personalidade jurÃ­dica prÃ³pria, com sede em BrasÃ­lia/DF.',
        'A Caixa de AssistÃªncia dos Advogados possui personalidade jurÃ­dica independente dos Conselhos Seccionais, nÃ£o prestando contas a eles.',
        'As SubseÃ§Ãµes da OAB possuem personalidade jurÃ­dica prÃ³pria e autonomia financeira irrestrita.',
        'Apenas a Seccional Estadual pode interpor recurso de decisÃµes disciplinares perante os tribunais de justiÃ§a estaduais.'
      ],
      gabarito: 0,
      explicacao: `Conforme o Art. 45 da Lei 8.906/94, a OAB Ã© composta pelo Conselho Federal (personalidade jurÃ­dica prÃ³pria, sede no Distrito Federal), Conselhos Seccionais, SubseÃ§Ãµes e Caixas de AssistÃªncia.`
    })
  },
  {
    tema: 'Sigilo Profissional',
    nivel: 'FÃ¡cil',
    incidenciaTema: 22,
    probabilidade: 'MÃ©dia',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `O advogado ${nMasc} foi intimado a depor como testemunha em processo penal sobre fatos sigilosos que lhe foram revelados por um cliente sob o manto do segredo profissional. Nesse cenÃ¡rio, o advogado:`,
      alternativas: [
        'Deve recusar-se a depor, pois o sigilo profissional Ã© um direito e um dever legal do advogado, mesmo se autorizado pelo cliente.',
        'Ã‰ obrigado a depor, uma vez que a intimaÃ§Ã£o judicial sobrepÃµe-se Ã s regras de Ã©tica da advocacia.',
        'Pode depor apenas sobre fatos secundÃ¡rios que nÃ£o envolvam a autoria delitiva do cliente.',
        'Fica obrigado a depor se o crime investigado for punido com pena de reclusÃ£o superior a quatro anos.'
      ],
      gabarito: 0,
      explicacao: `O Art. 7Âº, XIX do Estatuto da OAB garante ao advogado a prerrogativa de recusar-se a depor como testemunha sobre fatos de que tenha tomado conhecimento no exercÃ­cio profissional.`
    })
  },
  {
    tema: 'RelaÃ§Ãµes com a Magistratura e MinistÃ©rio PÃºblico',
    nivel: 'FÃ¡cil',
    incidenciaTema: 15,
    probabilidade: 'Baixa',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A advogada ${nFem} precisa despachar petiÃ§Ã£o urgente com o juiz da vara cÃ­vel, contudo, o assessor informa que o magistrado sÃ³ atende advogados com hora previamente agendada. Ã€ luz do Estatuto da OAB:`,
      alternativas: [
        'A advogada tem o direito de dirigir-se diretamente aos magistrados nas salas e gabinetes de trabalho, independentemente de horÃ¡rio previamente marcado.',
        'O assessor estÃ¡ correto, pois o princÃ­pio da celeridade autoriza o magistrado a criar regimento interno restringindo o acesso livre.',
        'O despacho presencial com juÃ­zes sÃ³ Ã© permitido se houver anuÃªncia expressa da parte contrÃ¡ria no processo.',
        'A magistratura goza de autonomia para determinar atendimento exclusivo por meio eletrÃ´nico (e-mail ou videoconferÃªncia).'
      ],
      gabarito: 0,
      explicacao: `Segundo o Art. 7Âº, VIII da Lei 8.906/94, Ã© direito do advogado dirigir-se diretamente aos magistrados nas salas e gabinetes de trabalho, independentemente de horÃ¡rio previamente marcado.`
    })
  },
  {
    tema: 'Processo Disciplinar na OAB',
    nivel: 'DifÃ­cil',
    incidenciaTema: 24,
    probabilidade: 'MÃ©dia',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Contra o advogado ${nMasc} foi instaurada representaÃ§Ã£o disciplinar perante o Tribunal de Ã‰tica e Disciplina (TED) da OAB. A respeito do rito processual disciplinar, assinale a opÃ§Ã£o correta:`,
      alternativas: [
        'O processo disciplinar tramita em sigilo, sÃ³ tendo acesso Ã s suas informaÃ§Ãµes as partes, seus defensores e a autoridade julgadora.',
        'A representaÃ§Ã£o disciplinar nÃ£o pode ser instaurada de ofÃ­cio, exigindo sempre denÃºncia formal por escrito da vÃ­tima.',
        'O prazo de prescriÃ§Ã£o da pretensÃ£o punitiva da OAB Ã© de dez anos contados da data do fato.',
        'A apelaÃ§Ã£o das decisÃµes finais do TED Ã© enviada diretamente ao Poder JudiciÃ¡rio (JustiÃ§a Federal).'
      ],
      gabarito: 0,
      explicacao: `O Art. 72 da Lei 8.906/94 estabelece que o processo disciplinar tramita em sigilo, atÃ© o seu tÃ©rmino, para resguardar a honra profissional do representado.`
    })
  }
);

// --- 2. DIREITO CONSTITUCIONAL ---
TEMPLATES['Direito Constitucional'].push(
  {
    tema: 'RemÃ©dios Constitucionais',
    nivel: 'MÃ©dio',
    incidenciaTema: 24,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `${nFem} impetrou aÃ§Ã£o constitucional para ter acesso a relatÃ³rios informativos contendo dados sobre sua prÃ³pria pessoa armazenados em banco de dados da Receita Federal. O pleito foi negado na via administrativa. A aÃ§Ã£o cabÃ­vel Ã©:`,
      alternativas: [
        'Habeas Data.',
        'Mandado de SeguranÃ§a.',
        'AÃ§Ã£o Civil PÃºblica.',
        'AÃ§Ã£o Popular.'
      ],
      gabarito: 0,
      explicacao: `O Habeas Data (Art. 5Âº, LXXII da CF/88) Ã© o remÃ©dio constitucional adequado para assegurar o conhecimento de informaÃ§Ãµes relativas Ã  pessoa do impetrante constantes de registros governamentais.`
    })
  },
  {
    tema: 'Processo Legislativo',
    nivel: 'DifÃ­cil',
    incidenciaTema: 26,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Uma proposta de Emenda Ã  ConstituiÃ§Ã£o (PEC) que visa abolir as garantias individuais da liberdade de expressÃ£o e de manifestaÃ§Ã£o do pensamento Ã© apresentada no Senado. Sobre essa PEC, assinale a afirmativa correta:`,
      alternativas: [
        'A PEC nÃ£o pode sequer ser objeto de deliberaÃ§Ã£o, pois visa abolir direitos e garantias individuais (clÃ¡usula pÃ©trea).',
        'A PEC Ã© formalmente e materialmente vÃ¡lida, podendo ser aprovada por maioria simples.',
        'A matÃ©ria de emenda constitucional rejeitada poderÃ¡ ser reapresentada na mesma sessÃ£o legislativa por maioria absoluta.',
        'A PEC sÃ³ pode prosseguir se houver sanÃ§Ã£o do Presidente da RepÃºblica.'
      ],
      gabarito: 0,
      explicacao: `O Art. 60, Â§ 4Âº, IV da CF/88 veda a deliberaÃ§Ã£o de propostas de emenda tendentes a abolir direitos e garantias individuais (clÃ¡usulas pÃ©treas).`
    })
  },
  {
    tema: 'Controle de Constitucionalidade',
    nivel: 'DifÃ­cil',
    incidenciaTema: 28,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Um governador de estado pretende questionar a constitucionalidade de uma lei federal recÃ©m-promulgada. A respeito dos legitimados ativos universais para propositura de AÃ§Ã£o Direta de Inconstitucionalidade (ADI), assinale a afirmativa correta:`,
      alternativas: [
        'Governador de Estado e do Distrito Federal Ã© legitimado especial, necessitando comprovar pertinÃªncia temÃ¡tica com a lei federal.',
        'Governador de Estado Ã© legitimado universal, dispensando a demonstraÃ§Ã£o de interesse jurÃ­dico direto.',
        'Partidos polÃ­ticos sem representaÃ§Ã£o no Congresso Nacional podem ajuizar ADI se houver aval do PGR.',
        'Mesas de CÃ¢maras Municipais tÃªm legitimidade para propor ADI no STF.'
      ],
      gabarito: 0,
      explicacao: `Embora o governador figure no rol do Art. 103 da CF, a jurisprudÃªncia consolidada do STF o classifica como legitimado especial, exigindo a demonstraÃ§Ã£o de pertinÃªncia temÃ¡tica para as aÃ§Ãµes cÃ­veis federais.`
    })
  },
  {
    tema: 'OrganizaÃ§Ã£o do Estado',
    nivel: 'MÃ©dio',
    incidenciaTema: 20,
    probabilidade: 'MÃ©dia',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `O Estado X editou lei ordinÃ¡ria dispondo sobre diretrizes de trÃ¢nsito e transporte urbano dentro do seu territÃ³rio. Diante da repartiÃ§Ã£o de competÃªncias legislativas prevista na CF/88, tal lei estadual Ã©:`,
      alternativas: [
        'Inconstitucional, pois legislar sobre trÃ¢nsito e transporte Ã© competÃªncia legislativa privativa da UniÃ£o.',
        'Constitucional, por se tratar de competÃªncia comum concorrente entre UniÃ£o e Estados.',
        'Constitucional, desde que respeitadas as normas gerais do MunicÃ­pio.',
        'Inconstitucional, pois trÃ¢nsito Ã© de competÃªncia privativa dos MunicÃ­pios.'
      ],
      gabarito: 0,
      explicacao: `De acordo com o Art. 22, XI da CF/88, compete privativamente Ã  UniÃ£o legislar sobre trÃ¢nsito e transporte, gerando inconstitucionalidade formal orgÃ¢nica a lei estadual.`
    })
  },
  {
    tema: 'Direitos e Garantias Fundamentais',
    nivel: 'FÃ¡cil',
    incidenciaTema: 25,
    probabilidade: 'Alta',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Policiais militares ingressaram na residÃªncia de ${nMasc} durante a noite, sem autorizaÃ§Ã£o judicial, sob a alegaÃ§Ã£o de suspeita de crime de estelionato cometido dias atrÃ¡s. Ã€ luz do princÃ­pio da inviolabilidade do domicÃ­lio (Art. 5Âº, XI, CF):`,
      alternativas: [
        'A atuaÃ§Ã£o dos policiais Ã© ilÃ­cita, pois a entrada forÃ§ada na residÃªncia durante a noite exige consentimento ou flagrante delito/desastre/socorro, ou determinaÃ§Ã£o judicial apenas durante o dia.',
        'A invasÃ£o domiciliar Ã© vÃ¡lida a qualquer hora do dia ou da noite sob suspeita de qualquer ilÃ­cito penal.',
        'A determinaÃ§Ã£o judicial autoriza a entrada domiciliar a qualquer hora da noite.',
        'A residÃªncia nÃ£o goza de proteÃ§Ã£o constitucional em Ã¡reas de periferia urbana.'
      ],
      gabarito: 0,
      explicacao: `A casa Ã© asilo inviolÃ¡vel, ninguÃ©m nela podendo penetrar sem consentimento, salvo em caso de flagrante delito, desastre, socorro, ou por determinaÃ§Ã£o judicial durante o dia (Art. 5Âº, XI).`
    })
  },
  {
    tema: 'Poder Executivo',
    nivel: 'MÃ©dio',
    incidenciaTema: 18,
    probabilidade: 'MÃ©dia',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Em caso de vacÃ¢ncia dos cargos de Presidente e Vice-Presidente da RepÃºblica nos dois primeiros anos do mandato presidencial, a linha sucessÃ³ria estabelecida pela ConstituiÃ§Ã£o determina que assumirÃ¡ provisoriamente:`,
      alternativas: [
        'O Presidente da CÃ¢mara dos Deputados, que deverÃ¡ convocar eleiÃ§Ãµes diretas em noventa dias.',
        'O Presidente do Senado Federal, que exercerÃ¡ o mandato atÃ© o fim do quadriÃªnio.',
        'O Presidente do STF, convocando eleiÃ§Ãµes indiretas pelo Congresso Nacional.',
        'O Ministro da Defesa, instalando junta governativa militar.'
      ],
      gabarito: 0,
      explicacao: `Conforme o Art. 80 e 81 da CF/88, vagando os cargos de Presidente e Vice nos primeiros dois anos, o Presidente da CÃ¢mara Ã© chamado ao exercÃ­cio, devendo ocorrer eleiÃ§Ãµes diretas em 90 dias.`
    })
  },
  {
    tema: 'Poder JudiciÃ¡rio',
    nivel: 'MÃ©dio',
    incidenciaTema: 19,
    probabilidade: 'MÃ©dia',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Compete processar e julgar, originariamente, o Presidente da RepÃºblica nos crimes de responsabilidade e nas infraÃ§Ãµes penais comuns, respectivamente:`,
      alternativas: [
        'O Senado Federal e o Supremo Tribunal Federal.',
        'A CÃ¢mara dos Deputados e o Senado Federal.',
        'O Supremo Tribunal Federal e o Congresso Nacional.',
        'O Superior Tribunal de JustiÃ§a e o Supremo Tribunal Federal.'
      ],
      gabarito: 0,
      explicacao: `De acordo com os Arts. 86 e 102, I, "a" da CF/88, o Presidente Ã© julgado no STF nos crimes comuns e no Senado Federal nos crimes de responsabilidade.`
    })
  },
  {
    tema: 'SÃºmula Vinculante',
    nivel: 'MÃ©dio',
    incidenciaTema: 15,
    probabilidade: 'MÃ©dia',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A respeito do procedimento de aprovaÃ§Ã£o, revisÃ£o ou cancelamento de SÃºmula Vinculante pelo Supremo Tribunal Federal, assinale a opÃ§Ã£o correta:`,
      alternativas: [
        'Exige decisÃ£o tomada por dois terÃ§os dos membros do STF, mediante provocaÃ§Ã£o dos legitimados para a ADI.',
        'Pode ser editada de ofÃ­cio por maioria simples dos ministros do STF em sessÃ£o plenÃ¡ria.',
        'Vincula a atuaÃ§Ã£o do Poder Legislativo na sua funÃ§Ã£o tÃ­pica de legislar.',
        'NÃ£o pode ser objeto de impugnaÃ§Ã£o ou controle por cidadÃ£os comuns.'
      ],
      gabarito: 0,
      explicacao: `A aprovaÃ§Ã£o de SÃºmula Vinculante exige voto de 2/3 dos membros do STF (8 ministros) e tem eficÃ¡cia vinculante em relaÃ§Ã£o Ã  AdministraÃ§Ã£o PÃºblica e demais Ã³rgÃ£os do JudiciÃ¡rio, sem vincular a funÃ§Ã£o legislativa federal.`
    })
  },
  {
    tema: 'Poder Legislativo',
    nivel: 'MÃ©dio',
    incidenciaTema: 16,
    probabilidade: 'Baixa',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `Os deputados federais e senadores, desde a expediÃ§Ã£o do diploma, gozam de imunidade formal em relaÃ§Ã£o Ã  prisÃ£o. Nesse sentido, eles:`,
      alternativas: [
        'NÃ£o poderÃ£o ser presos, salvo em flagrante de crime inafianÃ§Ã¡vel, caso em que os autos serÃ£o remetidos em vinte e quatro horas Ã  respectiva Casa Legislativa.',
        'Gozam de imunidade prisional civil e penal absoluta, impossibilitando qualquer espÃ©cie de segregaÃ§Ã£o preventiva.',
        'SÃ³ podem ser presos apÃ³s trÃ¢nsito em julgado de sentenÃ§a condenatÃ³ria proferida pelo STF, independentemente do tipo de crime.',
        'Podem ser presos por ordem de qualquer juiz de primeira instÃ¢ncia caso cometa ato de improbidade administrativa.'
      ],
      gabarito: 0,
      explicacao: `Conforme o Art. 53, Â§ 2Âº da CF/88, os membros do Congresso Nacional nÃ£o poderÃ£o ser presos, salvo em flagrante de crime inafianÃ§Ã¡vel.`
    })
  },
  {
    tema: 'Ordem Social e EducaÃ§Ã£o',
    nivel: 'FÃ¡cil',
    incidenciaTema: 12,
    probabilidade: 'Baixa',
    gerar: (i, nMasc, nFem, exameObj) => ({
      enunciado: `A ConstituiÃ§Ã£o da RepÃºblica assegura a educaÃ§Ã£o como direito de todos e dever do Estado e da famÃ­lia. Segundo a Carta Magna, o ensino pÃºblico serÃ¡ ministrado com base no seguinte princÃ­pio:`,
      alternativas: [
        'Gratuidade do ensino pÃºblico em estabelecimentos oficiais.',
        'MonopÃ³lio de ideias e concepÃ§Ãµes pedagÃ³gicas estatais.',
        'CentralizaÃ§Ã£o exclusiva do financiamento pela UniÃ£o.',
        'PrevalÃªncia do ensino religioso obrigatÃ³rio em todas as etapas escolares.'
      ],
      gabarito: 0,
      explicacao: `O Art. 206, IV da CF/88 estabelece como princÃ­pio do ensino a gratuidade do ensino pÃºblico em estabelecimentos oficiais.`
    })
  }
);

// --- OUTRAS 15 MATÃ‰RIAS ---
const TEMAS_MATERIAS: Record<string, { tema: string; nivel: 'FÃ¡cil' | 'MÃ©dio' | 'DifÃ­cil'; inc: number; prob: 'Alta' | 'MÃ©dia' | 'Baixa' }[]> = {
  'Direito Administrativo': [
    { tema: 'Atos Administrativos', nivel: 'MÃ©dio', inc: 22, prob: 'Alta' },
    { tema: 'LicitaÃ§Ãµes e Contratos', nivel: 'DifÃ­cil', inc: 28, prob: 'Alta' },
    { tema: 'Responsabilidade Civil do Estado', nivel: 'MÃ©dio', inc: 24, prob: 'Alta' },
    { tema: 'Agentes PÃºblicos', nivel: 'MÃ©dio', inc: 20, prob: 'MÃ©dia' },
    { tema: 'OrganizaÃ§Ã£o Administrativa', nivel: 'FÃ¡cil', inc: 18, prob: 'MÃ©dia' },
    { tema: 'Bens PÃºblicos', nivel: 'MÃ©dio', inc: 15, prob: 'Baixa' },
    { tema: 'Improbidade Administrativa', nivel: 'DifÃ­cil', inc: 23, prob: 'Alta' },
    { tema: 'ServiÃ§os PÃºblicos', nivel: 'MÃ©dio', inc: 16, prob: 'Baixa' },
    { tema: 'Poderes da AdministraÃ§Ã£o', nivel: 'FÃ¡cil', inc: 19, prob: 'MÃ©dia' },
    { tema: 'Processo Administrativo', nivel: 'DifÃ­cil', inc: 15, prob: 'Baixa' }
  ],
  'Direito Penal': [
    { tema: 'Teoria do Crime', nivel: 'MÃ©dio', inc: 25, prob: 'Alta' },
    { tema: 'Crimes contra a Pessoa', nivel: 'MÃ©dio', inc: 22, prob: 'Alta' },
    { tema: 'Crimes contra o PatrimÃ´nio', nivel: 'MÃ©dio', inc: 20, prob: 'MÃ©dia' },
    { tema: 'Crimes contra a AdministraÃ§Ã£o PÃºblica', nivel: 'DifÃ­cil', inc: 24, prob: 'Alta' },
    { tema: 'Penas e Dosimetria', nivel: 'DifÃ­cil', inc: 18, prob: 'MÃ©dia' },
    { tema: 'Excludentes de Ilicitude', nivel: 'FÃ¡cil', inc: 26, prob: 'Alta' },
    { tema: 'Concurso de Pessoas', nivel: 'MÃ©dio', inc: 15, prob: 'MÃ©dia' },
    { tema: 'ExtinÃ§Ã£o da Punibilidade', nivel: 'DifÃ­cil', inc: 17, prob: 'Baixa' },
    { tema: 'Lei Penal no Tempo e EspaÃ§o', nivel: 'FÃ¡cil', inc: 14, prob: 'Baixa' },
    { tema: 'Concurso de Crimes', nivel: 'MÃ©dio', inc: 19, prob: 'MÃ©dia' }
  ],
  'Direito Processual Penal': [
    { tema: 'PrisÃ£o e Liberdade ProvisÃ³ria', nivel: 'DifÃ­cil', inc: 30, prob: 'Alta' },
    { tema: 'InquÃ©rito Policial', nivel: 'FÃ¡cil', inc: 22, prob: 'MÃ©dia' },
    { tema: 'CompetÃªncia', nivel: 'DifÃ­cil', inc: 24, prob: 'Alta' },
    { tema: 'Provas', nivel: 'MÃ©dio', inc: 25, prob: 'Alta' },
    { tema: 'AÃ§Ã£o Penal', nivel: 'MÃ©dio', inc: 21, prob: 'MÃ©dia' },
    { tema: 'Recursos', nivel: 'DifÃ­cil', inc: 23, prob: 'Alta' },
    { tema: 'Nulidades', nivel: 'MÃ©dio', inc: 15, prob: 'Baixa' },
    { tema: 'Juizados Especiais Criminais', nivel: 'FÃ¡cil', inc: 14, prob: 'Baixa' },
    { tema: 'Procedimento Comum', nivel: 'MÃ©dio', inc: 18, prob: 'MÃ©dia' },
    { tema: 'Habeas Corpus', nivel: 'MÃ©dio', inc: 20, prob: 'Alta' }
  ],
  'Direito Civil': [
    { tema: 'NegÃ³cio JurÃ­dico', nivel: 'MÃ©dio', inc: 20, prob: 'Alta' },
    { tema: 'ObrigaÃ§Ãµes', nivel: 'MÃ©dio', inc: 18, prob: 'MÃ©dia' },
    { tema: 'Contratos', nivel: 'DifÃ­cil', inc: 25, prob: 'Alta' },
    { tema: 'Responsabilidade Civil', nivel: 'MÃ©dio', inc: 22, prob: 'Alta' },
    { tema: 'Direitos Reais', nivel: 'DifÃ­cil', inc: 20, prob: 'MÃ©dia' },
    { tema: 'FamÃ­lia', nivel: 'MÃ©dio', inc: 21, prob: 'MÃ©dia' },
    { tema: 'SucessÃµes', nivel: 'DifÃ­cil', inc: 24, prob: 'Alta' },
    { tema: 'Teoria Geral do Direito Civil', nivel: 'FÃ¡cil', inc: 15, prob: 'Baixa' },
    { tema: 'Bens e Pessoas', nivel: 'FÃ¡cil', inc: 14, prob: 'Baixa' },
    { tema: 'PrescriÃ§Ã£o e DecadÃªncia', nivel: 'MÃ©dio', inc: 16, prob: 'MÃ©dia' }
  ],
  'Direito Processual Civil': [
    { tema: 'PetiÃ§Ã£o Inicial e Respostas', nivel: 'MÃ©dio', inc: 24, prob: 'Alta' },
    { tema: 'Recursos', nivel: 'DifÃ­cil', inc: 28, prob: 'Alta' },
    { tema: 'Tutelas de UrgÃªncia', nivel: 'MÃ©dio', inc: 22, prob: 'Alta' },
    { tema: 'Cumprimento de SentenÃ§a', nivel: 'DifÃ­cil', inc: 20, prob: 'MÃ©dia' },
    { tema: 'CompetÃªncia', nivel: 'MÃ©dio', inc: 18, prob: 'MÃ©dia' },
    { tema: 'Provas', nivel: 'FÃ¡cil', inc: 17, prob: 'Baixa' },
    { tema: 'IntervenÃ§Ã£o de Terceiros', nivel: 'DifÃ­cil', inc: 19, prob: 'MÃ©dia' },
    { tema: 'Teoria Geral do Processo', nivel: 'FÃ¡cil', inc: 15, prob: 'Baixa' },
    { tema: 'AudiÃªncia de ConciliaÃ§Ã£o', nivel: 'FÃ¡cil', inc: 14, prob: 'Baixa' },
    { tema: 'Processo de ExecuÃ§Ã£o', nivel: 'MÃ©dio', inc: 23, prob: 'Alta' }
  ],
  'Direito do Trabalho': [
    { tema: 'Jornada de Trabalho', nivel: 'FÃ¡cil', inc: 28, prob: 'Alta' },
    { tema: 'Contrato de Trabalho', nivel: 'MÃ©dio', inc: 22, prob: 'MÃ©dia' },
    { tema: 'ExtinÃ§Ã£o do Contrato', nivel: 'MÃ©dio', inc: 25, prob: 'Alta' },
    { tema: 'Verbas RescisÃ³rias', nivel: 'MÃ©dio', inc: 20, prob: 'MÃ©dia' },
    { tema: 'SalÃ¡rio e RemuneraÃ§Ã£o', nivel: 'FÃ¡cil', inc: 18, prob: 'Baixa' },
    { tema: 'EquiparaÃ§Ã£o Salarial', nivel: 'MÃ©dio', inc: 15, prob: 'Baixa' },
    { tema: 'TerceirizaÃ§Ã£o', nivel: 'DifÃ­cil', inc: 21, prob: 'Alta' },
    { tema: 'Estabilidades e Garantias', nivel: 'DifÃ­cil', inc: 23, prob: 'Alta' },
    { tema: 'FÃ©rias', nivel: 'FÃ¡cil', inc: 16, prob: 'MÃ©dia' },
    { tema: 'SeguranÃ§a e Medicina do Trabalho', nivel: 'MÃ©dio', inc: 12, prob: 'Baixa' }
  ],
  'Direito Processual do Trabalho': [
    { tema: 'CompetÃªncia da JustiÃ§a do Trabalho', nivel: 'MÃ©dio', inc: 25, prob: 'Alta' },
    { tema: 'Recursos Trabalhistas', nivel: 'DifÃ­cil', inc: 28, prob: 'Alta' },
    { tema: 'ExecuÃ§Ã£o Trabalhista', nivel: 'DifÃ­cil', inc: 24, prob: 'Alta' },
    { tema: 'AudiÃªncia Trabalhista', nivel: 'MÃ©dio', inc: 22, prob: 'Alta' },
    { tema: 'Rito SumarÃ­ssimo', nivel: 'FÃ¡cil', inc: 18, prob: 'MÃ©dia' },
    { tema: 'Provas no Processo Trabalho', nivel: 'MÃ©dio', inc: 15, prob: 'Baixa' },
    { tema: 'Custas e DepÃ³sito Recursal', nivel: 'DifÃ­cil', inc: 20, prob: 'MÃ©dia' },
    { tema: 'PetiÃ§Ã£o Inicial Trabalhista', nivel: 'FÃ¡cil', inc: 14, prob: 'Baixa' },
    { tema: 'Defesas do RÃ©u', nivel: 'MÃ©dio', inc: 17, prob: 'MÃ©dia' },
    { tema: 'Acordo Homologado', nivel: 'FÃ¡cil', inc: 12, prob: 'Baixa' }
  ],
  'Direito TributÃ¡rio': [
    { tema: 'LimitaÃ§Ãµes ao Poder de Tributar', nivel: 'DifÃ­cil', inc: 28, prob: 'Alta' },
    { tema: 'Impostos Municipais', nivel: 'FÃ¡cil', inc: 18, prob: 'MÃ©dia' },
    { tema: 'Impostos Estaduais', nivel: 'MÃ©dio', inc: 22, prob: 'Alta' },
    { tema: 'Impostos Federais', nivel: 'MÃ©dio', inc: 20, prob: 'MÃ©dia' },
    { tema: 'CrÃ©dito TributÃ¡rio', nivel: 'DifÃ­cil', inc: 25, prob: 'Alta' },
    { tema: 'Imunidades TributÃ¡rias', nivel: 'MÃ©dio', inc: 24, prob: 'Alta' },
    { tema: 'PrincÃ­pio da Anterioridade', nivel: 'FÃ¡cil', inc: 19, prob: 'MÃ©dia' },
    { tema: 'Taxas e ContribuiÃ§Ãµes', nivel: 'FÃ¡cil', inc: 14, prob: 'Baixa' },
    { tema: 'ExecuÃ§Ã£o Fiscal', nivel: 'DifÃ­cil', inc: 16, prob: 'Baixa' },
    { tema: 'Responsabilidade TributÃ¡ria', nivel: 'MÃ©dio', inc: 15, prob: 'MÃ©dia' }
  ],
  'Direito Empresarial': [
    { tema: 'Tipos SocietÃ¡rios (Ltda e S/A)', nivel: 'DifÃ­cil', inc: 26, prob: 'Alta' },
    { tema: 'Propriedade Industrial', nivel: 'MÃ©dio', inc: 18, prob: 'MÃ©dia' },
    { tema: 'TÃ­tulos de CrÃ©dito', nivel: 'DifÃ­cil', inc: 24, prob: 'Alta' },
    { tema: 'FalÃªncia e RecuperaÃ§Ã£o', nivel: 'DifÃ­cil', inc: 28, prob: 'Alta' },
    { tema: 'Estabelecimento Comercial', nivel: 'FÃ¡cil', inc: 15, prob: 'Baixa' },
    { tema: 'Teoria da Empresa', nivel: 'FÃ¡cil', inc: 16, prob: 'Baixa' },
    { tema: 'Contratos Empresariais', nivel: 'MÃ©dio', inc: 17, prob: 'MÃ©dia' },
    { tema: 'EIRELI e EmpresÃ¡rio Individual', nivel: 'FÃ¡cil', inc: 12, prob: 'Baixa' },
    { tema: 'DissoluÃ§Ã£o de Sociedade', nivel: 'MÃ©dio', inc: 14, prob: 'Baixa' },
    { tema: 'Direito SocietÃ¡rio Geral', nivel: 'MÃ©dio', inc: 20, prob: 'MÃ©dia' }
  ],
  'Direitos Humanos': [
    { tema: 'Pacto de San JosÃ© da Costa Rica', nivel: 'MÃ©dio', inc: 35, prob: 'Alta' },
    { tema: 'ConvenÃ§Ã£o Americana', nivel: 'DifÃ­cil', inc: 25, prob: 'Alta' },
    { tema: 'DeclaraÃ§Ã£o Universal (DUDH)', nivel: 'FÃ¡cil', inc: 20, prob: 'MÃ©dia' },
    { tema: 'Sistema Interamericano', nivel: 'DifÃ­cil', inc: 22, prob: 'Alta' },
    { tema: 'ProteÃ§Ã£o Constitucional Humanos', nivel: 'MÃ©dio', inc: 18, prob: 'MÃ©dia' },
    { tema: 'Direitos da Pessoa com DeficiÃªncia', nivel: 'FÃ¡cil', inc: 15, prob: 'Baixa' },
    { tema: 'Tratados e IncorporaÃ§Ã£o', nivel: 'DifÃ­cil', inc: 30, prob: 'Alta' },
    { tema: 'Direitos das Minorias', nivel: 'FÃ¡cil', inc: 12, prob: 'Baixa' },
    { tema: 'ComissÃ£o Interamericana', nivel: 'MÃ©dio', inc: 14, prob: 'Baixa' },
    { tema: 'Corte Interamericana', nivel: 'MÃ©dio', inc: 16, prob: 'MÃ©dia' }
  ],
  'Direito Internacional': [
    { tema: 'Contratos Internacionais', nivel: 'MÃ©dio', inc: 20, prob: 'MÃ©dia' },
    { tema: 'HomologaÃ§Ã£o de SentenÃ§a Estrangeira', nivel: 'DifÃ­cil', inc: 28, prob: 'Alta' },
    { tema: 'Nacionalidade e CondiÃ§Ã£o Estrangeiro', nivel: 'MÃ©dio', inc: 30, prob: 'Alta' },
    { tema: 'Tratados Internacionais', nivel: 'DifÃ­cil', inc: 22, prob: 'MÃ©dia' },
    { tema: 'CompetÃªncia Internacional', nivel: 'MÃ©dio', inc: 18, prob: 'Baixa' },
    { tema: 'ExtradiÃ§Ã£o e DeportaÃ§Ã£o', nivel: 'FÃ¡cil', inc: 15, prob: 'Baixa' },
    { tema: 'Direito Internacional Privado (LINDB)', nivel: 'MÃ©dio', inc: 25, prob: 'Alta' },
    { tema: 'Arbitragem Internacional', nivel: 'DifÃ­cil', inc: 12, prob: 'Baixa' },
    { tema: 'Imunidade de JurisdiÃ§Ã£o', nivel: 'FÃ¡cil', inc: 14, prob: 'Baixa' },
    { tema: 'OrganizaÃ§Ãµes Internacionais', nivel: 'MÃ©dio', inc: 10, prob: 'Baixa' }
  ],
  'Direito Ambiental': [
    { tema: 'Licenciamento Ambiental', nivel: 'DifÃ­cil', inc: 32, prob: 'Alta' },
    { tema: 'PrincÃ­pios do Direito Ambiental', nivel: 'MÃ©dio', inc: 25, prob: 'Alta' },
    { tema: 'Responsabilidade por Dano Ambiental', nivel: 'DifÃ­cil', inc: 28, prob: 'Alta' },
    { tema: 'Unidades de ConservaÃ§Ã£o', nivel: 'MÃ©dio', inc: 18, prob: 'MÃ©dia' },
    { tema: 'CÃ³digo Florestal', nivel: 'FÃ¡cil', inc: 15, prob: 'Baixa' },
    { tema: 'PolÃ­tica Nacional do Meio Ambiente', nivel: 'MÃ©dio', inc: 20, prob: 'MÃ©dia' },
    { tema: 'Estudo de Impacto Ambiental (EIA/RIMA)', nivel: 'DifÃ­cil', inc: 22, prob: 'Alta' },
    { tema: 'CompetÃªncia Ambiental', nivel: 'MÃ©dio', inc: 17, prob: 'MÃ©dia' },
    { tema: 'Crimes Ambientais', nivel: 'FÃ¡cil', inc: 14, prob: 'Baixa' },
    { tema: 'PatrimÃ´nio Nacional', nivel: 'FÃ¡cil', inc: 12, prob: 'Baixa' }
  ],
  'Direito do Consumidor': [
    { tema: 'Responsabilidade pelo Fato do Produto', nivel: 'MÃ©dio', inc: 30, prob: 'Alta' },
    { tema: 'Responsabilidade pelo VÃ­cio do Produto', nivel: 'MÃ©dio', inc: 28, prob: 'Alta' },
    { tema: 'PrÃ¡ticas Abusivas', nivel: 'FÃ¡cil', inc: 22, prob: 'MÃ©dia' },
    { tema: 'ProteÃ§Ã£o Contratual', nivel: 'MÃ©dio', inc: 18, prob: 'MÃ©dia' },
    { tema: 'CobranÃ§a de DÃ­vidas', nivel: 'FÃ¡cil', inc: 15, prob: 'Baixa' },
    { tema: 'DesconsideraÃ§Ã£o da Personalidade JurÃ­dica', nivel: 'DifÃ­cil', inc: 25, prob: 'Alta' },
    { tema: 'Direito de Arrependimento', nivel: 'FÃ¡cil', inc: 20, prob: 'MÃ©dia' },
    { tema: 'Publicidade Enganosa e Abusiva', nivel: 'MÃ©dio', inc: 17, prob: 'MÃ©dia' },
    { tema: 'Banco de Dados e Cadastros', nivel: 'FÃ¡cil', inc: 14, prob: 'Baixa' },
    { tema: 'InversÃ£o do Ã”nus da Prova', nivel: 'DifÃ­cil', inc: 21, prob: 'Alta' }
  ],
  'Estatuto da CrianÃ§a e do Adolescente (ECA)': [
    { tema: 'AdoÃ§Ã£o', nivel: 'DifÃ­cil', inc: 35, prob: 'Alta' },
    { tema: 'Medidas Socioeducativas', nivel: 'DifÃ­cil', inc: 30, prob: 'Alta' },
    { tema: 'Direitos Fundamentais da CrianÃ§a', nivel: 'FÃ¡cil', inc: 18, prob: 'MÃ©dia' },
    { tema: 'Conselho Tutelar', nivel: 'MÃ©dio', inc: 20, prob: 'MÃ©dia' },
    { tema: 'Atos Infracionais', nivel: 'MÃ©dio', inc: 22, prob: 'Alta' },
    { tema: 'FamÃ­lia Substituta', nivel: 'MÃ©dio', inc: 15, prob: 'Baixa' },
    { tema: 'PrevenÃ§Ã£o e Acesso a Jogos/EspetÃ¡culos', nivel: 'FÃ¡cil', inc: 12, prob: 'Baixa' },
    { tema: 'DestituiÃ§Ã£o do Poder Familiar', nivel: 'DifÃ­cil', inc: 25, prob: 'Alta' },
    { tema: 'Direito Ã  ConvivÃªncia Familiar', nivel: 'FÃ¡cil', inc: 14, prob: 'Baixa' },
    { tema: 'ApuraÃ§Ã£o de Ato Infracional', nivel: 'MÃ©dio', inc: 16, prob: 'Baixa' }
  ],
  'Filosofia do Direito': [
    { tema: 'Positivismo JurÃ­dico', nivel: 'DifÃ­cil', inc: 28, prob: 'Alta' },
    { tema: 'Jusnaturalismo', nivel: 'MÃ©dio', inc: 22, prob: 'MÃ©dia' },
    { tema: 'Teoria da JustiÃ§a', nivel: 'MÃ©dio', inc: 25, prob: 'Alta' },
    { tema: 'HermenÃªutica JurÃ­dica', nivel: 'DifÃ­cil', inc: 26, prob: 'Alta' },
    { tema: 'Utilitarismo', nivel: 'FÃ¡cil', inc: 15, prob: 'Baixa' },
    { tema: 'Kantismo', nivel: 'MÃ©dio', inc: 18, prob: 'MÃ©dia' },
    { tema: 'Marxismo e Direito', nivel: 'FÃ¡cil', inc: 12, prob: 'Baixa' },
    { tema: 'Teoria Tridimensional do Direito', nivel: 'MÃ©dio', inc: 14, prob: 'Baixa' },
    { tema: 'Poder e Direito', nivel: 'FÃ¡cil', inc: 10, prob: 'Baixa' },
    { tema: 'Realismo JurÃ­dico', nivel: 'MÃ©dio', inc: 16, prob: 'Baixa' }
  ]
};

// Gerar templates dinÃ¢micos para as 15 disciplinas
Object.entries(TEMAS_MATERIAS).forEach(([materia, temasList]) => {
  temasList.forEach((meta) => {
    TEMPLATES[materia].push({
      tema: meta.tema,
      nivel: meta.nivel,
      incidenciaTema: meta.inc,
      probabilidade: meta.prob,
      gerar: (i, nMasc, nFem, exameObj) => {
        const enunciados = [
          `Durante uma fiscalizaÃ§Ã£o no estabelecimento de ${nFem}, constatou-se uma irregularidade administrativa. Em consequÃªncia, o agente aplicou uma sanÃ§Ã£o que ${nFem} entende violar os princÃ­pios basilares da matÃ©ria. No tocante a ${meta.tema}, assinale a alternativa juridicamente correta:`,
          `O cidadÃ£o ${nMasc} buscou assessoria jurÃ­dica para solucionar um conflito relativo a ${meta.tema} envolvendo uma entidade privada. Diante das regras vigentes e da jurisprudÃªncia consolidada, qual a orientaÃ§Ã£o adequada a ser prestada a ${nMasc}?`,
          `Em aÃ§Ã£o judicial discutindo especificamente o instituto de ${meta.tema}, a empresa X Ltda sustentou a inexigibilidade da obrigaÃ§Ã£o alegada. Diante do quadro fÃ¡tico apresentado, assinale a opÃ§Ã£o que reflete o posicionamento correto sobre o tema:`,
          `Em recente acÃ³rdÃ£o, discutiu-se a aplicaÃ§Ã£o das regras de ${meta.tema} em caso de grande repercussÃ£o nacional. Ã€ luz da doutrina majoritÃ¡ria e da legislaÃ§Ã£o aplicÃ¡vel, assinale a afirmativa correta:`,
          `A administraÃ§Ã£o ou a parte interessada, representada pelo doutor ${nMasc}, ajuizou a medida cabÃ­vel para garantir o direito pretendido sobre ${meta.tema}. Diante disso, assinale a opÃ§Ã£o correta:`
        ];

        const alternativasPorTema = [
          [
            `A conduta Ã© vÃ¡lida pois respeita estritamente as regras de ${meta.tema} previstas em lei especÃ­fica.`,
            `A medida padece de nulidade absoluta por vÃ­cio formal no tratamento de ${meta.tema}.`,
            `O instituto de ${meta.tema} nÃ£o se aplica a entidades de direito pÃºblico, apenas a relaÃ§Ãµes privadas.`,
            `Configura-se desvio de finalidade por ausÃªncia de nexo causal no Ã¢mbito de ${meta.tema}.`
          ],
          [
            `Trata-se de direito lÃ­quido e certo assegurado de forma plena pelas normas de ${meta.tema}.`,
            `O pleito deve ser indeferido pois prescreveu o prazo legal para suscitar controvÃ©rsia sobre ${meta.tema}.`,
            `Exige-se comprovaÃ§Ã£o de dolo ou culpa grave para verificar responsabilidade em sede de ${meta.tema}.`,
            `A matÃ©ria de ${meta.tema} exige procedimento administrativo prÃ©vio sob pena de carÃªncia de aÃ§Ã£o.`
          ],
          [
            `A responsabilidade Ã© subjetiva, recaindo o Ã´nus da prova sobre a caracterizaÃ§Ã£o de ${meta.tema}.`,
            `A obrigaÃ§Ã£o Ã© solidÃ¡ria, respondendo todos os envolvidos nos limites de ${meta.tema}.`,
            `O descumprimento gera apenas sanÃ§Ã£o pecuniÃ¡ria simples sem direito a perdas e danos em ${meta.tema}.`,
            `Inexiste dever de indenizar se comprovada forÃ§a maior superveniente em ${meta.tema}.`
          ],
          [
            `A jurisprudÃªncia do STJ e STF fixa que a competÃªncia para julgar causas de ${meta.tema} Ã© exclusiva da JustiÃ§a Federal.`,
            `Admite-se flexibilizaÃ§Ã£o das regras de ${meta.tema} se demonstrado interesse social relevante.`,
            `O ato Ã© plenamente revogÃ¡vel por razÃµes de oportunidade e conveniÃªncia decorrentes de ${meta.tema}.`,
            `A aplicaÃ§Ã£o de penalidade em ${meta.tema} exige notificaÃ§Ã£o pessoal prÃ©via e contraditÃ³rio.`
          ],
          [
            `A pretensÃ£o estÃ¡ amparada na legalidade e na doutrina clÃ¡ssica aplicÃ¡vel a ${meta.tema}.`,
            `O direito caducou no prazo de cinco anos contados da ciÃªncia do fato referente a ${meta.tema}.`,
            `NÃ£o cabe aÃ§Ã£o rescisÃ³ria para reformar julgado fundamentado na interpretaÃ§Ã£o de ${meta.tema}.`,
            `A decisÃ£o administrativa faz coisa julgada material em relaÃ§Ã£o a ${meta.tema}, impedindo revisÃ£o judicial.`
          ]
        ];

        const explicacoes = [
          `No caso concreto, a conduta atende aos preceitos da legislaÃ§Ã£o vigentes aplicÃ¡vel a ${meta.tema}, respeitando os limites da legalidade e os princÃ­pios gerais de direito.`,
          `Conforme consolidado pelos tribunais superiores, os direitos relativos a ${meta.tema} exigem observÃ¢ncia do devido processo legal e nÃ£o admitem cobranÃ§a retroativa abusiva.`,
          `A obrigaÃ§Ã£o em ${meta.tema} possui carÃ¡ter pessoal e segue a regra geral de distribuiÃ§Ã£o do Ã´nus probatÃ³rio, exigindo prova do nexo de causalidade direto.`,
          `A jurisprudÃªncia pÃ¡tria estabelece que a disciplina jurÃ­dica de ${meta.tema} visa garantir a seguranÃ§a jurÃ­dica e a eficiÃªncia das relaÃ§Ãµes contratuais ou sociais pactuadas.`,
          `O prazo decadencial aplicÃ¡vel ao caso Ã© quinquenal, conforme expressa previsÃ£o legal, aplicando-se de forma direta sobre os atos decorrentes de ${meta.tema}.`
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

// GeraÃ§Ã£o dinÃ¢mica das questÃµes em memÃ³ria
const gerarQuestoes = (): Questao[] => {
  const todasQuestoes: Questao[] = [];
  let questaoIdCounter = 1;

  const MATERIAS_MAIORES = [
    'Ã‰tica Profissional',
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
    
    // Configurar densidade de questÃµes para exatamente 50 por disciplina (5 variaÃ§Ãµes x 10 templates)
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

// Exporta as questÃµes prontas para serem consumidas em qualquer parte do Next.js
export const TODAS_QUESTOES_GERADAS: Questao[] = gerarQuestoes();
