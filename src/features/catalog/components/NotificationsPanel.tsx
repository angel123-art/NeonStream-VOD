import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { NOTIFICATION_FALLBACK_IMAGE } from '@/services/config';
import {
  countUnreadNotifications,
  formatNotificationTimeAgo,
  getNotificationThumbnailUrl,
} from '@/services/notifications';
import type { AppNotification } from '@/types/notification';
import styles from './NotificationsPanel.module.scss';

interface NotificationItemProps {
  item: AppNotification;
  onSelect: (id: string) => void;
}

function NotificationItem({ item, onSelect }: NotificationItemProps) {
  const [imgSrc, setImgSrc] = useState(getNotificationThumbnailUrl(item));
  const [fallback, setFallback] = useState(false);

  return (
    <button
      type="button"
      className={item.read ? styles.item : `${styles.item} ${styles.unread}`}
      onClick={() => onSelect(item.id)}
    >
      <span
        className={fallback ? `${styles.thumbWrap} ${styles.thumbFallback}` : styles.thumbWrap}
        style={{ backgroundImage: `url('${imgSrc}')` }}
        aria-hidden="true"
      >
        <img
          src={imgSrc}
          alt=""
          width={64}
          height={36}
          loading="lazy"
          onError={() => {
            setImgSrc(NOTIFICATION_FALLBACK_IMAGE);
            setFallback(true);
          }}
        />
      </span>
      <span className={styles.body}>
        <span className={styles.itemTitle}>{item.title}</span>
        <span className={styles.itemDesc}>{item.description}</span>
        <span className={styles.itemTime}>{formatNotificationTimeAgo(item.createdAt)}</span>
      </span>
    </button>
  );
}

export function NotificationsPanel() {
  const notifications = useAppStore((s) => s.notifications);
  const panelOpen = useAppStore((s) => s.notificationsPanelOpen);
  const toggleNotificationsPanel = useAppStore((s) => s.toggleNotificationsPanel);
  const closeNotificationsPanel = useAppStore((s) => s.closeNotificationsPanel);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const openDetailModal = useAppStore((s) => s.openDetailModal);
  const cacheMedia = useAppStore((s) => s.cacheMedia);
  const setSearchOpen = useAppStore((s) => s.setSearchOpen);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const unread = countUnreadNotifications(notifications);

  const handleSelect = useCallback(async (id: string) => {
    const item = useAppStore.getState().notifications.find((n) => n.id === id);
    if (!item) return;

    markNotificationRead(id);
    closeNotificationsPanel();
    setSearchOpen(false);

    if (item.mediaId && item.mediaType) {
      try {
        const { fetchMediaDetails } = await import('@/services/tmdb');
        const data = await fetchMediaDetails(item.mediaId, item.mediaType);
        const enriched = { ...data, custom_type: item.mediaType };
        cacheMedia(enriched);
        openDetailModal(enriched);
      } catch {
        useAppStore.getState().pushToast({
          variant: 'error',
          message: 'No se pudo abrir el título de la notificación.',
        });
      }
    }
  }, [markNotificationRead, closeNotificationsPanel, setSearchOpen, cacheMedia, openDetailModal]);

  useEffect(() => {
    if (!panelOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNotificationsPanel();
    };
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        closeNotificationsPanel();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [panelOpen, closeNotificationsPanel]);

  const badgeLabel =
    unread > 0 ? `Notificaciones, ${unread > 9 ? '9+' : unread} sin leer` : 'Notificaciones';

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={styles.btn}
        onClick={() => {
          setSearchOpen(false);
          toggleNotificationsPanel();
        }}
        aria-label={badgeLabel}
        aria-expanded={panelOpen}
        aria-haspopup="true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {panelOpen && (
        <div className={styles.panel} role="dialog" aria-label="Notificaciones">
          <div className={styles.header}>
            <h2 className={styles.title}>Notificaciones</h2>
          </div>

          {notifications.length === 0 ? (
            <p className={styles.empty}>No tienes notificaciones por ahora.</p>
          ) : (
            <div className={styles.list}>
              {notifications.map((item) => (
                <NotificationItem key={item.id} item={item} onSelect={handleSelect} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
