import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import { stopAllCardTrailers } from '@/services/cardTrailerCoordinator';
import { buildTmdbImageUrl, fetchMediaDetails } from '@/services/tmdb';
import { formatRuntime } from '@/services/player';
import {
  getMediaReleaseDate,
  getMediaTitle,
  resolveMediaType,
  type MediaDetails,
  type MyListItem,
} from '@/types/movie';
import styles from './DetailModal.module.scss';

function toMyListItem(details: MediaDetails): MyListItem {
  const type = resolveMediaType(details);
  return {
    id: details.id,
    type,
    title: getMediaTitle(details),
    poster_path: details.poster_path,
    backdrop_path: details.backdrop_path,
    vote_average: details.vote_average,
    release_date: getMediaReleaseDate(details),
  };
}

export function DetailModal() {
  const detailOpen = useAppStore((s) => s.detailOpen);
  const detailMedia = useAppStore((s) => s.detailMedia);
  const myList = useAppStore((s) => s.myList);
  const closeDetailModal = useAppStore((s) => s.closeDetailModal);
  const openPlayer = useAppStore((s) => s.openPlayer);
  const openTrailerModal = useAppStore((s) => s.openTrailerModal);
  const toggleMyListItem = useAppStore((s) => s.toggleMyListItem);
  const cacheMedia = useAppStore((s) => s.cacheMedia);

  const [details, setDetails] = useState<MediaDetails | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = useCallback(() => {
    closeDetailModal();
    setDetails(null);
  }, [closeDetailModal]);

  useEffect(() => {
    if (!detailOpen || !detailMedia) return;

    const cached = useAppStore.getState().mediaCache[detailMedia.id];
    if (cached) {
      setDetails(cached);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setDetails(null);

    const type = resolveMediaType(detailMedia);

    void fetchMediaDetails(detailMedia.id, type).then((data) => {
      if (cancelled) return;
      const enriched = { ...data, custom_type: type };
      cacheMedia(enriched);
      setDetails(enriched);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setDetails({ ...detailMedia, custom_type: type } as MediaDetails);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [detailOpen, detailMedia, cacheMedia]);

  useEffect(() => {
    if (!detailOpen) return;
    stopAllCardTrailers();
  }, [detailOpen]);

  useEffect(() => {
    if (!detailOpen) return;

    document.body.classList.add('modal-open');
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.classList.remove('modal-open');
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [detailOpen, handleClose]);

  if (!detailOpen || !detailMedia) return null;

  const display = details ?? detailMedia;
  const type = resolveMediaType(display);
  const title = getMediaTitle(display);
  const overview = display.overview || 'Sin descripción disponible para este título.';
  const year = getMediaReleaseDate(display).slice(0, 4);
  const match = Math.min(99, Math.round((display.vote_average || 0) * 10));
  const genres = display.genres?.map((g) => g.name).join(', ') || '—';
  const cast = details?.credits?.cast?.slice(0, 6).map((c) => c.name).join(', ') || '—';
  const inList = myList.some((i) => i.id === display.id && i.type === type);

  const backdropUrl =
    buildTmdbImageUrl(display.backdrop_path, 'original')
    ?? buildTmdbImageUrl(display.poster_path, 'original');

  const runtime =
    type === 'movie' && 'runtime' in display
      ? formatRuntime(display.runtime)
      : '';

  const seasons =
    type === 'tv' && 'number_of_seasons' in display
      ? display.number_of_seasons
      : undefined;

  return createPortal(
    <div
      className={styles.detailModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <button
        type="button"
        className={styles.closeBtn}
        onClick={handleClose}
        aria-label="Cerrar"
      >
        ×
      </button>

      <div className={styles.scroll}>
        <div
          className={styles.hero}
          style={backdropUrl ? { backgroundImage: `url('${backdropUrl}')` } : undefined}
        >
          <div className={styles.heroGradient} aria-hidden="true" />
          <div className={`${styles.heroContent} container-fluid`}>
            <h2 id="detail-modal-title" className={styles.title}>{title}</h2>
            <div className={styles.actions}>
              <button
                type="button"
                className={styles.playBtn}
                onClick={() => {
                  openPlayer(display);
                  handleClose();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Reproducir
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label="Ver tráiler"
                onClick={() => openTrailerModal(display.id, type)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              </button>
              <button
                type="button"
                className={inList ? `${styles.iconBtn} ${styles.inList}` : styles.iconBtn}
                aria-label={inList ? 'Quitar de Mi Lista' : 'Añadir a Mi Lista'}
                aria-pressed={inList}
                onClick={() => toggleMyListItem(toMyListItem(display as MediaDetails))}
              >
                {inList ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className={`${styles.body} container-fluid`}>
          {loading ? (
            <div className={styles.loading} role="status" aria-live="polite">
              <div className={styles.spinner} aria-hidden="true" />
            </div>
          ) : (
            <>
              <div className={styles.infoRow}>
                <span className={styles.match}>{match}% Relevante</span>
                {year && <span>{year}</span>}
                <span className={styles.badge}>HD</span>
                {seasons != null && seasons > 0 && (
                  <span>{seasons} Temporada{seasons !== 1 ? 's' : ''}</span>
                )}
                {runtime && <span>{runtime}</span>}
                {display.vote_average > 0 && (
                  <span className={styles.rating}>⭐ {display.vote_average.toFixed(1)}</span>
                )}
              </div>

              <div className={styles.columns}>
                <p className={styles.overview}>{overview}</p>
                <aside className={styles.sidebar}>
                  <p className={styles.sidebarItem}>
                    <span className={styles.label}>Reparto: </span>
                    {cast}
                  </p>
                  <p className={styles.sidebarItem}>
                    <span className={styles.label}>Géneros: </span>
                    {genres}
                  </p>
                  <p className={styles.sidebarItem}>
                    <span className={styles.label}>Tipo: </span>
                    {type === 'tv' ? 'Serie' : 'Película'}
                  </p>
                </aside>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
