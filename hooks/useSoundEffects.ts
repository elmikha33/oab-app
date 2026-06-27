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
  type: OscillatorType = 'sine'
) {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.02);
}

function playSuccessMelody() {
  const ctx = getAudioContext();
  if (!ctx || !readSoundEnabled()) return;

  void ctx.resume();
  const now = ctx.currentTime;

  playTone(ctx, now, 659.25, 0.09, 0.045, 'sine');
  playTone(ctx, now + 0.07, 783.99, 0.1, 0.05, 'sine');
  playTone(ctx, now + 0.15, 1046.5, 0.15, 0.055, 'triangle');
}

function playErrorMelody() {
  const ctx = getAudioContext();
  if (!ctx || !readSoundEnabled()) return;

  void ctx.resume();
  const now = ctx.currentTime;

  playTone(ctx, now, 246.94, 0.1, 0.04, 'triangle');
  playTone(ctx, now + 0.09, 196, 0.16, 0.045, 'sine');
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

  return {
    enabled,
    mounted,
    toggleSound,
    playSuccess,
    playError,
  };
}
