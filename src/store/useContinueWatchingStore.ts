import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import {
  CONTINUE_WATCHING_COMPLETE_RATIO,
  CONTINUE_WATCHING_MIN_SECONDS,
  type ContinueWatchingItem,
  type ContinueWatchingSnapshot,
} from '@/types/continueWatching';
import {
  loadContinueWatchingFromStorage,
  saveContinueWatchingToStorage,
} from '@/services/continueWatching';

interface ContinueWatchingState {
  items: ContinueWatchingItem[];
}

interface ContinueWatchingActions {
  /**
   * Upsert progress for a title.
   * Creates the entry when `snapshot` is provided; otherwise updates an existing one.
   */
  updateProgress: (
    movieId: number,
    currentTime: number,
    duration: number,
    snapshot?: ContinueWatchingSnapshot,
  ) => void;
  removeFromContinueWatching: (movieId: number) => void;
  getItem: (movieId: number) => ContinueWatchingItem | undefined;
}

export type ContinueWatchingStore = ContinueWatchingState & ContinueWatchingActions;

function persist(items: ContinueWatchingItem[]): ContinueWatchingItem[] {
  const sorted = [...items].sort((a, b) => b.updatedAt - a.updatedAt);
  saveContinueWatchingToStorage(sorted);
  return sorted;
}

export const useContinueWatchingStore = create<ContinueWatchingStore>()(
  devtools(
    (set, get) => ({
      items: loadContinueWatchingFromStorage(),

      updateProgress: (movieId, currentTime, duration, snapshot) => {
        const safeDuration = Math.max(1, duration);
        const safeTime = Math.max(0, Math.min(currentTime, safeDuration));
        const ratio = safeTime / safeDuration;

        if (ratio >= CONTINUE_WATCHING_COMPLETE_RATIO) {
          get().removeFromContinueWatching(movieId);
          return;
        }

        if (safeTime < CONTINUE_WATCHING_MIN_SECONDS && !get().items.some((i) => i.movieId === movieId)) {
          return;
        }

        set(
          (state) => {
            const existing = state.items.find((i) => i.movieId === movieId);
            if (!existing && !snapshot) return state;

            const nextItem: ContinueWatchingItem = {
              movieId,
              type: snapshot?.type ?? existing!.type,
              title: snapshot?.title ?? existing!.title,
              poster_path: snapshot?.poster_path ?? existing!.poster_path,
              backdrop_path: snapshot?.backdrop_path ?? existing!.backdrop_path,
              vote_average: snapshot?.vote_average ?? existing!.vote_average,
              release_date: snapshot?.release_date ?? existing?.release_date,
              season: snapshot?.season ?? existing?.season,
              episode: snapshot?.episode ?? existing?.episode,
              currentTime: safeTime,
              duration: safeDuration,
              updatedAt: Date.now(),
            };

            const without = state.items.filter((i) => i.movieId !== movieId);
            return { items: persist([nextItem, ...without]) };
          },
          false,
          'updateProgress',
        );
      },

      removeFromContinueWatching: (movieId) => {
        set(
          (state) => ({
            items: persist(state.items.filter((i) => i.movieId !== movieId)),
          }),
          false,
          'removeFromContinueWatching',
        );
      },

      getItem: (movieId) => get().items.find((i) => i.movieId === movieId),
    }),
    { name: 'NeonStreamContinueWatching' },
  ),
);

export const useContinueWatchingItems = () => useContinueWatchingStore((s) => s.items);
