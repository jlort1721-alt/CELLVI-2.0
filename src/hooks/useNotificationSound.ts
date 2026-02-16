import { useCallback, useRef } from 'react';

type SoundType = 'critical' | 'warning' | 'info' | 'success';

export function useNotificationSound() {
  const audioContextRef = useRef<AudioContext | null>(null);

  const getContext = useCallback(() => {
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((ctx: AudioContext, frequency: number, startTime: number, duration: number, volume = 0.3) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = frequency;
    osc.type = 'sine';
    gain.gain.setValueAtTime(volume, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    osc.start(startTime);
    osc.stop(startTime + duration);
  }, []);

  const playSound = useCallback((type: SoundType) => {
    try {
      const ctx = getContext();
      const now = ctx.currentTime;

      switch (type) {
        case 'critical':
          // Triple urgent beep
          playTone(ctx, 880, now, 0.12, 0.4);
          playTone(ctx, 880, now + 0.18, 0.12, 0.4);
          playTone(ctx, 1100, now + 0.36, 0.15, 0.4);
          break;
        case 'warning':
          // Double beep
          playTone(ctx, 660, now, 0.15, 0.3);
          playTone(ctx, 660, now + 0.22, 0.15, 0.3);
          break;
        case 'info':
          // Single soft tone
          playTone(ctx, 440, now, 0.25, 0.2);
          break;
        case 'success':
          // Rising two-tone
          playTone(ctx, 440, now, 0.15, 0.25);
          playTone(ctx, 660, now + 0.15, 0.2, 0.25);
          break;
      }
    } catch {
      // Audio context not available
    }
  }, [getContext, playTone]);

  return { playSound };
}
