import { useEffect, useRef } from 'react';
import { useAppPhase, useAppStore } from '@/store/useAppStore';
import { fetchMediaDetails } from '@/services/tmdb';
import {
  buildUrlSearchParams,
  hasDeepLinkState,
  parseUrlState,
  selectUrlSyncSlice,
  urlParamsEqual,
  writeUrlFromState,
  type ParsedUrlState,
  type UrlSyncSlice,
} from '@/services/urlState';
import type { MediaItem } from '@/types/movie';
import { selectAppPhase } from '@/types/app';

async function hydrateFromParsedUrl(parsed: ParsedUrlState): Promise<void> {
  const store = useAppStore.getState();

  if (parsed.playerId && parsed.playerType) {
    try {
      const media = await fetchMediaDetails(parsed.playerId, parsed.playerType);
      const enriched = { ...media, custom_type: parsed.playerType };
      store.cacheMedia(enriched);
      store.openPlayer(enriched, {
        season: parsed.playerSeason,
        episode: parsed.playerEpisode,
      });
    } catch {
      store.pushToast({
        variant: 'error',
        message: 'No se pudo cargar el contenido del enlace.',
      });
      store.setCatalogView('home');
    }
    return;
  }

  if (parsed.catalogView === 'search' && parsed.searchQuery) {
    store.setSearchQuery(parsed.searchQuery);
    store.setCatalogView('search');
  } else if (parsed.catalogView !== 'home') {
    store.setCatalogView(parsed.catalogView);
  }

  if (parsed.genreId != null && parsed.genreId > 0) {
    store.setSelectedGenreId(parsed.genreId);
  }

  if (parsed.detailId && parsed.detailType) {
    try {
      const media = await fetchMediaDetails(parsed.detailId, parsed.detailType);
      const item: MediaItem = { ...media, custom_type: parsed.detailType };
      store.cacheMedia({ ...media, custom_type: parsed.detailType });
      store.openDetailModal(item);
    } catch {
      store.pushToast({
        variant: 'error',
        message: 'No se pudo abrir el detalle del enlace.',
      });
    }
  }
}

function slicesEqual(a: UrlSyncSlice, b: UrlSyncSlice): boolean {
  return (
    a.catalogView === b.catalogView
    && a.searchQuery === b.searchQuery
    && a.detailOpen === b.detailOpen
    && a.detailMedia?.id === b.detailMedia?.id
    && a.playerOpen === b.playerOpen
    && a.playerMedia?.id === b.playerMedia?.id
    && a.playerSeason === b.playerSeason
    && a.playerEpisode === b.playerEpisode
    && a.playerServer === b.playerServer
    && a.selectedGenreId === b.selectedGenreId
  );
}

/**
 * Bidirectional sync between Zustand catalog/player/detail state and the URL.
 * Uses History API — no React Router dependency.
 */
export function useUrlSync(): void {
  const phase = useAppPhase();
  const isHydratingRef = useRef(false);
  const hydratedRef = useRef(false);
  const lastSliceRef = useRef<UrlSyncSlice | null>(null);

  useEffect(() => {
    if (phase !== 'catalog') {
      hydratedRef.current = false;
      return;
    }

    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const parsed = parseUrlState(new URLSearchParams(window.location.search));
    if (!hasDeepLinkState(parsed)) {
      lastSliceRef.current = selectUrlSyncSlice(useAppStore.getState());
      writeUrlFromState(useAppStore.getState(), true);
      return;
    }

    isHydratingRef.current = true;

    void hydrateFromParsedUrl(parsed).finally(() => {
      isHydratingRef.current = false;
      lastSliceRef.current = selectUrlSyncSlice(useAppStore.getState());
      writeUrlFromState(useAppStore.getState(), true);
    });
  }, [phase]);

  useEffect(() => {
    if (phase !== 'catalog') return;

    const unsubscribe = useAppStore.subscribe((state, prevState) => {
      if (isHydratingRef.current) return;

      const slice = selectUrlSyncSlice(state);
      const prevSlice = selectUrlSyncSlice(prevState);

      if (slicesEqual(slice, prevSlice)) return;

      const built = buildUrlSearchParams(state);
      const current = new URLSearchParams(window.location.search);
      if (urlParamsEqual(built, current)) {
        lastSliceRef.current = slice;
        return;
      }

      writeUrlFromState(state, false);
      lastSliceRef.current = slice;
    });

    return unsubscribe;
  }, [phase]);

  useEffect(() => {
    const onPopState = () => {
      const state = useAppStore.getState();
      if (selectAppPhase(state) !== 'catalog') return;

      isHydratingRef.current = true;
      const parsed = parseUrlState(new URLSearchParams(window.location.search));

      state.closePlayer();
      state.closeDetailModal();

      if (!hasDeepLinkState(parsed)) {
        state.clearSearch();
        state.setCatalogView('home');
        isHydratingRef.current = false;
        lastSliceRef.current = selectUrlSyncSlice(useAppStore.getState());
        return;
      }

      void hydrateFromParsedUrl(parsed).finally(() => {
        isHydratingRef.current = false;
        lastSliceRef.current = selectUrlSyncSlice(useAppStore.getState());
      });
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);
}
