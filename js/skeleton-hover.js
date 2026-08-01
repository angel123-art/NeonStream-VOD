/** NeonStream-VOD — skeleton-hover.js */
import { CARD_HOVER_DELAY_MS } from './config.js';
import { elements, appState } from './state.js';
import { fetchTrailerKey } from './detail-modal.js';
import { buildYoutubeEmbedUrl } from './hero.js';

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
        if (!card || card === appState.cardHoverTarget) return;

        clearCardHoverTimer();
        appState.cardHoverTarget = card;
        appState.cardHoverTimer = setTimeout(() => activateCardTrailer(card), CARD_HOVER_DELAY_MS);
    });

    elements.dynamicCatalog.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.movie-card:not(.trending-card)');
        if (!card) return;
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;

        if (appState.cardHoverTarget === card) appState.cardHoverTarget = null;
        clearCardHoverTimer();
        deactivateCardTrailer(card);
    });
}

function clearCardHoverTimer() {
    if (appState.cardHoverTimer) {
        clearTimeout(appState.cardHoverTimer);
        appState.cardHoverTimer = null;
    }
}

async function getCachedTrailerKey(id, type) {
    const cacheKey = `${type}-${id}`;
    if (appState.trailerCache.has(cacheKey)) return appState.trailerCache.get(cacheKey);

    const key = await fetchTrailerKey(id, type);
    appState.trailerCache.set(cacheKey, key);
    return key;
}

async function activateCardTrailer(card) {
    if (!card.matches(':hover')) return;

    const id = card.dataset.id;
    const type = card.dataset.type || appState.loadedMedia[id]?.custom_type || 'movie';
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

function stopAllCardTrailers() {
    clearCardHoverTimer();
    appState.cardHoverTarget = null;
    document.querySelectorAll('.movie-card.playing-trailer').forEach(deactivateCardTrailer);
}

export {
    showSkeletonLoader,
    toggleSpinner,
    setupCardHoverTrailers,
    clearCardHoverTimer,
    stopAllCardTrailers
};
