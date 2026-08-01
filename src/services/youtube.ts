import { fetchTrailerKey } from '@/services/tmdb';
import type { MediaType } from '@/types/movie';

const trailerKeyCache = new Map<string, string | null>();

export function buildYoutubeEmbedUrl(
  key: string,
  options: { mute?: boolean; controls?: boolean } = {},
): string {
  const { mute = true, controls = false } = options;
  const params = new URLSearchParams({
    autoplay: '1',
    mute: mute ? '1' : '0',
    controls: controls ? '1' : '0',
    rel: '0',
    modestbranding: '1',
    playsinline: '1',
    enablejsapi: '1',
    loop: '1',
    playlist: key,
  });
  return `https://www.youtube.com/embed/${key}?${params.toString()}`;
}

export async function getCachedTrailerKey(id: number, type: MediaType): Promise<string | null> {
  const cacheKey = `${type}-${id}`;
  if (trailerKeyCache.has(cacheKey)) {
    return trailerKeyCache.get(cacheKey) ?? null;
  }

  const key = await fetchTrailerKey(id, type);
  trailerKeyCache.set(cacheKey, key);
  return key;
}
