import type { MediaItem } from '@/types/movie';
import { MovieCard } from './MovieCard';
import styles from './MovieGrid.module.scss';

interface MovieGridProps {
  items: MediaItem[];
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function MovieGrid({ items, page, totalPages, onPageChange }: MovieGridProps) {
  if (items.length === 0) {
    return <p className={styles.empty}>Sin resultados.</p>;
  }

  const startPage = Math.max(1, page - 2);
  const endPage = Math.min(totalPages, page + 2);
  const pages: number[] = [];
  for (let i = startPage; i <= endPage; i += 1) pages.push(i);

  return (
    <>
      <div className={styles.grid}>
        {items.map((item) => (
          <MovieCard key={`${item.id}-${item.custom_type ?? item.media_type}`} item={item} />
        ))}
      </div>

      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="Paginación">
          {page > 1 && (
            <button type="button" className={styles.pageBtn} onClick={() => onPageChange(page - 1)}>
              Anterior
            </button>
          )}
          {pages.map((p) => (
            <button
              key={p}
              type="button"
              className={p === page ? `${styles.pageBtn} ${styles.pageActive}` : styles.pageBtn}
              aria-current={p === page ? 'page' : undefined}
              onClick={() => onPageChange(p)}
            >
              {p}
            </button>
          ))}
          {page < totalPages && (
            <button type="button" className={styles.pageBtn} onClick={() => onPageChange(page + 1)}>
              Siguiente
            </button>
          )}
        </nav>
      )}
    </>
  );
}
