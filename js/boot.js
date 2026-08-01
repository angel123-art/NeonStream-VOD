/** NeonStream-VOD — boot.js */
import { elements, appState } from './state.js';
import { showLandingGate } from './landing.js';
import { onUserAuthenticated } from './auth.js';
import { closeNotificationsPanel } from './notifications.js';

// ============================================
// App Boot — splash inicial anti-flicker
// ============================================
function startAppBoot() {
    document.documentElement.classList.add('app-booting');
    document.documentElement.classList.remove('app-ready');
    document.body.classList.remove('landing-gate-active', 'auth-gate-active', 'profile-gate-active');

    elements.landingGate?.classList.add('hidden');
    elements.authGate?.classList.add('hidden');
    elements.profileGate?.classList.add('hidden');
    elements.appBootLoader?.classList.remove('hidden', 'app-boot-loader--out');

    if (appState.appBootTimeoutId) clearTimeout(appState.appBootTimeoutId);
    appState.appBootTimeoutId = setTimeout(() => {
        if (!appState.appBootComplete) {
            console.warn('[Boot] Tiempo de espera agotado — mostrando landing.');
            showLandingGate();
            finishAppBoot();
        }
    }, 12000);
}

function finishAppBoot() {
    if (appState.appBootComplete) return;
    appState.appBootComplete = true;

    if (appState.appBootTimeoutId) {
        clearTimeout(appState.appBootTimeoutId);
        appState.appBootTimeoutId = null;
    }

    document.body.style.overflow = '';

    const loader = elements.appBootLoader;
    const reveal = () => {
        document.documentElement.classList.remove('app-booting');
        document.documentElement.classList.add('app-ready');
    };

    if (loader) {
        loader.classList.add('app-boot-loader--out');
        setTimeout(reveal, 280);
    } else {
        reveal();
    }
}

async function resolveBootSession(session) {
    if (appState.bootSessionResolved) return;
    appState.bootSessionResolved = true;

    if (session?.user) {
        await onUserAuthenticated(session.user, { fromInitialSession: true });
        return;
    }

    showLandingGate();
    finishAppBoot();
}

function setupSearchToggle() {
    if (!elements.searchToggle || !elements.searchWrapper) return;

    elements.searchToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        closeNotificationsPanel();
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

export { startAppBoot, finishAppBoot, resolveBootSession, setupSearchToggle };
