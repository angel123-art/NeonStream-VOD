import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '@/store/useAppStore';
import type { Toast, ToastVariant } from '@/types/toast';
import styles from './ToastContainer.module.scss';

function ToastIcon({ variant }: { variant: ToastVariant }) {
  if (variant === 'success') {
    return (
      <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (variant === 'error') {
    return (
      <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }
  if (variant === 'warning') {
    return (
      <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg className={styles.icon} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useAppStore((s) => s.dismissToast);

  useEffect(() => {
    const timerId = window.setTimeout(() => dismissToast(toast.id), toast.durationMs);
    return () => window.clearTimeout(timerId);
  }, [toast.id, toast.durationMs, dismissToast]);

  const variantClass =
    toast.variant === 'success' ? styles.success
      : toast.variant === 'error' ? styles.error
        : toast.variant === 'warning' ? styles.warning
          : styles.info;

  return (
    <div
      className={`${styles.toast} ${variantClass}`}
      role={toast.variant === 'error' ? 'alert' : 'status'}
      aria-live={toast.variant === 'error' ? 'assertive' : 'polite'}
    >
      <ToastIcon variant={toast.variant} />
      <div className={styles.body}>
        {toast.title && <p className={styles.title}>{toast.title}</p>}
        <p className={styles.message}>{toast.message}</p>
      </div>
      <button
        type="button"
        className={styles.dismiss}
        onClick={() => dismissToast(toast.id)}
        aria-label="Cerrar notificación"
      >
        ×
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return createPortal(
    <div className={styles.container} aria-label="Notificaciones">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>,
    document.body,
  );
}
