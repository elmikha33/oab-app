'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

type LayoutShellProps = {
  children: React.ReactNode;
};

const PUBLIC_ROUTES = ['/', '/auth'];

export default function LayoutShell({ children }: LayoutShellProps) {
  const pathname = usePathname();

  const isPublicRoute =
    PUBLIC_ROUTES.includes(pathname) ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/');

  if (isPublicRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="md:hidden">
        <MobileNav />
      </div>

      <main className="min-h-screen px-4 pb-8 pt-16 sm:px-5 md:ml-[300px] md:px-8 md:pb-10 md:pt-8">
        {children}
      </main>
    </div>
  );
}