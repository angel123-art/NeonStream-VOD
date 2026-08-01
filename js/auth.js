/** NeonStream-VOD — auth.js */
import {
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

// ============================================
// Supabase Auth — Login / Registro
// ============================================
function validateSupabaseConfig() {
    const issues = [];
    const projectUrl = getSupabaseProjectUrl();

    if (!projectUrl || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(projectUrl)) {
        issues.push('VITE_SUPABASE_URL debe ser https://TU-PROYECTO.supabase.co (sin /rest/v1/ al final).');
    }

    const key = SUPABASE_ANON_KEY.trim();
    if (!key || key.length < 20) {
        issues.push('VITE_SUPABASE_ANON_KEY está vacía o parece inválida.');
    } else if (!key.startsWith('sb_publishable_') && !key.startsWith('eyJ')) {
        issues.push('La clave debe ser publishable (sb_publishable_...) o anon JWT (eyJ...).');
    }

    return issues;
}

function getSupabaseKeyType() {
    const key = SUPABASE_ANON_KEY.trim();
    if (key.startsWith('sb_publishable_')) return 'publishable';
    if (key.startsWith('eyJ')) return 'anon-jwt';
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

    AuditLogger.error('AUTH', `Error Supabase: ${context}`, AuditLogger.sanitizeObject({
        message: err?.message || String(err),
        name: err?.name,
        code: err?.code,
        status: err?.status,
        details: err?.details,
        hint: err?.hint,
        context,
        extra
    }));
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
            flowType: 'pkce',
            experimental: { passkey: true }
        }
    });

    console.info('[Supabase] Cliente inicializado', {
        url: projectUrl,
        keyType: getSupabaseKeyType(),
        redirectTo: getAuthRedirectUrl(),
        passkeyEnabled: true
    });
    return client;
}

function setupAuthGate() {
    if (!elements.authForm || appState.authGateInitialized) return;
    appState.authGateInitialized = true;

    elements.authForm.addEventListener('submit', handleAuthSubmit);
    elements.authToggleBtn?.addEventListener('click', toggleAuthMode);
    elements.authForgotBtn?.addEventListener('click', openForgotPasswordMode);
    elements.authForgotBackBtn?.addEventListener('click', returnToLoginFromForgot);
    elements.authBackBtn?.addEventListener('click', returnToLandingFromAuth);
    elements.authBackLink?.addEventListener('click', returnToLandingFromAuth);
    elements.authPasskeySigninBtn?.addEventListener('click', handlePasskeySignIn);
    elements.authPasskeyRegisterBtn?.addEventListener('click', handleRegisterWithPasskey);
}

function isPasskeySupported() {
    return window.isSecureContext
        && typeof window.PublicKeyCredential !== 'undefined'
        && typeof navigator?.credentials?.create === 'function'
        && typeof navigator?.credentials?.get === 'function';
}

function isPasskeyAvailable() {
    return Boolean(
        appState.supabaseClient?.auth?.signInWithPasskey
        && appState.supabaseClient?.auth?.registerPasskey
        && isPasskeySupported()
    );
}

function setPasskeyLoading(loading) {
    if (elements.authPasskeySigninBtn) {
        elements.authPasskeySigninBtn.disabled = loading;
    }
    if (elements.authPasskeyRegisterBtn) {
        elements.authPasskeyRegisterBtn.disabled = loading;
    }
}

function getPasskeyErrorMessage(err) {
    const msg = err?.message || String(err);
    const code = err?.code || '';

    if (err?.name === 'NotAllowedError' || /not allowed|cancel/i.test(msg)) {
        return 'Operación cancelada. Puedes intentarlo de nuevo cuando quieras.';
    }
    if (/passkey_disabled/i.test(code) || /passkey_disabled/i.test(msg)) {
        return 'Las llaves de acceso no están habilitadas en Supabase para este dominio.';
    }
    if (/webauthn_credential_not_found/i.test(code) || /webauthn_credential_not_found/i.test(msg)) {
        return 'No hay una llave de acceso registrada. Crea tu cuenta y regístrala primero.';
    }
    if (/webauthn_credential_exists/i.test(code) || /webauthn_credential_exists/i.test(msg)) {
        return 'Esta llave de acceso ya está registrada en tu cuenta.';
    }
    if (/too_many_passkeys/i.test(code) || /too_many_passkeys/i.test(msg)) {
        return 'Has alcanzado el límite de llaves de acceso permitidas.';
    }
    if (/webauthn_verification_failed/i.test(code) || /webauthn_verification_failed/i.test(msg)) {
        return 'No se pudo verificar la llave de acceso. Inténtalo de nuevo.';
    }

    return getAuthErrorMessage(err, 'passkey');
}

async function handlePasskeySignIn() {
    hideAuthMessages();

    if (!appState.supabaseClient) {
        showAuthError('Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.');
        return;
    }
    if (!isPasskeyAvailable()) {
        showAuthError('Tu navegador o este entorno no admite llaves de acceso. Usa HTTPS y un navegador compatible.');
        return;
    }

    setPasskeyLoading(true);

    try {
        console.info('[Supabase Auth] signInWithPasskey →', { origin: window.location.origin });

        const { data, error } = await appState.supabaseClient.auth.signInWithPasskey();

        if (error) {
            logSupabaseError('signInWithPasskey', error);
            throw error;
        }

        AuditLogger.success('AUTH', 'Inicio de sesión con Passkey (WebAuthn) exitoso', {
            user: AuditLogger.sanitizeUser(data.user),
            method: 'signInWithPasskey'
        });

        console.info('[Supabase Auth] signInWithPasskey OK', { userId: data.user?.id });
        showAuthSuccess('Sesión iniciada con llave de acceso.');
    } catch (err) {
        AuditLogger.error('AUTH', 'Fallo en inicio de sesión con Passkey', AuditLogger.sanitizeObject({
            message: err?.message,
            method: 'signInWithPasskey'
        }));
        showAuthError(getPasskeyErrorMessage(err));
    } finally {
        setPasskeyLoading(false);
    }
}

async function handleRegisterWithPasskey() {
    hideAuthMessages();

    if (!appState.supabaseClient) {
        showAuthError('Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.');
        return;
    }
    if (!isPasskeyAvailable()) {
        showAuthError('Tu navegador o este entorno no admite llaves de acceso. Usa HTTPS y un navegador compatible.');
        return;
    }

    const email = normalizeAuthEmail(elements.authEmail?.value || '');
    const password = elements.authPassword?.value || '';

    if (!email) {
        showAuthError('Introduce tu correo electrónico para crear la cuenta.');
        elements.authEmail?.focus();
        return;
    }
    if (!email.includes('@')) {
        showAuthError('Introduce un correo electrónico válido.');
        return;
    }
    if (password.length < 6) {
        showAuthError('La contraseña debe tener al menos 6 caracteres para registrar tu cuenta.');
        elements.authPassword?.focus();
        return;
    }

    setPasskeyLoading(true);

    try {
        const redirectTo = getAuthRedirectUrl();
        console.info('[Supabase Auth] signUp + registerPasskey →', { email, redirectTo });

        const { data, error } = await appState.supabaseClient.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: redirectTo }
        });

        if (error) {
            logSupabaseError('signUp (passkey flow)', error, { email });
            throw error;
        }

        AuditLogger.success('AUTH', 'Registro de cuenta (flujo Passkey) iniciado', {
            user: AuditLogger.sanitizeUser(data.user),
            email,
            hasSession: Boolean(data.session),
            method: 'signUp+passkey'
        });

        if (!data.session) {
            showAuthSuccess('Confirma tu correo electrónico. Después podrás registrar una llave de acceso al iniciar sesión.');
            appState.authMode = 'login';
            updateAuthUI();
            return;
        }

        const { data: passkeyData, error: passkeyError } = await appState.supabaseClient.auth.registerPasskey();

        if (passkeyError) {
            logSupabaseError('registerPasskey', passkeyError, { email });
            throw passkeyError;
        }

        AuditLogger.success('AUTH', 'Passkey (WebAuthn) registrada correctamente', AuditLogger.sanitizeObject({
            email,
            passkeyId: passkeyData?.id,
            user: AuditLogger.sanitizeUser(data.user),
            method: 'registerPasskey'
        }));

        console.info('[Supabase Auth] registerPasskey OK', { passkeyId: passkeyData?.id });
        showAuthSuccess('¡Cuenta creada y llave de acceso registrada! Cargando tus perfiles...');
    } catch (err) {
        AuditLogger.error('AUTH', 'Fallo en registro con Passkey', AuditLogger.sanitizeObject({
            email,
            message: err?.message,
            method: 'signUp+registerPasskey'
        }));
        showAuthError(getPasskeyErrorMessage(err));
    } finally {
        setPasskeyLoading(false);
    }
}

function updatePasskeyUI() {
    const isLogin = appState.authMode === 'login';
    const isRegister = appState.authMode === 'register';
    const isForgot = appState.authMode === 'forgot';
    const available = isPasskeyAvailable();

    if (elements.authPasskeySection) {
        elements.authPasskeySection.classList.toggle('hidden', isForgot || !available);
    }
    if (elements.authPasskeySigninBtn) {
        elements.authPasskeySigninBtn.classList.toggle('hidden', !isLogin);
    }
    if (elements.authPasskeyRegisterBtn) {
        elements.authPasskeyRegisterBtn.classList.toggle('hidden', !isRegister);
    }
    if (elements.authPasskeyHint) {
        elements.authPasskeyHint.textContent = isRegister
            ? 'Crea tu cuenta y guarda una llave de acceso en este dispositivo con biometría.'
            : 'Usa Face ID, Touch ID, Windows Hello o tu gestor de contraseñas.';
    }
}

function openForgotPasswordMode() {
    appState.authMode = 'forgot';
    updateAuthUI();
    hideAuthMessages();
    elements.authEmail?.focus();
}

function returnToLoginFromForgot() {
    appState.authMode = 'login';
    updateAuthUI();
    hideAuthMessages();
    elements.authEmail?.focus();
}

function toggleAuthMode() {
    if (appState.authMode === 'forgot') return;
    appState.authMode = appState.authMode === 'login' ? 'register' : 'login';
    updateAuthUI();
    hideAuthMessages();
    elements.authEmail?.focus();
}

function getAuthSubmitLabel() {
    if (appState.authMode === 'forgot') return 'Enviar enlace de recuperación';
    if (appState.authMode === 'register') return 'Registrarse';
    return 'Iniciar sesión';
}

function updateAuthUI() {
    const isLogin = appState.authMode === 'login';
    const isRegister = appState.authMode === 'register';
    const isForgot = appState.authMode === 'forgot';

    if (elements.authGateTitle) {
        elements.authGateTitle.textContent = isForgot
            ? 'Restablecer contraseña'
            : (isLogin ? 'Iniciar sesión' : 'Registrarse');
    }
    if (elements.authSubmitBtn) {
        elements.authSubmitBtn.textContent = getAuthSubmitLabel();
    }
    if (elements.authToggleBtn) {
        elements.authToggleBtn.innerHTML = isLogin
            ? '¿Primera vez en Netflix? <span>Regístrate ahora</span>'
            : '¿Ya tienes cuenta? <span>Inicia sesión</span>';
        elements.authToggleBtn.classList.toggle('hidden', isForgot);
    }
    if (elements.authForgotBackBtn) {
        elements.authForgotBackBtn.classList.toggle('hidden', !isForgot);
    }
    if (elements.authPasswordGroup) {
        elements.authPasswordGroup.classList.toggle('hidden', isForgot);
    }
    if (elements.authForgotBtn) {
        elements.authForgotBtn.classList.toggle('hidden', !isLogin);
    }
    if (elements.authEmail) {
        elements.authEmail.placeholder = 'nombre@ejemplo.com';
        elements.authEmail.autocomplete = 'email';
    }
    if (elements.authPassword) {
        elements.authPassword.autocomplete = isRegister ? 'new-password' : 'current-password';
        elements.authPassword.required = !isForgot;
    }
    if (elements.authHint) {
        elements.authHint.textContent = isForgot
            ? 'Te enviaremos un enlace para restablecer tu contraseña.'
            : (isLogin
                ? 'Usa el correo electrónico con el que te registraste.'
                : 'Al registrarte aceptas nuestros Términos de uso y Política de privacidad.');
    }

    updatePasskeyUI();
}

function showAuthGate() {
    hideLandingGate();
    document.body.classList.add('auth-gate-active', 'profile-gate-active');
    document.body.classList.remove('landing-gate-active');
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
        elements.authSubmitBtn.textContent = loading ? 'Procesando...' : getAuthSubmitLabel();
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

    if (!appState.supabaseClient) {
        showAuthError('Supabase no está configurado. Revisa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env.');
        return;
    }

    const email = normalizeAuthEmail(elements.authEmail?.value || '');

    if (!email) {
        showAuthError('Introduce tu correo electrónico.');
        return;
    }

    if (appState.authMode === 'forgot') {
        if (!email.includes('@')) {
            showAuthError('Introduce un correo electrónico válido.');
            return;
        }

        setAuthLoading(true);

        try {
            const redirectTo = getPasswordResetRedirectUrl();
            console.info('[Supabase Auth] resetPasswordForEmail →', { email, redirectTo });

            const { error } = await appState.supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });

            if (error) {
                logSupabaseError('resetPasswordForEmail', error, { email });
                throw error;
            }

            showAuthSuccess('Te enviamos un enlace de recuperación a tu correo. Revisa tu bandeja de entrada.');
        } catch (err) {
            showAuthError(getAuthErrorMessage(err, 'resetPassword'));
        } finally {
            setAuthLoading(false);
        }
        return;
    }

    const password = elements.authPassword?.value || '';

    if (password.length < 6) {
        showAuthError('La contraseña debe tener al menos 6 caracteres.');
        return;
    }

    setAuthLoading(true);

    try {
        if (appState.authMode === 'register') {
            if (!email.includes('@')) {
                showAuthError('Para registrarte debes usar un correo electrónico válido.');
                return;
            }

            const redirectTo = getAuthRedirectUrl();
            console.info('[Supabase Auth] signUp →', { email, url: getSupabaseProjectUrl(), redirectTo });

            const { data, error } = await appState.supabaseClient.auth.signUp({
                email,
                password,
                options: { emailRedirectTo: redirectTo }
            });

            if (error) {
                logSupabaseError('signUp', error, { email });
                throw error;
            }

            AuditLogger.success('AUTH', 'Usuario registrado con correo y contraseña', {
                user: AuditLogger.sanitizeUser(data.user),
                email,
                hasSession: Boolean(data.session),
                method: 'signUp'
            });

            console.info('[Supabase Auth] signUp OK', { hasSession: Boolean(data.session), userId: data.user?.id });

            if (data.session) {
                showAuthSuccess('¡Cuenta creada! Cargando tus perfiles...');
            } else {
                showAuthSuccess('Revisa tu correo para confirmar la cuenta antes de iniciar sesión.');
                appState.authMode = 'login';
                updateAuthUI();
            }
        } else {
            if (!email.includes('@')) {
                showAuthError('Introduce un correo electrónico válido.');
                return;
            }

            console.info('[Supabase Auth] signInWithPassword →', { email, url: getSupabaseProjectUrl() });

            const { data, error } = await appState.supabaseClient.auth.signInWithPassword({ email, password });

            if (error) {
                logSupabaseError('signInWithPassword', error, { email });
                throw error;
            }

            AuditLogger.success('AUTH', 'Inicio de sesión con contraseña exitoso', {
                user: AuditLogger.sanitizeUser(data.user),
                email,
                method: 'signInWithPassword'
            });

            console.info('[Supabase Auth] signIn OK', { userId: data.user?.id });
        }
    } catch (err) {
        showAuthError(getAuthErrorMessage(err, appState.authMode === 'register' ? 'signUp' : 'signIn'));
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
    if (/email.*invalid|invalid email/i.test(msg)) return 'Introduce un correo electrónico válido.';

    return msg || 'Error de autenticación desconocido.';
}

async function initAuth() {
    console.info(`[NeonStream] Build ${APP_BUILD}`);
    console.info('[Supabase] Config activa →', {
        url: getSupabaseProjectUrl(),
        keyType: getSupabaseKeyType(),
        redirectTo: getAuthRedirectUrl(),
        origin: window.location.origin
    });

    appState.supabaseClient = initSupabaseClient();
    if (!appState.supabaseClient) {
        showLandingGate();
        finishAppBoot();
        return;
    }

    updatePasskeyUI();

    const configIssues = validateSupabaseConfig();
    if (configIssues.length) {
        showLandingGate();
        finishAppBoot();
        console.warn('[Supabase] Config inválida:', configIssues.join(' '));
        return;
    }

    appState.supabaseClient.auth.onAuthStateChange((event, session) => {
        console.info('[Supabase Auth] onAuthStateChange', { event, hasSession: Boolean(session) });

        AuditLogger.info('AUTH', `Evento Supabase Auth: ${event}`, AuditLogger.sanitizeObject({
            event,
            hasSession: Boolean(session),
            user: AuditLogger.sanitizeUser(session?.user)
        }));

        if (event === 'INITIAL_SESSION') {
            if (!appState.bootSessionResolved) {
                void resolveBootSession(session);
            }
            return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
            void onUserAuthenticated(session.user);
            return;
        }

        if (event === 'SIGNED_OUT') {
            if (appState.currentUser) onUserSignedOut();
        }
    });

    const { data: { session }, error } = await appState.supabaseClient.auth.getSession();
    if (error) {
        console.warn('[Supabase Auth] getSession:', error);
    }

    if (!appState.bootSessionResolved) {
        await resolveBootSession(session);
    }

    // Diagnóstico en consola únicamente — no bloquea el formulario de login
    testSupabaseConnection()
        .then((connection) => {
            console.info('[Supabase] Prueba de conexión:', connection);
            if (!connection.ok) {
                console.warn('[Supabase] Advertencia:', formatConnectionError(connection));
            }
        })
        .catch((err) => console.warn('[Supabase] Prueba de conexión falló:', err));
}

async function onUserAuthenticated(user, { fromInitialSession = false } = {}) {
    appState.currentUser = user;
    AuditLogger.success('AUTH', 'Usuario autenticado en la aplicación', {
        user: AuditLogger.sanitizeUser(user),
        fromInitialSession
    });

    cleanAuthCallbackFromUrl();
    hideLandingGate();
    hideAuthGate();

    if (!fromInitialSession) {
        elements.profileGate?.classList.remove('hidden');
        document.body.classList.add('profile-gate-active');
    }

    try {
        await loadUserProfiles();
    } catch (err) {
        console.error('Error cargando perfiles:', err);
        elements.profileGate?.classList.remove('hidden');
        document.body.classList.add('profile-gate-active');
        showProfileGridError('No se pudieron cargar tus perfiles. Intenta de nuevo.');
        if (fromInitialSession) finishAppBoot();
        return;
    }

    renderProfileSelectGrid();

    if (tryRestoreProfileSession({ reloadCatalog: true })) {
        if (fromInitialSession) finishAppBoot();
        return;
    }

    clearActiveProfile(user.id);
    if (appState.userProfiles.length === 0) {
        openProfileGate('manage');
    } else {
        openProfileGate('select');
    }

    if (fromInitialSession) finishAppBoot();
}

function onUserSignedOut() {
    AuditLogger.info('AUTH', 'Sesión cerrada', {
        userId: appState.currentUser?.id || null
    });

    clearActiveProfile(appState.currentUser?.id);
    appState.currentUser = null;
    appState.userProfiles = [];
    closeProfileEditor();
    closeProfileManage();
    closeDetailModal();
    clearInterval(appState.carouselInterval);
    clearInterval(appState.homeRefreshInterval);
    appState.carouselInterval = null;
    appState.homeRefreshInterval = null;
    stopNotificationsPolling();
    elements.profileGate?.classList.remove('fade-out');
    elements.profileGate?.classList.add('hidden');
    elements.trailerModal?.classList.add('hidden');
    if (elements.trailerVideoContainer) elements.trailerVideoContainer.innerHTML = '';
    elements.authForm?.reset();
    elements.landingEmailForm?.reset();
    hideAuthMessages();
    appState.authMode = 'login';
    updateAuthUI();
    showLandingGate();
}

async function handleSignOut() {
    const btn = elements.profileSignoutBtn;
    const originalText = btn?.textContent;

    if (btn) {
        btn.disabled = true;
        btn.textContent = 'Cerrando sesión...';
    }

    try {
        if (appState.supabaseClient) {
            const { error } = await appState.supabaseClient.auth.signOut();
            if (error) {
                logSupabaseError('signOut', error);
            }
        }
    } catch (err) {
        logSupabaseError('signOut', err);
    } finally {
        onUserSignedOut();
        if (btn) {
            btn.disabled = false;
            btn.textContent = originalText || 'Cerrar sesión';
        }
    }
}

export {
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
    handleSignOut,
    logSupabaseError
};
