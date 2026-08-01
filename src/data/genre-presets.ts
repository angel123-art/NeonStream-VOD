import type { CatalogView } from '@/types/app';

export interface GenrePreset {
  id: number;
  label: string;
  /** Hidden when profile is kids — e.g. horror, crime */
  kidsHide?: boolean;
  /** Only shown in kids mode */
  kidsOnly?: boolean;
}

export const MOVIE_GENRES: GenrePreset[] = [
  { id: 0, label: 'Todos' },
  { id: 28, label: 'Acción' },
  { id: 12, label: 'Aventura' },
  { id: 16, label: 'Animación', kidsOnly: true },
  { id: 35, label: 'Comedia' },
  { id: 80, label: 'Crimen', kidsHide: true },
  { id: 99, label: 'Documental' },
  { id: 18, label: 'Drama' },
  { id: 10751, label: 'Familia', kidsOnly: true },
  { id: 14, label: 'Fantasía' },
  { id: 27, label: 'Terror', kidsHide: true },
  { id: 878, label: 'Ciencia ficción' },
  { id: 53, label: 'Suspenso', kidsHide: true },
  { id: 10749, label: 'Romance' },
];

export const TV_GENRES: GenrePreset[] = [
  { id: 0, label: 'Todos' },
  { id: 10759, label: 'Acción y aventura' },
  { id: 16, label: 'Animación', kidsOnly: true },
  { id: 35, label: 'Comedia' },
  { id: 80, label: 'Crimen', kidsHide: true },
  { id: 99, label: 'Documental' },
  { id: 18, label: 'Drama' },
  { id: 10751, label: 'Familia', kidsOnly: true },
  { id: 10762, label: 'Infantil', kidsOnly: true },
  { id: 9648, label: 'Misterio' },
  { id: 10765, label: 'Ciencia ficción y fantasía' },
  { id: 10768, label: 'Guerra y política', kidsHide: true },
];

export function getGenresForView(view: CatalogView, isKids: boolean): GenrePreset[] {
  const base = view === 'series' ? TV_GENRES : MOVIE_GENRES;
  return base.filter((g) => {
    if (g.id === 0) return true;
    if (isKids && g.kidsHide) return false;
    if (!isKids && g.kidsOnly) return false;
    return true;
  });
}

/** Normalize filter id — 0 means "all genres". */
export function normalizeGenreFilterId(id: number | null): number | null {
  if (id == null || id === 0) return null;
  return id;
}
