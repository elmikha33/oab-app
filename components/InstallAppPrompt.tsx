'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Download, Share, Smartphone, SquarePlus, X } from 'lucide-react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const DISMISS_KEY = 'oaplay-install-prompt-dismissed-at';
const DISMISS_DAYS = 7;

function isStandalone() {
  if (typeof window === 'undefined') return false;

  const navigatorWithStandalone = navigator as Navigator & { standalone?: boolean };

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean(navigatorWithStandalone.standalone)
  );
}

function isDismissedRecently() {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;

    const dismissedAt = Number(raw);
    if (!Number.isFinite(dismissedAt)) return false;

    return Date.now() - dismissedAt < DISMISS_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

function markDismissed() {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    // LocalStorage can be unavailable in private browsing.
  }
}

function isIosSafari() {
  if (typeof window === 'undefined') return false;

  const ua = navigator.userAgent || '';
  const isAppleTouchDevice = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome/i.test(ua);

  return isAppleTouchDevice && isSafari;
}

export default function InstallAppPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [mode, setMode] = useState<'install' | 'ios'>('install');

  const shouldRenderOnRoute = pathname === '/dashboard' || pathname.startsWith('/dashboard/');

  useEffect(() => {
    if (!shouldRenderOnRoute || isStandalone() || isDismissedRecently()) {
      setVisible(false);
      return;
    }

    function onBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setMode('install');
      setVisible(true);
    }

    function onAppInstalled() {
      setVisible(false);
      setDeferredPrompt(null);
      markDismissed();
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onAppInstalled);

    if (isIosSafari()) {
      setMode('ios');
      setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, [shouldRenderOnRoute]);

  if (!visible || !shouldRenderOnRoute) {
    return null;
  }

  async function installApp() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice.catch(() => null);
    setDeferredPrompt(null);
    setVisible(false);
    markDismissed();
  }

  function dismiss() {
    setVisible(false);
    markDismissed();
  }

  return (
    <aside className="fixed inset-x-4 bottom-4 z-40 mx-auto max-w-md overflow-hidden rounded-[1.5rem] border border-emerald-300/20 bg-slate-950 text-white shadow-2xl shadow-slate-950/35 md:inset-x-auto md:bottom-6 md:right-6 md:w-[420px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.22),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))]" />

      <div className="relative p-5">
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-emerald-300/30 hover:text-white"
          aria-label="Fechar aviso de instalação"
        >
          <X className="h-4 w-4" strokeWidth={2.6} />
        </button>

        <div className="flex gap-4 pr-10">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/20 bg-slate-900 shadow-inner">
            <img src="/icons/icon-192.png" alt="" className="h-10 w-10 rounded-xl" />
          </div>

          <div>
            <h2 className="font-heading text-lg font-black leading-tight">
              {mode === 'ios'
                ? 'Adicione o OAPlay à Tela de Início'
                : 'Instale o OAPlay no seu celular'}
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              {mode === 'ios'
                ? 'Assim você acessa seu treino diário da OAB com um toque, como se fosse um aplicativo.'
                : 'Deixe o treino da OAB na sua tela inicial e volte a estudar com um toque.'}
            </p>
          </div>
        </div>

        {mode === 'ios' ? (
          <div className="mt-5 grid gap-2.5 text-sm">
            {[
              { icon: Share, label: 'Toque no botão Compartilhar' },
              { icon: SquarePlus, label: 'Escolha Adicionar à Tela de Início' },
              { icon: CheckCircle2, label: 'Confirme em Adicionar' },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div
                  key={step.label}
                  className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-slate-200"
                >
                  <Icon className="h-4 w-4 shrink-0 text-emerald-300" strokeWidth={2.6} />
                  <span className="font-semibold">{step.label}</span>
                </div>
              );
            })}

            <button
              type="button"
              onClick={dismiss}
              className="mt-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-200"
            >
              Entendi
            </button>

            <p className="text-xs font-semibold leading-relaxed text-slate-500">
              Funciona pelo Safari e mantém o OAPlay sempre à mão para você não perder a constância.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-xs font-semibold text-slate-400">
              <Smartphone className="h-4 w-4 text-emerald-300" strokeWidth={2.6} />
              <span>Não ocupa espaço como um app comum e você pode remover quando quiser.</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={installApp}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-300 px-4 py-3 text-sm font-black text-emerald-950 transition hover:bg-emerald-200"
              >
                <Download className="h-4 w-4" strokeWidth={2.6} />
                Instalar app
              </button>

              <button
                type="button"
                onClick={dismiss}
                className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-black text-slate-300 transition hover:border-emerald-300/30 hover:text-white"
              >
                Agora não
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
