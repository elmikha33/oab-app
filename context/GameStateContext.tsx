'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const GameStateContext = createContext<any>(null);

const conquistas = [
  { id: 'badge_first', titulo: 'Primeira questão', descricao: 'Respondeu a primeira questão no LegⅠ.', icone: 'award' },
  { id: 'badge_10_correct', titulo: 'Sequência inicial', descricao: 'Acertou 10 questões no total.', icone: 'award' },
];

function normalizarIdsQuestao(questaoId: number | string | Array<number | string>) {
  return (Array.isArray(questaoId) ? questaoId : [questaoId]).map((id) => String(id)).filter(Boolean);
}

function criarUsuario(base: any = {}) {
  const today = new Date().toISOString().split('T')[0];
  const nome = base.nome || 'Candidato';

  const questoesRespondidas = [
    ...new Set([...(base.questoesRespondidas || []), ...(base.questoesErradas || [])].map(String)),
  ];

  return {
    nome,
    streak: base.streak || 1,
    lastAccess: today,
    acertos: base.acertos || 0,
    moedas: base.moedas || 0,
    xp: 0,
    nivel: base.nivel || 1,
    xpNecessario: base.xpNecessario || 100,
    questoesRespondidas,
    questoesErradas: base.questoesErradas || [],
    revisaoIds: base.revisaoIds || [],
    freeDailyAnswers: base.freeDailyAnswers?.date === today ? base.freeDailyAnswers : { date: today, count: 0 },
    conquistasDesbloqueadas: base.conquistasDesbloqueadas || [],
    isPremium: base.isPremium || false,
    isAdmin: base.isAdmin || nome.toLowerCase() === 'admin',

    rankingScore: base.rankingScore || 0,
    rankingQuestions: base.rankingQuestions || 0,
    rankingActiveDays: base.rankingActiveDays || 0,
    rankingLastActiveDay: base.rankingLastActiveDay || null,
    rankingAnsweredIds: Array.isArray(base.rankingAnsweredIds) ? base.rankingAnsweredIds.map(String) : [],
    rankingMilestones: Array.isArray(base.rankingMilestones) ? base.rankingMilestones : [],
  };
}

function aplicarRanking(prev: any, questaoId: number | string | Array<number | string>) {
  const today = new Date().toISOString().split('T')[0];
  const ids = normalizarIdsQuestao(questaoId);

  const rankingAnsweredIds = (prev.rankingAnsweredIds || []).map(String);
  const novosIds = ids.filter((id) => !rankingAnsweredIds.includes(id));

  let bonusDia = 0;
  let rankingActiveDays = prev.rankingActiveDays || 0;
  let rankingLastActiveDay = prev.rankingLastActiveDay || null;

  if (rankingLastActiveDay !== today) {
    bonusDia = 3;
    rankingActiveDays += 1;
    rankingLastActiveDay = today;
  }

  const rankingMilestones = Array.isArray(prev.rankingMilestones) ? prev.rankingMilestones : [];
  let bonusSemana = 0;

  if (rankingActiveDays > 0 && rankingActiveDays % 7 === 0) {
    const milestone = `active-days-${rankingActiveDays}`;
    if (!rankingMilestones.includes(milestone)) {
      bonusSemana = 10;
      rankingMilestones.push(milestone);
    }
  }

  const pontosQuestoes = novosIds.length;

  return {
    ...prev,
    rankingScore: (prev.rankingScore || 0) + pontosQuestoes + bonusDia + bonusSemana,
    rankingQuestions: (prev.rankingQuestions || 0) + novosIds.length,
    rankingActiveDays,
    rankingLastActiveDay,
    rankingAnsweredIds: [...new Set([...rankingAnsweredIds, ...novosIds])],
    rankingMilestones: [...new Set(rankingMilestones)],
  };
}

export const GameStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user-game-data');
    const updatedUser = criarUsuario(savedUser ? JSON.parse(savedUser) : {});
    setUser(updatedUser);
    localStorage.setItem('user-game-data', JSON.stringify(updatedUser));
  }, []);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem('user-game-data', JSON.stringify(user));
  }, [user]);

  const loginMock = useCallback((nome: string) => {
    setUser(criarUsuario({ nome }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('user-game-data');
    setUser(null);
  }, []);

  const comprarPremium = useCallback(() => {
    setUser((prev: any) => (prev ? { ...prev, isPremium: true } : prev));
  }, []);

  const registrarRespostaFreeHoje = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];

    setUser((prev: any) => {
      if (!prev || prev.isPremium) return prev;
      const atual = prev.freeDailyAnswers?.date === today ? prev.freeDailyAnswers.count || 0 : 0;
      return { ...prev, freeDailyAnswers: { date: today, count: atual + 1 } };
    });
  }, []);

  const registrarAcerto = useCallback((questaoId: number | string | Array<number | string>) => {
    setUser((prev: any) => {
      if (!prev) return prev;

      const ids = normalizarIdsQuestao(questaoId);
      const respondidasAtuais = (prev.questoesRespondidas || []).map(String);
      const jaRespondida = ids.some((id) => respondidasAtuais.includes(id));
      const acertos = jaRespondida ? prev.acertos || 0 : (prev.acertos || 0) + 1;

      const conquistasDesbloqueadas = [
        ...new Set([...(prev.conquistasDesbloqueadas || []), 'badge_first', ...(acertos >= 10 ? ['badge_10_correct'] : [])]),
      ];

      const comRanking = aplicarRanking(prev, questaoId);

      return {
        ...comRanking,
        acertos,
        xp: 0,
        questoesRespondidas: [...new Set([...respondidasAtuais, ...ids])],
        questoesErradas: (prev.questoesErradas || []).filter((id: number | string) => !ids.includes(String(id))),
        conquistasDesbloqueadas: jaRespondida ? prev.conquistasDesbloqueadas || [] : conquistasDesbloqueadas,
      };
    });
  }, []);

  const registrarErro = useCallback((questaoId: number | string | Array<number | string>) => {
    setUser((prev: any) => {
      if (!prev) return prev;

      const ids = normalizarIdsQuestao(questaoId);
      const comRanking = aplicarRanking(prev, questaoId);

      return {
        ...comRanking,
        xp: 0,
        questoesRespondidas: [...new Set([...(prev.questoesRespondidas || []).map(String), ...ids])],
        questoesErradas: [...new Set([...(prev.questoesErradas || []).map(String), ...ids])],
      };
    });
  }, []);

  const resetarAcertos = useCallback(() => {
    setUser((prev: any) => {
      if (!prev) return prev;

      return {
        ...prev,
        acertos: 0,
        xp: 0,
        moedas: 0,
        questoesRespondidas: [],
        questoesErradas: [],
        revisaoIds: [],
        conquistasDesbloqueadas: [],
      };
    });
  }, []);

  return (
    <GameStateContext.Provider
      value={{
        user,
        setUser,
        loginMock,
        logout,
        comprarPremium,
        registrarRespostaFreeHoje,
        registrarAcerto,
        registrarErro,
        resetarAcertos,
        conquistas,
        stats: {},
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => useContext(GameStateContext);
