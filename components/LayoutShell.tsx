'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import AchievementUnlockEffects from '@/components/AchievementUnlockEffects';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

type LayoutShellProps = {
  children: React.ReactNode;
};

const PUBLIC_ROUTES = ['/', '/auth'];

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();
  const [playSidebarCollapsed, setPlaySidebarCollapsed] = useState(false);

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/');

  const isPlayRoute = pathname === '/play' || pathname.startsWith('/play/');

  useEffect(() => {
    if (!isPlayRoute) {
      setPlaySidebarCollapsed(false);
    }
  }, [isPlayRoute]);

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <AchievementUnlockEffects />

      {(!isPlayRoute || !playSidebarCollapsed) && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      <div className="md:hidden">
        <MobileNav />
      </div>

      {isPlayRoute && (
        <button
          type="button"
          onClick={() => setPlaySidebarCollapsed((current) => !current)}
          className={
            playSidebarCollapsed
              ? 'fixed left-3 top-24 z-50 hidden h-12 w-12 items-center justify-center rounded-r-2xl border border-l-0 border-emerald-300 bg-emerald-600 text-white shadow-lg shadow-emerald-950/20 transition hover:bg-emerald-700 md:flex dark:border-emerald-300/40 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200'
              : 'fixed left-[342px] top-24 z-50 hidden h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-lg shadow-slate-950/10 transition hover:border-emerald-300 hover:text-emerald-700 md:flex dark:border-white/10 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-emerald-200'
          }
          aria-label={playSidebarCollapsed ? 'Mostrar sidebar' : 'Recolher sidebar'}
          title={playSidebarCollapsed ? 'Mostrar sidebar' : 'Recolher sidebar'}
        >
          {playSidebarCollapsed ? (
            <PanelLeftOpen className="h-5 w-5" strokeWidth={2.8} />
          ) : (
            <PanelLeftClose className="h-5 w-5" strokeWidth={2.8} />
          )}
        </button>
      )}

      <main
        className={`min-h-screen px-4 pb-8 pt-16 sm:px-5 md:px-8 md:pb-10 md:pt-8 ${
          isPlayRoute && playSidebarCollapsed ? 'md:ml-0' : 'md:ml-[330px]'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
