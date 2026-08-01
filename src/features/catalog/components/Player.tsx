import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import { useContinueWatchingStore } from '@/store/useContinueWatchingStore';
import { stopAllCardTrailers } from '@/services/cardTrailerCoordinator';
import {
  resolveWatchDurationSeconds,
  snapshotFromMedia,
} from '@/services/continueWatching';
import { buildEmbedUrl, PLAYER_SERVERS } from '@/services/player';
import { fetchMediaDetails, fetchSeasonEpisodes } from '@/services/tmdb';
import {
  getMediaReleaseDate,
  getMediaTitle,
  resolveMediaType,
  type Episode,
  type Season,
  type TvDetails,
} from '@/types/movie';
import styles from './Player.module.scss';

function getFullscreenElement(): Element | null {
  return document.fullscreenElement ?? (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement ?? null;
}

export function Player() {
  const playerOpen = useAppStore((s) => s.playerOpen);
  const playerMedia = useAppStore((s) => s.playerMedia);
  const playerSeason = useAppStore((s) => s.playerSeason);
  const playerEpisode = useAppStore((s) => s.playerEpisode);
  const playerServer = useAppStore((s) => s.playerServer);
  const playerStartAt = useAppStore((s) => s.playerStartAt);
  const closePlayer = useAppStore((s) => s.closePlayer);
  const setPlayerSeason = useAppStore((s) => s.setPlayerSeason);
  const setPlayerEpisode = useAppStore((s) => s.setPlayerEpisode);
  const setPlayerServer = useAppStore((s) => s.setPlayerServer);
  const openTrailerModal = useAppStore((s) => s.openTrailerModal);
  const cacheMedia = useAppStore((s) => s.cacheMedia);
  const updateProgress = useContinueWatchingStore((s) => s.updateProgress);

  const stageRef = useRef<HTMLDivElement>(null);
  const sessionStartedAtRef = useRef(0);
  const durationRef = useRef(0);
  const lastReportedTimeRef = useRef(0);
  const [iframeLoading, setIframeLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);

  const media = playerMedia;
  const type = media ? resolveMediaType(media) : 'movie';
  const isTv = type === 'tv';

  const reportProgress = useCallback(
    (currentTime: number, duration: number) => {
      if (!media) return;
      const safeDuration = Math.max(duration, durationRef.current, 1);
      durationRef.current = safeDuration;
      lastReportedTimeRef.current = currentTime;
      updateProgress(
        media.id,
        currentTime,
        safeDuration,
        snapshotFromMedia(media, isTv ? playerSeason : undefined, isTv ? playerEpisode : undefined),
      );
    },
    [media, isTv, playerSeason, playerEpisode, updateProgress],
  );

  const flushEstimatedProgress = useCallback(() => {
    if (!media || !sessionStartedAtRef.current) return;
    const elapsed = (Date.now() - sessionStartedAtRef.current) / 1000;
    const estimated = Math.min(durationRef.current || Number.POSITIVE_INFINITY, playerStartAt + elapsed);
    const duration = durationRef.current || resolveWatchDurationSeconds(media, type);
    reportProgress(Math.max(lastReportedTimeRef.current, estimated), duration);
  }, [media, playerStartAt, reportProgress, type]);

  const handleClose = useCallback(() => {
    flushEstimatedProgress();
    if (getFullscreenElement()) {
      if (document.exitFullscreen) void document.exitFullscreen();
      else if ((document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
        (document as Document & { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
    }
    closePlayer();
    setEmbedUrl(null);
  }, [closePlayer, flushEstimatedProgress]);

  const toggleFullscreen = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;

    if (getFullscreenElement()) {
      if (document.exitFullscreen) void document.exitFullscreen();
      else if ((document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen) {
        (document as Document & { webkitExitFullscreen: () => void }).webkitExitFullscreen();
      }
      return;
    }

    if (stage.requestFullscreen) void stage.requestFullscreen();
    else if ((stage as HTMLDivElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen) {
      (stage as HTMLDivElement & { webkitRequestFullscreen: () => void }).webkitRequestFullscreen();
    }
  }, []);

  useEffect(() => {
    if (!playerOpen) return;
    stopAllCardTrailers();
  }, [playerOpen]);

  useEffect(() => {
    if (!playerOpen || !media) {
      sessionStartedAtRef.current = 0;
      durationRef.current = 0;
      lastReportedTimeRef.current = 0;
      return;
    }

    sessionStartedAtRef.current = Date.now();
    lastReportedTimeRef.current = playerStartAt;
    durationRef.current = resolveWatchDurationSeconds(media, type);

    if (playerStartAt >= 20) {
      reportProgress(playerStartAt, durationRef.current);
    }

    const tickId = window.setInterval(() => {
      const elapsed = (Date.now() - sessionStartedAtRef.current) / 1000;
      const estimated = Math.min(durationRef.current, playerStartAt + elapsed);
      if (estimated >= 20) {
        reportProgress(estimated, durationRef.current);
      }
    }, 15000);

    return () => window.clearInterval(tickId);
  }, [playerOpen, media, type, playerStartAt, reportProgress]);

  useEffect(() => {
    if (!playerOpen) return;

    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      const payload = data as Record<string, unknown>;
      const nested = (payload.data && typeof payload.data === 'object'
        ? payload.data
        : payload) as Record<string, unknown>;

      const currentTime = Number(nested.currentTime ?? nested.time ?? nested.t ?? NaN);
      const duration = Number(nested.duration ?? nested.d ?? NaN);
      if (!Number.isFinite(currentTime) || currentTime < 0) return;

      reportProgress(
        currentTime,
        Number.isFinite(duration) && duration > 0 ? duration : durationRef.current,
      );
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [playerOpen, reportProgress]);

  useEffect(() => {
    if (!playerOpen || !media || !isTv) {
      setSeasons([]);
      setEpisodes([]);
      return;
    }

    let cancelled = false;

    const loadTvData = async () => {
      let tvDetails = media as TvDetails;
      if (!tvDetails.seasons) {
        const fetched = await fetchMediaDetails(media.id, 'tv');
        tvDetails = fetched as TvDetails;
        cacheMedia(fetched);
      }

      if (cancelled) return;

      const validSeasons = (tvDetails.seasons ?? []).filter((s) => s.season_number > 0);
      setSeasons(validSeasons.length > 0 ? validSeasons : [{ id: 0, name: 'Temporada 1', overview: '', season_number: 1, episode_count: 1, poster_path: null }]);

      const seasonNum = playerSeason || 1;
      try {
        const eps = await fetchSeasonEpisodes(media.id, seasonNum);
        if (!cancelled) setEpisodes(eps.length > 0 ? eps : []);
      } catch {
        if (!cancelled) setEpisodes([]);
      }

      const runtimeSeconds = resolveWatchDurationSeconds(tvDetails, 'tv');
      if (runtimeSeconds > 0) durationRef.current = runtimeSeconds;
    };

    void loadTvData();

    return () => {
      cancelled = true;
    };
  }, [playerOpen, media, isTv, playerSeason, cacheMedia]);

  useEffect(() => {
    if (!playerOpen || !media) {
      setEmbedUrl(null);
      return;
    }

    setIframeLoading(true);
    const url = buildEmbedUrl(media.id, type, playerServer, playerSeason, playerEpisode, playerStartAt);

    const timerId = window.setTimeout(() => {
      setEmbedUrl(url);
      setIframeLoading(false);
    }, 100);

    return () => window.clearTimeout(timerId);
  }, [playerOpen, media, type, playerServer, playerSeason, playerEpisode, playerStartAt]);

  useEffect(() => {
    if (!playerOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (getFullscreenElement()) return;
        handleClose();
        return;
      }
      if (
        e.key === 'f'
        && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName ?? '')
      ) {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    const onFullscreenChange = () => {
      setIsFullscreen(getFullscreenElement() === stageRef.current);
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [playerOpen, handleClose, toggleFullscreen]);

  const handleSeasonChange = async (seasonNum: number) => {
    flushEstimatedProgress();
    sessionStartedAtRef.current = Date.now();
    lastReportedTimeRef.current = 0;
    setPlayerSeason(seasonNum);
    if (!media) return;
    try {
      const eps = await fetchSeasonEpisodes(media.id, seasonNum);
      setEpisodes(eps.length > 0 ? eps : []);
    } catch {
      setEpisodes([]);
    }
  };

  if (!playerOpen || !media) return null;

  const title = getMediaTitle(media);
  const year = getMediaReleaseDate(media).slice(0, 4) || 'N/A';
  const rating = media.vote_average ? media.vote_average.toFixed(1) : 'NR';
  const overview = media.overview || 'Sin descripción disponible para este título.';

  return createPortal(
    <div className={styles.shell} role="region" aria-label={`Reproductor: ${title}`}>
      <div className={styles.container}>
        <header className={styles.header}>
          <button type="button" className={styles.backBtn} onClick={handleClose}>
            ← Volver al catálogo
          </button>
          <div className={styles.infoHeader}>
            <h1 className={styles.title}>{title}</h1>
            <span className={styles.badge}>{year}</span>
            <span className={styles.badge}>⭐ {rating}</span>
          </div>
        </header>

        <div className={styles.stage} ref={stageRef}>
          <div className={styles.videoWrapper}>
            {iframeLoading && (
              <p className={styles.loading} role="status">Cargando reproductor…</p>
            )}
            {embedUrl && (
              <iframe
                key={embedUrl}
                src={embedUrl}
                title={`Reproduciendo ${title}`}
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
              />
            )}
          </div>
          <button
            type="button"
            className={isFullscreen ? `${styles.fullscreenBtn} ${styles.active}` : styles.fullscreenBtn}
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            title={isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
          >
            {isFullscreen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        </div>

        <div className={styles.servers} role="group" aria-label="Servidores de reproducción">
          {PLAYER_SERVERS.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              className={playerServer === id ? `${styles.serverBtn} ${styles.serverActive}` : styles.serverBtn}
              onClick={() => {
                flushEstimatedProgress();
                sessionStartedAtRef.current = Date.now();
                setPlayerServer(id);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <p className={styles.serverHint}>
          Si un servidor no carga, prueba otro. La calidad puede variar según la fuente.
        </p>

        <section className={styles.details}>
          {isTv && (
            <div className={styles.tvControls}>
              <div className={styles.selectGroup}>
                <label htmlFor="player-season">Temporada</label>
                <select
                  id="player-season"
                  className={styles.select}
                  value={playerSeason}
                  onChange={(e) => void handleSeasonChange(Number(e.target.value))}
                >
                  {seasons.map((s) => (
                    <option key={s.season_number} value={s.season_number}>
                      Temporada {s.season_number}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.selectGroup}>
                <label htmlFor="player-episode">Episodio</label>
                <select
                  id="player-episode"
                  className={styles.select}
                  value={playerEpisode}
                  onChange={(e) => {
                    flushEstimatedProgress();
                    sessionStartedAtRef.current = Date.now();
                    lastReportedTimeRef.current = 0;
                    setPlayerEpisode(Number(e.target.value));
                  }}
                >
                  {episodes.length > 0 ? (
                    episodes.map((ep) => (
                      <option key={ep.episode_number} value={ep.episode_number}>
                        Cap. {ep.episode_number} - {ep.name}
                      </option>
                    ))
                  ) : (
                    <option value={1}>Episodio 1</option>
                  )}
                </select>
              </div>
            </div>
          )}

          <h2 className={styles.overviewTitle}>Sinopsis</h2>
          <p className={styles.overviewText}>{overview}</p>

          <button
            type="button"
            className={styles.trailerBtn}
            onClick={() => openTrailerModal(media.id, type)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Ver tráiler
          </button>
        </section>
      </div>
    </div>,
    document.body,
  );
}
