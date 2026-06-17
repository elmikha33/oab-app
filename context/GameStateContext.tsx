'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

const GameStateContext = createContext<any>(null);

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState({ nome: "Candidato", nivel: 1, moedas: 0, streak: 0, xp: 0 });
  const [missoes, setMissoes] = useState<any[]>([]);

  // Carregar dados e calcular Streak
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('gameState') || '{}');
    const lastDate = localStorage.getItem('lastPlayDate');
    const today = new Date().toDateString();

    // Lógica simples de Streak
    let streak = saved.streak || 0;
    if (lastDate && lastDate !== today) {
       const diff = new Date(today).getTime() - new Date(lastDate).getTime();
       if (diff > 86400000) streak = 0; // Reset se passou de 24h
    }
    setUser({ ...user, ...saved, streak });
  }, []);

  const atualizarProgresso = (xpGanhos: number, moedasGanhas: number) => {
    const novoXP = user.xp + xpGanhos;
    const novoNivel = Math.floor(novoXP / 500) + 1; // Nível sobe a cada 500 XP
    const novoEstado = { 
        ...user, 
        xp: novoXP, 
        moedas: user.moedas + moedasGanhas, 
        nivel: novoNivel 
    };
    setUser(novoEstado);
    localStorage.setItem('gameState', JSON.stringify(novoEstado));
    localStorage.setItem('lastPlayDate', new Date().toDateString());
  };

  return (
    <GameStateContext.Provider value={{ user, missoes, atualizarProgresso, setMissoes }}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = () => useContext(GameStateContext);