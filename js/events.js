/** NeonStream-VOD — events.js */
import { elements, appState } from './state.js';
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
            loadVideoIframe(appState.currentMediaId, appState.currentMediaType, serverId, sea, epi);
        });
    }

    // TV Season / Episode Changes
    elements.seasonSelect.addEventListener('change', async (e) => {
        const seasonNum = e.target.value;
        await populateEpisodes(appState.currentMediaId, seasonNum);
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
        
        if (Object.keys(appState.loadedMedia).length === 0) {
            switchCategory('home');
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
    });

    // Hero Play Button Direct Binding
    const heroPlayBtn = document.getElementById('hero-play-btn');
    if (heroPlayBtn) {
        heroPlayBtn.addEventListener('click', (e) => {
            const media = appState.loadedMedia[e.currentTarget.dataset.id];
            if (media) openPlayer(media);
        });
    }

    // Hero Info Button — opens detail modal (Netflix "More Info")
    const heroInfoBtn = document.getElementById('hero-info-btn');
    if (heroInfoBtn) {
        heroInfoBtn.addEventListener('click', (e) => {
            const media = appState.loadedMedia[e.currentTarget.dataset.id];
            if (media) openDetailModal(media);
        });
    }

    setupDetailModalListeners();

    // Details Trailer Button
    const detailsTrailerBtn = document.getElementById('details-trailer-btn');
    if (detailsTrailerBtn) {
        detailsTrailerBtn.addEventListener('click', () => {
            if (appState.currentMediaId && appState.currentMediaType) {
                openTrailerModal(appState.currentMediaId, appState.currentMediaType);
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
            const media = appState.loadedMedia[playBtn.dataset.id];
            if (media) openPlayer(media);
            return;
        }

        const listBtn = e.target.closest('.card-action-btn.list-btn');
        if (listBtn) {
            e.stopPropagation();
            const media = appState.loadedMedia[listBtn.dataset.id];
            if (media) {
                toggleMyList(media);
                updateListButtonStates();
            }
            return;
        }

        const infoBtn = e.target.closest('.card-action-btn.info-btn');
        if (infoBtn) {
            e.stopPropagation();
            const media = appState.loadedMedia[infoBtn.dataset.id];
            if (media) openDetailModal(media);
            return;
        }

        const clickable = e.target.closest('.movie-card, .top10-item');
        if (clickable) {
            const mediaId = clickable.dataset.id;
            const media = appState.loadedMedia[mediaId];
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

export { setupEventListeners };
