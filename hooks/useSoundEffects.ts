'use client';

import { useCallback, useEffect, useState } from 'react';

const SOUND_KEY = 'oaplay-sound-enabled';
const SOUND_EVENT = 'oaplay-sound-change';

let audioContext: AudioContext | null = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;

  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

function readSoundEnabled() {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(SOUND_KEY) !== 'off';
}

function writeSoundEnabled(enabled: boolean, notify = true) {
  localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');

  if (notify) {
    window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: enabled }));
  }
}

function playTone(
  ctx: AudioContext,
  startAt: number,
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  destination: AudioNode = ctx.destination
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function withRunningAudioContext(callback: (ctx: AudioContext) => void) {
  const ctx = getAudioContext();
  if (!ctx || !readSoundEnabled()) return;

  const play = () => callback(ctx);

  if (ctx.state === 'suspended') {
    void ctx.resume().then(play).catch(play);
    return;
  }

  play();
}

function getDesktopErrorVolumeScale() {
  if (typeof window === 'undefined') return 1;
  const isMobileLike = window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches;
  return isMobileLike ? 1 : 0.5;
}

function createErrorOutput(ctx: AudioContext) {
  const master = ctx.createGain();
  const limiter = ctx.createDynamicsCompressor();
  const now = ctx.currentTime;

  master.gain.setValueAtTime(getDesktopErrorVolumeScale(), now);
  limiter.threshold.setValueAtTime(-26, now);
  limiter.knee.setValueAtTime(12, now);
  limiter.ratio.setValueAtTime(8, now);
  limiter.attack.setValueAtTime(0.004, now);
  limiter.release.setValueAtTime(0.18, now);

  master.connect(limiter);
  limiter.connect(ctx.destination);

  return {
    input: master,
    dispose: () => {
      master.disconnect();
      limiter.disconnect();
    },
  };
}

function playSuccessMelody() {
  withRunningAudioContext((ctx) => {
    const now = ctx.currentTime + 0.01;

    playTone(ctx, now, 659.25, 0.09, 0.08, 'sine');
    playTone(ctx, now + 0.07, 783.99, 0.1, 0.09, 'sine');
    playTone(ctx, now + 0.15, 1046.5, 0.15, 0.1, 'triangle');
  });
}

function playErrorMelody() {
  withRunningAudioContext((ctx) => {
    const now = ctx.currentTime + 0.01;
    const output = createErrorOutput(ctx);

    playTone(ctx, now, 246.94, 0.12, 0.18, 'sawtooth', output.input);
    playTone(ctx, now + 0.07, 196, 0.18, 0.22, 'square', output.input);
    playTone(ctx, now + 0.12, 130.81, 0.16, 0.1, 'triangle', output.input);

    window.setTimeout(output.dispose, 520);
  });
}

function playAchievementMelody() {
  withRunningAudioContext((ctx) => {
    const now = ctx.currentTime + 0.01;

    playTone(ctx, now, 523.25, 0.08, 0.07, 'triangle');
    playTone(ctx, now + 0.055, 659.25, 0.09, 0.08, 'sine');
    playTone(ctx, now + 0.12, 783.99, 0.1, 0.085, 'sine');
    playTone(ctx, now + 0.19, 1046.5, 0.18, 0.095, 'triangle');
    playTone(ctx, now + 0.21, 1318.51, 0.16, 0.045, 'sine');
  });
}

export default function useSoundEffects() {
  const [enabled, setEnabled] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabled(readSoundEnabled());
    setMounted(true);

    function syncSound(event?: Event) {
      const next =
        event instanceof CustomEvent && typeof event.detail === 'boolean'
          ? event.detail
          : readSoundEnabled();

      setEnabled(next);
    }

    window.addEventListener(SOUND_EVENT, syncSound);
    window.addEventListener('storage', syncSound);

    return () => {
      window.removeEventListener(SOUND_EVENT, syncSound);
      window.removeEventListener('storage', syncSound);
    };
  }, []);

  const toggleSound = useCallback(() => {
    const next = !readSoundEnabled();
    setEnabled(next);
    writeSoundEnabled(next);

    if (next) {
      window.setTimeout(playSuccessMelody, 20);
    }
  }, []);

  const playSuccess = useCallback(() => {
    playSuccessMelody();
  }, []);

  const playError = useCallback(() => {
    playErrorMelody();
  }, []);

  const playAchievement = useCallback(() => {
    playAchievementMelody();
  }, []);

  return {
    enabled,
    mounted,
    toggleSound,
    playSuccess,
    playError,
    playAchievement,
  };
}
