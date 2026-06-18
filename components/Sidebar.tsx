'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { useGameState } from '../context/GameStateContext';
import { getProgressionInfo } from '../lib/progression';
<<<<<<< HEAD
import { 
  LayoutDashboard, BookOpen, Swords, Calendar, Award, 
  Crown, Flame, Scale 
} from 'lucide-react';
=======
import { Award, BookOpen, Calendar, Crown, Flame, LayoutDashboard, Scale } from 'lucide-react';

const links = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  {
    name: 'Responder Questões',
    href: '/play',
    icon: BookOpen,
    featured: true,
  },
  { name: 'Modo Revisão', href: '/review', icon: Calendar },
  { name: 'Classificação', href: '/ranking', icon: Award },
  { name: 'Seja Premium', href: '/premium', icon: Crown },
];
>>>>>>> e1e1b23 (primeira versao)

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useGameState();

  if (!user) return null;

  const info = getProgressionInfo(user.streak || 0);
<<<<<<< HEAD

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
=======
  const goToStudy = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    try {
      confetti({
        particleCount: 150,
        spread: 72,
        origin: { y: 0.62 },
        colors: ['#fbbf24', '#ffffff', '#8b5cf6'],
      });
    } finally {
      router.push('/play');
    }
  };

  return (
    <aside className="hidden min-h-screen w-64 flex-col border-r border-slate-800 bg-slate-950/95 p-4 text-slate-200 shadow-2xl shadow-black/20 md:flex">
      <Link href="/" className="mb-6 flex items-center gap-3 rounded-xl px-2 py-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/20">
          <Scale className="h-6 w-6" />
        </div>
        <span className="font-heading text-xl font-extrabold tracking-tight text-white">
          MISSÃO <span className="text-brand-400">OAB</span>
        </span>
      </Link>

      <div className="mb-5 rounded-xl border border-slate-800 bg-slate-900/70 p-4 shadow-xl shadow-black/10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 font-bold text-white shadow-lg shadow-brand-500/20">
            {user.nome.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-slate-100">{user.nome}</h4>
            <p className="truncate text-xs font-bold text-brand-400">{info.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-orange-500/15 bg-orange-500/10 px-3 py-2 font-semibold text-orange-300">
>>>>>>> e1e1b23 (primeira versao)
          <Flame className="h-4 w-4" />
          <span className="text-xs">{user.streak || 0} dias de ofensiva</span>
        </div>
      </div>

<<<<<<< HEAD
      <nav className="flex-1 space-y-1">
        {links.map((link: any) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link key={link.href} href={link.href} onClick={link.onClick} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-brand-600/20 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
              <Icon className="h-4 w-4" />
=======
      <nav className="flex-1 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;

          if (link.featured) {
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={goToStudy}
                className={`golden-nav-link flex min-h-12 items-center gap-3 rounded-xl px-3 py-3 text-sm font-extrabold text-white transition-transform duration-300 hover:-translate-y-0.5 ${
                  isActive ? 'ring-1 ring-yellow-300/60' : ''
                }`}
              >
                <Icon className="h-4.5 w-4.5 text-yellow-300" />
                <span>{link.name}</span>
              </Link>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                isActive
                  ? 'border border-brand-500/20 bg-brand-500/15 text-white'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
>>>>>>> e1e1b23 (primeira versao)
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> e1e1b23 (primeira versao)
