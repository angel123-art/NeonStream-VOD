import { CONTINUE_WATCHING_KEY } from './config';
import type { ContinueWatchingItem } from '@/types/continueWatching';
import type { MediaItem, MediaType } from '@/types/movie';
import { getMediaReleaseDate, getMediaTitle, resolveMediaType } from '@/types/movie';

export function loadContinueWatchingFromStorage(): ContinueWatchingItem[] {
  try {
    const raw = localStorage.getItem(CONTINUE_WATCHING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ContinueWatchingItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && typeof item.movieId === 'number' && item.duration > 0)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

export function saveContinueWatchingToStorage(list: ContinueWatchingItem[]): void {
  try {
    localStorage.setItem(CONTINUE_WATCHING_KEY, JSON.stringify(list));
  } catch {
    /* quota / private mode — ignore */
  }
}

/** Prefer TMDB runtime (minutes → seconds); fall back to sensible defaults. */
export function resolveWatchDurationSeconds(
  media: { runtime?: number; episode_run_time?: number[] } | MediaItem | null | undefined,
  type: MediaType,
): number {
  if (media && 'runtime' in media && typeof media.runtime === 'number' && media.runtime > 0) {
    return media.runtime * 60;
  }
  if (
    media
    && 'episode_run_time' in media
    && Array.isArray(media.episode_run_time)
    && media.episode_run_time[0] > 0
  ) {
    return media.episode_run_time[0] * 60;
  }
  return type === 'tv' ? 45 * 60 : 110 * 60;
}

export function continueWatchingToMediaItem(item: ContinueWatchingItem): MediaItem {
  if (item.type === 'tv') {
    return {
      id: item.movieId,
      name: item.title,
      overview: '',
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
      first_air_date: item.release_date ?? '',
      custom_type: 'tv',
      media_type: 'tv',
    };
  }

  return {
    id: item.movieId,
    title: item.title,
    overview: '',
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    vote_average: item.vote_average,
    release_date: item.release_date ?? '',
    custom_type: 'movie',
    media_type: 'movie',
  };
}

export function snapshotFromMedia(media: MediaItem, season?: number, episode?: number) {
  const type = resolveMediaType(media);
  return {
    type,
    title: getMediaTitle(media),
    poster_path: media.poster_path,
    backdrop_path: media.backdrop_path,
    vote_average: media.vote_average ?? 0,
    release_date: getMediaReleaseDate(media),
    season,
    episode,
  };
}
