/**
 * Environment & constants — migrated from js/config.js
 */
function readEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (typeof value !== 'string' || !value.trim()) {
    if (import.meta.env.DEV) {
      console.warn(
        `[Config] Falta ${name}. Copia .env.example → .env y define tus credenciales.`,
      );
    }
    return '';
  }
  return value.trim();
}

export const SUPABASE_URL = readEnv('VITE_SUPABASE_URL');
export const SUPABASE_ANON_KEY = readEnv('VITE_SUPABASE_ANON_KEY');
export const API_KEY = readEnv('VITE_TMDB_API_KEY');
export const APP_BUILD = readEnv('VITE_APP_BUILD') || 'dev';

export function normalizeSupabaseUrl(url: string): string {
  return url
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

export function getSupabaseProjectUrl(): string {
  return normalizeSupabaseUrl(SUPABASE_URL);
}

export function getAuthRedirectUrl(): string {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';

  let path = url.pathname.replace(/\/index\.html$/i, '');
  if (!path.endsWith('/')) {
    const lastSegment = path.split('/').pop() || '';
    path = lastSegment.includes('.')
      ? path.slice(0, path.lastIndexOf('/') + 1)
      : `${path}/`;
  }

  return `${url.origin}${path}`;
}

export function getPasswordResetRedirectUrl(): string {
  const path = window.location.pathname.replace(/\/index\.html$/i, '') || '/';
  return `${window.location.origin}${path}`;
}

export function cleanAuthCallbackFromUrl(): void {
  const hash = window.location.hash;
  if (!hash) return;
  if (/access_token|refresh_token|type=signup|type=recovery|type=magiclink/i.test(hash)) {
    window.history.replaceState({}, document.title, getAuthRedirectUrl());
  }
}

export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const KIDS_MOVIE_CERT = '&certification_country=US&certification.lte=PG';
export const KIDS_TV_CERT = '&certification_country=US&certification.lte=TV-PG';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w780';
export const HERO_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
export const LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w500';
export const HOME_REFRESH_MS = 20 * 60 * 1000;
export const MY_LIST_KEY = 'netflix_my_list';
export const PROFILE_SESSION_KEY = 'netflix_active_profile';
export const PROFILE_LOCAL_KEY = 'netflix_active_profile_v1';
export const MAX_PROFILES = 5;
export const CARD_HOVER_DELAY_MS = 1200;
export const NOTIFICATIONS_POLL_MS = 45000;
export const NOTIFICATIONS_MAX = 15;
export const NOTIFICATION_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200';
export const NOTIFICATION_FALLBACK_IMAGE =
  'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
export const LANDING_POSTER_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';
export const LANDING_POSTER_FALLBACK = NOTIFICATION_FALLBACK_IMAGE;
export const BOOT_TIMEOUT_MS = 12000;
