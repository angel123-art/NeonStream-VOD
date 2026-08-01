/** NeonStream-VOD — helpers.js */
import {
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
    clearInterval(appState.carouselInterval);
    clearInterval(appState.homeRefreshInterval);
    elements.heroSection.classList.add('hidden');
    elements.catalogSection.classList.remove('has-hero-banner');
    elements.genreFilters.classList.add('hidden');
    if (elements.paginationContainer) elements.paginationContainer.classList.add('hidden');

    appState.currentView = 'search';
    updateNavActiveState('');
    elements.gridTitle.textContent = `Resultados para "${query}"`;
    elements.gridTitle.classList.remove('hidden');

    showView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchAndRenderGrid(`${TMDB_BASE_URL}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(query)}`, 'movie');
}

async function handleGenreFilter(button) {
    if (isKidsProfile() && button.dataset.kidsHide === 'true') {
        return;
    }

    resetGenreButtons();
    button.classList.add('active');

    const genreId = button.dataset.id;

    if (!genreId) {
        const base = `${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`;
        fetchAndRenderGrid(isKidsProfile() ? `${base}${getKidsMovieParams()}` : base, 'movie');
        return;
    }

    const genreParam = isKidsProfile()
        ? `${KIDS_MOVIE_CERT}&with_genres=${genreId}`
        : `&with_genres=${genreId}`;

    fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc${genreParam}`, 'movie');
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

export {
    handleSearch,
    handleGenreFilter,
    resetGenreButtons,
    showView,
    updateServerActiveState
};
