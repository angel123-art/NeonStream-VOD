import { useCallback, useEffect, useRef } from 'react';
import { TADUM_AUDIO_URL } from '@/data/avatar-presets';

/** Netflix "Ta-Dum" intro sound on profile selection. */
export function useTaDumSound() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(TADUM_AUDIO_URL);
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audioRef.current = null;
    };
  }, []);

  const playTaDum = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    void audio.play().catch(() => {
      /* autoplay policy — silently ignore */
    });
  }, []);

  return playTaDum;
}
