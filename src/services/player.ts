import type { MediaType } from '@/types/movie';

export type PlayerServerId = '1' | '2' | '3';

export const PLAYER_SERVERS: { id: PlayerServerId; label: string }[] = [
  { id: '1', label: 'Servidor 1' },
  { id: '2', label: 'Servidor 2' },
  { id: '3', label: 'Servidor 3' },
];

export interface BuildEmbedOptions {
  season: number;
  episode: number;
  /** Resume playback at this offset (seconds), when the provider supports it. */
  startAt?: number;
}

export function buildEmbedUrl(
  id: number,
  type: MediaType,
  serverId: PlayerServerId,
  season: number,
  episode: number,
  startAt = 0,
): string {
  const sNum = String(season);
  const eNum = String(episode);
  const resume = Math.max(0, Math.floor(startAt));
  const startQuery = resume > 0 ? `&startAt=${resume}` : '';

  switch (serverId) {
    case '1':
      return type === 'tv'
        ? `https://vidfast.pro/tv/${id}/${sNum}/${eNum}?autoPlay=true&sub=es&title=false&poster=true&fullscreenButton=false${startQuery}`
        : `https://vidfast.pro/movie/${id}?autoPlay=true&sub=es&title=false&poster=true&fullscreenButton=false${startQuery}`;
    case '2':
      return type === 'tv'
        ? `https://vidlink.pro/tv/${id}/${sNum}/${eNum}?autoplay=true&primaryColor=e50914&secondaryColor=141414&title=false${startQuery}`
        : `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=e50914&secondaryColor=141414&title=false${startQuery}`;
    case '3':
      return type === 'tv'
        ? `https://autoembed.co/tv/tmdb/${id}-${sNum}-${eNum}`
        : `https://autoembed.co/movie/tmdb/${id}`;
    default:
      return type === 'tv'
        ? `https://vidfast.pro/tv/${id}/${sNum}/${eNum}?autoPlay=true&sub=es${startQuery}`
        : `https://vidfast.pro/movie/${id}?autoPlay=true&sub=es${startQuery}`;
  }
}

export function formatRuntime(minutes: number | undefined): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h} h ${m} min` : `${m} min`;
}
