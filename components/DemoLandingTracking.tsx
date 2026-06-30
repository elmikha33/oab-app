'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, Gamepad2 } from 'lucide-react';
import { trackDemoEvent } from '@/lib/demoTracking';

export function LandingViewTracker() {
  useEffect(() => {
    trackDemoEvent('landing_view', {
      location: 'landing',
    });
  }, []);

  return null;
}

export function LandingDemoCta() {
  return (
    <Link
      href="/demo"
      onClick={() =>
        trackDemoEvent('demo_cta_click', {
          location: 'landing_hero',
        })
      }
      className="inline-flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-5 py-3 text-sm font-black text-emerald-950 shadow-xl shadow-emerald-950/30 transition hover:-translate-y-0.5 hover:bg-emerald-200"
    >
      <Gamepad2 className="h-5 w-5" strokeWidth={2.7} />
      Testar questões grátis
      <ArrowRight className="h-4 w-4" strokeWidth={3} />
    </Link>
  );
}
