import type { MouseEvent } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useCardHoverTrailer } from '@/hooks/useCardHoverTrailer';
import { stopAllCardTrailers } from '@/services/cardTrailerCoordinator';
import {
  getMediaReleaseDate,
  getMediaTitle,
  resolveMediaType,
  type MediaItem,
} from '@/types/movie';
import { buildTmdbImageUrl } from '@/services/tmdb';
import styles from './MovieCard.module.scss';

interface MovieCardProps {
  item: MediaItem;
  variant?: 'default' | 'trending' | 'top10';
  rank?: number;
}

export function MovieCard({ item, variant = 'default', rank }: MovieCardProps) {
  const myList = useAppStore((s) => s.myList);
  const toggleMyListItem = useAppStore((s) => s.toggleMyListItem);
  const openDetailModal = useAppStore((s) => s.openDetailModal);
  const openPlayer = useAppStore((s) => s.openPlayer);

  const hoverTrailer = useCardHoverTrailer(item, {
    enabled: variant === 'default' || variant === 'top10',
  });

  const type = resolveMediaType(item);
  const title = getMediaTitle(item);
  const year = getMediaReleaseDate(item).slice(0, 4);
  const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
  const match = Math.min(99, Math.round((item.vote_average || 0) * 10));
  const inList = myList.some((i) => i.id === item.id && i.type === type);

  const posterUrl =
    variant === 'trending'
      ? buildTmdbImageUrl(item.backdrop_path, 'w780')
      : buildTmdbImageUrl(item.poster_path, 'w500');

  if (!posterUrl) return null;

  const handleOpenDetail = () => {
    stopAllCardTrailers();
    openDetailModal(item);
  };

  const handlePlay = (e: MouseEvent) => {
    e.stopPropagation();
    stopAllCardTrailers();
    openPlayer(item);
  };

  const handleToggleList = (e: MouseEvent) => {
    e.stopPropagation();
    toggleMyListItem({
      id: item.id,
      type,
      title,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      vote_average: item.vote_average,
      release_date: getMediaReleaseDate(item),
    });
  };

  if (variant === 'top10' && rank) {
    return (
      <article
        className={hoverTrailer.playing ? `${styles.top10Item} ${styles.playingTrailer}` : styles.top10Item}
        aria-label={title}
        role="button"
        tabIndex={0}
        onClick={handleOpenDetail}
        onKeyDown={(e) => { if (e.key === 'Enter') handleOpenDetail(); }}
        onMouseEnter={hoverTrailer.onMouseEnter}
        onMouseLeave={hoverTrailer.onMouseLeave}
      >
        <span className={styles.top10Rank} aria-hidden="true">{rank}</span>
        <div className={styles.top10Poster}>
          <img
            className={hoverTrailer.playing ? styles.posterHidden : undefined}
            src={posterUrl}
            alt={title}
            loading="lazy"
          />
          {hoverTrailer.trailerSrc && (
            <iframe
              className={styles.cardTrailer}
              src={hoverTrailer.trailerSrc}
              title={`Vista previa: ${title}`}
              allow="autoplay; encrypted-media"
              tabIndex={-1}
            />
          )}
          <div className={styles.playOverlay} aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </article>
    );
  }

  if (variant === 'trending') {
    return (
      <article
        className={styles.trendingCard}
        aria-label={title}
        role="button"
        tabIndex={0}
        onClick={handleOpenDetail}
        onKeyDown={(e) => { if (e.key === 'Enter') handleOpenDetail(); }}
      >
        <div className={styles.posterContainer}>
          <img src={posterUrl} alt={title} loading="lazy" />
          <div className={styles.trendingOverlay}>
            <span className={styles.trendingTitle}>{title}</span>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article
      className={hoverTrailer.playing ? `${styles.card} ${styles.playingTrailer}` : styles.card}
      aria-label={title}
      role="button"
      tabIndex={0}
      onClick={handleOpenDetail}
      onKeyDown={(e) => { if (e.key === 'Enter') handleOpenDetail(); }}
      onMouseEnter={hoverTrailer.onMouseEnter}
      onMouseLeave={hoverTrailer.onMouseLeave}
    >
      <div className={styles.posterContainer}>
        <img
          className={hoverTrailer.playing ? styles.posterHidden : undefined}
          src={posterUrl}
          alt={title}
          loading="lazy"
        />
        {hoverTrailer.trailerSrc && (
          <iframe
            className={styles.cardTrailer}
            src={hoverTrailer.trailerSrc}
            title={`Vista previa: ${title}`}
            allow="autoplay; encrypted-media"
            tabIndex={-1}
          />
        )}
        <div className={styles.playOverlay} aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
      <div className={styles.hoverPanel}>
        <div className={styles.cardActions}>
          <button type="button" className={styles.actionBtn} aria-label="Reproducir" onClick={handlePlay}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <button
            type="button"
            className={inList ? `${styles.actionBtn} ${styles.inList}` : styles.actionBtn}
            aria-label={inList ? 'Quitar de Mi Lista' : 'Añadir a Mi Lista'}
            aria-pressed={inList}
            onClick={handleToggleList}
          >
            {inList ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </button>
        </div>
        <p className={styles.cardTitle}>{title}</p>
        <div className={styles.cardMeta}>
          <span className={styles.match}>{match}% Match</span>
          {year && <span className={styles.badge}>{year}</span>}
          <span className={styles.badgeRating}>⭐ {rating}</span>
        </div>
      </div>
    </article>
  );
}
