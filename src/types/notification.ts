import type { MediaType } from './movie';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  thumbnail?: string | null;
  poster_path?: string | null;
  createdAt: number;
  read: boolean;
  mediaId?: number;
  mediaType?: MediaType;
}

export interface NotificationTemplate {
  title: string;
  description: string;
  backdrop: string;
  mediaId: number;
  mediaType: MediaType;
}
