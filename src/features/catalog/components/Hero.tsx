import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { fetchTitleLogo, fetchTrailerKey, buildTmdbImageUrl } from '@/services/tmdb';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import {
  getMediaTitle,
  resolveMediaType,
  type MediaItem,
} from '@/types/movie';
import styles from './Hero.module.scss';

const CAROUSEL_INTERVAL_MS = 8000;
const FADE_MS = 500;

interface HeroProps {
  items: MediaItem[];
}

export function Hero({ items }: HeroProps) {
  const openPlayer = useAppStore((s) => s.openPlayer);
  const openDetailModal = useAppStore((s) => s.openDetailModal);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const { loadVideo, toggleMute, isMuted, isReady } = useYouTubePlayer(videoContainerRef);

  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);

  const current = items[index];

  useEffect(() => {
    if (items.length === 0) return;

    const intervalId = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        setFading(false);
      }, FADE_MS);
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [items.length]);

  useEffect(() => {
    if (!current) return;

    let cancelled = false;

    const loadHeroAssets = async () => {
      const type = resolveMediaType(current);
      const [key, logo] = await Promise.all([
        fetchTrailerKey(current.id, type),
        fetchTitleLogo(current.id, type),
      ]);

      if (cancelled) return;
      setTrailerKey(key);
      setLogoUrl(logo);
      await loadVideo(key);
    };

    void loadHeroAssets();

    return () => {
      cancelled = true;
    };
  }, [current, loadVideo]);

  if (!current) return null;

  const title = getMediaTitle(current);
  const backdropUrl = buildTmdbImageUrl(current.backdrop_path, 'original');
  const overview = current.overview || 'Disfruta de los mejores estrenos en Netflix.';

  return (
    <section
      className={fading ? `${styles.hero} ${styles.fade}` : styles.hero}
      aria-label="Destacado"
      style={backdropUrl ? { backgroundImage: `url('${backdropUrl}')` } : undefined}
    >
      <div
        className={trailerKey ? styles.videoWrap : `${styles.videoWrap} ${styles.videoHidden}`}
      >
        <div
          ref={videoContainerRef}
          className={isReady ? `${styles.video} ${styles.videoLoaded}` : styles.video}
          aria-hidden="true"
        />
      </div>

      <div className={styles.vignette} aria-hidden="true" />

      <div className={`${styles.content} container-fluid`}>
        <div className={styles.logoWrap}>
          {logoUrl ? (
            <img className={styles.logo} src={logoUrl} alt={title} />
          ) : (
            <h1 className={styles.title}>{title}</h1>
          )}
        </div>

        <p className={styles.overview}>{overview}</p>

        <div className={styles.bottomActions}>
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.primaryBtn}
              aria-label={`Reproducir ${title}`}
              onClick={() => openPlayer(current)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
              Reproducir
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              aria-label={`Más información sobre ${title}`}
              onClick={() => openDetailModal(current)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Más información
            </button>
          </div>

          {trailerKey && (
            <button
              type="button"
              className={styles.volumeBtn}
              aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              aria-pressed={!isMuted}
              onClick={toggleMute}
            >
              {isMuted ? (
                <svg className={styles.iconMuted} xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <line x1="23" y1="9" x2="17" y2="15" />
                  <line x1="17" y1="9" x2="23" y2="15" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                </svg>
              )}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
