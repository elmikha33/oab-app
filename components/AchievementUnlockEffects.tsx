'use client';

import { useEffect, useState } from 'react';
import { Trophy } from 'lucide-react';
import useSoundEffects from '@/hooks/useSoundEffects';
import { ACHIEVEMENTS } from '@/lib/achievements';

type UnlockToast = {
  id: string;
  title: string;
  emoji: string;
};

function getVisibleAchievementBlock() {
  if (typeof document === 'undefined') return null;

  const blocks = Array.from(
    document.querySelectorAll<HTMLElement>('[data-achievement-miniatures="true"]')
  );

  return blocks.find((block) => {
    const style = window.getComputedStyle(block);
    return style.display !== 'none' && style.visibility !== 'hidden' && block.getClientRects().length > 0;
  }) || null;
}

export default function AchievementUnlockEffects() {
  const { playAchievement } = useSoundEffects();
  const [toast, setToast] = useState<UnlockToast | null>(null);

  useEffect(() => {
    let hideTimer: number | undefined;

    function onAchievementUnlocked(event: Event) {
      const detail = event instanceof CustomEvent ? event.detail : {};
      const id = String(detail?.id || detail?.ids?.[0] || '');
      const achievement = ACHIEVEMENTS.find((item) => item.id === id);

      if (!achievement) return;

      playAchievement();
      setToast({
        id: achievement.id,
        title: achievement.title,
        emoji: achievement.emoji,
      });

      window.dispatchEvent(
        new CustomEvent('oaplay-achievement-focus', {
          detail: { ids: detail?.ids || [achievement.id], id: achievement.id },
        })
      );

      window.requestAnimationFrame(() => {
        getVisibleAchievementBlock()?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      });

      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => setToast(null), 3200);
    }

    window.addEventListener('oaplay-achievement-unlocked', onAchievementUnlocked);

    return () => {
      window.removeEventListener('oaplay-achievement-unlocked', onAchievementUnlocked);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [playAchievement]);

  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-[10000] flex justify-center px-4">
      <div className="flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-200 bg-white/95 px-4 py-3 text-slate-950 shadow-2xl shadow-emerald-950/15 ring-1 ring-emerald-100 backdrop-blur-xl dark:border-emerald-300/30 dark:bg-slate-950/95 dark:text-white dark:ring-white/10">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl dark:bg-emerald-300/15">
          <span aria-hidden="true">{toast.emoji}</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700 dark:text-emerald-300">
            <Trophy className="h-3.5 w-3.5" strokeWidth={3} />
            Conquista desbloqueada
          </div>
          <p className="mt-1 truncate text-sm font-black">{toast.title}</p>
        </div>
      </div>
    </div>
  );
}
