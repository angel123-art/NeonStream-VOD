import { useCallback, useEffect, useRef, useState } from 'react';
import { CARD_HOVER_DELAY_MS } from '@/services/config';
import { registerCardTrailer, stopAllCardTrailers } from '@/services/cardTrailerCoordinator';
import { buildYoutubeEmbedUrl, getCachedTrailerKey } from '@/services/youtube';
import { resolveMediaType, type MediaItem } from '@/types/movie';

function isDesktopHover(): boolean {
  return window.matchMedia('(min-width: 769px)').matches;
}

interface UseCardHoverTrailerOptions {
  enabled?: boolean;
}

export function useCardHoverTrailer(
  item: MediaItem,
  { enabled = true }: UseCardHoverTrailerOptions = {},
) {
  const type = resolveMediaType(item);
  const timerRef = useRef<number | null>(null);
  const hoveringRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [trailerSrc, setTrailerSrc] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    hoveringRef.current = false;
    setPlaying(false);
    setTrailerSrc(null);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    return registerCardTrailer(stop);
  }, [enabled, stop]);

  const onMouseEnter = useCallback(() => {
    if (!enabled || !isDesktopHover()) return;

    hoveringRef.current = true;

    timerRef.current = window.setTimeout(() => {
      void (async () => {
        if (!hoveringRef.current) return;

        const key = await getCachedTrailerKey(item.id, type);
        if (!key || !hoveringRef.current) return;

        stopAllCardTrailers(stop);
        setTrailerSrc(buildYoutubeEmbedUrl(key, { mute: true, controls: false }));
        setPlaying(true);
      })();
    }, CARD_HOVER_DELAY_MS);
  }, [enabled, item.id, type, stop]);

  const onMouseLeave = useCallback(() => {
    stop();
  }, [stop]);

  return {
    playing,
    trailerSrc,
    onMouseEnter,
    onMouseLeave,
    stop,
  };
}
