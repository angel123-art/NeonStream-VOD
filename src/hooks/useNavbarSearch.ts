import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { filterSearchResults, searchMulti } from '@/services/tmdb';
import type { MediaItem } from '@/types/movie';

const DEBOUNCE_MS = 350;

export function useNavbarSearch() {
  const searchOpen = useAppStore((s) => s.searchOpen);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);
  const submitSearch = useAppStore((s) => s.submitSearch);
  const openDetailModal = useAppStore((s) => s.openDetailModal);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (!searchOpen) {
      setQuery('');
      setResults([]);
      setShowDropdown(false);
      return;
    }
    inputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [setSearchOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const timerId = window.setTimeout(() => {
      void searchMulti(trimmed, 1).then((data) => {
        if (cancelled) return;
        setResults(filterSearchResults(data.results));
        setLoading(false);
        setShowDropdown(true);
      }).catch(() => {
        if (cancelled) return;
        setResults([]);
        setLoading(false);
        useAppStore.getState().pushToast({
          variant: 'error',
          title: 'Búsqueda',
          message: 'No se pudieron cargar los resultados. Revisa tu conexión.',
        });
      });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [query]);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    submitSearch(trimmed);
    setSearchOpen(false);
    setShowDropdown(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectResult = (item: MediaItem) => {
    openDetailModal(item);
    setSearchOpen(false);
    setShowDropdown(false);
    setQuery('');
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
  };

  return {
    wrapperRef,
    inputRef,
    query,
    setQuery,
    results,
    loading,
    showDropdown,
    searchOpen,
    toggleSearch,
    handleSubmit,
    handleSelectResult,
  };
}
