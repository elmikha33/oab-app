export type AvatarTier = 'free' | 'premium' | 'special';

export type AvatarOption = {
  id: string;
  label: string;
  emoji: string;
  tier: AvatarTier;
  unlockAchievementId?: string;
};

export const AVATAR_OPTIONS: AvatarOption[] = [
  { id: 'avatar_scales', label: 'Balança', emoji: '⚖️', tier: 'free' },
  { id: 'avatar_book', label: 'Livro', emoji: '📚', tier: 'free' },
  { id: 'avatar_pen', label: 'Caneta', emoji: '🖊️', tier: 'free' },
  { id: 'avatar_star', label: 'Estrela', emoji: '⭐', tier: 'free' },
  { id: 'avatar_coffee', label: 'Café', emoji: '☕', tier: 'free' },
  { id: 'avatar_target', label: 'Meta', emoji: '🎯', tier: 'free' },
  { id: 'avatar_crown', label: 'Coroa', emoji: '👑', tier: 'premium' },
  { id: 'avatar_flame', label: 'Chama', emoji: '🔥', tier: 'premium' },
  { id: 'avatar_shield', label: 'Escudo', emoji: '🛡️', tier: 'premium' },
  { id: 'avatar_rocket', label: 'Foguete', emoji: '🚀', tier: 'premium' },
  { id: 'avatar_diamond', label: 'Diamante', emoji: '💎', tier: 'premium' },
  { id: 'avatar_lightning', label: 'Raio', emoji: '⚡', tier: 'premium' },
  { id: 'avatar_compass', label: 'Bússola', emoji: '🧭', tier: 'premium' },
  { id: 'avatar_trophy', label: 'Troféu', emoji: '🏆', tier: 'premium' },
  { id: 'avatar_legend', label: 'Lenda', emoji: '🏛️', tier: 'special', unlockAchievementId: 'hundred_correct' },
];

export function getAvatarOption(value?: string | null) {
  return AVATAR_OPTIONS.find((option) => option.id === value) || null;
}

export function getAvailableAvatarOptions(
  isPremium = false,
  unlockedAchievementIds: string[] = []
) {
  const unlocked = new Set(unlockedAchievementIds);

  return AVATAR_OPTIONS.filter((option) => {
    if (option.tier === 'free') return true;
    if (option.tier === 'premium') return isPremium;
    return Boolean(option.unlockAchievementId && unlocked.has(option.unlockAchievementId));
  });
}

export function isAvatarAvailable(
  value?: string | null,
  isPremium = false,
  unlockedAchievementIds: string[] = []
) {
  if (!value) return true;

  return getAvailableAvatarOptions(isPremium, unlockedAchievementIds).some(
    (option) => option.id === value
  );
}

export function getInitials(nome?: string | null) {
  const parts = String(nome || 'Candidato')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) return 'OA';

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}
