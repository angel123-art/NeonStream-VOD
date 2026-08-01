export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  title?: string;
  variant: ToastVariant;
  durationMs: number;
}

export interface PushToastInput {
  message: string;
  title?: string;
  variant?: ToastVariant;
  durationMs?: number;
  id?: string;
}

export const DEFAULT_TOAST_DURATION_MS = 4000;
