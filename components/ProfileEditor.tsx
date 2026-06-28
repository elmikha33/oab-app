'use client';

import type { ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Check, Crown, Edit3, Loader2, X } from 'lucide-react';
import UserAvatar from '@/components/UserAvatar';
import { getAvailableAvatarOptions, getAvatarOption } from '@/lib/avatarOptions';
import { useGameState } from '@/context/GameStateContext';

type ProfileEditorProps = {
  children?: ReactNode;
};

function cleanDisplayName(value?: string | null) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function getPrivateAccountLabel(user: any) {
  if (user?.isAdmin) return 'Conta admin privada';
  return user?.email || 'Usuário OAPlay';
}

export default function ProfileEditor({ children }: ProfileEditorProps) {
  const { user, atualizarPerfil } = useGameState() || {};
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [avatarId, setAvatarId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const avatarOptions = useMemo(
    () =>
      getAvailableAvatarOptions(
        Boolean(user?.isPremium),
        Array.isArray(user?.conquistasDesbloqueadas) ? user.conquistasDesbloqueadas : []
      ),
    [user?.conquistasDesbloqueadas, user?.isPremium]
  );

  const lockedAdminName =
    Boolean(user?.isAdmin) && cleanDisplayName(user?.nome).toLowerCase() === 'admin';

  useEffect(() => {
    const availableIds = avatarOptions.map((option) => option.id);
    const currentAvatar = getAvatarOption(user?.avatar_url)?.id || '';

    setDisplayName(cleanDisplayName(user?.nome));
    setAvatarId(
      currentAvatar && availableIds.includes(currentAvatar)
        ? currentAvatar
        : avatarOptions[0]?.id || ''
    );
    setError('');
  }, [avatarOptions, user?.avatar_url, user?.nome]);

  async function handleSave() {
    const nome = lockedAdminName ? 'Admin' : cleanDisplayName(displayName);

    if (!lockedAdminName && nome.length < 2) {
      setError('Use pelo menos 2 caracteres.');
      return;
    }

    if (!avatarId) {
      setError('Escolha um avatar.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await atualizarPerfil?.({ nome, avatar_url: avatarId });
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <UserAvatar
          nome={user?.nome}
          avatar={user?.avatar_url}
          className="h-12 w-12"
          textClassName={getAvatarOption(user?.avatar_url) ? 'text-2xl' : ''}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-950 dark:text-white">
            {user?.nome || 'Candidato'}
          </p>
          <p className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
            {getPrivateAccountLabel(user)}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setEditing((current) => !current)}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-white/10 dark:bg-slate-950 dark:text-slate-200 dark:hover:text-emerald-200"
          aria-label={editing ? 'Fechar edição de perfil' : 'Editar perfil'}
          title={editing ? 'Fechar edição de perfil' : 'Editar perfil'}
        >
          {editing ? <X className="h-4 w-4" strokeWidth={2.8} /> : <Edit3 className="h-4 w-4" strokeWidth={2.8} />}
        </button>
      </div>

      {editing && (
        <div className="mt-4 space-y-3 border-t border-slate-100 pt-4 dark:border-white/10">
          <div>
            <label
              htmlFor="sidebar-display-name"
              className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400"
            >
              Nome no ranking
            </label>
            <input
              id="sidebar-display-name"
              value={lockedAdminName ? 'Admin' : displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={lockedAdminName || saving}
              maxLength={40}
              placeholder="Nome que aparece no ranking"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-950 caret-emerald-600 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white focus:text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 disabled:opacity-100 dark:border-white/10 dark:bg-slate-950 dark:text-white dark:caret-emerald-300 dark:placeholder:text-slate-500 dark:focus:border-emerald-300 dark:focus:bg-slate-950 dark:focus:text-white dark:disabled:bg-slate-900 dark:disabled:text-slate-300"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Avatar
              </p>
              {user?.isPremium && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-black text-emerald-700 dark:bg-emerald-300/10 dark:text-emerald-200">
                  <Crown className="h-3 w-3" strokeWidth={2.8} />
                  Premium
                </span>
              )}
            </div>

            <div className="grid grid-cols-6 gap-2">
              {avatarOptions.map((option) => {
                const selected = avatarId === option.id;

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAvatarId(option.id)}
                    disabled={saving}
                    title={option.label}
                    aria-label={option.label}
                    className={
                      selected
                        ? 'relative flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-400 bg-emerald-50 text-xl shadow-sm ring-2 ring-emerald-300/50 dark:border-emerald-300 dark:bg-emerald-300/10'
                        : 'relative flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-xl transition hover:border-emerald-300 hover:bg-white disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:hover:border-emerald-300'
                    }
                  >
                    <span aria-hidden="true">{option.emoji}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 dark:border-rose-300/30 dark:bg-rose-400/10 dark:text-rose-200">
              {error}
            </p>
          )}

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={saving}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-emerald-300 dark:text-emerald-950 dark:hover:bg-emerald-200"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2.8} />
              ) : (
                <Check className="h-4 w-4" strokeWidth={2.8} />
              )}
              Salvar
            </button>

            <button
              type="button"
              onClick={() => setEditing(false)}
              disabled={saving}
              className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-950 disabled:opacity-60 dark:border-white/10 dark:bg-slate-950 dark:text-slate-300 dark:hover:text-white"
              aria-label="Cancelar"
              title="Cancelar"
            >
              <X className="h-4 w-4" strokeWidth={2.8} />
            </button>
          </div>
        </div>
      )}

      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
