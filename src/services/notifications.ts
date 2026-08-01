import {
  NOTIFICATION_FALLBACK_IMAGE,
  NOTIFICATION_IMAGE_BASE_URL,
  NOTIFICATIONS_MAX,
} from '@/services/config';
import { fetchMediaDetails } from '@/services/tmdb';
import {
  createSeedNotifications,
  NOTIFICATION_SHOW_NAMES,
  NOTIFICATION_TEMPLATES,
} from '@/data/notification-presets';
import type { AppNotification } from '@/types/notification';
import type { MediaType } from '@/types/movie';

export function buildNotificationImageUrl(
  path: string | null | undefined,
): string | null {
  if (!path || path === 'null') return null;
  if (/^https?:\/\//i.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${NOTIFICATION_IMAGE_BASE_URL}${normalized}`;
}

export function getNotificationThumbnailUrl(item: AppNotification): string {
  const path = item.thumbnail ?? item.poster_path ?? null;
  return buildNotificationImageUrl(path) ?? NOTIFICATION_FALLBACK_IMAGE;
}

export function formatNotificationTimeAgo(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const mins = Math.floor(diffMs / 60000);

  if (mins < 1) return 'Ahora';
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  return `Hace ${days} días`;
}

async function fetchNotificationMediaImagePath(
  mediaId: number,
  mediaType: MediaType,
  cache: Record<number, import('@/types/movie').MediaDetails>,
): Promise<string | null> {
  const cached = cache[mediaId];
  if (cached?.poster_path || cached?.backdrop_path) {
    return cached.poster_path ?? cached.backdrop_path ?? null;
  }

  try {
    const data = await fetchMediaDetails(mediaId, mediaType);
    return data.poster_path ?? data.backdrop_path ?? null;
  } catch {
    return null;
  }
}

async function enrichNotificationItem(
  item: AppNotification,
  cache: Record<number, import('@/types/movie').MediaDetails>,
): Promise<AppNotification> {
  const existing = item.thumbnail ?? item.poster_path;
  if (existing && buildNotificationImageUrl(existing)) {
    return { ...item, thumbnail: existing };
  }

  if (item.mediaId && item.mediaType) {
    const fetched = await fetchNotificationMediaImagePath(item.mediaId, item.mediaType, cache);
    if (fetched) {
      return { ...item, poster_path: fetched, thumbnail: fetched };
    }
  }

  return item;
}

export async function enrichNotifications(
  list: AppNotification[],
  cache: Record<number, import('@/types/movie').MediaDetails>,
): Promise<AppNotification[]> {
  return Promise.all(list.map((item) => enrichNotificationItem(item, cache)));
}

export function createInitialNotifications(): AppNotification[] {
  return createSeedNotifications();
}

export async function buildSimulatedNotification(): Promise<AppNotification> {
  const template = NOTIFICATION_TEMPLATES[Math.floor(Math.random() * NOTIFICATION_TEMPLATES.length)];
  const name = NOTIFICATION_SHOW_NAMES[Math.floor(Math.random() * NOTIFICATION_SHOW_NAMES.length)];

  let thumbnail = template.backdrop;
  try {
    const data = await fetchMediaDetails(template.mediaId, template.mediaType);
    thumbnail = data.poster_path ?? data.backdrop_path ?? template.backdrop;
  } catch {
    /* use template backdrop */
  }

  return {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: template.title,
    description: template.description.replace('{name}', name),
    thumbnail,
    createdAt: Date.now(),
    read: false,
    mediaId: template.mediaId,
    mediaType: template.mediaType,
  };
}

export function trimNotifications(list: AppNotification[]): AppNotification[] {
  return list.slice(0, NOTIFICATIONS_MAX);
}

export function countUnreadNotifications(list: AppNotification[]): number {
  return list.filter((n) => !n.read).length;
}
