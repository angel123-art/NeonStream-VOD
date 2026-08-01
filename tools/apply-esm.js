/**
 * Migrates js/ modules to ES modules with appState for mutable shared state.
 * Run from repo root: node tools/apply-esm.js
 */
const fs = require('fs');
const path = require('path');

const JS_DIR = path.join(__dirname, '..', 'js');
const BUILD = '20260801-esm';

const MUTABLE_VARS = [
    'notificationsPollInterval',
    'notificationsInitialized',
    'notificationsSeedLoaded',
    'notificationsPanelOpen',
    'profileGateInitialized',
    'landingGateInitialized',
    'notificationsPanelOpen',
    'bootSessionResolved',
    'homeRefreshInterval',
    'cardHoverTimer',
    'cardHoverTarget',
    'heroCurrentVideoKey',
    'profileGateInitialized',
    'authGateInitialized',
    'landingGateInitialized',
    'notificationsPanelOpen',
    'appBootTimeoutId',
    'currentHeroItems',
    'currentHeroIdx',
    'youtubeApiReady',
    'profilesLoading',
    'selectedAvatarUrl',
    'notifications',
    'carouselInterval',
    'currentMediaType',
    'currentMediaId',
    'profileGateInitialized',
    'appBootComplete',
    'editingProfileId',
    'currentProfile',
    'supabaseClient',
    'userProfiles',
    'loadedMedia',
    'currentView',
    'detailMedia',
    'heroYtPlayer',
    'heroMuted',
    'authMode',
    'currentUser'
];

const UNIQUE_VARS = [...new Set(MUTABLE_VARS)].sort((a, b) => b.length - a.length);

function applyAppState(content) {
    let out = content;
    for (const name of UNIQUE_VARS) {
        const re = new RegExp(`(?<![.\\w])${name}(?![\\w])`, 'g');
        out = out.replace(re, `appState.${name}`);
    }
    out = out.replace(/(?<![.\w])trailerCache(?![\w])/g, 'appState.trailerCache');
    return out;
}

const moduleMeta = {
    'audit-logger.js': {
        imports: `import {
    APP_BUILD,
    AUDIT_LOG_STORAGE_KEY,
    AUDIT_LOG_MAX_ENTRIES
} from './config.js';
import { elements } from './state.js';

`,
        exports: 'export { AuditLogger, setupAuditLoggerUI, setupGlobalImageErrorLogging };',
        skipState: true
    },
    'boot.js': {
        imports: `import { elements, appState } from './state.js';
import { showLandingGate } from './landing.js';
import { onUserAuthenticated } from './auth.js';
import { closeNotificationsPanel } from './notifications.js';

`,
        exports: 'export { startAppBoot, finishAppBoot, resolveBootSession, setupSearchToggle };'
    },
    'notifications.js': {
        imports: `import {
    API_KEY,
    TMDB_BASE_URL,
    NOTIFICATIONS_MAX,
    NOTIFICATIONS_POLL_MS,
    NOTIFICATION_IMAGE_BASE_URL,
    NOTIFICATION_FALLBACK_IMAGE
} from './config.js';
import { NOTIFICATION_TEMPLATES, NOTIFICATION_SHOW_NAMES } from './data-presets.js';
import { elements, appState } from './state.js';
import { openDetailModal } from './detail-modal.js';

`,
        exports: `export {
    setupNotifications,
    buildTmdbImageUrl,
    closeNotificationsPanel,
    startNotificationsPolling,
    stopNotificationsPolling
};`
    },
    'landing.js': {
        imports: `import {
    API_KEY,
    TMDB_BASE_URL,
    LANDING_POSTER_IMAGE_BASE,
    LANDING_POSTER_FALLBACK
} from './config.js';
import { LANDING_POSTER_PATHS } from './data-presets.js';
import { elements, appState } from './state.js';
import { AuditLogger } from './audit-logger.js';
import { buildTmdbImageUrl } from './notifications.js';
import {
    normalizeAuthEmail,
    hideAuthGate,
    hideAuthMessages,
    updateAuthUI,
    showAuthGate,
    showAuthError,
    validateSupabaseConfig
} from './auth.js';

`,
        exports: `export {
    handleLandingPosterError,
    setupLandingGate,
    showLandingGate,
    hideLandingGate,
    returnToLandingFromAuth,
    openAuthFromLanding
};`
    },
    'auth.js': {
        imports: `import {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    APP_BUILD,
    getSupabaseProjectUrl,
    getAuthRedirectUrl,
    getPasswordResetRedirectUrl,
    cleanAuthCallbackFromUrl
} from './config.js';
import { elements, appState } from './state.js';
import { AuditLogger } from './audit-logger.js';
import { finishAppBoot } from './boot.js';
import { hideLandingGate, showLandingGate } from './landing.js';
import {
    loadUserProfiles,
    renderProfileSelectGrid,
    openProfileGate,
    tryRestoreProfileSession,
    clearActiveProfile,
    closeProfileEditor,
    closeProfileManage
} from './profiles.js';
import { closeDetailModal } from './detail-modal.js';
import { stopNotificationsPolling } from './notifications.js';

`,
        exports: `export {
    validateSupabaseConfig,
    normalizeAuthEmail,
    hideAuthGate,
    hideAuthMessages,
    updateAuthUI,
    showAuthGate,
    showAuthError,
    setupAuthGate,
    initAuth,
    onUserAuthenticated,
    onUserSignedOut,
    handleSignOut
};`
    },
    'profiles.js': {
        imports: `import {
    KIDS_MOVIE_CERT,
    KIDS_TV_CERT,
    MAX_PROFILES,
    PROFILE_LOCAL_KEY,
    PROFILE_SESSION_KEY
} from './config.js';
import { AVATAR_PRESETS } from './data-presets.js';
import { elements, appState } from './state.js';
import { AuditLogger } from './audit-logger.js';
import { handleSignOut } from './auth.js';
import { checkUrlState } from './catalog.js';
import { startNotificationsPolling } from './notifications.js';
import { hideLandingGate } from './landing.js';
import { resetGenreButtons } from './helpers.js';

`,
        exports: `export {
    isKidsProfile,
    getKidsMovieParams,
    getKidsTvParams,
    loadUserProfiles,
    getProfiles,
    clearActiveProfile,
    tryRestoreProfileSession,
    setupProfilePersistence,
    setupProfileGate,
    renderProfileSelectGrid,
    selectProfile,
    revealApp,
    openProfileGate,
    closeProfileEditor,
    closeProfileManage
};`
    },
    'skeleton-hover.js': {
        imports: `import { CARD_HOVER_DELAY_MS } from './config.js';
import { elements, appState } from './state.js';
import { fetchTrailerKey } from './detail-modal.js';
import { buildYoutubeEmbedUrl } from './hero.js';

`,
        exports: `export {
    showSkeletonLoader,
    toggleSpinner,
    setupCardHoverTrailers,
    clearCardHoverTimer,
    stopAllCardTrailers
};`
    },
    'hero.js': {
        imports: `import { elements, appState } from './state.js';

`,
        exports: `export {
    buildYoutubeEmbedUrl,
    setupHeroVolumeControl,
    initHeroYoutubePlayer
};`
    },
    'my-list.js': {
        imports: `import { MY_LIST_KEY } from './config.js';
import { elements, appState } from './state.js';

`,
        exports: `export {
    getMyList,
    isInMyList,
    toggleMyList,
    updateListButtonStates,
    setupNavbarScroll
};`
    },
    'detail-modal.js': {
        imports: `import {
    API_KEY,
    TMDB_BASE_URL,
    HERO_IMAGE_BASE_URL
} from './config.js';
import { elements, appState } from './state.js';
import { openPlayer } from './player.js';
import { toggleMyList, updateListButtonStates } from './my-list.js';
import { stopAllCardTrailers } from './skeleton-hover.js';

`,
        exports: `export {
    setupDetailModalListeners,
    fetchTrailerKey,
    openDetailModal,
    closeDetailModal
};`
    },
    'player.js': {
        imports: `import { API_KEY, TMDB_BASE_URL } from './config.js';
import { elements, appState } from './state.js';
import { closeDetailModal, fetchTrailerKey } from './detail-modal.js';
import { showView, updateServerActiveState } from './helpers.js';
import { switchCategory, clearUrlParam } from './catalog.js';

`,
        exports: `export {
    fetchMediaDetailsAndPlay,
    openPlayer,
    populateSeasons,
    populateEpisodes,
    triggerIframeUpdate,
    openTrailerModal,
    setupFullscreenControls,
    getFullscreenElement,
    loadVideoIframe
};`
    },
    'helpers.js': {
        imports: `import {
    API_KEY,
    TMDB_BASE_URL,
    KIDS_MOVIE_CERT
} from './config.js';
import { elements, appState } from './state.js';
import { isKidsProfile, getKidsMovieParams } from './profiles.js';
import {
    switchCategory,
    fetchAndRenderGrid,
    clearUrlParam,
    updateNavActiveState
} from './catalog.js';
import { closeDetailModal } from './detail-modal.js';
import { getFullscreenElement } from './player.js';

`,
        exports: `export {
    handleSearch,
    handleGenreFilter,
    resetGenreButtons,
    showView,
    updateServerActiveState
};`
    },
    'catalog.js': {
        imports: `import {
    API_KEY,
    TMDB_BASE_URL,
    KIDS_MOVIE_CERT,
    KIDS_TV_CERT,
    HOME_REFRESH_MS,
    IMAGE_BASE_URL,
    BACKDROP_BASE_URL,
    HERO_IMAGE_BASE_URL,
    LOGO_BASE_URL
} from './config.js';
import { elements, appState } from './state.js';
import { AuditLogger } from './audit-logger.js';
import {
    isKidsProfile,
    getKidsMovieParams,
    getKidsTvParams
} from './profiles.js';
import { getMyList, isInMyList, updateListButtonStates } from './my-list.js';
import {
    showSkeletonLoader,
    toggleSpinner,
    stopAllCardTrailers
} from './skeleton-hover.js';
import { closeDetailModal } from './detail-modal.js';
import { fetchTrailerKey } from './detail-modal.js';
import { initHeroYoutubePlayer } from './hero.js';

`,
        exports: `export {
    clearUrlParam,
    checkUrlState,
    updateNavActiveState,
    switchCategory,
    fetchAndRenderGrid,
    stopAllCardTrailers
};`
    },
    'events.js': {
        imports: `import { elements, appState } from './state.js';
import { switchCategory, checkUrlState } from './catalog.js';
import { handleSearch, handleGenreFilter, showView } from './helpers.js';
import { updateServerActiveState } from './helpers.js';
import {
    openPlayer,
    loadVideoIframe,
    populateEpisodes,
    triggerIframeUpdate,
    setupFullscreenControls,
    getFullscreenElement,
    openTrailerModal
} from './player.js';
import { openDetailModal, closeDetailModal, setupDetailModalListeners } from './detail-modal.js';
import { toggleMyList, updateListButtonStates } from './my-list.js';

`,
        exports: 'export { setupEventListeners };'
    },
    'main.js': {
        imports: `import { setupAuditLoggerUI, setupGlobalImageErrorLogging } from './audit-logger.js';
import { startAppBoot, setupSearchToggle } from './boot.js';
import { setupNotifications } from './notifications.js';
import { setupLandingGate } from './landing.js';
import { setupAuthGate, initAuth } from './auth.js';
import { setupProfileGate, setupProfilePersistence } from './profiles.js';
import { setupCardHoverTrailers } from './skeleton-hover.js';
import { setupHeroVolumeControl } from './hero.js';
import { setupNavbarScroll } from './my-list.js';
import { setupEventListeners } from './events.js';

`,
        exports: '',
        skipState: true,
        skipHeaderStrip: false
    }
};

function stripHeader(content) {
    return content.replace(/^\/\*\* NeonStream-VOD[^\n]*\n/, '');
}

function stripExistingExports(content) {
    return content.replace(/\nexport \{[\s\S]*?\};?\s*$/m, '\n');
}

function processFile(name) {
    if (name === 'config.js' || name === 'data-presets.js' || name === 'state.js') return;

    const meta = moduleMeta[name];
    if (!meta) {
        console.warn('No meta for', name);
        return;
    }

    let content = fs.readFileSync(path.join(JS_DIR, name), 'utf8');
    content = stripHeader(content);
    content = stripExistingExports(content);

    if (!meta.skipState) {
        content = applyAppState(content);
    }

    content = content.trimEnd() + '\n';
    if (meta.exports) {
        content += `\n${meta.exports}\n`;
    }

    const header = `/** NeonStream-VOD — ${name} */\n`;
    fs.writeFileSync(path.join(JS_DIR, name), header + meta.imports + content, 'utf8');
    console.log('Updated', name);
}

// Write state.js
const stateContent = `/** NeonStream-VOD — state.js */
import { AVATAR_PRESETS } from './data-presets.js';

export const elements = {
    appBootLoader: document.getElementById('app-boot-loader'),
    landingGate: document.getElementById('landing-gate'),
    landingPosterCollage: document.getElementById('landing-poster-collage'),
    landingSigninBtn: document.getElementById('landing-signin-btn'),
    landingEmailForm: document.getElementById('landing-email-form'),
    landingEmail: document.getElementById('landing-email'),
    landingGetStartedBtn: document.getElementById('landing-get-started-btn'),
    authGate: document.getElementById('auth-gate'),
    authBackBtn: document.getElementById('auth-back-btn'),
    authBackLink: document.getElementById('auth-back-link'),
    authForm: document.getElementById('auth-form'),
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    authPasswordGroup: document.getElementById('auth-password-group'),
    authForgotBtn: document.getElementById('auth-forgot-btn'),
    authForgotBackBtn: document.getElementById('auth-forgot-back-btn'),
    authError: document.getElementById('auth-error'),
    authSuccess: document.getElementById('auth-success'),
    authSubmitBtn: document.getElementById('auth-submit-btn'),
    authToggleBtn: document.getElementById('auth-toggle-btn'),
    authGateTitle: document.getElementById('auth-gate-title'),
    authHint: document.getElementById('auth-hint'),
    authPasskeySection: document.getElementById('auth-passkey-section'),
    authPasskeySigninBtn: document.getElementById('auth-passkey-signin-btn'),
    authPasskeyRegisterBtn: document.getElementById('auth-passkey-register-btn'),
    authPasskeyHint: document.getElementById('auth-passkey-hint'),
    catalogSection: document.getElementById('catalog-section'),
    playerSection: document.getElementById('player-section'),
    heroSection: document.getElementById('hero-section'),
    dynamicCatalog: document.getElementById('dynamic-catalog'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    gridTitle: document.getElementById('grid-title'),
    genreFilters: document.getElementById('genre-filters'),
    paginationContainer: document.getElementById('pagination-container'),
    mainNav: document.getElementById('main-nav'),
    logoHome: document.getElementById('logo-home'),
    netflixKidsLabel: document.getElementById('netflix-kids-label'),
    searchWrapper: document.getElementById('search-wrapper'),
    searchToggle: document.getElementById('search-toggle'),
    notificationsWrapper: document.getElementById('notifications-wrapper'),
    notificationsBtn: document.getElementById('notifications-btn'),
    notificationsBadge: document.getElementById('notifications-badge'),
    notificationsPanel: document.getElementById('notifications-panel'),
    notificationsList: document.getElementById('notifications-list'),
    notificationsEmpty: document.getElementById('notifications-empty'),
    heroVideoPlayer: document.getElementById('hero-video-player'),
    heroVideoWrap: document.getElementById('hero-video-wrap'),
    heroVolumeBtn: document.getElementById('hero-volume-btn'),
    heroLogo: document.getElementById('hero-logo'),
    heroLogoWrap: document.getElementById('hero-logo-wrap'),
    profileGate: document.getElementById('profile-gate'),
    profileGrid: document.getElementById('profile-grid'),
    profileManageGrid: document.getElementById('profile-manage-grid'),
    profileSelectView: document.getElementById('profile-select-view'),
    profileManageView: document.getElementById('profile-manage-view'),
    profileManageBtn: document.getElementById('profile-manage-btn'),
    profileDoneBtn: document.getElementById('profile-done-btn'),
    profileEditor: document.getElementById('profile-editor'),
    profileEditorForm: document.getElementById('profile-editor-form'),
    profileEditorTitle: document.getElementById('profile-editor-title'),
    profileEditorName: document.getElementById('profile-editor-name'),
    profileEditorIsKids: document.getElementById('profile-editor-is-kids'),
    profileEditorAvatarPreview: document.getElementById('profile-editor-avatar-preview'),
    profileAvatarPicker: document.getElementById('profile-avatar-picker'),
    profileEditorError: document.getElementById('profile-editor-error'),
    profileDeleteBtn: document.getElementById('profile-delete-btn'),
    profileCancelBtn: document.getElementById('profile-cancel-btn'),
    profileSignoutBtn: document.getElementById('profile-signout-btn'),
    profileBtn: document.getElementById('profile-btn'),
    auditLogBtn: document.getElementById('audit-log-btn'),
    tadumAudio: document.getElementById('tadum-audio'),
    detailAddListBtn: document.getElementById('detail-add-list-btn'),
    serverOptions: document.getElementById('server-options'),
    trailerModal: document.getElementById('trailer-modal'),
    trailerVideoContainer: document.getElementById('trailer-video-container'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    backBtn: document.getElementById('back-btn'),
    videoContainer: document.getElementById('video-container'),
    videoStage: document.getElementById('video-stage'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    playerTitle: document.getElementById('player-title'),
    playerReleaseDate: document.getElementById('player-release-date'),
    playerRating: document.getElementById('player-rating'),
    playerOverview: document.getElementById('player-overview'),
    tvControls: document.getElementById('tv-controls'),
    seasonSelect: document.getElementById('season-select'),
    episodeSelect: document.getElementById('episode-select'),
    detailModal: document.getElementById('detail-modal'),
    detailBackdrop: document.getElementById('detail-backdrop'),
    detailTitle: document.getElementById('detail-title'),
    detailOverview: document.getElementById('detail-overview'),
    detailInfoRow: document.getElementById('detail-info-row'),
    detailCast: document.getElementById('detail-cast'),
    detailGenres: document.getElementById('detail-genres'),
    detailType: document.getElementById('detail-type'),
    detailLoading: document.getElementById('detail-loading'),
    detailContent: document.getElementById('detail-content'),
    closeDetailBtn: document.getElementById('close-detail-btn'),
    detailPlayBtn: document.getElementById('detail-play-btn'),
    detailTrailerBtn: document.getElementById('detail-trailer-btn')
};

/** Mutable application state (shared across modules). */
export const appState = {
    loadedMedia: {},
    currentMediaId: null,
    currentMediaType: 'movie',
    currentView: 'home',
    carouselInterval: null,
    homeRefreshInterval: null,
    detailMedia: null,
    heroYtPlayer: null,
    heroMuted: true,
    heroCurrentVideoKey: null,
    youtubeApiReady: null,
    cardHoverTimer: null,
    cardHoverTarget: null,
    trailerCache: new Map(),
    editingProfileId: null,
    selectedAvatarUrl: AVATAR_PRESETS[0].url,
    profileGateInitialized: false,
    authGateInitialized: false,
    landingGateInitialized: false,
    authMode: 'login',
    supabaseClient: null,
    currentUser: null,
    userProfiles: [],
    currentProfile: null,
    profilesLoading: false,
    notifications: [],
    notificationsPollInterval: null,
    notificationsInitialized: false,
    notificationsPanelOpen: false,
    notificationsSeedLoaded: false,
    appBootComplete: false,
    bootSessionResolved: false,
    appBootTimeoutId: null,
    currentHeroItems: [],
    currentHeroIdx: 0
};
`;

fs.writeFileSync(path.join(JS_DIR, 'state.js'), stateContent, 'utf8');
console.log('Updated state.js');

Object.keys(moduleMeta).forEach(processFile);

// Update index.html
const htmlPath = path.join(__dirname, '..', 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
const scriptBlock = /<!-- Supabase CDN -->[\s\S]*?<\/script>\s*(?:<script src="js\/[^"]+"[^>]*><\/script>\s*)+/;

const newScripts = `    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.105.1/dist/umd/supabase.min.js"></script>
    <script type="module" src="js/main.js?v=${BUILD}"></script>`;

if (html.includes('type="module"')) {
    html = html.replace(/<script type="module" src="js\/main\.js\?v=[^"]+"><\/script>/, `<script type="module" src="js/main.js?v=${BUILD}"></script>`);
} else {
    html = html.replace(
        /<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js[^<]+<\/script>\s*[\s\S]*?<script src="js\/main\.js[^<]+<\/script>/,
        newScripts
    );
}

fs.writeFileSync(htmlPath, html, 'utf8');
console.log('Updated index.html');
