/**
 * Netflix Clone — UI/UX Premium
 * Catálogo TMDB, filas horizontales, hero con tráiler, Mi Lista local
 */

// Configuration
// Supabase — URL base del proyecto (sin /rest/v1/)
const SUPABASE_URL = 'https://hqsphvlzvkjqxrydayba.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_BoriF9VG7pT70QcWs_hXXg_r-3qjvpV';

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

const API_KEY = '42d673667b21f76c723454b10c6a9252';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w780';
const HERO_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';
const LOGO_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const HOME_REFRESH_MS = 20 * 60 * 1000;
const MY_LIST_KEY = 'netflix_my_list';
const PROFILE_SESSION_KEY = 'netflix_active_profile';
const MAX_PROFILES = 5;
const CARD_HOVER_DELAY_MS = 1200;

const AVATAR_PRESETS = [
    { id: 'classic', url: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Netflix-avatar.png' },
    { id: 'red', url: 'https://ui-avatars.com/api/?name=N&background=E50914&color=fff&size=256&bold=true&format=png' },
    { id: 'blue', url: 'https://ui-avatars.com/api/?name=N&background=0080FF&color=fff&size=256&bold=true&format=png' },
    { id: 'green', url: 'https://ui-avatars.com/api/?name=N&background=46D369&color=fff&size=256&bold=true&format=png' },
    { id: 'purple', url: 'https://ui-avatars.com/api/?name=N&background=7B2CBF&color=fff&size=256&bold=true&format=png' },
    { id: 'orange', url: 'https://ui-avatars.com/api/?name=N&background=F77F00&color=fff&size=256&bold=true&format=png' },
    { id: 'yellow', url: 'https://ui-avatars.com/api/?name=N&background=EEC218&color=141414&size=256&bold=true&format=png' },
    { id: 'pink', url: 'https://ui-avatars.com/api/?name=N&background=E91E8C&color=fff&size=256&bold=true&format=png' }
];

const elements = {
    authGate: document.getElementById('auth-gate'),
    authForm: document.getElementById('auth-form'),
    authEmail: document.getElementById('auth-email'),
    authPassword: document.getElementById('auth-password'),
    authError: document.getElementById('auth-error'),
    authSuccess: document.getElementById('auth-success'),
    authSubmitBtn: document.getElementById('auth-submit-btn'),
    authToggleBtn: document.getElementById('auth-toggle-btn'),
    authGateTitle: document.getElementById('auth-gate-title'),
    authHint: document.getElementById('auth-hint'),
    catalogSection: document.getElementById('catalog-section'),
    playerSection: document.getElementById('player-section'),
    heroSection: document.getElementById('hero-section'),
    dynamicCatalog: document.getElementById('dynamic-catalog'), // Container for Rows or Grid
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    gridTitle: document.getElementById('grid-title'),
    genreFilters: document.getElementById('genre-filters'),
    paginationContainer: document.getElementById('pagination-container'),
    mainNav: document.getElementById('main-nav'),
    logoHome: document.getElementById('logo-home'),
    searchWrapper: document.getElementById('search-wrapper'),
    searchToggle: document.getElementById('search-toggle'),
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
    profileEditorAvatarPreview: document.getElementById('profile-editor-avatar-preview'),
    profileAvatarPicker: document.getElementById('profile-avatar-picker'),
    profileEditorError: document.getElementById('profile-editor-error'),
    profileDeleteBtn: document.getElementById('profile-delete-btn'),
    profileCancelBtn: document.getElementById('profile-cancel-btn'),
    profileSignoutBtn: document.getElementById('profile-signout-btn'),
    profileBtn: document.getElementById('profile-btn'),
    tadumAudio: document.getElementById('tadum-audio'),
    detailAddListBtn: document.getElementById('detail-add-list-btn'),
    serverOptions: document.getElementById('server-options'),
    
    // Trailer Modal elements
    trailerModal: document.getElementById('trailer-modal'),
    trailerVideoContainer: document.getElementById('trailer-video-container'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    
    // Player
    backBtn: document.getElementById('back-btn'),
    videoContainer: document.getElementById('video-container'),
    videoStage: document.getElementById('video-stage'),
    fullscreenBtn: document.getElementById('fullscreen-btn'),
    playerTitle: document.getElementById('player-title'),
    playerReleaseDate: document.getElementById('player-release-date'),
    playerRating: document.getElementById('player-rating'),
    playerOverview: document.getElementById('player-overview'),
    
    // TV Controls
    tvControls: document.getElementById('tv-controls'),
    seasonSelect: document.getElementById('season-select'),
    episodeSelect: document.getElementById('episode-select'),

    // Detail Modal
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

// State
let loadedMedia = {};
let currentMediaId = null;
let currentMediaType = 'movie'; // 'movie' or 'tv'
let currentView = 'home'; // Tracks active navigation tab
let carouselInterval = null;
let homeRefreshInterval = null;
let detailMedia = null;
let heroYtPlayer = null;
let heroMuted = true;
let heroCurrentVideoKey = null;
let youtubeApiReady = null;
let cardHoverTimer = null;
let cardHoverTarget = null;
const trailerCache = new Map();
let editingProfileId = null;
let selectedAvatarUrl = AVATAR_PRESETS[0].url;
let profileGateInitialized = false;
let authGateInitialized = false;
let authMode = 'login';
let supabaseClient = null;
let currentUser = null;
let userProfiles = [];
let profilesLoading = false;

document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    setupNavbarScroll();
    setupSearchToggle();
    setupAuthGate();
    setupProfileGate();
    setupCardHoverTrailers();
    setupHeroVolumeControl();
    await initAuth();
});

function setupSearchToggle() {
    if (!elements.searchToggle || !elements.searchWrapper) return;

    elements.searchToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.searchWrapper.classList.toggle('open');
        if (elements.searchWrapper.classList.contains('open')) {
            elements.searchInput.focus();
        }
    });

    document.addEventListener('click', (e) => {
        if (!elements.searchWrapper.contains(e.target)) {
            elements.searchWrapper.classList.remove('open');
        }
    });
}

// ============================================
// Supabase Auth — Login / Registro
// ============================================
function validateSupabaseConfig() {
    const issues = [];
    const projectUrl = getSupabaseProjectUrl();

    if (!projectUrl || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(projectUrl)) {
        issues.push('SUPABASE_URL debe ser https://TU-PROYECTO.supabase.co (sin /rest/v1/ al final).');
    }

    const key = SUPABASE_ANON_KEY.trim();
    if (!key || key.length < 20) {
        issues.push('SUPABASE_ANON_KEY está vacía o parece inválida.');
    } else if (!key.startsWith('sb_publishable_') && !key.startsWith('eyJ')) {
        issues.push('La clave debe ser publishable (sb_publishable_...) o anon JWT (eyJ...).');
    }

    return issues;
}

function getSupabaseKeyType() {
    if (SUPABASE_ANON_KEY.startsWith('sb_publishable_')) return 'publishable';
    if (SUPABASE_ANON_KEY.startsWith('eyJ')) return 'anon-jwt';
    return 'desconocido';
}

function logSupabaseError(context, err, extra = {}) {
    console.group(`[Supabase] Error — ${context}`);
    console.error('Mensaje:', err?.message || err);
    console.error('Nombre:', err?.name);
    console.error('Código:', err?.code);
    console.error('Status HTTP:', err?.status);
    console.error('Detalles:', err?.details);
    console.error('Hint:', err?.hint);
    console.error('URL configurada:', getSupabaseProjectUrl());
    console.error('Tipo de clave:', getSupabaseKeyType());
    if (Object.keys(extra).length) console.error('Contexto extra:', extra);
    console.error('Objeto completo:', err);
    console.groupEnd();
}

async function testSupabaseConnection() {
    const baseUrl = getSupabaseProjectUrl();
    const healthUrl = `${baseUrl}/auth/v1/health`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
        const response = await fetch(healthUrl, {
            method: 'GET',
            headers: {
                apikey: SUPABASE_ANON_KEY.trim(),
                Accept: 'application/json'
            },
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit'
        });

        clearTimeout(timeoutId);

        let body = '';
        try {
            body = (await response.text()).slice(0, 300);
        } catch {
            body = '(sin cuerpo)';
        }

        return {
            ok: response.ok,
            status: response.status,
            statusText: response.statusText,
            url: healthUrl,
            body
        };
    } catch (err) {
        clearTimeout(timeoutId);

        const message = err?.message || String(err);
        const isFailedFetch = /failed to fetch|networkerror|network request failed|load failed|err_name_not_resolved|enotfound|getaddrinfo/i.test(message);
        const isAbort = err?.name === 'AbortError';

        return {
            ok: false,
            url: healthUrl,
            errorName: err?.name,
            errorMessage: message,
            isFailedFetch,
            isAbort,
            isDnsFailure: isFailedFetch || /not resolved|enotfound|getaddrinfo/i.test(message)
        };
    }
}

function formatConnectionError(result) {
    if (result.isAbort) {
        return `Supabase no respondió a tiempo (${result.url}). El proyecto puede estar pausado o la URL es incorrecta.`;
    }

    if (result.isDnsFailure || result.isFailedFetch) {
        return [
            `No se pudo conectar con Supabase en ${getSupabaseProjectUrl()}.`,
            'Posibles causas:',
            '• URL del proyecto incorrecta (verifica en Supabase → Settings → API → Project URL).',
            '• Proyecto pausado o eliminado.',
            '• Bloqueo de red, firewall o extensión del navegador.',
            `Detalle técnico: ${result.errorMessage || 'Failed to fetch'}`
        ].join(' ');
    }

    if (result.status) {
        return `Supabase respondió HTTP ${result.status} (${result.statusText || 'error'}) en ${result.url}.`;
    }

    return result.errorMessage || 'Error desconocido al conectar con Supabase.';
}

function initSupabaseClient() {
    if (!window.supabase?.createClient) {
        console.error('[Supabase] El CDN no cargó. window.supabase =', window.supabase);
        return null;
    }

    const projectUrl = getSupabaseProjectUrl();
    const anonKey = SUPABASE_ANON_KEY.trim();

    const client = window.supabase.createClient(projectUrl, anonKey, {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            storage: window.localStorage,
            storageKey: 'neonstream-supabase-auth'
        },
        global: {
            headers: {
                'X-Client-Info': 'neonstream-vod-github-pages'
            }
        }
    });

    console.info('[Supabase] Cliente inicializado', {
        url: projectUrl,
        keyType: getSupabaseKeyType(),
        keyPreview: `${anonKey.slice(0, 20)}...`,
        origin: window.location.origin
    });

    return client;
}

function setupAuthGate() {
    if (!elements.authForm || authGateInitialized) return;
    authGateInitialized = true;

    elements.authForm.addEventListener('submit', handleAuthSubmit);
    elements.authToggleBtn?.addEventListener('click', toggleAuthMode);
}

function toggleAuthMode() {
    authMode = authMode === 'login' ? 'register' : 'login';
    updateAuthUI();
    hideAuthMessages();
    elements.authEmail?.focus();
}

function updateAuthUI() {
    const isLogin = authMode === 'login';

    if (elements.authGateTitle) {
        elements.authGateTitle.textContent = isLogin ? 'Iniciar sesión' : 'Registrarse';
    }
    if (elements.authSubmitBtn) {
        elements.authSubmitBtn.textContent = isLogin ? 'Iniciar sesión' : 'Registrarse';
    }
    if (elements.authToggleBtn) {
        elements.authToggleBtn.innerHTML = isLogin
            ? '¿Primera vez en Netflix? <span>Regístrate ahora</span>'
            : '¿Ya tienes cuenta? <span>Inicia sesión</span>';
    }
    if (elements.authEmail) {
        elements.authEmail.placeholder = 'nombre@ejemplo.com';
        elements.authEmail.autocomplete = isLogin ? 'email' : 'email';
    }
    if (elements.authPassword) {
        elements.authPassword.autocomplete = isLogin ? 'current-password' : 'new-password';
    }
    if (elements.authHint) {
        elements.authHint.textContent = isLogin
            ? 'Usa el correo electrónico con el que te registraste.'
            : 'Al registrarte aceptas nuestros Términos de uso y Política de privacidad.';
    }
}

function showAuthGate() {
    document.body.classList.add('auth-gate-active', 'profile-gate-active');
    elements.authGate?.classList.remove('hidden');
    elements.profileGate?.classList.add('hidden');
    updateAuthUI();
    hideAuthMessages();
}

function hideAuthGate() {
    document.body.classList.remove('auth-gate-active');
    elements.authGate?.classList.add('hidden');
}

function showAuthError(message) {
    if (!elements.authError) return;
    elements.authError.textContent = message;
    elements.authError.classList.remove('hidden');
    elements.authSuccess?.classList.add('hidden');
}

function showAuthSuccess(message) {
    if (!elements.authSuccess) return;
    elements.authSuccess.textContent = message;
    elements.authSuccess.classList.remove('hidden');
    elements.authError?.classList.add('hidden');
}

function hideAuthMessages() {
    elements.authError?.classList.add('hidden');
    elements.authSuccess?.classList.add('hidden');
}

function setAuthLoading(loading) {
    if (elements.authSubmitBtn) {
        elements.authSubmitBtn.disabled = loading;
        elements.authSubmitBtn.textContent = loading
            ? 'Procesando...'
            : (authMode === 'login' ? 'Iniciar sesión' : 'Registrarse');
    }
}

function normalizeAuthEmail(input) {
    const value = input.trim();
    if (!value) return '';
    if (value.includes('@')) return value.toLowerCase();
    return value.toLowerCase();
}

async function handleAuthSubmit(e) {
    e.preventDefault();
    hideAuthMessages();

    if (!supabaseClient) {
        showAuthError('Supabase no está configurado. Revisa SUPABASE_URL y SUPABASE_ANON_KEY.');
        return;
    }

    const email = normalizeAuthEmail(elements.authEmail?.value || '');
    const password = elements.authPassword?.value || '';

    if (!email) {
        showAuthError('Introduce tu correo electrónico.');
        return;
    }
    if (password.length < 6) {
        showAuthError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    setAuthLoading(true);

    try {
        if (authMode === 'register') {
            if (!email.includes('@')) {
                showAuthError('Para registrarte debes usar un correo electrónico válido.');
                return;
            }

            console.info('[Supabase Auth] signUp →', { email, url: getSupabaseProjectUrl() });

            const { data, error } = await supabaseClient.auth.signUp({ email, password });

            if (error) {
                logSupabaseError('signUp', error, { email });
                throw error;
            }

            console.info('[Supabase Auth] signUp OK', { hasSession: Boolean(data.session), userId: data.user?.id });

            if (data.session) {
                showAuthSuccess('¡Cuenta creada! Cargando tus perfiles...');
            } else {
                showAuthSuccess('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.');
                authMode = 'login';
                updateAuthUI();
            }
        } else {
            if (!email.includes('@')) {
                showAuthError('Introduce un correo electrónico válido.');
                return;
            }

            console.info('[Supabase Auth] signInWithPassword →', { email, url: getSupabaseProjectUrl() });

            const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

            if (error) {
                logSupabaseError('signInWithPassword', error, { email });
                throw error;
            }

            console.info('[Supabase Auth] signIn OK', { userId: data.user?.id });
        }
    } catch (err) {
        showAuthError(getAuthErrorMessage(err, authMode === 'register' ? 'signUp' : 'signIn'));
    } finally {
        setAuthLoading(false);
    }
}

function getAuthErrorMessage(err, context = 'auth') {
    const msg = err?.message || String(err);

    logSupabaseError(context, err);

    if (/failed to fetch|networkerror|network request failed|load failed|err_name_not_resolved|enotfound|getaddrinfo/i.test(msg)) {
        return [
            'Error de red: no se pudo contactar Supabase.',
            `URL actual: ${getSupabaseProjectUrl()}`,
            'Revisa en Supabase Dashboard → Settings → API que la Project URL sea exactamente esa.',
            'Si usas sb_publishable_ y sigue fallando, prueba con la clave anon (JWT eyJ...) de Legacy API Keys.',
            `Detalle: ${msg}`
        ].join(' ');
    }

    if (/invalid api key|invalid jwt|unauthorized/i.test(msg)) {
        return 'Clave API inválida. Copia la Publishable key o la anon key (JWT) desde Supabase → Settings → API Keys.';
    }

    if (/invalid login credentials/i.test(msg)) return 'Correo o contraseña incorrectos.';
    if (/email not confirmed/i.test(msg)) return 'Confirma tu correo antes de iniciar sesión.';
    if (/user already registered|already been registered/i.test(msg)) return 'Este correo ya está registrado. Inicia sesión.';
    if (/signup is disabled/i.test(msg)) return 'El registro está deshabilitado en Supabase Auth.';
    if (/rate limit|too many requests/i.test(msg)) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';

    return msg || 'Error de autenticación desconocido.';
}

async function initAuth() {
    supabaseClient = initSupabaseClient();
    if (!supabaseClient) {
        showAuthGate();
        showAuthError('No se pudo inicializar Supabase. Verifica que el script CDN cargue (F12 → Consola).');
        return;
    }

    const configIssues = validateSupabaseConfig();
    if (configIssues.length) {
        showAuthGate();
        showAuthError(configIssues.join(' '));
        return;
    }

    const connection = await testSupabaseConnection();
    console.info('[Supabase] Prueba de conexión:', connection);

    if (!connection.ok) {
        showAuthGate();
        showAuthError(formatConnectionError(connection));
    }

    supabaseClient.auth.onAuthStateChange(async (event, session) => {
        console.info('[Supabase Auth] onAuthStateChange', { event, hasSession: Boolean(session) });

        if (event === 'INITIAL_SESSION') {
            if (session?.user) await onUserAuthenticated(session.user);
            else showAuthGate();
            return;
        }
        if (event === 'SIGNED_IN' && session?.user) {
            await onUserAuthenticated(session.user);
        } else if (event === 'SIGNED_OUT') {
            onUserSignedOut();
        }
    });
}

async function onUserAuthenticated(user) {
    currentUser = user;
    hideAuthGate();

    elements.profileGate?.classList.remove('hidden');
    document.body.classList.add('profile-gate-active');

    try {
        await loadUserProfiles();
    } catch (err) {
        console.error('Error cargando perfiles:', err);
        showProfileGridError('No se pudieron cargar tus perfiles. Intenta de nuevo.');
        return;
    }

    renderProfileSelectGrid();

    const active = getActiveProfile();
    const stillValid = active && userProfiles.some(p => p.id === active.id);

    if (stillValid) {
        updateNavbarProfileAvatar(active);
        revealApp();
        elements.profileGate?.classList.add('hidden');
        document.body.classList.remove('profile-gate-active');
        checkUrlState();
    } else {
        sessionStorage.removeItem(PROFILE_SESSION_KEY);
        if (userProfiles.length === 0) {
            openProfileGate('manage');
        } else {
            openProfileGate('select');
        }
    }
}

function onUserSignedOut() {
    currentUser = null;
    userProfiles = [];
    sessionStorage.removeItem(PROFILE_SESSION_KEY);
    closeProfileEditor();
    closeProfileManage();
    elements.profileGate?.classList.add('hidden');
    elements.authForm?.reset();
    hideAuthMessages();
    authMode = 'login';
    updateAuthUI();
    showAuthGate();
}

async function handleSignOut() {
    if (!supabaseClient) return;
    await supabaseClient.auth.signOut();
}

// ============================================
// Profile Gate — CRUD con Supabase (tabla perfiles)
// ============================================
function mapProfileFromDb(row) {
    return {
        id: row.id,
        user_id: row.user_id,
        name: row.nombre,
        avatar: row.avatar || AVATAR_PRESETS[0].url
    };
}

async function loadUserProfiles() {
    if (!supabaseClient || !currentUser) {
        userProfiles = [];
        return userProfiles;
    }

    profilesLoading = true;

    const { data, error } = await supabaseClient
        .from('perfiles')
        .select('id, user_id, nombre, avatar, created_at')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: true });

    profilesLoading = false;

    if (error) {
        logSupabaseError('loadUserProfiles', error, { userId: currentUser.id });
        throw error;
    }

    userProfiles = (data || []).map(mapProfileFromDb);
    return userProfiles;
}

function getProfiles() {
    return userProfiles;
}

function getActiveProfile() {
    try {
        const raw = sessionStorage.getItem(PROFILE_SESSION_KEY);
        if (!raw) return null;
        const active = JSON.parse(raw);
        return userProfiles.find(p => p.id === active.id) || null;
    } catch {
        return null;
    }
}

function setActiveProfile(profile) {
    sessionStorage.setItem(PROFILE_SESSION_KEY, JSON.stringify(profile));
    updateNavbarProfileAvatar(profile);
}

function setupProfileGate() {
    if (!elements.profileGrid || profileGateInitialized) return;
    profileGateInitialized = true;

    renderAvatarPicker();

    elements.profileGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.profile-item[data-profile-id]');
        if (!btn) return;
        const profile = getProfiles().find(p => p.id === btn.dataset.profileId);
        if (profile) selectProfile(profile);
    });

    elements.profileManageGrid?.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.profile-manage-item[data-profile-id]');
        if (editBtn) {
            openProfileEditor(editBtn.dataset.profileId);
            return;
        }
        const addBtn = e.target.closest('.profile-add-item');
        if (addBtn) openProfileEditor(null);
    });

    elements.profileManageBtn?.addEventListener('click', openProfileManage);
    elements.profileDoneBtn?.addEventListener('click', closeProfileManage);
    elements.profileSignoutBtn?.addEventListener('click', handleSignOut);
    elements.profileBtn?.addEventListener('click', () => openProfileGate('select'));
    elements.profileCancelBtn?.addEventListener('click', closeProfileEditor);
    elements.profileDeleteBtn?.addEventListener('click', handleDeleteProfile);
    elements.profileEditorForm?.addEventListener('submit', handleProfileFormSubmit);

    elements.profileAvatarPicker?.addEventListener('click', (e) => {
        const option = e.target.closest('.profile-avatar-option');
        if (!option) return;
        selectedAvatarUrl = option.dataset.avatarUrl;
        updateAvatarPickerSelection();
        if (elements.profileEditorAvatarPreview) {
            elements.profileEditorAvatarPreview.src = selectedAvatarUrl;
        }
    });
}

function showProfileGridError(message) {
    if (elements.profileGrid) {
        elements.profileGrid.innerHTML = `<p class="profile-grid-error">${escapeHtml(message)}</p>`;
    }
}

function renderProfileSelectGrid() {
    if (!elements.profileGrid) return;

    if (profilesLoading) {
        elements.profileGrid.innerHTML = '<p class="profile-grid-loading">Cargando perfiles...</p>';
        return;
    }

    const profiles = getProfiles();

    if (profiles.length === 0) {
        elements.profileGrid.innerHTML = `
            <p class="profile-grid-empty">Aún no tienes perfiles. Pulsa «Administrar perfiles» para crear uno.</p>`;
        return;
    }

    elements.profileGrid.innerHTML = profiles.map(profile => `
        <button type="button" class="profile-item" data-profile-id="${profile.id}" aria-label="Perfil ${escapeHtml(profile.name)}">
            <img class="profile-item-avatar" src="${profile.avatar}" alt="${escapeHtml(profile.name)}" width="132" height="132">
            <span class="profile-item-name">${escapeHtml(profile.name)}</span>
        </button>
    `).join('');
}

function renderProfileManageGrid() {
    if (!elements.profileManageGrid) return;

    if (profilesLoading) {
        elements.profileManageGrid.innerHTML = '<p class="profile-grid-loading">Cargando perfiles...</p>';
        return;
    }

    const profiles = getProfiles();
    let html = profiles.map(profile => `
        <button type="button" class="profile-manage-item" data-profile-id="${profile.id}" aria-label="Editar perfil ${escapeHtml(profile.name)}">
            <img class="profile-item-avatar" src="${profile.avatar}" alt="${escapeHtml(profile.name)}" width="132" height="132">
            <span class="profile-edit-badge" aria-hidden="true">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </span>
            <span class="profile-item-name">${escapeHtml(profile.name)}</span>
        </button>
    `).join('');

    if (profiles.length < MAX_PROFILES) {
        html += `
            <button type="button" class="profile-add-item" aria-label="Añadir perfil">
                <span class="profile-add-tile">
                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                </span>
                <span class="profile-item-name">Añadir perfil</span>
            </button>`;
    }

    elements.profileManageGrid.innerHTML = html;
}

function renderAvatarPicker() {
    if (!elements.profileAvatarPicker) return;

    elements.profileAvatarPicker.innerHTML = AVATAR_PRESETS.map(preset => `
        <button type="button" class="profile-avatar-option" data-avatar-url="${preset.url}" aria-label="Avatar ${preset.id}">
            <img src="${preset.url}" alt="" loading="lazy">
        </button>
    `).join('');
}

function updateAvatarPickerSelection() {
    elements.profileAvatarPicker?.querySelectorAll('.profile-avatar-option').forEach(btn => {
        btn.classList.toggle('selected', btn.dataset.avatarUrl === selectedAvatarUrl);
    });
}

function openProfileManage() {
    renderProfileManageGrid();
    elements.profileSelectView?.classList.add('hidden');
    elements.profileManageView?.classList.remove('hidden');
}

function closeProfileManage() {
    renderProfileSelectGrid();
    elements.profileManageView?.classList.add('hidden');
    elements.profileSelectView?.classList.remove('hidden');
}

function openProfileEditor(profileId) {
    editingProfileId = profileId;
    const isEdit = Boolean(profileId);
    const profile = isEdit ? getProfiles().find(p => p.id === profileId) : null;

    elements.profileEditorTitle.textContent = isEdit ? 'Editar perfil' : 'Añadir perfil';
    elements.profileEditorName.value = profile?.name || '';
    selectedAvatarUrl = profile?.avatar || AVATAR_PRESETS[0].url;

    if (elements.profileEditorAvatarPreview) {
        elements.profileEditorAvatarPreview.src = selectedAvatarUrl;
    }

    elements.profileDeleteBtn?.classList.toggle('hidden', !isEdit);
    hideProfileEditorError();
    updateAvatarPickerSelection();

    elements.profileEditor?.classList.remove('hidden');
    elements.profileEditorName?.focus();
}

function closeProfileEditor() {
    editingProfileId = null;
    elements.profileEditor?.classList.add('hidden');
    elements.profileEditorForm?.reset();
    hideProfileEditorError();
}

function showProfileEditorError(message) {
    if (!elements.profileEditorError) return;
    elements.profileEditorError.textContent = message;
    elements.profileEditorError.classList.remove('hidden');
}

function hideProfileEditorError() {
    elements.profileEditorError?.classList.add('hidden');
}

function handleProfileFormSubmit(e) {
    e.preventDefault();
    handleProfileFormSubmitAsync();
}

async function handleProfileFormSubmitAsync() {
    if (!supabaseClient || !currentUser) {
        showProfileEditorError('Debes iniciar sesión para guardar perfiles.');
        return;
    }

    const name = elements.profileEditorName?.value.trim();
    if (!name) {
        showProfileEditorError('Introduce un nombre para el perfil.');
        return;
    }
    if (name.length > 20) {
        showProfileEditorError('El nombre no puede superar 20 caracteres.');
        return;
    }

    const profiles = getProfiles();
    const saveBtn = document.getElementById('profile-save-btn');
    if (saveBtn) {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Guardando...';
    }

    try {
        if (editingProfileId) {
            const duplicate = profiles.some(
                p => p.id !== editingProfileId && p.name.toLowerCase() === name.toLowerCase()
            );
            if (duplicate) {
                showProfileEditorError('Ya existe un perfil con ese nombre.');
                return;
            }

            const { data, error } = await supabaseClient
                .from('perfiles')
                .update({ nombre: name, avatar: selectedAvatarUrl })
                .eq('id', editingProfileId)
                .eq('user_id', currentUser.id)
                .select('id, user_id, nombre, avatar, created_at')
                .single();

            if (error) throw error;

            await loadUserProfiles();

            const active = getActiveProfile();
            const updated = mapProfileFromDb(data);
            if (active?.id === editingProfileId) {
                setActiveProfile(updated);
            }
        } else {
            if (profiles.length >= MAX_PROFILES) {
                showProfileEditorError(`Máximo ${MAX_PROFILES} perfiles permitidos.`);
                return;
            }

            const duplicate = profiles.some(p => p.name.toLowerCase() === name.toLowerCase());
            if (duplicate) {
                showProfileEditorError('Ya existe un perfil con ese nombre.');
                return;
            }

            const { error } = await supabaseClient
                .from('perfiles')
                .insert({
                    user_id: currentUser.id,
                    nombre: name,
                    avatar: selectedAvatarUrl
                });

            if (error) throw error;

            await loadUserProfiles();
        }

        closeProfileEditor();
        renderProfileManageGrid();
        renderProfileSelectGrid();
    } catch (err) {
        logSupabaseError('handleProfileFormSubmit', err, { editingProfileId, name });
        showProfileEditorError(err.message || 'No se pudo guardar el perfil.');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Guardar';
        }
    }
}

function handleDeleteProfile() {
    handleDeleteProfileAsync();
}

async function handleDeleteProfileAsync() {
    if (!editingProfileId || !supabaseClient || !currentUser) return;

    const profiles = getProfiles();
    const deleted = profiles.find(p => p.id === editingProfileId);
    if (!deleted) return;

    const deleteBtn = elements.profileDeleteBtn;
    if (deleteBtn) {
        deleteBtn.disabled = true;
        deleteBtn.textContent = 'Eliminando...';
    }

    try {
        const { error } = await supabaseClient
            .from('perfiles')
            .delete()
            .eq('id', editingProfileId)
            .eq('user_id', currentUser.id);

        if (error) throw error;

        await loadUserProfiles();

        const active = getActiveProfile();
        if (active?.id === deleted.id) {
            const remaining = getProfiles();
            if (remaining.length > 0) {
                setActiveProfile(remaining[0]);
            } else {
                sessionStorage.removeItem(PROFILE_SESSION_KEY);
            }
        }

        closeProfileEditor();
        renderProfileManageGrid();
        renderProfileSelectGrid();
    } catch (err) {
        logSupabaseError('handleDeleteProfile', err, { editingProfileId });
        showProfileEditorError(err.message || 'No se pudo eliminar el perfil.');
    } finally {
        if (deleteBtn) {
            deleteBtn.disabled = false;
            deleteBtn.textContent = 'Eliminar perfil';
        }
    }
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function playTaDum() {
    const audio = elements.tadumAudio;
    if (!audio) return;
    audio.currentTime = 0;
    audio.play().catch(() => {});
}

function selectProfile(profile, { reloadCatalog = true } = {}) {
    setActiveProfile(profile);
    playTaDum();

    elements.profileGate?.classList.add('fade-out');

    setTimeout(() => {
        elements.profileGate?.classList.add('hidden');
        elements.profileGate?.classList.remove('fade-out');
        closeProfileManage();
        revealApp();
        if (reloadCatalog) checkUrlState();
    }, 650);
}

function revealApp() {
    document.body.classList.remove('profile-gate-active');
}

function openProfileGate(view = 'select') {
    elements.profileGate?.classList.remove('hidden', 'fade-out');
    document.body.classList.add('profile-gate-active');

    renderProfileSelectGrid();

    if (view === 'manage') {
        openProfileManage();
    } else {
        closeProfileManage();
    }
}

function updateNavbarProfileAvatar(profile) {
    const img = elements.profileBtn?.querySelector('img');
    if (img && profile?.avatar) {
        img.src = profile.avatar;
        img.alt = profile.name;
    }
}

// ============================================
// Skeleton Loaders
// ============================================
function generateSkeletonRowsHTML(rowCount = 5, cardsPerRow = 6) {
    let html = '<div class="skeleton-catalog">';
    for (let r = 0; r < rowCount; r++) {
        html += '<div class="skeleton-row"><div class="skeleton-row-title"></div><div class="skeleton-cards">';
        for (let c = 0; c < cardsPerRow; c++) {
            html += '<div class="skeleton-card"></div>';
        }
        html += '</div></div>';
    }
    return `${html}</div>`;
}

function generateSkeletonGridHTML(count = 18) {
    let html = '<div class="skeleton-grid">';
    for (let i = 0; i < count; i++) {
        html += '<div class="skeleton-card"></div>';
    }
    return `${html}</div>`;
}

function showSkeletonLoader(mode = 'rows') {
    elements.dynamicCatalog.innerHTML = mode === 'grid'
        ? generateSkeletonGridHTML()
        : generateSkeletonRowsHTML();
}

function toggleSpinner(show, mode = 'rows') {
    if (show) showSkeletonLoader(mode);
}

// ============================================
// Card Hover Mini-Trailer
// ============================================
function isDesktopHover() {
    return window.matchMedia('(min-width: 769px)').matches;
}

function setupCardHoverTrailers() {
    elements.dynamicCatalog.addEventListener('mouseover', (e) => {
        if (!isDesktopHover()) return;

        const card = e.target.closest('.movie-card:not(.trending-card)');
        if (!card || card === cardHoverTarget) return;

        clearCardHoverTimer();
        cardHoverTarget = card;
        cardHoverTimer = setTimeout(() => activateCardTrailer(card), CARD_HOVER_DELAY_MS);
    });

    elements.dynamicCatalog.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.movie-card:not(.trending-card)');
        if (!card) return;
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;

        if (cardHoverTarget === card) cardHoverTarget = null;
        clearCardHoverTimer();
        deactivateCardTrailer(card);
    });
}

function clearCardHoverTimer() {
    if (cardHoverTimer) {
        clearTimeout(cardHoverTimer);
        cardHoverTimer = null;
    }
}

async function getCachedTrailerKey(id, type) {
    const cacheKey = `${type}-${id}`;
    if (trailerCache.has(cacheKey)) return trailerCache.get(cacheKey);

    const key = await fetchTrailerKey(id, type);
    trailerCache.set(cacheKey, key);
    return key;
}

async function activateCardTrailer(card) {
    if (!card.matches(':hover')) return;

    const id = card.dataset.id;
    const type = card.dataset.type || loadedMedia[id]?.custom_type || 'movie';
    const key = await getCachedTrailerKey(id, type);

    if (!key || !card.matches(':hover')) return;

    const poster = card.querySelector('.poster-container');
    const img = poster?.querySelector('.card-poster-img, img');
    if (!poster || !img) return;

    img.classList.add('hidden');

    let trailer = poster.querySelector('.card-trailer');
    if (!trailer) {
        trailer = document.createElement('iframe');
        trailer.className = 'card-trailer';
        trailer.title = 'Vista previa';
        trailer.setAttribute('allow', 'autoplay; encrypted-media');
        trailer.src = buildYoutubeEmbedUrl(key, { mute: true, controls: false });
        poster.appendChild(trailer);
    }

    card.classList.add('playing-trailer');
    requestAnimationFrame(() => trailer.classList.add('loaded'));
}

function deactivateCardTrailer(card) {
    if (!card) return;

    card.classList.remove('playing-trailer');
    const poster = card.querySelector('.poster-container');
    const img = poster?.querySelector('.card-poster-img, img');
    const trailer = poster?.querySelector('.card-trailer');

    img?.classList.remove('hidden');
    trailer?.remove();
}

// ============================================
// Hero YouTube Player + Volume
// ============================================
function loadYouTubeAPI() {
    if (youtubeApiReady) return youtubeApiReady;

    youtubeApiReady = new Promise((resolve) => {
        if (window.YT?.Player) {
            resolve();
            return;
        }
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prev?.();
            resolve();
        };
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    });

    return youtubeApiReady;
}

function buildYoutubeEmbedUrl(key, { mute = true, controls = false } = {}) {
    const params = new URLSearchParams({
        autoplay: '1',
        mute: mute ? '1' : '0',
        controls: controls ? '1' : '0',
        rel: '0',
        showinfo: '0',
        modestbranding: '1',
        playsinline: '1',
        enablejsapi: '1',
        loop: '1',
        playlist: key
    });
    return `https://www.youtube.com/embed/${key}?${params}`;
}

function setupHeroVolumeControl() {
    elements.heroVolumeBtn?.addEventListener('click', toggleHeroVolume);
    updateHeroVolumeUI();
}

function updateHeroVolumeUI() {
    if (!elements.heroVolumeBtn) return;
    elements.heroVolumeBtn.querySelector('.icon-muted')?.classList.toggle('hidden', !heroMuted);
    elements.heroVolumeBtn.querySelector('.icon-unmuted')?.classList.toggle('hidden', heroMuted);
    elements.heroVolumeBtn.setAttribute('aria-label', heroMuted ? 'Activar sonido' : 'Silenciar');
    elements.heroVolumeBtn.setAttribute('aria-pressed', String(!heroMuted));
}

function toggleHeroVolume() {
    if (!heroYtPlayer) return;

    if (heroMuted) {
        heroYtPlayer.unMute();
        heroYtPlayer.setVolume(100);
        heroMuted = false;
    } else {
        heroYtPlayer.mute();
        heroMuted = true;
    }
    updateHeroVolumeUI();
}

async function initHeroYoutubePlayer(videoKey) {
    if (!elements.heroVideoPlayer || !videoKey) return;

    await loadYouTubeAPI();
    heroCurrentVideoKey = videoKey;
    heroMuted = true;
    updateHeroVolumeUI();

    if (heroYtPlayer) {
        heroYtPlayer.loadVideoById(videoKey);
        heroYtPlayer.mute();
        heroMuted = true;
        updateHeroVolumeUI();
        elements.heroVideoWrap.style.display = '';
        elements.heroVideoPlayer.classList.add('loaded');
        return;
    }

    heroYtPlayer = new YT.Player('hero-video-player', {
        videoId: videoKey,
        width: '100%',
        height: '100%',
        playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            playsinline: 1,
            loop: 1,
            playlist: videoKey,
            enablejsapi: 1
        },
        events: {
            onReady: (event) => {
                event.target.mute();
                event.target.playVideo();
                elements.heroVideoWrap.style.display = '';
                elements.heroVideoPlayer.classList.add('loaded');
            }
        }
    });
}

// ============================================
// Mi Lista — localStorage
// ============================================
function getMyList() {
    try {
        return JSON.parse(localStorage.getItem(MY_LIST_KEY)) || [];
    } catch {
        return [];
    }
}

function saveMyList(list) {
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(list));
}

function isInMyList(id, type) {
    return getMyList().some(item => item.id === id && item.type === type);
}

function toggleMyList(media) {
    const type = media.custom_type || media.media_type || 'movie';
    const list = getMyList();
    const idx = list.findIndex(item => item.id === media.id && item.type === type);

    if (idx >= 0) {
        list.splice(idx, 1);
    } else {
        list.unshift({
            id: media.id,
            type,
            title: media.title || media.name,
            poster_path: media.poster_path,
            backdrop_path: media.backdrop_path,
            vote_average: media.vote_average,
            release_date: media.release_date || media.first_air_date
        });
    }

    saveMyList(list);
    return idx < 0;
}

function updateListButtonStates() {
    document.querySelectorAll('.card-action-btn.list-btn').forEach(btn => {
        const id = parseInt(btn.dataset.id, 10);
        const type = btn.dataset.type;
        btn.classList.toggle('in-list', isInMyList(id, type));
        btn.innerHTML = btn.classList.contains('in-list')
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    });

    if (elements.detailAddListBtn && detailMedia) {
        const inList = isInMyList(detailMedia.id, detailMedia.custom_type || 'movie');
        elements.detailAddListBtn.classList.toggle('in-list', inList);
    }
}

function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

// ============================================
// Navigation & Listeners
// ============================================
function setupEventListeners() {
    // Top Netflix Nav
    elements.mainNav.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-link')) {
            switchCategory(e.target.dataset.view);
        }
    });

    elements.logoHome.addEventListener('click', (e) => {
        e.preventDefault();
        switchCategory('home');
    });

    // Search
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });

    // Sub-Genre Filters (Only visible in specific grids like Movies)
    if (elements.genreFilters) {
        elements.genreFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('genre-btn')) {
                handleGenreFilter(e.target);
            }
        });
    }

    // Server Choice
    if (elements.serverOptions) {
        elements.serverOptions.addEventListener('click', (e) => {
            const serverBtn = e.target.closest('.server-btn');
            if (!serverBtn) return;
            updateServerActiveState(serverBtn);
            const serverId = serverBtn.dataset.server;
            const sea = elements.seasonSelect.value || '1';
            const epi = elements.episodeSelect.value || '1';
            loadVideoIframe(currentMediaId, currentMediaType, serverId, sea, epi);
        });
    }

    // TV Season / Episode Changes
    elements.seasonSelect.addEventListener('change', async (e) => {
        const seasonNum = e.target.value;
        await populateEpisodes(currentMediaId, seasonNum);
        elements.episodeSelect.value = "1";
        triggerIframeUpdate();
    });

    elements.episodeSelect.addEventListener('change', () => {
        triggerIframeUpdate();
    });

    setupFullscreenControls();

    // Go Back
    elements.backBtn.addEventListener('click', () => {
        if (getFullscreenElement()) {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        }
        elements.videoContainer.innerHTML = '';
        clearUrlParam();
        showView('catalog');
        
        if (Object.keys(loadedMedia).length === 0) {
            switchCategory('home');
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
    });

    // Hero Play Button Direct Binding
    const heroPlayBtn = document.getElementById('hero-play-btn');
    if (heroPlayBtn) {
        heroPlayBtn.addEventListener('click', (e) => {
            const media = loadedMedia[e.currentTarget.dataset.id];
            if (media) openPlayer(media);
        });
    }

    // Hero Info Button — opens detail modal (Netflix "More Info")
    const heroInfoBtn = document.getElementById('hero-info-btn');
    if (heroInfoBtn) {
        heroInfoBtn.addEventListener('click', (e) => {
            const media = loadedMedia[e.currentTarget.dataset.id];
            if (media) openDetailModal(media);
        });
    }

    setupDetailModalListeners();

    // Details Trailer Button
    const detailsTrailerBtn = document.getElementById('details-trailer-btn');
    if (detailsTrailerBtn) {
        detailsTrailerBtn.addEventListener('click', () => {
            if (currentMediaId && currentMediaType) {
                openTrailerModal(currentMediaId, currentMediaType);
            }
        });
    }

    // Trailer Modal Closure
    if (elements.closeModalBtn) {
        elements.closeModalBtn.addEventListener('click', () => {
            elements.trailerModal.classList.add('hidden');
            elements.trailerVideoContainer.innerHTML = '';
            
            // Clean Fallback Area
            const fb = document.getElementById('trailer-fallback');
            if (fb) {
                fb.classList.add('hidden');
                fb.innerHTML = '';
            }
        });
    }

    // Optimized Event Delegation for Movie/TV Cards & Sliders
    elements.dynamicCatalog.addEventListener('click', (e) => {
        const sliderBtn = e.target.closest('.slider-btn');
        if (sliderBtn) {
            const rowWrapper = sliderBtn.closest('.row-wrapper');
            const row = rowWrapper.querySelector('.movie-row');
            const scrollAmount = window.innerWidth * 0.75;

            if (sliderBtn.classList.contains('left')) {
                row.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                row.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
            return;
        }

        const playBtn = e.target.closest('.card-action-btn.play-btn');
        if (playBtn) {
            e.stopPropagation();
            const media = loadedMedia[playBtn.dataset.id];
            if (media) openPlayer(media);
            return;
        }

        const listBtn = e.target.closest('.card-action-btn.list-btn');
        if (listBtn) {
            e.stopPropagation();
            const media = loadedMedia[listBtn.dataset.id];
            if (media) {
                toggleMyList(media);
                updateListButtonStates();
            }
            return;
        }

        const infoBtn = e.target.closest('.card-action-btn.info-btn');
        if (infoBtn) {
            e.stopPropagation();
            const media = loadedMedia[infoBtn.dataset.id];
            if (media) openDetailModal(media);
            return;
        }

        const clickable = e.target.closest('.movie-card, .top10-item');
        if (clickable) {
            const mediaId = clickable.dataset.id;
            const media = loadedMedia[mediaId];
            if (media) openDetailModal(media);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (!elements.trailerModal?.classList.contains('hidden')) {
            elements.closeModalBtn?.click();
            return;
        }
        if (!elements.detailModal?.classList.contains('hidden')) {
            closeDetailModal();
        }
    });

    window.addEventListener('popstate', () => {
        elements.videoContainer.innerHTML = '';
        checkUrlState();
    });
}

// ============================================
// Core Routing
// ============================================
function clearUrlParam() {
    const url = new URL(window.location);
    url.searchParams.delete('id');
    url.searchParams.delete('type');
    url.searchParams.delete('sea');
    url.searchParams.delete('epi');
    window.history.pushState({}, '', url);
}

function checkUrlState() {
    const params = new URLSearchParams(window.location.search);
    const mediaId = params.get('id');
    const mediaType = params.get('type') || 'movie';
    const sea = params.get('sea') || '1';
    const epi = params.get('epi') || '1';
    
    if (mediaId && mediaType) {
        fetchMediaDetailsAndPlay(mediaId, mediaType, sea, epi);
    } else {
        switchCategory('home');
    }
}

function updateNavActiveState(viewName) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.view === viewName);
    });
}

function switchCategory(view) {
    closeDetailModal();
    stopAllCardTrailers();
    currentView = view;
    updateNavActiveState(view);
    clearUrlParam();
    clearInterval(carouselInterval);
    clearInterval(homeRefreshInterval);
    
    elements.searchInput.value = '';
    elements.dynamicCatalog.innerHTML = '';
    if (elements.paginationContainer) elements.paginationContainer.classList.add('hidden');
    elements.heroSection.classList.add('hidden'); // Esconder Hero por defecto a menos en Inicio
    
    // Hide filters unless in 'movies' (since others have specific logic or rows)
    elements.genreFilters.classList.toggle('hidden', view !== 'movies');
    elements.gridTitle.classList.add('hidden');
    elements.catalogSection.classList.toggle('has-hero-banner', view === 'home');
    
    showView('catalog');
    
    switch(view) {
        case 'home':
            loadHomeRows();
            break;
        case 'movies':
            resetGenreButtons();
            elements.gridTitle.textContent = 'Películas';
            elements.gridTitle.classList.remove('hidden');
            fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`, 'movie');
            break;
        case 'series':
            elements.gridTitle.textContent = 'Series';
            elements.gridTitle.classList.remove('hidden');
            fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`, 'tv');
            break;
        case 'new':
            elements.gridTitle.textContent = 'Novedades';
            elements.gridTitle.classList.remove('hidden');
            fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=release_date.desc&primary_release_date.lte=2026-12-31`, 'movie');
            break;
        case 'mylist':
            loadMyListView();
            break;
    }
}

async function loadMyListView() {
    showSkeletonLoader('grid');
    const list = getMyList();

    elements.gridTitle.textContent = 'Mi Lista';
    elements.gridTitle.classList.remove('hidden');

    if (list.length === 0) {
        elements.dynamicCatalog.innerHTML = `
            <div class="empty-list">
                <p>Tu lista está vacía.</p>
                <p class="empty-list-hint">Explora el catálogo y pulsa + en cualquier título para añadirlo.</p>
            </div>`;
        return;
    }

    const mediaItems = list.map(item => ({
        id: item.id,
        custom_type: item.type,
        title: item.type === 'movie' ? item.title : undefined,
        name: item.type === 'tv' ? item.title : undefined,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        vote_average: item.vote_average,
        release_date: item.type === 'movie' ? item.release_date : undefined,
        first_air_date: item.type === 'tv' ? item.release_date : undefined
    }));

    mediaItems.forEach(item => { loadedMedia[item.id] = item; });

    let html = '<div class="dynamic-grid">';
    mediaItems.forEach(item => { html += createCardHTML(item); });
    html += '</div>';

    elements.dynamicCatalog.innerHTML = html;
    updateListButtonStates();
}

function stopAllCardTrailers() {
    clearCardHoverTimer();
    cardHoverTarget = null;
    document.querySelectorAll('.movie-card.playing-trailer').forEach(deactivateCardTrailer);
}
async function loadHomeRows(silent = false) {
    if (!silent) toggleSpinner(true);
    if (!silent) loadedMedia = {};

    try {
        const [trendingDay, popularTv, actionMovies, horrorMovies, scifiMovies, comedyMovies, animes, kdramas, newMovies] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${API_KEY}&language=es-MX`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&with_genres=28,12&sort_by=popularity.desc`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&with_genres=27&sort_by=popularity.desc`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&with_genres=878&sort_by=popularity.desc`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&with_genres=35&sort_by=popularity.desc`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&with_genres=16&with_original_language=ja&sort_by=popularity.desc`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&with_origin_country=KR&sort_by=popularity.desc`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=release_date.desc&primary_release_date.lte=2026-12-31`).then(r => r.json())
        ]);

        const dayList = (trendingDay.results || []).filter(i => i.poster_path || i.backdrop_path);

        if (!silent && dayList.length > 0) {
            initHeroCarousel(dayList.slice(0, 5));
        }

        const trendingWide = dayList.filter(i => i.backdrop_path).slice(0, 15);
        const top10 = dayList.filter(i => i.poster_path).slice(0, 10);

        let combinedHtml = '';
        combinedHtml += generateTrendingRowHTML('Tendencias ahora', trendingWide);
        combinedHtml += generateTop10RowHTML('Top 10 en Netflix hoy', top10);
        combinedHtml += generateRowHTML('Títulos originales de Netflix', overrideMediaType((popularTv.results || []).slice(0, 18), 'tv'));
        combinedHtml += generateRowHTML('Acción y aventura', overrideMediaType((actionMovies.results || []).slice(0, 18), 'movie'));
        combinedHtml += generateRowHTML('Comedias', overrideMediaType((comedyMovies.results || []).slice(0, 18), 'movie'));
        combinedHtml += generateRowHTML('Terror', overrideMediaType((horrorMovies.results || []).slice(0, 18), 'movie'));
        combinedHtml += generateRowHTML('Ciencia ficción', overrideMediaType((scifiMovies.results || []).slice(0, 18), 'movie'));
        combinedHtml += generateRowHTML('Novedades', overrideMediaType((newMovies.results || []).filter(m => m.poster_path).slice(0, 18), 'movie'));
        combinedHtml += generateRowHTML('Animes populares', overrideMediaType((animes.results || []).slice(0, 18), 'tv'));
        combinedHtml += generateRowHTML('Doramas coreanos', overrideMediaType((kdramas.results || []).slice(0, 18), 'tv'));

        elements.dynamicCatalog.innerHTML = combinedHtml;
        updateListButtonStates();

        if (!silent) startHomeAutoRefresh();
    } catch (e) {
        console.error('Error loading home:', e);
        if (!silent) {
            elements.dynamicCatalog.innerHTML = '<p style="color:red; text-align:center;">Error cargando portada.</p>';
        }
    }
}

function startHomeAutoRefresh() {
    clearInterval(homeRefreshInterval);
    homeRefreshInterval = setInterval(() => {
        if (currentView === 'home' && elements.catalogSection.classList.contains('active-view')) {
            loadHomeRows(true);
        }
    }, HOME_REFRESH_MS);
}

// Grid fallback Logic
async function fetchAndRenderGrid(url, forcedMediaType, page = 1) {
    showSkeletonLoader('grid');
    // Eliminar &page si existe para que no se duplique y agregar dinámicamente
    const baseUrl = url.replace(/&page=\d+/, '');
    const finalUrl = `${baseUrl}&page=${page}`;
    
    try {
        const response = await fetch(finalUrl);
        const data = await response.json();
        const mediaArr = overrideMediaType(data.results, forcedMediaType);
        
        if (mediaArr.length === 0) {
            elements.dynamicCatalog.innerHTML = '<p style="color:red;width:100%;text-align:center;">Sin resultados.</p>';
            if(elements.paginationContainer) elements.paginationContainer.classList.add('hidden');
            return;
        }

        let htmlGrid = '<div class="dynamic-grid">';
        mediaArr.forEach(item => { htmlGrid += createCardHTML(item); });
        htmlGrid += '</div>';

        elements.dynamicCatalog.innerHTML = htmlGrid;
        updateListButtonStates();
        if(data.total_pages > 1) {
            renderPagination(data.page, data.total_pages, baseUrl, forcedMediaType);
        } else {
            if(elements.paginationContainer) elements.paginationContainer.classList.add('hidden');
        }

    } catch (e) {
        elements.dynamicCatalog.innerHTML = '<p style="color:red;">Error en catálogo.</p>';
        if(elements.paginationContainer) elements.paginationContainer.classList.add('hidden');
    }
}

function renderPagination(currentPage, totalPages, baseUrl, forcedMediaType) {
    if (!elements.paginationContainer) return;
    elements.paginationContainer.classList.remove('hidden');
    
    // TMDb API max pages is 500
    const maxPages = Math.min(totalPages, 500); 
    let html = '';
    
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(maxPages, currentPage + 2);
    
    if (currentPage > 1) {
        html += `<button class="page-btn" data-page="${currentPage - 1}">Anterior</button>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }
    
    if (currentPage < maxPages) {
        html += `<button class="page-btn" data-page="${currentPage + 1}">Siguiente</button>`;
    }
    
    elements.paginationContainer.innerHTML = html;
    
    const buttons = elements.paginationContainer.querySelectorAll('.page-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
             const targetPage = parseInt(btn.dataset.page);
             fetchAndRenderGrid(baseUrl, forcedMediaType, targetPage);
             // Regresar scroll al inicio del catálogo para ver resultados
             elements.catalogSection.scrollIntoView({ behavior: 'smooth' });
        });
    });
}

// Internal Template Generators
let currentHeroItems = [];
let currentHeroIdx = 0;

function initHeroCarousel(items) {
    currentHeroItems = items;
    currentHeroIdx = 0;
    renderHeroContent(currentHeroItems[0]);

    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        currentHeroIdx = (currentHeroIdx + 1) % currentHeroItems.length;

        elements.heroSection.classList.add('fade');
        setTimeout(() => {
            renderHeroContent(currentHeroItems[currentHeroIdx]);
            elements.heroSection.classList.remove('fade');
        }, 500);
    }, 8000);
}

async function fetchTitleLogo(id, type) {
    try {
        const data = await fetch(
            `${TMDB_BASE_URL}/${type}/${id}/images?api_key=${API_KEY}&include_image_language=es,en,null`
        ).then(r => r.json());

        const logos = data.logos || [];
        const logo = logos.find(l => l.iso_639_1 === 'es') || logos.find(l => l.iso_639_1 === 'en') || logos[0];
        return logo?.file_path ? `${LOGO_BASE_URL}${logo.file_path}` : null;
    } catch {
        return null;
    }
}

async function renderHeroContent(item) {
    if (!item) return;

    const name = item.title || item.name;
    const type = item.media_type || item.custom_type || 'movie';
    const overview = item.overview || 'Disfruta de los mejores estrenos en Netflix.';
    const backdropUrl = item.backdrop_path ? `${HERO_IMAGE_BASE_URL}${item.backdrop_path}` : '';

    loadedMedia[item.id] = { ...item, custom_type: type };

    elements.heroSection.style.backgroundImage = backdropUrl ? `url('${backdropUrl}')` : 'none';

    const heroTitle = document.getElementById('hero-title');
    heroTitle.textContent = name;

    const logoUrl = await fetchTitleLogo(item.id, type);
    if (logoUrl && elements.heroLogo) {
        elements.heroLogo.src = logoUrl;
        elements.heroLogo.alt = name;
        elements.heroLogo.classList.remove('hidden');
        heroTitle.classList.add('hidden');
    } else {
        elements.heroLogo?.classList.add('hidden');
        heroTitle.classList.remove('hidden');
    }

    document.getElementById('hero-overview').textContent = overview;
    document.getElementById('hero-play-btn').dataset.id = item.id;
    document.getElementById('hero-info-btn').dataset.id = item.id;
    elements.heroSection.classList.remove('hidden');

    loadHeroVideo(item.id, type);
}

async function loadHeroVideo(id, type) {
    if (!elements.heroVideoPlayer) return;

    elements.heroVideoPlayer.classList.remove('loaded');

    const key = await fetchTrailerKey(id, type);

    if (key) {
        await initHeroYoutubePlayer(key);
    } else {
        elements.heroVideoWrap.style.display = 'none';
        if (heroYtPlayer?.stopVideo) heroYtPlayer.stopVideo();
    }
}

function overrideMediaType(arr, type) {
    return arr.map(i => ({...i, custom_type: i.media_type || type}));
}

function generateTrendingRowHTML(title, mediaArray) {
    if (!mediaArray || mediaArray.length === 0) return '';

    let rowContent = `<div class="row-container trending-row-container"><h2 class="row-title">${title}</h2><div class="row-wrapper">`;
    rowContent += `<button class="slider-btn left">&#10094;</button>`;
    rowContent += `<div class="movie-row trending-row">`;

    mediaArray.forEach(item => {
        if (!item.custom_type) item.custom_type = item.media_type || 'movie';
        rowContent += createTrendingCardHTML(item);
    });

    rowContent += `</div><button class="slider-btn right">&#10095;</button></div></div>`;
    return rowContent;
}

function createTrendingCardHTML(item) {
    if (!item.backdrop_path) return '';

    loadedMedia[item.id] = item;
    const name = item.title || item.name;

    return `
        <div class="movie-card trending-card" data-id="${item.id}">
            <div class="poster-container">
                <img src="${BACKDROP_BASE_URL}${item.backdrop_path}" alt="${name}" loading="lazy">
                <div class="trending-title-overlay">
                    <span class="trending-card-title">${name}</span>
                </div>
            </div>
        </div>
    `;
}

function generateTop10RowHTML(title, mediaArray) {
    if (!mediaArray || mediaArray.length === 0) return '';

    let rowContent = `<div class="row-container top10-row-container"><h2 class="row-title">${title}</h2><div class="row-wrapper">`;
    rowContent += `<button class="slider-btn left">&#10094;</button>`;
    rowContent += `<div class="movie-row top10-row">`;

    mediaArray.forEach((item, index) => {
        if (!item.custom_type) item.custom_type = item.media_type || 'movie';
        rowContent += createTop10ItemHTML(item, index + 1);
    });

    rowContent += `</div><button class="slider-btn right">&#10095;</button></div></div>`;
    return rowContent;
}

function createTop10ItemHTML(item, rank) {
    if (!item.poster_path) return '';

    loadedMedia[item.id] = item;
    const name = item.title || item.name;

    return `
        <div class="top10-item" data-id="${item.id}">
            <span class="top10-rank" aria-hidden="true">${rank}</span>
            <div class="top10-poster">
                <img src="${IMAGE_BASE_URL}${item.poster_path}" alt="${name}" loading="lazy">
                <div class="play-overlay"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
            </div>
        </div>
    `;
}

function generateRowHTML(title, mediaArray) {
    if (!mediaArray || mediaArray.length === 0) return '';
    let rowContent = `<div class="row-container"><h2 class="row-title">${title}</h2><div class="row-wrapper">`;
    
    // Left UI Arrow
    rowContent += `<button class="slider-btn left">&#10094;</button>`;
    
    rowContent += `<div class="movie-row">`;
    mediaArray.forEach(item => {
        // Trending endpoint sometimes provides 'media_type', otherwise fallback
        if(!item.custom_type) { item.custom_type = item.media_type || 'movie'; }
        rowContent += createCardHTML(item);
    });
    rowContent += `</div>`;
    
    // Right UI Arrow
    rowContent += `<button class="slider-btn right">&#10095;</button>`;
    rowContent += `</div></div>`;
    
    return rowContent;
}

function createCardHTML(item) {
    if (!item.poster_path) return '';

    loadedMedia[item.id] = item;

    const name = item.title || item.name;
    const type = item.custom_type || item.media_type || 'movie';
    const year = item.release_date ? item.release_date.substring(0, 4) : (item.first_air_date ? item.first_air_date.substring(0, 4) : '');
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
    const match = Math.min(99, Math.round((item.vote_average || 0) * 10));
    const inList = isInMyList(item.id, type);

    return `
        <div class="movie-card" data-id="${item.id}" data-type="${type}">
            <div class="poster-container">
                <img class="card-poster-img" src="${IMAGE_BASE_URL}${item.poster_path}" alt="${name}" loading="lazy">
                <div class="play-overlay"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="48" height="48"><path d="M8 5v14l11-7z"/></svg></div>
            </div>
            <div class="card-hover-panel">
                <div class="card-actions">
                    <button class="card-action-btn play-btn" data-id="${item.id}" aria-label="Reproducir">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                    </button>
                    <button class="card-action-btn list-btn ${inList ? 'in-list' : ''}" data-id="${item.id}" data-type="${type}" aria-label="Mi Lista">
                        ${inList
                            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
                            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'}
                    </button>
                    <button class="card-action-btn info-btn" data-id="${item.id}" aria-label="Más información" style="margin-left:auto;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                </div>
                <p class="card-hover-title">${name}</p>
                <div class="card-hover-meta">
                    <span class="card-match">${match}% Relevante</span>
                    ${year ? `<span>${year}</span>` : ''}
                    <span class="card-badge">HD</span>
                    <span>⭐ ${rating}</span>
                </div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${name}</h3>
                <div class="movie-meta"><span>${year}</span><span>⭐ ${rating}</span></div>
            </div>
        </div>
    `;
}

// ============================================
// Detail Modal — Netflix Info Panel
// ============================================
function setupDetailModalListeners() {
    if (!elements.detailModal) return;

    elements.closeDetailBtn?.addEventListener('click', closeDetailModal);

    elements.detailPlayBtn?.addEventListener('click', () => {
        if (!detailMedia) return;
        const media = { ...detailMedia };
        closeDetailModal();
        openPlayer(media);
    });

    elements.detailTrailerBtn?.addEventListener('click', () => {
        if (!detailMedia) return;
        openTrailerModal(detailMedia.id, detailMedia.custom_type || 'movie');
    });

    elements.detailAddListBtn?.addEventListener('click', () => {
        if (!detailMedia) return;
        toggleMyList(detailMedia);
        updateListButtonStates();
    });
}

async function fetchTrailerKey(id, type) {
    const dataMX = await fetch(`${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=es-MX`).then(r => r.json());
    let trailer = dataMX.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');

    if (!trailer) {
        const dataUS = await fetch(`${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=en-US`).then(r => r.json());
        trailer = dataUS.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    }

    return trailer?.key || null;
}

function stopDetailTrailer() {
    elements.detailBackdrop?.classList.remove('has-trailer');
}

async function openDetailModal(media) {
    if (!elements.detailModal || !media) return;

    stopAllCardTrailers();
    const type = media.custom_type || media.media_type || 'movie';
    detailMedia = { ...media, custom_type: type };

    stopDetailTrailer();
    elements.detailModal.classList.remove('hidden');
    document.body.classList.add('modal-open');
    elements.detailModal.querySelector('.detail-modal-scroll').scrollTop = 0;
    elements.detailLoading?.classList.remove('hidden');
    elements.detailContent?.classList.add('hidden');

    elements.detailTitle.textContent = media.title || media.name || 'Cargando...';
    elements.detailOverview.textContent = media.overview || '';

    setDetailBackdrop(media);

    try {
        const data = await fetch(
            `${TMDB_BASE_URL}/${type}/${media.id}?api_key=${API_KEY}&language=es-MX&append_to_response=credits`
        ).then(r => {
            if (!r.ok) throw new Error('No se pudo cargar el detalle');
            return r.json();
        });

        data.custom_type = type;
        loadedMedia[data.id] = data;
        detailMedia = data;
        renderDetailModal(data);
    } catch (e) {
        renderDetailModal(detailMedia);
    } finally {
        elements.detailLoading?.classList.add('hidden');
        elements.detailContent?.classList.remove('hidden');
    }
}

function setDetailBackdrop(data) {
    const backdrop = data.backdrop_path
        ? `${HERO_IMAGE_BASE_URL}${data.backdrop_path}`
        : (data.poster_path ? `${HERO_IMAGE_BASE_URL}${data.poster_path}` : '');
    elements.detailBackdrop.style.backgroundImage = backdrop ? `url('${backdrop}')` : 'none';
    elements.detailBackdrop.classList.remove('has-trailer');
}

function formatRuntime(minutes) {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h} h ${m} min` : `${m} min`;
}

function renderDetailModal(data) {
    const type = data.custom_type || 'movie';
    const title = data.title || data.name || 'Sin título';
    const overview = data.overview || 'Sin descripción disponible para este título.';
    const year = (data.release_date || data.first_air_date || '').substring(0, 4);
    const match = Math.min(99, Math.round((data.vote_average || 0) * 10));
    const genres = data.genres?.map(g => g.name).join(', ') || '—';
    const cast = data.credits?.cast?.slice(0, 6).map(c => c.name).join(', ') || '—';

    setDetailBackdrop(data);

    elements.detailTitle.textContent = title;
    elements.detailOverview.textContent = overview;
    elements.detailGenres.textContent = genres;
    elements.detailCast.textContent = cast;
    elements.detailType.textContent = type === 'tv' ? 'Serie' : 'Película';

    let infoHtml = `<span class="detail-match">${match}% Relevante</span>`;
    if (year) infoHtml += `<span>${year}</span>`;
    infoHtml += `<span class="detail-info-badge">HD</span>`;

    if (type === 'tv' && data.number_of_seasons) {
        infoHtml += `<span>${data.number_of_seasons} Temporada${data.number_of_seasons !== 1 ? 's' : ''}</span>`;
    } else if (type === 'movie' && data.runtime) {
        infoHtml += `<span>${formatRuntime(data.runtime)}</span>`;
    }

    if (data.vote_average) {
        infoHtml += `<span class="detail-info-rating">⭐ ${data.vote_average.toFixed(1)}</span>`;
    }

    elements.detailInfoRow.innerHTML = infoHtml;
    updateListButtonStates();
}

function closeDetailModal() {
    if (!elements.detailModal) return;
    stopDetailTrailer();
    elements.detailModal.classList.add('hidden');
    document.body.classList.remove('modal-open');
    detailMedia = null;
}

// ============================================
// TV Embed Player & TV Logistics
// ============================================
async function fetchMediaDetailsAndPlay(id, type, presetSeason='1', presetEpisode='1') {
    try {
        const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=es-MX`;
        const r = await fetch(url);
        if(!r.ok) throw Error();
        const data = await r.json();
        
        data.custom_type = type;
        loadedMedia[data.id] = data; // Cache
        
        openPlayer(data, false, presetSeason, presetEpisode);
    } catch(e) {
        clearUrlParam();
        switchCategory('home');
    }
}

async function openPlayer(media, updateUrl = true, presetSeason='1', presetEpisode='1') {
    closeDetailModal();
    currentMediaId = media.id;
    currentMediaType = media.custom_type || 'movie';

    // UI Top updates
    elements.playerTitle.textContent = media.title || media.name;
    elements.playerReleaseDate.textContent = (media.release_date || media.first_air_date || 'N/A').substring(0, 4);
    elements.playerRating.textContent = `⭐ ${media.vote_average ? media.vote_average.toFixed(1) : 'NR'}`;
    elements.playerOverview.textContent = media.overview || 'Sin descripción disponible para este título.';

    // Default to server 1
    updateServerActiveState(elements.serverOptions.querySelector('[data-server="1"]'));

    // Handle Layout
    if (currentMediaType === 'tv') {
        elements.tvControls.classList.remove('hidden');
        await populateSeasons(media);
        
        elements.seasonSelect.value = presetSeason;
        await populateEpisodes(currentMediaId, presetSeason);
        
        elements.episodeSelect.value = presetEpisode;
        
    } else {
        elements.tvControls.classList.add('hidden');
    }

    if (updateUrl) pushPlayerUrl(presetSeason, presetEpisode);
    
    // Inject automatically upon click to S1E1 (or preset for URL restore)
    loadVideoIframe(currentMediaId, currentMediaType, '1', presetSeason, presetEpisode);

    showView('player');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Fill Season Drodown
async function populateSeasons(tvObject) {
    let seasonsArray = tvObject.seasons;
    // If we loaded from Grid context, seasons might not be fetched yet.
    if (!seasonsArray) {
        const fullData = await fetch(`${TMDB_BASE_URL}/tv/${tvObject.id}?api_key=${API_KEY}&language=es-MX`).then(r => r.json());
        seasonsArray = fullData.seasons;
        loadedMedia[tvObject.id] = fullData; // Update cache deeply
    }
    
    if(!seasonsArray) return;

    elements.seasonSelect.innerHTML = '';
    seasonsArray.forEach(season => {
        if(season.season_number > 0) { // Exclude Specials (S0)
            const option = document.createElement('option');
            option.value = season.season_number;
            option.textContent = `Temporada ${season.season_number}`;
            elements.seasonSelect.appendChild(option);
        }
    });

    if(elements.seasonSelect.options.length === 0) {
        elements.seasonSelect.innerHTML = '<option value="1">Temporada 1</option>';
    }
}

// Fill Episodes Dropdown
async function populateEpisodes(tvId, seasonNum) {
    elements.episodeSelect.innerHTML = '';
    try {
        const r = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNum}?api_key=${API_KEY}&language=es-MX`);
        const data = await r.json();
        
        if (data.episodes && data.episodes.length > 0) {
            data.episodes.forEach(ep => {
                const opt = document.createElement('option');
                opt.value = ep.episode_number;
                opt.textContent = `Cap. ${ep.episode_number} - ${ep.name}`;
                elements.episodeSelect.appendChild(opt);
            });
        } else {
            elements.episodeSelect.innerHTML = '<option value="1">Episodio 1</option>';
        }
    } catch(e) {
        elements.episodeSelect.innerHTML = '<option value="1">Episodio 1</option>';
    }
}

// Dynamic Iframe Server Execution
function triggerIframeUpdate() {
    const sea = elements.seasonSelect.value || '1';
    const epi = elements.episodeSelect.value || '1';
    const serverId = elements.serverOptions.querySelector('.active').dataset.server;
    
    pushPlayerUrl(sea, epi);
    loadVideoIframe(currentMediaId, currentMediaType, serverId, sea, epi);
}

// Trailer Modal Loading Logic
async function openTrailerModal(id, type) {
    if (!id) return;
    elements.trailerVideoContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">Buscando tráiler...</p>';
    elements.trailerModal.classList.remove('hidden');

    try {
        const key = await fetchTrailerKey(id, type);

        if (key) {
            const originStr = window.location.origin !== 'null' ? window.location.origin : 'https://www.netflix.com';
            elements.trailerVideoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${key}?autoplay=1&origin=${encodeURIComponent(originStr)}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;

            const fallbackDiv = document.getElementById('trailer-fallback');
            if (fallbackDiv) {
                fallbackDiv.innerHTML = `<a href="https://www.youtube.com/watch?v=${key}" target="_blank" class="hero-btn secondary" style="text-decoration:none; padding: 0.5rem 1.5rem; border-radius: 30px; font-weight: 500; font-size: 0.95rem;">⚠ ¿Presentas error al cargar? Abrir Tráiler en YouTube</a>`;
                fallbackDiv.classList.remove('hidden');
            }
        } else {
            elements.trailerVideoContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">Tráiler no disponible por el momento</p>';
        }
    } catch (e) {
        console.error('Error fetching trailer:', e);
        elements.trailerVideoContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">Tráiler no disponible por el momento</p>';
    }
}

function buildEmbedUrl(id, type, serverId, sNum, eNum) {
    switch (serverId) {
        case '1':
            // VidFast — ocultamos su botón fullscreen (redirige a sitios externos)
            return type === 'tv'
                ? `https://vidfast.pro/tv/${id}/${sNum}/${eNum}?autoPlay=true&sub=es&title=false&poster=true&fullscreenButton=false`
                : `https://vidfast.pro/movie/${id}?autoPlay=true&sub=es&title=false&poster=true&fullscreenButton=false`;
        case '2':
            // VidLink — agrega múltiples fuentes automáticamente
            return type === 'tv'
                ? `https://vidlink.pro/tv/${id}/${sNum}/${eNum}?autoplay=true&primaryColor=e50914&secondaryColor=141414&title=false`
                : `https://vidlink.pro/movie/${id}?autoplay=true&primaryColor=e50914&secondaryColor=141414&title=false`;
        case '3':
            // AutoEmbed — buen respaldo para series y películas
            return type === 'tv'
                ? `https://autoembed.co/tv/tmdb/${id}-${sNum}-${eNum}`
                : `https://autoembed.co/movie/tmdb/${id}`;
        default:
            return type === 'tv'
                ? `https://vidfast.pro/tv/${id}/${sNum}/${eNum}?autoPlay=true&sub=es`
                : `https://vidfast.pro/movie/${id}?autoPlay=true&sub=es`;
    }
}

function setupFullscreenControls() {
    if (!elements.fullscreenBtn || !elements.videoStage) return;

    elements.fullscreenBtn.addEventListener('click', toggleVideoFullscreen);

    document.addEventListener('fullscreenchange', updateFullscreenButtonState);
    document.addEventListener('webkitfullscreenchange', updateFullscreenButtonState);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') updateFullscreenButtonState();
        if (
            e.key === 'f' &&
            elements.playerSection.classList.contains('active-view') &&
            !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
        ) {
            e.preventDefault();
            toggleVideoFullscreen();
        }
    });
}

function getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || null;
}

function toggleVideoFullscreen() {
    if (!elements.videoStage) return;

    if (getFullscreenElement()) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        return;
    }

    const stage = elements.videoStage;
    if (stage.requestFullscreen) stage.requestFullscreen();
    else if (stage.webkitRequestFullscreen) stage.webkitRequestFullscreen();
}

function updateFullscreenButtonState() {
    if (!elements.fullscreenBtn) return;

    const isFullscreen = getFullscreenElement() === elements.videoStage;
    elements.fullscreenBtn.classList.toggle('is-active', isFullscreen);
    elements.fullscreenBtn.setAttribute('aria-label', isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa');
    elements.fullscreenBtn.title = isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa';

    elements.fullscreenBtn.querySelector('.icon-expand')?.classList.toggle('hidden', isFullscreen);
    elements.fullscreenBtn.querySelector('.icon-compress')?.classList.toggle('hidden', !isFullscreen);
}

function loadVideoIframe(id, type, serverId, sNum, eNum) {
    if (!id) return;

    elements.videoContainer.innerHTML = '<p class="player-loading">Cargando reproductor...</p>';

    const url = buildEmbedUrl(id, type, serverId, sNum, eNum);

    // Destruir iframe anterior antes de crear uno nuevo (evita audio duplicado)
    setTimeout(() => {
        elements.videoContainer.innerHTML = '';

        const iframe = document.createElement('iframe');
        iframe.id = 'reproductor-iframe';
        iframe.src = url;
        iframe.setAttribute('width', '100%');
        iframe.setAttribute('height', '100%');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('scrolling', 'no');
        iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture; encrypted-media');
        iframe.setAttribute('allowfullscreen', '');
        // Sin sandbox: VidFast/VidLink detectan sandbox y dejan de reproducir
        elements.videoContainer.appendChild(iframe);
    }, 100);
}

function pushPlayerUrl(s, e) {
    const url = new URL(window.location);
    url.searchParams.set('id', currentMediaId);
    url.searchParams.set('type', currentMediaType);
    if(currentMediaType === 'tv') {
        url.searchParams.set('sea', s);
        url.searchParams.set('epi', e);
    } else {
        url.searchParams.delete('sea');
        url.searchParams.delete('epi');
    }
    window.history.pushState({}, '', url);
}

// ============================================
// Miscellaneous Helpers
// ============================================
async function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;

    closeDetailModal();
    if (getFullscreenElement()) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    }
    elements.videoContainer.innerHTML = '';
    clearUrlParam();
    clearInterval(carouselInterval);
    clearInterval(homeRefreshInterval);
    elements.heroSection.classList.add('hidden');
    elements.catalogSection.classList.remove('has-hero-banner');
    elements.genreFilters.classList.add('hidden');
    if (elements.paginationContainer) elements.paginationContainer.classList.add('hidden');

    currentView = 'search';
    updateNavActiveState('');
    elements.gridTitle.textContent = `Resultados para "${query}"`;
    elements.gridTitle.classList.remove('hidden');

    showView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchAndRenderGrid(`${TMDB_BASE_URL}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(query)}`, 'movie');
}

async function handleGenreFilter(button) {
    resetGenreButtons();
    button.classList.add('active');
    
    const genreId = button.dataset.id;
    if (!genreId) {
        fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`, 'movie');
        return;
    }
    fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&with_genres=${genreId}&sort_by=popularity.desc`, 'movie');
}

function resetGenreButtons() {
    if(!elements.genreFilters) return;
    elements.genreFilters.querySelectorAll('.genre-btn').forEach(b => b.classList.remove('active'));
    const t = elements.genreFilters.querySelector('[data-id=""]');
    if (t) t.classList.add('active');
}

function showView(viewName) {
    if (viewName === 'catalog') {
        elements.catalogSection.classList.replace('hidden-view', 'active-view');
        elements.playerSection.classList.replace('active-view', 'hidden-view');
    } else if (viewName === 'player') {
        elements.playerSection.classList.replace('hidden-view', 'active-view');
        elements.catalogSection.classList.replace('active-view', 'hidden-view');
    }
}

function updateServerActiveState(targetBtn) {
    if(!elements.serverOptions || !targetBtn) return;
    elements.serverOptions.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
    targetBtn.classList.add('active');
}
