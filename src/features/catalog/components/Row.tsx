import { useRef } from 'react';
import type { CatalogRow } from '@/types/catalog';
import { MovieCard } from './MovieCard';
import styles from './Row.module.scss';

interface RowProps {
  row: CatalogRow;
}

export function Row({ row }: RowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.75;
    el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  const rowClass =
    row.variant === 'trending'
      ? `${styles.rowTrack} ${styles.trendingRow}`
      : row.variant === 'top10'
        ? `${styles.rowTrack} ${styles.top10Row}`
        : styles.rowTrack;

  const containerClass =
    row.variant === 'trending'
      ? `${styles.container} ${styles.trendingContainer}`
      : row.variant === 'top10'
        ? `${styles.container} ${styles.top10Container}`
        : styles.container;

  return (
    <section className={containerClass} aria-label={row.title}>
      <h2 className={styles.title}>{row.title}</h2>
      <div className={styles.wrapper}>
        <button
          type="button"
          className={`${styles.sliderBtn} ${styles.sliderLeft}`}
          aria-label={`Desplazar ${row.title} a la izquierda`}
          onClick={() => scroll('left')}
        >
          &#10094;
        </button>
        <div className={rowClass} ref={scrollRef}>
          {row.items.map((item, index) => (
            <MovieCard
              key={`${row.id}-${item.id}-${index}`}
              item={item}
              variant={row.variant === 'default' ? 'default' : row.variant}
              rank={row.variant === 'top10' ? index + 1 : undefined}
            />
          ))}
        </div>
        <button
          type="button"
          className={`${styles.sliderBtn} ${styles.sliderRight}`}
          aria-label={`Desplazar ${row.title} a la derecha`}
          onClick={() => scroll('right')}
        >
          &#10095;
        </button>
      </div>
    </section>
  );
}
