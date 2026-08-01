/** NeonStream-VOD — config.js */
/**
 * Netflix Clone — UI/UX Premium
 * Catálogo TMDB, filas horizontales, hero con tráiler, Mi Lista local
 *
 * Credenciales sensibles: archivo `.env` en la raíz (ver `.env.example`).
 * Vite inyecta variables VITE_* vía import.meta.env en build/dev.
 */

function readEnv(name) {
    const value = import.meta.env[name];
    if (typeof value !== 'string' || !value.trim()) {
        if (import.meta.env.DEV) {
            console.warn(
                `[Config] Falta ${name}. Copia .env.example → .env y define tus credenciales.`
            );
        }
        return '';
    }
    return value.trim();
}

// Configuration — Supabase & TMDB (desde .env)
const SUPABASE_URL = readEnv('VITE_SUPABASE_URL');
const SUPABASE_ANON_KEY = readEnv('VITE_SUPABASE_ANON_KEY');
const API_KEY = readEnv('VITE_TMDB_API_KEY');
const APP_BUILD = readEnv('VITE_APP_BUILD') || 'dev';

/** Limpia la URL: quita espacios, barras finales y /rest/v1/ si se pegó por error */
function normalizeSupabaseUrl(url) {
    return url
        .trim()
        .replace(/\/rest\/v1\/?$/i, '')
        .replace(/\/+$/, '');
}

function getSupabaseProjectUrl() {
    return normalizeSupabaseUrl(SUPABASE_URL);
}

/**
 * URL de retorno tras confirmar correo u OAuth.
 * En GitHub Pages la app vive en /NeonStream-VOD/, no solo en el origin.
 */
function getAuthRedirectUrl() {
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

function getPasswordResetRedirectUrl() {
    const path = window.location.pathname.replace(/\/index\.html$/i, '') || '/';
    return `${window.location.origin}${path}`;
}

function cleanAuthCallbackFromUrl() {
    const hash = window.location.hash;
    if (!hash) return;
    if (/access_token|refresh_token|type=signup|type=recovery|type=magiclink/i.test(hash)) {
        window.history.replaceState({}, document.title, getAuthRedirectUrl());
    }
}

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const KIDS_MOVIE_CERT = '&certification_country=US&certification.lte=PG';
const KIDS_TV_CERT = '&certification_country=US&certification.lte=TV-PG';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w780';
const HERO_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const HOME_REFRESH_MS = 20 * 60 * 1000;
const MY_LIST_KEY = 'netflix_my_list';
const PROFILE_SESSION_KEY = 'netflix_active_profile';
const PROFILE_LOCAL_KEY = 'netflix_active_profile_v1';
const MAX_PROFILES = 5;
const CARD_HOVER_DELAY_MS = 1200;
const NOTIFICATIONS_POLL_MS = 45000;
const NOTIFICATIONS_MAX = 15;
const NOTIFICATION_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w200';
const NOTIFICATION_FALLBACK_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png';
const LANDING_POSTER_IMAGE_BASE = 'https://image.tmdb.org/t/p/w342';
const LANDING_POSTER_FALLBACK = NOTIFICATION_FALLBACK_IMAGE;
const AUDIT_LOG_STORAGE_KEY = 'neonstream_audit_logs_v1';
const AUDIT_LOG_MAX_ENTRIES = 800;

export {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    APP_BUILD,
    normalizeSupabaseUrl,
    getSupabaseProjectUrl,
    getAuthRedirectUrl,
    getPasswordResetRedirectUrl,
    cleanAuthCallbackFromUrl,
    API_KEY,
    TMDB_BASE_URL,
    KIDS_MOVIE_CERT,
    KIDS_TV_CERT,
    IMAGE_BASE_URL,
    BACKDROP_BASE_URL,
    HERO_IMAGE_BASE_URL,
    LOGO_BASE_URL,
    HOME_REFRESH_MS,
    MY_LIST_KEY,
    PROFILE_SESSION_KEY,
    PROFILE_LOCAL_KEY,
    MAX_PROFILES,
    CARD_HOVER_DELAY_MS,
    NOTIFICATIONS_POLL_MS,
    NOTIFICATIONS_MAX,
    NOTIFICATION_IMAGE_BASE_URL,
    NOTIFICATION_FALLBACK_IMAGE,
    LANDING_POSTER_IMAGE_BASE,
    LANDING_POSTER_FALLBACK,
    AUDIT_LOG_STORAGE_KEY,
    AUDIT_LOG_MAX_ENTRIES
};
