import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import { fetchTrailerKey } from '@/services/tmdb';
import styles from './TrailerModal.module.scss';

export function TrailerModal() {
  const trailerOpen = useAppStore((s) => s.trailerOpen);
  const trailerTarget = useAppStore((s) => s.trailerTarget);
  const closeTrailerModal = useAppStore((s) => s.closeTrailerModal);

  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = useCallback(() => {
    closeTrailerModal();
    setTrailerKey(null);
  }, [closeTrailerModal]);

  useEffect(() => {
    if (!trailerOpen || !trailerTarget) return;

    let cancelled = false;
    setLoading(true);
    setTrailerKey(null);

    void fetchTrailerKey(trailerTarget.id, trailerTarget.type).then((key) => {
      if (cancelled) return;
      setTrailerKey(key);
      setLoading(false);
    }).catch(() => {
      if (cancelled) return;
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [trailerOpen, trailerTarget]);

  useEffect(() => {
    if (!trailerOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [trailerOpen, handleClose]);

  if (!trailerOpen || !trailerTarget) return null;

  const originStr =
    window.location.origin !== 'null' ? window.location.origin : 'https://www.netflix.com';

  return createPortal(
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label="Tráiler"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className={styles.content}>
        <button
          type="button"
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Cerrar tráiler"
        >
          ×
        </button>

        <div className={styles.wrapper}>
          {loading && (
            <p className={styles.message} role="status">Buscando tráiler…</p>
          )}
          {!loading && trailerKey && (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&origin=${encodeURIComponent(originStr)}`}
              title="Tráiler"
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          )}
          {!loading && !trailerKey && (
            <p className={styles.message}>Tráiler no disponible por el momento</p>
          )}
        </div>

        {trailerKey && (
          <div className={styles.fallback}>
            <a
              href={`https://www.youtube.com/watch?v=${trailerKey}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              ¿Error al cargar? Abrir tráiler en YouTube
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
