import type { MediaItem } from './movie';

export type RowVariant = 'default' | 'trending' | 'top10';

export interface CatalogRow {
  id: string;
  title: string;
  variant: RowVariant;
  items: MediaItem[];
}

export interface CatalogData {
  heroItems: MediaItem[];
  rows: CatalogRow[];
}

export interface GridCatalogData {
  items: MediaItem[];
  page: number;
  totalPages: number;
  searchQuery?: string;
}

export const CATALOG_VIEW_LABELS: Record<string, string> = {
  home: 'Inicio',
  series: 'Series',
  movies: 'Películas',
  new: 'Novedades',
  mylist: 'Mi Lista',
  search: 'Búsqueda',
};
