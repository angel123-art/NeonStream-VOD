import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { NOTIFICATIONS_POLL_MS } from '@/services/config';
import {
  buildSimulatedNotification,
  createInitialNotifications,
  enrichNotifications,
  trimNotifications,
} from '@/services/notifications';

/**
 * Polls for simulated Netflix-style notifications while the catalog is active.
 * Seeds initial notifications on first mount; enriches thumbnails from TMDB.
 */
export function useNotifications(): void {
  const currentUser = useAppStore((s) => s.currentUser);
  const activeProfile = useAppStore((s) => s.activeProfile);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!currentUser || !activeProfile) return;

    const store = useAppStore.getState();

    if (!initializedRef.current) {
      initializedRef.current = true;
      if (store.notifications.length === 0) {
        store.setNotifications(createInitialNotifications());
      }
    }

    const enrich = async () => {
      const state = useAppStore.getState();
      const enriched = await enrichNotifications(state.notifications, state.mediaCache);
      useAppStore.getState().setNotifications(trimNotifications(enriched));
    };

    void enrich();

    const poll = async (allowNew: boolean) => {
      const state = useAppStore.getState();
      let list = [...state.notifications];

      if (allowNew && Math.random() < 0.4) {
        list.unshift(await buildSimulatedNotification());
        list = trimNotifications(list);
      }

      const enriched = await enrichNotifications(list, state.mediaCache);
      useAppStore.getState().setNotifications(enriched);
    };

    void poll(false);

    const intervalId = window.setInterval(() => {
      void poll(true);
    }, NOTIFICATIONS_POLL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [currentUser, activeProfile?.id]);

  useEffect(() => {
    if (!currentUser) {
      initializedRef.current = false;
      const store = useAppStore.getState();
      store.setNotifications([]);
      store.closeNotificationsPanel();
    }
  }, [currentUser]);
}
