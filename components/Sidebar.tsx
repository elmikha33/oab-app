'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useGameState } from '../context/GameStateContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Swords, 
  Calendar, 
  Award, 
  ShieldAlert,
  Crown,
  LogOut,
  Flame,
  Scale
} from 'lucide-react';

// Função que define a patente baseada na streak
const getPatentePorStreak = (streak: number) => {
  if (streak === 0) return "Iniciante";
  if (streak < 5) return "Estudante";
  if (streak < 10) return "Bacharelando";
  if (streak < 20) return "Advogado em Ascensão";
  return "Mestre da OAB";
};

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useGameState();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/auth');
      router.refresh();
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#facc15', '#ffffff'],
    });
  };

  if (!user) return null;

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Responder Questões', href: '/play', icon: BookOpen, onClick: triggerConfetti },
    { name: 'Chefe do Dia', href: '/play/boss', icon: Swords },
    { name: 'Modo Revisão', href: '/review', icon: Calendar },
    { name: 'Classificação', href: '/ranking', icon: TrophyIcon },
    { name: 'Conquistas', href: '/achievements', icon: Award },
    { name: 'Seja Premium', href: '/premium', icon: Crown, premium: true },
  ];

  if (user.isAdmin) {
    links.push({ name: 'Admin', href: '/admin', icon: ShieldAlert, premium: false });
  }

  function TrophyIcon(props: any) {
    return (
      <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
        <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
        <path d="M4 22h16" />
        <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
        <path d="M12 2a6 6 0 0 1 6 6v5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
      </svg>
    );
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 min-h-screen text-slate-200">
      
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 px-2 py-4 mb-6 cursor-pointer hover:opacity-90 transition-all block">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 p-2 rounded-lg glow-purple">
            <Scale className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-xl text-white tracking-wide block">
              MISSÃO <span className="text-brand-500">OAB</span>
            </span>
            <span className="text-xs text-slate-400 block -mt-1">Preparação Gamificada</span>
          </div>
        </div>
      </Link>

      {/* Perfil Simplificado com Patente */}
      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center font-heading font-bold text-white text-lg ring-2 ring-brand-500/50 shadow-lg shadow-brand-500/20">
            {user.nome.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <h4 className="font-semibold text-sm text-slate-200 truncate">{user.nome}</h4>
            <p className="text-xs text-brand-400 font-bold uppercase tracking-wider">{getPatentePorStreak(user.streak || 0)}</p>
          </div>
        </div>

        {/* Ofensiva */}
        <div className="flex items-center gap-2 text-orange-500 font-semibold bg-slate-900/50 py-2 px-3 rounded-lg border border-slate-800">
          <Flame className="h-4 w-4" />
          <span className="text-xs">{user.streak || 0} dias de ofensiva</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1">
        {links.map((link: any) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link 
              key={link.href} 
              href={link.href} 
              onClick={link.onClick}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-brand-600/20 border border-brand-500/30 text-white font-semibold' : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'}`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-brand-400' : 'text-slate-400'}`} />
                <span>{link.name}</span>
              </div>
              {link.premium && !user.isPremium && (
                <span className="bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider scale-90">PRO</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair da Conta</span>
        </button>
      </div>
    </aside>
  );
}