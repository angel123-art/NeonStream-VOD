import { useRef, useState } from 'react';
import type { CatalogRow } from '@/types/catalog';
import { MovieCard } from './MovieCard';
import styles from './Row.module.scss';

interface RowProps {
  row: CatalogRow;
}

function isMobileViewport(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;
}

export function Row({ row }: RowProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  const scroll = (direction: 'left' | 'right') => {
    /* Desktop-only: mobile relies on native touch scroll (transform is disabled). */
    if (isMobileViewport()) return;

    const viewport = viewportRef.current;
    const track = trackRef.current;
    if (!viewport || !track) return;

    const amount = viewport.clientWidth * 0.75;
    const maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);

    setOffset((prev) => {
      const next = direction === 'left' ? prev - amount : prev + amount;
      return Math.max(0, Math.min(next, maxOffset));
    });
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
        <div className={styles.viewport} ref={viewportRef}>
          <div
            className={rowClass}
            ref={trackRef}
            style={{ transform: `translate3d(-${offset}px, 0, 0)` }}
          >
            {row.items.map((item, index) => (
              <MovieCard
                key={`${row.id}-${item.id}-${index}`}
                item={item}
                variant={row.variant === 'default' ? 'default' : row.variant}
                rank={row.variant === 'top10' ? index + 1 : undefined}
              />
            ))}
          </div>
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
