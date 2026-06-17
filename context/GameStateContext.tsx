'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const GameStateContext = createContext<any>(null);

export const GameStateProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user-game-data');
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

    if (savedUser) {
      const userData = JSON.parse(savedUser);
      const lastAccess = userData.lastAccess; // Data do último login

      // Lógica de Streak
      let newStreak = userData.streak || 0;
      
      // Criar data de ontem para comparar
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (lastAccess !== today) {
        if (lastAccess === yesterdayStr) {
          // Estudou ontem, incrementa
          newStreak += 1;
        } else {
          // Ficou mais de 24h sem entrar, reseta para 1
          newStreak = 1;
        }
      }

      // Atualiza usuário com a nova lógica
      const updatedUser = {
        ...userData,
        streak: newStreak,
        lastAccess: today
      };
      
      setUser(updatedUser);
      localStorage.setItem('user-game-data', JSON.stringify(updatedUser));
    } else {
      // Usuário novo
      const newUser = {
        nome: "Candidato",
        streak: 1,
        lastAccess: today,
        isPremium: false,
        isAdmin: false
      };
      setUser(newUser);
      localStorage.setItem('user-game-data', JSON.stringify(newUser));
    }
  }, []);

  return (
    <GameStateContext.Provider value={{ user, setUser }}>
      {children}
    </GameStateContext.Provider>
  );
};

export const useGameState = () => useContext(GameStateContext);