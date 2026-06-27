'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import { ACHIEVEMENTS, countUnlockedAchievements, isAchievementUnlocked } from '@/lib/achievements';

type AchievementMiniaturesProps = {
  user: any;
};

export default function AchievementMiniatures({ user }: AchievementMiniaturesProps) {
  const unlockedCount = countUnlockedAchievements(user);

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
          Coleção
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

          return (
            <Link
              key={achievement.id}
              href="/achievements"
              title={achievement.title}
              aria-label={achievement.title}
              className={
                unlocked
                  ? 'flex h-10 items-center justify-center rounded-xl border border-emerald-200 bg-white text-xl shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 dark:border-emerald-300/30 dark:bg-emerald-300/10'
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
