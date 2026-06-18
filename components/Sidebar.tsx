'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useGameState } from '../context/GameStateContext';
import { getProgressionInfo } from '../lib/progression';
import { 
  LayoutDashboard, BookOpen, Swords, Calendar, Award, 
  Crown, Flame, Scale 
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useGameState();

  if (!user) return null;

  const info = getProgressionInfo(user.streak || 0);

  const links = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Responder Questões', href: '/play', icon: BookOpen, onClick: () => confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }) },
    { name: 'Chefe do Dia', href: '/play/boss', icon: Swords },
    { name: 'Modo Revisão', href: '/review', icon: Calendar },
    { name: 'Classificação', href: '/ranking', icon: Award },
    { name: 'Seja Premium', href: '/premium', icon: Crown },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 p-4 min-h-screen text-slate-200">
      <Link href="/" className="flex items-center gap-2 px-2 py-4 mb-6">
        <div className="bg-brand-600 p-2 rounded-lg"><Scale className="h-6 w-6 text-white" /></div>
        <span className="font-heading font-extrabold text-xl text-white">MISSÃO <span className="text-brand-500">OAB</span></span>
      </Link>

      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center font-bold text-white shadow-lg">
            {user.nome.charAt(0).toUpperCase()}
          </div>
          <div>
            <h4 className="font-semibold text-sm text-slate-200 truncate">{user.nome}</h4>
            {/* Removido o uppercase daqui */}
            <p className="text-xs text-brand-400 font-bold tracking-wider">{info.title}</p>
          </div>
        </div>
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
            <Link key={link.href} href={link.href} onClick={link.onClick} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brand-600/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Icon className="h-4 w-4" />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}