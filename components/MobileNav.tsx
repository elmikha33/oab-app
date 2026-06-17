'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGameState } from '../context/GameStateContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Swords, 
  Calendar,
  Award,
  Crown,
  LogOut,
  ShieldCheck,
  User2
} from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useGameState();
  const [menuAberto, setMenuAberto] = useState(false);

  if (!user) return null;

  const mainLinks = [
    { name: 'Painel', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Estudo', href: '/play', icon: BookOpen },
    { name: 'Chefe', href: '/play/boss', icon: Swords },
    { name: 'Revisar', href: '/review', icon: Calendar },
  ];

  return (
    <div className="md:hidden">
      {/* Menu Superior Compacto para Status do Usuário */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-slate-900/90 backdrop-blur border-b border-slate-800 px-4 flex items-center justify-between z-40">
        <div className="flex items-center gap-1.5">
          <span className="font-heading font-extrabold text-md text-white tracking-wide">
            MISSÃO <span className="text-brand-500">OAB</span>
          </span>
        </div>
        
        {/* Nível, Streak e Moedas no topo */}
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-0.5 text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/10">
            <span>🔥 {user.streak}d</span>
          </div>
          <div className="flex items-center gap-0.5 text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/10">
            <span>🪙 {user.moedas}</span>
          </div>
          <button 
            onClick={() => setMenuAberto(!menuAberto)}
            className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold"
          >
            {user.nome.charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      {/* Drawer do Perfil / Configurações (Aberto via Avatar) */}
      {menuAberto && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-80 max-w-[85vw] bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between h-full animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-heading font-bold text-lg text-white">Menu do Aluno</h3>
                <button 
                  onClick={() => setMenuAberto(false)} 
                  className="text-slate-400 hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Status Completo */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white text-lg">
                    {user.nome.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-white">{user.nome}</h4>
                    <span className="text-xs text-brand-400 font-medium">{user.nome === 'admin' ? 'Administrador' : 'Estudante'}</span>
                  </div>
                </div>

                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Nível {user.nivel} ({user.nome === 'admin' ? 'Mestre' : 'Estagiário'})</span>
                    <span>{user.xp} XP</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-brand-500 h-full rounded-full" 
                      style={{ width: `${Math.round((user.xp / user.xpNecessario) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Links Extras */}
              <div className="space-y-2">
                <Link
                  href="/achievements"
                  onClick={() => setMenuAberto(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    pathname === '/achievements' ? 'bg-brand-500/10 text-white' : 'text-slate-400'
                  }`}
                >
                  <Award className="h-4.5 w-4.5 text-brand-400" />
                  <span>Conquistas & Badges</span>
                </Link>
                
                <Link
                  href="/premium"
                  onClick={() => setMenuAberto(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                    pathname === '/premium' ? 'bg-yellow-500/10 text-white' : 'text-slate-400'
                  }`}
                >
                  <Crown className="h-4.5 w-4.5 text-yellow-500" />
                  <span className="flex items-center gap-2">
                    Seja Premium
                    {!user.isPremium && (
                      <span className="bg-yellow-500 text-slate-950 text-[9px] font-bold px-1 rounded">PRO</span>
                    )}
                  </span>
                </Link>

                {user.isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMenuAberto(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      pathname === '/admin' ? 'bg-emerald-500/10 text-white' : 'text-slate-400'
                    }`}
                  >
                    <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
                    <span>Painel Admin</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Logout no rodapé */}
            <button
              onClick={() => {
                setMenuAberto(false);
                logout();
              }}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors text-sm font-semibold"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de Navegação Inferior Flutuante */}
      <nav className="fixed bottom-4 left-4 right-4 h-16 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl flex items-center justify-around px-2 shadow-2xl shadow-black/50 z-40">
        {mainLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl transition-all ${
                isActive
                  ? 'text-brand-400 font-semibold scale-110'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span className="text-[10px] tracking-wide font-medium">{link.name}</span>
            </Link>
          );
        })}

        {/* Botão de Menu Mais */}
        <button
          onClick={() => setMenuAberto(true)}
          className={`flex flex-col items-center justify-center w-14 h-12 rounded-xl text-slate-500`}
        >
          <User2 className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] tracking-wide font-medium">Perfil</span>
        </button>
      </nav>
    </div>
  );
}
