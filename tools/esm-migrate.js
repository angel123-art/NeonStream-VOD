/**
 * Adds ES module import/export blocks to js/ modules.
 * Run: node tools/esm-migrate.js
 */
const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, '..', 'js');

const modules = {
    'config.js': {
        imports: '',
        exports: `export {
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
};`
    },
    'data-presets.js': {
        imports: '',
        exports: `export {
    NOTIFICATION_TEMPLATES,
    NOTIFICATION_SHOW_NAMES,
    AVATAR_PRESETS,
    LANDING_POSTER_PATHS
};`
    },
    'state.js': {
        imports: `import { AVATAR_PRESETS } from './data-presets.js';\n\n`,
        exports: `export {
    elements,
    loadedMedia,
    currentMediaId,
    currentMediaType,
    currentView,
    carouselInterval,
    homeRefreshInterval,
    detailMedia,
    heroYtPlayer,
    heroMuted,
    heroCurrentVideoKey,
    youtubeApiReady,
    cardHoverTimer,
    cardHoverTarget,
    trailerCache,
    editingProfileId,
    selectedAvatarUrl,
    profileGateInitialized,
    authGateInitialized,
    landingGateInitialized,
    authMode,
    supabaseClient,
    currentUser,
    userProfiles,
    currentProfile,
    profilesLoading,
    notifications,
    notificationsPollInterval,
    notificationsInitialized,
    notificationsPanelOpen,
    notificationsSeedLoaded,
    appBootComplete,
    bootSessionResolved,
    appBootTimeoutId
};`
    },
    'audit-logger.js': {
        imports: `import {
    APP_BUILD,
    AUDIT_LOG_STORAGE_KEY,
    AUDIT_LOG_MAX_ENTRIES
} from './config.js';
import { elements } from './state.js';

`,
        exports: `export { AuditLogger, setupAuditLoggerUI, setupGlobalImageErrorLogging };`
    },
    'boot.js': {
        imports: `import {
    elements,
    appBootComplete,
    appBootTimeoutId,
    bootSessionResolved
} from './state.js';
import { showLandingGate, finishAppBoot } from './boot.js';
import { onUserAuthenticated } from './auth.js';
import { closeNotificationsPanel } from './notifications.js';

`,
        exports: `export { startAppBoot, finishAppBoot, resolveBootSession, setupSearchToggle };`
    }
};

console.log('Use manual migration — script is a reference only.');
