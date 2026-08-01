import type { MouseEvent } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useContinueWatchingStore } from '@/store/useContinueWatchingStore';
import { continueWatchingToMediaItem } from '@/services/continueWatching';
import { buildTmdbImageUrl } from '@/services/tmdb';
import type { ContinueWatchingItem } from '@/types/continueWatching';
import styles from './ContinueWatchingRow.module.scss';

function progressPercent(item: ContinueWatchingItem): number {
  if (!item.duration || item.duration <= 0) return 0;
  return Math.min(100, Math.max(2, (item.currentTime / item.duration) * 100));
}

interface ContinueWatchingCardProps {
  item: ContinueWatchingItem;
}

function ContinueWatchingCard({ item }: ContinueWatchingCardProps) {
  const openPlayer = useAppStore((s) => s.openPlayer);
  const removeFromContinueWatching = useContinueWatchingStore((s) => s.removeFromContinueWatching);

  const posterUrl = buildTmdbImageUrl(item.poster_path, 'w500');
  const percent = progressPercent(item);

  const handlePlay = () => {
    openPlayer(continueWatchingToMediaItem(item), {
      season: item.season,
      episode: item.episode,
      startAt: item.currentTime,
    });
  };

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    removeFromContinueWatching(item.movieId);
  };

  if (!posterUrl) return null;

  return (
    <article
      className={styles.card}
      aria-label={`Continuar: ${item.title}`}
      role="button"
      tabIndex={0}
      onClick={handlePlay}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handlePlay();
        }
      }}
    >
      <div className={styles.poster}>
        <img src={posterUrl} alt={item.title} loading="lazy" />
        <div className={styles.playOverlay} aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
        <div className={styles.progressTrack} aria-hidden="true">
          <div className={styles.progressBar} style={{ width: `${percent}%` }} />
        </div>
      </div>
      <div className={styles.meta}>
        <p className={styles.title}>{item.title}</p>
        <button
          type="button"
          className={styles.removeBtn}
          aria-label={`Quitar ${item.title} de Continuar viendo`}
          onClick={handleRemove}
        >
          ×
        </button>
      </div>
    </article>
  );
}

export function ContinueWatchingRow() {
  const items = useContinueWatchingStore((s) => s.items);

  if (items.length === 0) return null;

  return (
    <section className={styles.container} aria-label="Continuar viendo">
      <h2 className={styles.heading}>Continuar viendo</h2>
      <div className={styles.viewport}>
        <div className={styles.track}>
          {items.map((item) => (
            <ContinueWatchingCard key={`${item.type}-${item.movieId}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
