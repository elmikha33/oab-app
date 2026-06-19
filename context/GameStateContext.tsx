'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const GameStateContext = createContext<any>(null);

const conquistas = [
  {
    id: 'badge_first',
    titulo: 'Primeira questao',
    descricao: 'Respondeu a primeira questao no Missao OAB.',
    icone: 'award',
  },
  {
    id: 'badge_10_correct',
    titulo: 'Sequencia inicial',
    descricao: 'Acertou 10 questoes no total.',
    icone: 'award',
  },
];

function normalizarIdsQuestao(questaoId: number | string | Array<number | string>) {
  return (Array.isArray(questaoId) ? questaoId : [questaoId])
    .map((id) => String(id))
    .filter(Boolean);
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
    xp: base.xp || 0,
    nivel: base.nivel || 1,
    xpNecessario: base.xpNecessario || 100,
    questoesRespondidas,
    questoesErradas: base.questoesErradas || [],
    revisaoIds: base.revisaoIds || [],
    conquistasDesbloqueadas: base.conquistasDesbloqueadas || [],
    isPremium: base.isPremium || false,
    isAdmin: base.isAdmin || nome.toLowerCase() === 'admin',
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

  const registrarAcerto = useCallback((questaoId: number | string | Array<number | string>) => {
    setUser((prev: any) => {
      if (!prev) return prev;

      const ids = normalizarIdsQuestao(questaoId);
      const respondidasAtuais = (prev.questoesRespondidas || []).map(String);
      const jaRespondida = ids.some((id) => respondidasAtuais.includes(id));
      const acertos = (prev.acertos || 0) + 1;
      const conquistasDesbloqueadas = [
        ...new Set([
          ...(prev.conquistasDesbloqueadas || []),
          'badge_first',
          ...(acertos >= 10 ? ['badge_10_correct'] : []),
        ]),
      ];

      return {
        ...prev,
        acertos,
        xp: (prev.xp || 0) + 10,
        moedas: (prev.moedas || 0) + 1,
        questoesRespondidas: [
          ...new Set([...respondidasAtuais, ...ids]),
        ],
        questoesErradas: (prev.questoesErradas || []).filter(
          (id: number | string) => !ids.includes(String(id))
        ),
        conquistasDesbloqueadas: jaRespondida ? prev.conquistasDesbloqueadas || [] : conquistasDesbloqueadas,
      };
    });
  }, []);

  const registrarErro = useCallback((questaoId: number | string | Array<number | string>) => {
    setUser((prev: any) => {
      if (!prev) return prev;

      const ids = normalizarIdsQuestao(questaoId);

      return {
        ...prev,
        questoesRespondidas: [
          ...new Set([...(prev.questoesRespondidas || []).map(String), ...ids]),
        ],
        questoesErradas: [
          ...new Set([...(prev.questoesErradas || []).map(String), ...ids]),
        ],
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
        registrarAcerto,
        registrarErro,
        conquistas,
        stats: {},
      }}
    >
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => useContext(GameStateContext);
