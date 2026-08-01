/** NeonStream-VOD — notifications.js */
import {
    API_KEY,
    TMDB_BASE_URL,
    NOTIFICATIONS_MAX,
    NOTIFICATIONS_POLL_MS,
    NOTIFICATION_IMAGE_BASE_URL,
    NOTIFICATION_FALLBACK_IMAGE
} from './config.js';
import { NOTIFICATION_TEMPLATES, NOTIFICATION_SHOW_NAMES } from './data-presets.js';
import { elements, appState } from './state.js';
import { AuditLogger } from './audit-logger.js';
import { escapeHtml } from './profiles.js';
import { openDetailModal } from './detail-modal.js';

// ============================================
// Notifications — panel, badge y polling
// ============================================
function setupNotifications() {
    if (appState.notificationsInitialized) return;
    appState.notificationsInitialized = true;

    elements.notificationsBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotificationsPanel();
    });

    elements.notificationsList?.addEventListener('click', (e) => {
        const item = e.target.closest('.notifications-item[data-notification-id]');
        if (!item) return;
        handleNotificationClick(item.dataset.notificationId);
    });

    document.addEventListener('click', (e) => {
        if (!appState.notificationsPanelOpen) return;
        if (!elements.notificationsWrapper?.contains(e.target)) {
            closeNotificationsPanel();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeNotificationsPanel();
    });

    elements.notificationsList?.addEventListener('error', (e) => {
        handleNotificationThumbError(e.target);
    }, true);
}

function buildTmdbImageUrl(filePath, baseUrl = NOTIFICATION_IMAGE_BASE_URL) {
    if (!filePath || typeof filePath !== 'string') return null;
    const trimmed = filePath.trim();
    if (!trimmed || trimmed === 'null') return null;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseUrl}${path}`;
}

function getNotificationImagePath(item) {
    return item?.poster_path || item?.backdrop_path || item?.thumbnail || null;
}

function getNotificationThumbnailUrl(pathOrUrl) {
    return buildTmdbImageUrl(pathOrUrl) || NOTIFICATION_FALLBACK_IMAGE;
}

function handleNotificationThumbError(img) {
    if (!img?.classList?.contains('notifications-thumb')) return;

    AuditLogger.logImageFailure(img, 'notification-thumb');

    img.onerror = null;
    img.src = NOTIFICATION_FALLBACK_IMAGE;
    img.classList.add('notifications-thumb--fallback');

    const wrap = img.closest('.notifications-thumb-wrap');
    if (wrap) {
        wrap.classList.add('notifications-thumb-wrap--fallback');
        wrap.style.backgroundImage = `url('${NOTIFICATION_FALLBACK_IMAGE}')`;
    }
}

window.handleNotificationThumbError = handleNotificationThumbError;

async function fetchNotificationMediaImagePath(mediaId, mediaType) {
    const cached = appState.loadedMedia[mediaId];
    if (cached?.poster_path || cached?.backdrop_path) {
        return cached.poster_path || cached.backdrop_path;
    }

    try {
        const response = await fetch(
            `${TMDB_BASE_URL}/${mediaType}/${mediaId}?api_key=${API_KEY}&language=es-MX`
        );
        if (!response.ok) return null;

        const data = await response.json();
        data.custom_type = mediaType;
        appState.loadedMedia[data.id] = data;
        return data.poster_path || data.backdrop_path || null;
    } catch {
        return null;
    }
}

async function enrichNotificationItem(item) {
    const existingPath = getNotificationImagePath(item);
    if (existingPath && buildTmdbImageUrl(existingPath)) {
        return { ...item, thumbnail: existingPath };
    }

    if (item.mediaId && item.mediaType) {
        const fetchedPath = await fetchNotificationMediaImagePath(item.mediaId, item.mediaType);
        if (fetchedPath) {
            return {
                ...item,
                poster_path: fetchedPath,
                thumbnail: fetchedPath
            };
        }
    }

    return item;
}

async function enrichNotificationsThumbnails(list) {
    return Promise.all(list.map((item) => enrichNotificationItem(item)));
}

function buildNotificationThumbHtml(item) {
    const imagePath = getNotificationImagePath(item);
    const thumbUrl = getNotificationThumbnailUrl(imagePath);

    return `
            <span class="notifications-thumb-wrap" style="background-image:url('${thumbUrl}')" aria-hidden="true">
                <img
                    class="notifications-thumb"
                    src="${thumbUrl}"
                    alt=""
                    width="64"
                    height="36"
                    loading="eager"
                    decoding="async"
                    referrerpolicy="no-referrer"
                    onerror="handleNotificationThumbError(this)"
                >
            </span>`;
}

function createSeedNotifications() {
    const now = Date.now();
    return [
        {
            id: 'seed-1',
            title: 'Bienvenido de nuevo',
            description: 'Descubre las novedades que llegaron esta semana a Netflix.',
            thumbnail: '/9EnAD2saKzhaK0JrPfe2SRTKe5.jpg',
            createdAt: now - 12 * 60 * 1000,
            read: false
        },
        {
            id: 'seed-2',
            title: 'Nueva temporada disponible',
            description: 'Stranger Things tiene episodios nuevos listos para ver.',
            thumbnail: '/56v2S6BLGUjJIRX2R8ZfcmcZiSy.jpg',
            createdAt: now - 45 * 60 * 1000,
            read: false,
            mediaId: 66732,
            mediaType: 'tv'
        },
        {
            id: 'seed-3',
            title: 'Continúa viendo',
            description: 'Retoma The Witcher donde lo dejaste.',
            thumbnail: '/7Y91Y9MXe1a8mULVl2uH7xAOH2.jpg',
            createdAt: now - 2 * 60 * 60 * 1000,
            read: true,
            mediaId: 71912,
            mediaType: 'tv'
        }
    ];
}

function ensureNotificationsSeed() {
    if (appState.notificationsSeedLoaded) return;
    appState.notifications = createSeedNotifications();
    appState.notificationsSeedLoaded = true;
    updateNotificationsBadge();
}

async function buildSimulatedNotification() {
    const template = NOTIFICATION_TEMPLATES[Math.floor(Math.random() * NOTIFICATION_TEMPLATES.length)];
    const name = NOTIFICATION_SHOW_NAMES[Math.floor(Math.random() * NOTIFICATION_SHOW_NAMES.length)];
    const fetchedPath = await fetchNotificationMediaImagePath(template.mediaId, template.mediaType);

    return {
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: template.title,
        description: template.description.replace('{name}', name),
        thumbnail: fetchedPath || template.backdrop,
        poster_path: fetchedPath || undefined,
        createdAt: Date.now(),
        read: false,
        mediaId: template.mediaId,
        mediaType: template.mediaType
    };
}

async function fetchNotifications({ allowNew = true } = {}) {
    if (!appState.currentUser || document.body.classList.contains('profile-gate-active')) {
        return;
    }

    ensureNotificationsSeed();

    await new Promise((resolve) => setTimeout(resolve, 120));

    if (allowNew && Math.random() < 0.4) {
        appState.notifications.unshift(await buildSimulatedNotification());
        appState.notifications = appState.notifications.slice(0, NOTIFICATIONS_MAX);
    }

    appState.notifications = await enrichNotificationsThumbnails(appState.notifications);

    renderNotificationsPanel();
    updateNotificationsBadge();
}

function formatNotificationTimeAgo(timestamp) {
    const diffMs = Date.now() - timestamp;
    const mins = Math.floor(diffMs / 60000);

    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ayer';
    return `Hace ${days} días`;
}

function getUnreadNotificationsCount() {
    return appState.notifications.filter((n) => !n.read).length;
}

function updateNotificationsBadge() {
    const badge = elements.notificationsBadge;
    if (!badge) return;

    const unread = getUnreadNotificationsCount();
    if (unread <= 0) {
        badge.classList.add('hidden');
        badge.textContent = '0';
        elements.notificationsBtn?.setAttribute('aria-label', 'Notificaciones');
        return;
    }

    badge.classList.remove('hidden');
    badge.textContent = unread > 9 ? '9+' : String(unread);
    elements.notificationsBtn?.setAttribute('aria-label', `Notificaciones, ${unread} sin leer`);
}

function renderNotificationsPanel() {
    const list = elements.notificationsList;
    const empty = elements.notificationsEmpty;
    if (!list || !empty) return;

    if (!appState.notifications.length) {
        list.innerHTML = '';
        empty.classList.remove('hidden');
        return;
    }

    empty.classList.add('hidden');
    list.innerHTML = appState.notifications.map((item) => `
        <button type="button" class="notifications-item${item.read ? '' : ' unread'}" data-notification-id="${escapeHtml(item.id)}" data-media-id="${item.mediaId || ''}" data-media-type="${item.mediaType || ''}">
            ${buildNotificationThumbHtml(item)}
            <div class="notifications-body">
                <p class="notifications-item-title">${escapeHtml(item.title)}</p>
                <p class="notifications-item-desc">${escapeHtml(item.description)}</p>
                <span class="notifications-item-time">${escapeHtml(formatNotificationTimeAgo(item.createdAt))}</span>
            </div>
        </button>
    `).join('');
}

function markAllNotificationsRead() {
    appState.notifications = appState.notifications.map((item) => ({ ...item, read: true }));
    updateNotificationsBadge();
    renderNotificationsPanel();
}

function openNotificationsPanel() {
    if (!elements.notificationsPanel || !elements.notificationsBtn) return;

    elements.searchWrapper?.classList.remove('open');
    markAllNotificationsRead();

    elements.notificationsPanel.classList.remove('hidden');
    elements.notificationsBtn.setAttribute('aria-expanded', 'true');
    appState.notificationsPanelOpen = true;
    renderNotificationsPanel();
}

function closeNotificationsPanel(updateBadge = true) {
    if (!elements.notificationsPanel || !elements.notificationsBtn) return;

    elements.notificationsPanel.classList.add('hidden');
    elements.notificationsBtn.setAttribute('aria-expanded', 'false');
    appState.notificationsPanelOpen = false;

    if (updateBadge) {
        updateNotificationsBadge();
    }
}

function toggleNotificationsPanel() {
    if (appState.notificationsPanelOpen) {
        closeNotificationsPanel();
    } else {
        openNotificationsPanel();
    }
}

async function handleNotificationClick(notificationId) {
    const item = appState.notifications.find((n) => n.id === notificationId);
    if (!item) return;

    item.read = true;
    updateNotificationsBadge();
    renderNotificationsPanel();
    closeNotificationsPanel();

    if (item.mediaId && item.mediaType) {
        try {
            const url = `${TMDB_BASE_URL}/${item.mediaType}/${item.mediaId}?api_key=${API_KEY}&language=es-MX`;
            const response = await fetch(url);
            if (!response.ok) return;
            const data = await response.json();
            data.custom_type = item.mediaType;
            appState.loadedMedia[data.id] = data;
            openDetailModal(data);
        } catch (err) {
            console.warn('[Notificaciones] No se pudo abrir el título:', err);
        }
    }
}

function startNotificationsPolling() {
    if (!appState.currentUser) return;

    ensureNotificationsSeed();

    void (async () => {
        appState.notifications = await enrichNotificationsThumbnails(appState.notifications);
        renderNotificationsPanel();
        updateNotificationsBadge();
    })();

    if (appState.notificationsPollInterval) return;

    void fetchNotifications({ allowNew: false });

    appState.notificationsPollInterval = setInterval(() => {
        void fetchNotifications({ allowNew: true });
    }, NOTIFICATIONS_POLL_MS);
}

function stopNotificationsPolling() {
    if (appState.notificationsPollInterval) {
        clearInterval(appState.notificationsPollInterval);
        appState.notificationsPollInterval = null;
    }
    closeNotificationsPanel();
    appState.notifications = [];
    appState.notificationsSeedLoaded = false;
    updateNotificationsBadge();
    if (elements.notificationsList) elements.notificationsList.innerHTML = '';
    elements.notificationsEmpty?.classList.add('hidden');
}

export {
    setupNotifications,
    buildTmdbImageUrl,
    closeNotificationsPanel,
    startNotificationsPolling,
    stopNotificationsPolling
};
