import { useEffect, useRef, useState } from 'react';
import { useAppStore, useIsKidsProfile } from '@/store/useAppStore';
import { getGenresForView } from '@/data/genre-presets';
import {
  fetchAdultHomeCatalog,
  fetchGridCatalog,
  fetchKidsHomeCatalog,
  filterSearchResults,
  isTmdbConfigured,
  searchMulti,
} from '@/services/tmdb';
import { HOME_REFRESH_MS } from '@/services/config';
import type { CatalogData, GridCatalogData } from '@/types/catalog';
import type { MediaItem, MyListItem } from '@/types/movie';

function myListToMediaItems(list: MyListItem[]): MediaItem[] {
  return list.map((item) => {
    if (item.type === 'tv') {
      return {
        id: item.id,
        name: item.title,
        overview: '',
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        first_air_date: item.release_date,
        vote_average: item.vote_average,
        custom_type: 'tv' as const,
      };
    }
    return {
      id: item.id,
      title: item.title,
      overview: '',
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      release_date: item.release_date,
      vote_average: item.vote_average,
      custom_type: 'movie' as const,
    };
  });
}

export function useCatalog() {
  const catalogView = useAppStore((s) => s.catalogView);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const selectedGenreId = useAppStore((s) => s.selectedGenreId);
  const setSelectedGenreId = useAppStore((s) => s.setSelectedGenreId);
  const activeProfile = useAppStore((s) => s.activeProfile);
  const myList = useAppStore((s) => s.myList);
  const isKids = useIsKidsProfile();

  const [homeData, setHomeData] = useState<CatalogData>({ heroItems: [], rows: [] });
  const [gridData, setGridData] = useState<GridCatalogData>({ items: [], page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [gridPage, setGridPage] = useState(1);
  const lastErrorRef = useRef<string | null>(null);

  const profileKey = `${activeProfile?.id ?? 'none'}-${isKids}`;

  useEffect(() => {
    setGridPage(1);
  }, [catalogView, profileKey, searchQuery, selectedGenreId]);

  useEffect(() => {
    const genres = getGenresForView(catalogView, isKids);
    if (
      selectedGenreId != null
      && !genres.some((g) => g.id === selectedGenreId)
    ) {
      setSelectedGenreId(null);
    }
  }, [catalogView, isKids, profileKey, selectedGenreId, setSelectedGenreId]);

  useEffect(() => {
    if (!isTmdbConfigured()) {
      setError('Configura VITE_TMDB_API_KEY en tu archivo .env');
      setLoading(false);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        if (catalogView === 'home') {
          const data = isKids ? await fetchKidsHomeCatalog() : await fetchAdultHomeCatalog();
          if (!cancelled) {
            setHomeData(data);
            lastErrorRef.current = null;
          }
        } else if (catalogView === 'mylist') {
          if (!cancelled) {
            setHomeData({ heroItems: [], rows: [] });
          }
        } else if (catalogView === 'movies' || catalogView === 'series' || catalogView === 'new') {
          const data = await fetchGridCatalog(catalogView, isKids, gridPage, selectedGenreId);
          if (!cancelled) {
            setGridData({
              items: data.results,
              page: data.page,
              totalPages: Math.min(data.total_pages, 500),
              searchQuery: '',
            });
            setHomeData({ heroItems: [], rows: [] });
          }
        } else if (catalogView === 'search') {
          const data = await searchMulti(searchQuery, gridPage);
          if (!cancelled) {
            setGridData({
              items: filterSearchResults(data.results),
              page: data.page,
              totalPages: Math.min(data.total_pages, 500),
              searchQuery,
            });
            setHomeData({ heroItems: [], rows: [] });
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Error cargando catálogo';
          setError(message);
          if (lastErrorRef.current !== message) {
            lastErrorRef.current = message;
            useAppStore.getState().pushToast({
              variant: 'error',
              title: 'Error de red',
              message,
              durationMs: 5000,
            });
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [catalogView, isKids, gridPage, profileKey, searchQuery, selectedGenreId]);

  useEffect(() => {
    if (catalogView !== 'home') return;

    const intervalId = window.setInterval(() => {
      void (async () => {
        try {
          const data = isKids ? await fetchKidsHomeCatalog() : await fetchAdultHomeCatalog();
          setHomeData(data);
        } catch {
          /* silent refresh */
        }
      })();
    }, HOME_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [catalogView, isKids, profileKey]);

  const myListItems: MediaItem[] = myListToMediaItems(myList);

  return {
    catalogView,
    isKids,
    activeProfile,
    loading,
    error,
    homeData,
    gridData,
    myListItems,
    gridPage,
    setGridPage,
  };
}
