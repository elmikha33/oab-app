'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { ACHIEVEMENTS, countUnlockedAchievements, isAchievementUnlocked } from '@/lib/achievements';

type AchievementMiniaturesProps = {
  user: any;
};

export default function AchievementMiniatures({ user }: AchievementMiniaturesProps) {
  const unlockedCount = countUnlockedAchievements(user);
  const [highlightedIds, setHighlightedIds] = useState<string[]>([]);

  useEffect(() => {
    let timer: number | undefined;

    function onAchievementFocus(event: Event) {
      const detail = event instanceof CustomEvent ? event.detail : {};
      const ids = Array.isArray(detail?.ids)
        ? detail.ids.map(String)
        : detail?.id
          ? [String(detail.id)]
          : [];

      if (!ids.length) return;

      setHighlightedIds(ids);

      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => setHighlightedIds([]), 3300);
    }

    window.addEventListener('oaplay-achievement-focus', onAchievementFocus);

    return () => {
      window.removeEventListener('oaplay-achievement-focus', onAchievementFocus);
      if (timer) window.clearTimeout(timer);
    };
  }, []);

  return (
    <div
      data-achievement-miniatures="true"
      className={`rounded-2xl border border-slate-200 bg-slate-50 p-3 transition-all duration-500 dark:border-white/10 dark:bg-slate-950 ${
        highlightedIds.length
          ? 'ring-2 ring-emerald-300 shadow-xl shadow-emerald-950/10 dark:ring-emerald-300/60 dark:shadow-black/30'
          : ''
      }`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Conquistas
        </p>
        <Link
          href="/achievements"
          className="rounded-full border border-emerald-200 bg-white px-2 py-0.5 text-[10px] font-black text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-300/25 dark:bg-emerald-300/10 dark:text-emerald-200"
        >
          {unlockedCount}/{ACHIEVEMENTS.length}
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {ACHIEVEMENTS.map((achievement) => {
          const unlocked = isAchievementUnlocked(achievement.id, user);
          const highlighted = highlightedIds.includes(achievement.id);

          return (
            <Link
              key={achievement.id}
              href={`/achievements?achievement=${achievement.id}`}
              title={achievement.title}
              aria-label={achievement.title}
              className={
                unlocked
                  ? `flex h-10 items-center justify-center rounded-xl border bg-white text-xl shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 dark:bg-emerald-300/10 ${
                      highlighted
                        ? 'scale-110 animate-pulse border-amber-300 ring-2 ring-amber-300 dark:border-amber-200 dark:ring-amber-300/70'
                        : 'border-emerald-200 dark:border-emerald-300/30'
                    }`
                  : 'flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-400 shadow-sm transition hover:border-slate-300 dark:border-white/10 dark:bg-slate-900 dark:text-slate-600'
              }
            >
              {unlocked ? (
                <span aria-hidden="true">{achievement.emoji}</span>
              ) : (
                <Lock className="h-4 w-4" strokeWidth={2.7} />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
