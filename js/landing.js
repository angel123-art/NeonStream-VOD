/** NeonStream-VOD — landing.js */
import {
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

// ============================================
// Landing Page — Vista pública
// ============================================
function getLandingPosterUrl(path) {
    return buildTmdbImageUrl(path, LANDING_POSTER_IMAGE_BASE) || LANDING_POSTER_FALLBACK;
}

function renderLandingPosterTiles(posterPaths, count = 48) {
    if (!elements.landingPosterCollage) return;

    const paths = [];
    while (paths.length < count && posterPaths.length > 0) {
        paths.push(...posterPaths);
    }

    elements.landingPosterCollage.innerHTML = paths.slice(0, count).map((path) => {
        const url = getLandingPosterUrl(path);
        return `
        <div class="landing-poster-tile">
            <img
                class="landing-poster-img"
                src="${url}"
                alt=""
                loading="lazy"
                decoding="async"
                referrerpolicy="no-referrer"
                onerror="handleLandingPosterError(this)"
            >
        </div>`;
    }).join('');
}

function handleLandingPosterError(img) {
    if (!img || img.dataset.fallbackApplied === 'true') return;

    img.dataset.fallbackApplied = 'true';
    img.onerror = null;
    img.src = LANDING_POSTER_FALLBACK;
    img.classList.add('landing-poster-img--fallback');

    const tile = img.closest('.landing-poster-tile');
    tile?.classList.add('landing-poster-tile--fallback');

    AuditLogger.warn('UI', 'Fallo de carga de póster en landing', {
        attemptedUrl: img.getAttribute('data-original-src') || img.src,
        fallback: LANDING_POSTER_FALLBACK
    });
}

window.handleLandingPosterError = handleLandingPosterError;

async function buildLandingPosterCollage() {
    if (!elements.landingPosterCollage) return;

    renderLandingPosterTiles(LANDING_POSTER_PATHS);

    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/trending/movie/week?api_key=${API_KEY}&language=es-MX`
        );

        if (!response.ok) {
            AuditLogger.warn('TMDB', 'Landing: trending no disponible', {
                status: response.status
            });
            return;
        }

        const data = await response.json();
        const livePaths = (data.results || [])
            .map((item) => item.poster_path)
            .filter(Boolean);

        if (livePaths.length >= 12) {
            renderLandingPosterTiles(livePaths);
        }
    } catch (err) {
        AuditLogger.warn('TMDB', 'Landing: no se pudieron obtener pósters dinámicos', {
            message: err?.message
        });
    }
}

function setupLandingGate() {
    if (appState.landingGateInitialized) return;
    appState.landingGateInitialized = true;

    void buildLandingPosterCollage();

    elements.landingSigninBtn?.addEventListener('click', () => {
        openAuthFromLanding('login');
    });

    elements.landingEmailForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = normalizeAuthEmail(elements.landingEmail?.value || '');
        openAuthFromLanding('register', email);
    });
}

function showLandingGate() {
    document.body.classList.add('landing-gate-active', 'profile-gate-active');
    document.body.classList.remove('auth-gate-active');
    elements.landingGate?.classList.remove('hidden');
    elements.authGate?.classList.add('hidden');
    elements.profileGate?.classList.add('hidden');
    void buildLandingPosterCollage();
}

function hideLandingGate() {
    document.body.classList.remove('landing-gate-active');
    elements.landingGate?.classList.add('hidden');
}

function returnToLandingFromAuth() {
    hideAuthGate();
    hideAuthMessages();
    elements.authForm?.reset();
    appState.authMode = 'login';
    updateAuthUI();
    showLandingGate();
}

function openAuthFromLanding(mode = 'login', email = '') {
    hideLandingGate();
    appState.authMode = mode;
    showAuthGate();
    hideAuthMessages();
    updateAuthUI();

    if (email && elements.authEmail) {
        elements.authEmail.value = email;
    }

    if (!appState.supabaseClient) {
        showAuthError('No se pudo inicializar Supabase. Verifica que el script CDN cargue (F12 → Consola).');
    } else {
        const configIssues = validateSupabaseConfig();
        if (configIssues.length) {
            showAuthError(configIssues.join(' '));
        }
    }

    elements.authEmail?.focus();
}

export {
    handleLandingPosterError,
    setupLandingGate,
    showLandingGate,
    hideLandingGate,
    returnToLandingFromAuth,
    openAuthFromLanding
};
