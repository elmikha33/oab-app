'use client';

import React, { useState } from 'react';
import { useGameState } from '../../context/GameStateContext';
import { MATERIAS } from '../../lib/mockData';
import { ShieldCheck, Plus, Trash2, Edit2, Users, BookOpen, Layers, Award, Target } from 'lucide-react';

export default function AdminPage() {
  const { 
    user, 
    questoes, 
    ranking, 
    missoes,
    criarQuestao, 
    editarQuestao, 
    excluirQuestao,
    criarMissao,
    excluirUsuarioSimulado 
  } = useGameState();

  const [abaAtiva, SetAbaAtiva] = useState<'questoes' | 'usuarios' | 'missoes'>('questoes');
  
  // Estados para Modal de Questão
  const [modalQuestaoAberto, SetModalQuestaoAberto] = useState(false);
  const [editandoQuestaoId, SetEditandoQuestaoId] = useState<string | null>(null);
  
  const [materia, SetMateria] = useState('Ética Profissional');
  const [tema, SetTema] = useState('');
  const [nivel, SetNivel] = useState<'Fácil' | 'Médio' | 'Difícil'>('Médio');
  const [enunciado, SetEnunciado] = useState('');
  const [alternativas, SetAlternativas] = useState<string[]>(['', '', '', '']);
  const [gabarito, SetGabarito] = useState(0);
  const [explicacao, SetExplicacao] = useState('');

  // Estados para Modal de Missão
  const [modalMissaoAberto, SetModalMissaoAberto] = useState(false);
  const [missaoTitulo, SetMissaoTitulo] = useState('');
  const [missaoDesc, SetMissaoDesc] = useState('');
  const [missaoXp, SetMissaoXp] = useState(100);
  const [missaoMoedas, SetMissaoMoedas] = useState(20);
  const [missaoMeta, SetMissaoMeta] = useState(5);
  const [missaoTipo, SetMissaoTipo] = useState<'total_questoes' | 'questoes_materia' | 'acertos_seguidos'>('total_questoes');
  const [missaoMateria, SetMissaoMateria] = useState('Ética Profissional');

  if (!user) return null;

  // Abrir modal para criar nova questão
  const abrirCriarQuestao = () => {
    SetEditandoQuestaoId(null);
    SetMateria('Ética Profissional');
    SetTema('');
    SetNivel('Médio');
    SetEnunciado('');
    SetAlternativas(['', '', '', '']);
    SetGabarito(0);
    SetExplicacao('');
    SetModalQuestaoAberto(true);
  };

  // Abrir modal para editar questão
  const abrirEditarQuestao = (q: any) => {
    SetEditandoQuestaoId(q.id);
    SetMateria(q.materia);
    SetTema(q.tema);
    SetNivel(q.nivel);
    SetEnunciado(q.enunciado);
    SetAlternativas([...q.alternativas]);
    SetGabarito(q.gabarito);
    SetExplicacao(q.explicacao);
    SetModalQuestaoAberto(true);
  };

  const salvarQuestao = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações básicas
    if (!tema.trim() || !enunciado.trim() || !explicacao.trim()) return;
    if (alternativas.some(alt => !alt.trim())) return;

    const questaoData = {
      materia,
      tema: tema.trim(),
      nivel,
      enunciado: enunciado.trim(),
      alternativas,
      gabarito,
      explicacao: explicacao.trim(),
      exame: 'Criado pelo Admin',
      incidenciaTema: 0,
      probabilidade: 'Média' as const,
    };

    if (editandoQuestaoId) {
      editarQuestao({ ...questaoData, id: editandoQuestaoId });
    } else {
      criarQuestao(questaoData);
    }

    SetModalQuestaoAberto(false);
  };

  const handleAltChange = (index: number, val: string) => {
    const novas = [...alternativas];
    novas[index] = val;
    SetAlternativas(novas);
  };

  const salvarMissao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!missaoTitulo.trim() || !missaoDesc.trim()) return;

    criarMissao({
      titulo: missaoTitulo.trim(),
      descricao: missaoDesc.trim(),
      xpRecompensa: Number(missaoXp),
      moedasRecompensa: Number(missaoMoedas),
      meta: Number(missaoMeta),
      tipo: missaoTipo,
      materia: missaoTipo === 'questoes_materia' ? missaoMateria : undefined
    });

    SetModalMissaoAberto(false);
    // Limpar
    SetMissaoTitulo('');
    SetMissaoDesc('');
  };

  return (
    <div className="space-y-6 pb-10">
      
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 glass-premium">
        <div className="space-y-1">
          <h1 className="font-heading font-extrabold text-2xl md:text-3xl text-white flex items-center gap-2">
            <ShieldCheck className="h-8 w-8 text-emerald-400" />
            <span>Painel do Administrador</span>
          </h1>
          <p className="text-slate-400 text-sm">
            Gerenciamento geral da plataforma Missão OAB: questões, missões e alunos.
          </p>
        </div>
      </div>

      {/* Estatísticas Rápidas da Plataforma */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <BookOpen className="h-8 w-8 text-brand-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Total Questões</span>
            <span className="font-heading font-extrabold text-lg text-white">{questoes.length}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <Users className="h-8 w-8 text-blue-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Alunos Ativos</span>
            <span className="font-heading font-extrabold text-lg text-white">{ranking.length}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <Target className="h-8 w-8 text-orange-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Missões Ativas</span>
            <span className="font-heading font-extrabold text-lg text-white">{missoes.length}</span>
          </div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
          <Layers className="h-8 w-8 text-emerald-400 shrink-0" />
          <div>
            <span className="text-[10px] text-slate-500 font-bold block uppercase">Disciplinas</span>
            <span className="font-heading font-extrabold text-lg text-white">{MATERIAS.length}</span>
          </div>
        </div>
      </div>

      {/* Navegação entre abas */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => SetAbaAtiva('questoes')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors ${
            abaAtiva === 'questoes' ? 'text-brand-400 border-b-2 border-brand-500' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          Questões
        </button>
        <button
          onClick={() => SetAbaAtiva('usuarios')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors ${
            abaAtiva === 'usuarios' ? 'text-brand-400 border-b-2 border-brand-500' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          Usuários
        </button>
        <button
          onClick={() => SetAbaAtiva('missoes')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors ${
            abaAtiva === 'missoes' ? 'text-brand-400 border-b-2 border-brand-500' : 'text-slate-500 hover:text-slate-350'
          }`}
        >
          Missões
        </button>
      </div>

      {/* ==========================================
          ABA 1: QUESTÕES (Tabela e CRUD)
          ========================================== */}
      {abaAtiva === 'questoes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-bold text-lg text-white">Banco de Questões</h3>
            <button
              onClick={abrirCriarQuestao}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Nova Questão</span>
            </button>
          </div>

          {/* Lista de Questões */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Matéria</th>
                    <th className="py-3 px-4">Tema</th>
                    <th className="py-3 px-4 text-center">Nível</th>
                    <th className="py-3 px-4">Enunciado</th>
                    <th className="py-3 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                  {questoes.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-950/20">
                      <td className="py-3 px-4 font-semibold text-brand-400 min-w-[120px]">{q.materia}</td>
                      <td className="py-3 px-4 min-w-[120px]">{q.tema}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          q.nivel === 'Fácil' ? 'bg-emerald-500/10 text-emerald-400' :
                          q.nivel === 'Médio' ? 'bg-yellow-500/10 text-yellow-400' :
                          'bg-red-500/10 text-red-400'
                        }`}>
                          {q.nivel}
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate">{q.enunciado}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => abrirEditarQuestao(q)}
                            className="p-1.5 text-blue-400 hover:bg-blue-500/10 rounded"
                            title="Editar Questão"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => excluirQuestao(q.id)}
                            className="p-1.5 text-red-400 hover:bg-red-500/10 rounded"
                            title="Excluir Questão"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          ABA 2: USUÁRIOS
          ========================================== */}
      {abaAtiva === 'usuarios' && (
        <div className="space-y-4">
          <h3 className="font-heading font-bold text-lg text-white">Usuários Simulados (Leaderboard)</h3>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Nome</th>
                  <th className="py-3 px-4 text-center">Nível</th>
                  <th className="py-3 px-4">Patente</th>
                  <th className="py-3 px-4 text-right">XP Acumulado</th>
                  <th className="py-3 px-4 text-center w-24">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-350">
                {ranking.map((usr) => (
                  <tr key={usr.id} className="hover:bg-slate-950/20">
                    <td className="py-3 px-4 text-slate-200 font-medium">{usr.nome}</td>
                    <td className="py-3 px-4 text-center">{usr.nivel}</td>
                    <td className="py-3 px-4">{usr.titulo}</td>
                    <td className="py-3 px-4 text-right pr-6 font-bold text-brand-400">{usr.xpSemanal} XP</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => excluirUsuarioSimulado(usr.id)}
                        disabled={usr.id === 'usuario_atual'}
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded disabled:opacity-40"
                        title="Remover Usuário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==========================================
          ABA 3: MISSÕES
          ========================================== */}
      {abaAtiva === 'missoes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-heading font-bold text-lg text-white">Lista de Missões Ativas</h3>
            <button
              onClick={() => SetModalMissaoAberto(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Criar Missão</span>
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {missoes.map((m) => (
              <div key={m.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-heading font-bold text-sm text-slate-200">{m.titulo}</h4>
                    <span className="text-[10px] text-brand-400 font-semibold">{m.tipo}</span>
                  </div>
                  <span className="bg-slate-950 border border-slate-850 px-2 py-0.5 rounded text-[10px] text-yellow-500 font-bold">
                    Meta: {m.meta}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{m.descricao}</p>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
                  <span>Recompensa XP: +{m.xpRecompensa} XP</span>
                  <span>Moedas: 🪙 +{m.moedasRecompensa}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DE QUESTÃO (Criar / Editar)
          ========================================== */}
      {modalQuestaoAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-lg text-white">
                {editandoQuestaoId ? 'Editar Questão' : 'Adicionar Nova Questão'}
              </h3>
              <button onClick={() => SetModalQuestaoAberto(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={salvarQuestao} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">Matéria</label>
                  <select
                    value={materia}
                    onChange={(e) => SetMateria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                  >
                    {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">Tema (Subtópico)</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Recursos no Processo"
                    value={tema}
                    onChange={(e) => SetTema(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">Dificuldade</label>
                  <select
                    value={nivel}
                    onChange={(e) => SetNivel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                  >
                    <option value="Fácil">Fácil</option>
                    <option value="Médio">Médio</option>
                    <option value="Difícil">Difícil</option>
                  </select>
                </div>
              </div>

              {/* Enunciado */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Enunciado da Questão</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Escreva o enunciado completo da questão aqui..."
                  value={enunciado}
                  onChange={(e) => SetEnunciado(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                />
              </div>

              {/* Alternativas */}
              <div className="space-y-2">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Alternativas de Resposta</label>
                {alternativas.map((alt, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <span className="font-bold text-slate-500">{(['A','B','C','D','E'])[index]}</span>
                    <input
                      type="text"
                      required
                      placeholder={`Alternativa ${(['A','B','C','D','E'])[index]}...`}
                      value={alt}
                      onChange={(e) => handleAltChange(index, e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Gabarito */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Alternativa Correta (Gabarito)</label>
                <select
                  value={gabarito}
                  onChange={(e) => SetGabarito(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                >
                  <option value={0}>Alternativa A</option>
                  <option value={1}>Alternativa B</option>
                  <option value={2}>Alternativa C</option>
                  <option value={3}>Alternativa D</option>
                </select>
              </div>

              {/* Explicação */}
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Explicação Jurídica / Detalhada</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explicação de acordo com a CLT/Constituição para exibir após a resposta do aluno..."
                  value={explicacao}
                  onChange={(e) => SetExplicacao(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-all"
              >
                Salvar Questão
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DE MISSÃO (Criar)
          ========================================== */}
      {modalMissaoAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-heading font-bold text-lg text-white">Criar Nova Missão Diária</h3>
              <button onClick={() => SetModalMissaoAberto(false)} className="text-slate-400 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <form onSubmit={salvarMissao} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Título da Missão</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mestre Constitucional"
                  value={missaoTitulo}
                  onChange={(e) => SetMissaoTitulo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Acerte 5 questões de Direito Constitucional."
                  value={missaoDesc}
                  onChange={(e) => SetMissaoDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">XP</label>
                  <input
                    type="number"
                    required
                    value={missaoXp}
                    onChange={(e) => SetMissaoXp(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">Moedas</label>
                  <input
                    type="number"
                    required
                    value={missaoMoedas}
                    onChange={(e) => SetMissaoMoedas(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">Meta (Qtd)</label>
                  <input
                    type="number"
                    required
                    value={missaoMeta}
                    onChange={(e) => SetMissaoMeta(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 uppercase font-bold block">Tipo de Regra</label>
                <select
                  value={missaoTipo}
                  onChange={(e) => SetMissaoTipo(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                >
                  <option value="total_questoes">Total de Questões Respondidas</option>
                  <option value="questoes_materia">Questões de Matéria Específica</option>
                  <option value="acertos_seguidos">Acertos Consecutivos</option>
                </select>
              </div>

              {missaoTipo === 'questoes_materia' && (
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold block">Escolha a Disciplina</label>
                  <select
                    value={missaoMateria}
                    onChange={(e) => SetMissaoMateria(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl outline-none"
                  >
                    {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs transition-all animate-pulse"
              >
                Criar Missão Diária
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
