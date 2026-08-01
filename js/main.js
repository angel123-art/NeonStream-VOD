/** NeonStream-VOD — main.js */
import { setupAuditLoggerUI, setupGlobalImageErrorLogging } from './audit-logger.js';
import { startAppBoot, setupSearchToggle } from './boot.js';
import { setupNotifications } from './notifications.js';
import { setupLandingGate } from './landing.js';
import { setupAuthGate, initAuth } from './auth.js';
import { setupProfileGate, setupProfilePersistence } from './profiles.js';
import { setupCardHoverTrailers } from './skeleton-hover.js';
import { setupHeroVolumeControl } from './hero.js';
import { setupNavbarScroll } from './my-list.js';
import { setupEventListeners } from './events.js';

document.addEventListener('DOMContentLoaded', async () => {
    setupAuditLoggerUI();
    setupGlobalImageErrorLogging();
    startAppBoot();
    setupEventListeners();
    setupNavbarScroll();
    setupSearchToggle();
    setupNotifications();
    setupLandingGate();
    setupAuthGate();
    setupProfileGate();
    setupProfilePersistence();
    setupCardHoverTrailers();
    setupHeroVolumeControl();
    await initAuth();
});
