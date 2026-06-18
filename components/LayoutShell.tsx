'use client';

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  // MODO BYPASS - Sem proteção para focar no desenvolvimento
  return <>{children}</>;
}