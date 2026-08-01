import type { MediaType } from './movie';

/** Persisted in-progress title for Continuar viendo. */
export interface ContinueWatchingItem {
  movieId: number;
  type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  currentTime: number;
  duration: number;
  updatedAt: number;
  season?: number;
  episode?: number;
  release_date?: string;
}

/** Optional media snapshot when creating / refreshing a progress entry. */
export interface ContinueWatchingSnapshot {
  type: MediaType;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  release_date?: string;
  season?: number;
  episode?: number;
}

/** Remove from Continuar viendo when this fraction of runtime is reached. */
export const CONTINUE_WATCHING_COMPLETE_RATIO = 0.92;

/** Ignore tiny progress so the row does not fill with accidental opens. */
export const CONTINUE_WATCHING_MIN_SECONDS = 20;
