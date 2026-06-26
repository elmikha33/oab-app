'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  Award,
  BookOpen,
  Calendar,
  Crown,
  LayoutDashboard,
  Menu,
  Scale,
  X,
} from 'lucide-react';

const links = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Responder Questões', href: '/play', icon: BookOpen },
  { name: 'Modo Revisão', href: '/review', icon: Calendar },
  { name: 'Ranking', href: '/ranking', icon: Award },
  { name: 'Seja Premium', href: '/premium', icon: Crown },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-[99999] flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-xl lg:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" strokeWidth={3} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100000] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-label="Fechar menu"
          />

          <aside className="relative h-full w-[84vw] max-w-[340px] bg-white p-5 shadow-2xl dark:bg-slate-950">
            <div className="mb-7 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Scale className="h-6 w-6" />
                </div>

                <div>
                  <p className="text-2xl font-black text-slate-950 dark:text-white">
                    Leg<span className="text-emerald-600">Ⅰ</span>
                  </p>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-500">
                    Missão OAB
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="space-y-2">
              {links.map(({ name, href, icon: Icon }) => {
                const active = pathname === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-12 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-black ${
                      active
                        ? 'bg-emerald-600 text-white'
                        : 'text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {name}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <div className="pt-16 lg:pt-0">
        {children}
      </div>
    </>
  );
}