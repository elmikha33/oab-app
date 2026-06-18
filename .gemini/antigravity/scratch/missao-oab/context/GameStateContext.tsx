'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Inicialização Segura ---
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- Interfaces ---
export interface Conquista {
  id: string; titulo: string; descricao: string; icone: string; 
  xpRecompensa: number; moedasRecompensa: number;
}

export interface UserState {
  id: string; nome: string; nivel: number; xp: number; xpNecessario: number; 
  streak: number; moedas: number; isPremium: boolean; isAdmin: boolean; 
  questoesRespondidas: number; questoesCorretas: number; combo: number; 
  conquistasDesbloqueadas: string[]; revisaoIds: string[];
  errosPorMateria: Record<string, number>; acertosPorMateria: Record<string, number>;
}

export interface RespostaResult { correta: boolean; xpGanho: number; moedasGanhas: number; }

interface GameStateContextType {
  user: UserState | null; loading: boolean; conquistas: Conquista[];
  questoes: any[]; ranking: any[]; missoes: any[];
  loginMock: (nome: string) => void; logout: () => void;
  updateXP: (amount: number) => void; updateMoedas: (amount: number) => void;
  recordAnswer: (materia: string, acertou: boolean) => void;
  comprarPremium: () => void; bossHp: number; playerHp: number;
  bossDerrotadoHoje: boolean; combaterBoss: (dano: number) => void;
  resetarBatalhaBoss: () => void; buscarQuestaoDificil: (dificuldadeMinima: number) => Promise<any | null>;
  criarQuestao: (q: any) => Promise<void>; editarQuestao: (q: any) => Promise<void>;
  excluirQuestao: (id: string) => Promise<void>; criarMissao: (m: any) => Promise<void>;
  excluirUsuarioSimulado: (id: string) => Promise<void>;
  responderQuestao: (questaoId: string, alternativa: number) => RespostaResult;
  alternarFavoritoRevisao: (questaoId: string) => void;
}

const GameStateContext = createContext<GameStateContextType | undefined>(undefined);

export const GameStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [bossHp, setBossHp] = useState(100);
  const [playerHp, setPlayerHp] = useState(100);
  const [bossDerrotadoHoje] = useState(false);
  
  const [conquistas] = useState<Conquista[]>([{ id: '1', titulo: 'Iniciante', descricao: 'Responda 1 questão', icone: '🏆', xpRecompensa: 100, moedasRecompensa: 50 }]);
  const [questoes] = useState<any[]>([]);
  const [ranking] = useState<any[]>([]);
  const [missoes] = useState<any[]>([]);

  useEffect(() => {
    const localUser = localStorage.getItem('missao_oab_user');
    if (localUser) setUser(JSON.parse(localUser));
    setLoading(false);
  }, []);

  // --- Funções de Estado (Handers) ---
  const loginMock = (nome: string) => {
    const newUser: UserState = {
      id: 'user_123', nome, nivel: 1, xp: 0, xpNecessario: 500, streak: 0,
      moedas: 50, isPremium: false, isAdmin: nome === 'admin', questoesRespondidas: 0,
      questoesCorretas: 0, combo: 0, conquistasDesbloqueadas: [], revisaoIds: [],
      errosPorMateria: {}, acertosPorMateria: {}
    };
    setUser(newUser);
    localStorage.setItem('missao_oab_user', JSON.stringify(newUser));
  };

  const logout = () => { setUser(null); localStorage.removeItem('missao_oab_user'); };
  const updateXP = (amount: number) => setUser(prev => prev ? { ...prev, xp: prev.xp + amount } : null);
  const updateMoedas = (amount: number) => setUser(prev => prev ? { ...prev, moedas: prev.moedas + amount } : null);
  
  const recordAnswer = (materia: string, acertou: boolean) => {
    setUser(prev => prev ? {
      ...prev,
      questoesRespondidas: prev.questoesRespondidas + 1,
      questoesCorretas: acertou ? prev.questoesCorretas + 1 : prev.questoesCorretas,
    } : null);
  };

  const comprarPremium = () => {
    if (user) {
      const updatedUser = { ...user, isPremium: true };
      setUser(updatedUser);
      localStorage.setItem('missao_oab_user', JSON.stringify(updatedUser));
    }
  };

  const responderQuestao = (questaoId: string, alternativa: number): RespostaResult => {
    return { correta: true, xpGanho: 20, moedasGanhas: 10 };
  };

  const alternarFavoritoRevisao = (questaoId: string) => {
    setUser(prev => {
      if (!prev) return null;
      const novaRevisao = prev.revisaoIds.includes(questaoId) 
        ? prev.revisaoIds.filter(id => id !== questaoId)
        : [...prev.revisaoIds, questaoId];
      return { ...prev, revisaoIds: novaRevisao };
    });
  };

  // --- Funções Supabase ---
  const buscarQuestaoDificil = async (dificuldadeMinima: number) => {
    if (!supabase) return null;
    const { data } = await supabase.from('questoes_oab').select('*').gte('dificuldade', dificuldadeMinima).limit(1).single();
    return data;
  };

  // --- Memoização ---
  const contextValue = useMemo(() => ({
    user, loading, conquistas, questoes, ranking, missoes,
    loginMock, logout, updateXP, updateMoedas, recordAnswer, comprarPremium, 
    bossHp, playerHp, bossDerrotadoHoje, 
    combaterBoss: (d: number) => setBossHp(p => Math.max(0, p - d)), 
    resetarBatalhaBoss: () => { setBossHp(100); setPlayerHp(100); }, 
    buscarQuestaoDificil,
    criarQuestao: async (q: any) => console.log('Criar', q), 
    editarQuestao: async (q: any) => console.log('Editar', q), 
    excluirQuestao: async (id: string) => console.log('Excluir', id), 
    criarMissao: async (m: any) => console.log('Missao', m), 
    excluirUsuarioSimulado: async (id: string) => console.log('Excluir user', id),
    responderQuestao, alternarFavoritoRevisao
  }), [user, loading, bossHp, playerHp]);

  return <GameStateContext.Provider value={contextValue}>{children}</GameStateContext.Provider>;
};

export const useGameState = () => {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within provider');
  return ctx;
};