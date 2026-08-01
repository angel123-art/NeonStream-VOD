import { useEffect, useState, type SyntheticEvent } from 'react';
import {
  fillLandingPosterPaths,
  LANDING_GRID_SIZE,
  LANDING_POSTER_PATHS,
} from '@/data/landing-presets';
import { buildTmdbImageUrl, fetchTrendingAll, fetchTrendingMovies } from '@/services/tmdb';
import styles from './LandingGate.module.scss';

function buildPosterUrl(path: string): string | null {
  return buildTmdbImageUrl(path, 'w342');
}

function uniquePosterPaths(paths: Array<string | null | undefined>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const path of paths) {
    if (!path || seen.has(path)) continue;
    seen.add(path);
    result.push(path);
  }
  return result;
}

function handlePosterError(event: SyntheticEvent<HTMLImageElement>): void {
  event.currentTarget.style.opacity = '0';
}

async function fetchLandingPosters(): Promise<string[]> {
  const [movies, all] = await Promise.all([
    fetchTrendingMovies('week'),
    fetchTrendingAll('week'),
  ]);

  return uniquePosterPaths([
    ...(movies.results ?? []).map((item) => item.poster_path),
    ...(all.results ?? []).map((item) => item.poster_path),
  ]);
}

export function LandingPosterMarquee() {
  const [posterPaths, setPosterPaths] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadPosters() {
      try {
        const livePaths = await fetchLandingPosters();
        if (!cancelled && livePaths.length >= LANDING_GRID_SIZE) {
          setPosterPaths(fillLandingPosterPaths(livePaths, LANDING_GRID_SIZE));
          setReady(true);
          return;
        }
      } catch {
        // Fallback estático abajo.
      }

      if (!cancelled) {
        setPosterPaths(fillLandingPosterPaths(LANDING_POSTER_PATHS, LANDING_GRID_SIZE));
        setReady(true);
      }
    }

    void loadPosters();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.background} aria-hidden="true">
      <div className={`${styles.grid} ${ready ? styles.gridReady : ''}`}>
        {posterPaths.map((path, index) => {
          const url = buildPosterUrl(path);
          if (!url) return <div key={`empty-${index}`} className={styles.posterTile} />;

          return (
            <div key={`${path}-${index}`} className={styles.posterTile}>
              <img
                className={styles.posterImg}
                src={url}
                alt=""
                loading={index < 4 ? 'eager' : 'lazy'}
                decoding="async"
                onError={handlePosterError}
              />
            </div>
          );
        })}
      </div>
      <div className={styles.overlay} />
    </div>
  );
}
