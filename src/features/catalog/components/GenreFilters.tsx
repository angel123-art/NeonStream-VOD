import { useAppStore, useIsKidsProfile } from '@/store/useAppStore';
import { getGenresForView, normalizeGenreFilterId } from '@/data/genre-presets';
import type { CatalogView } from '@/types/app';
import styles from './GenreFilters.module.scss';

interface GenreFiltersProps {
  catalogView: CatalogView;
}

export function GenreFilters({ catalogView }: GenreFiltersProps) {
  const isKids = useIsKidsProfile();
  const selectedGenreId = useAppStore((s) => s.selectedGenreId);
  const setSelectedGenreId = useAppStore((s) => s.setSelectedGenreId);

  if (catalogView !== 'movies' && catalogView !== 'series') return null;

  const genres = getGenresForView(catalogView, isKids);
  const activeId = selectedGenreId ?? 0;

  return (
    <nav className={styles.filters} aria-label="Filtrar por género">
      {genres.map((genre) => {
        const isActive = activeId === genre.id;
        const className = [
          styles.btn,
          isActive ? styles.active : '',
          genre.kidsOnly ? styles.kidsOnly : '',
        ].filter(Boolean).join(' ');

        return (
          <button
            key={`${catalogView}-${genre.id}`}
            type="button"
            className={className}
            aria-pressed={isActive}
            onClick={() => setSelectedGenreId(normalizeGenreFilterId(genre.id))}
          >
            {genre.label}
          </button>
        );
      })}
    </nav>
  );
}
