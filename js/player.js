/** NeonStream-VOD — player.js */
import { API_KEY, TMDB_BASE_URL } from './config.js';
import { elements, appState } from './state.js';
import { closeDetailModal, fetchTrailerKey } from './detail-modal.js';
import { showView, updateServerActiveState } from './helpers.js';
import { switchCategory, clearUrlParam } from './catalog.js';

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
        appState.loadedMedia[data.id] = data; // Cache
        
        openPlayer(data, false, presetSeason, presetEpisode);
    } catch(e) {
        clearUrlParam();
        switchCategory('home');
    }
}

async function openPlayer(media, updateUrl = true, presetSeason='1', presetEpisode='1') {
    closeDetailModal();
    appState.currentMediaId = media.id;
    appState.currentMediaType = media.custom_type || 'movie';

    // UI Top updates
    elements.playerTitle.textContent = media.title || media.name;
    elements.playerReleaseDate.textContent = (media.release_date || media.first_air_date || 'N/A').substring(0, 4);
    elements.playerRating.textContent = `⭐ ${media.vote_average ? media.vote_average.toFixed(1) : 'NR'}`;
    elements.playerOverview.textContent = media.overview || 'Sin descripción disponible para este título.';

    // Default to server 1
    updateServerActiveState(elements.serverOptions.querySelector('[data-server="1"]'));

    // Handle Layout
    if (appState.currentMediaType === 'tv') {
        elements.tvControls.classList.remove('hidden');
        await populateSeasons(media);
        
        elements.seasonSelect.value = presetSeason;
        await populateEpisodes(appState.currentMediaId, presetSeason);
        
        elements.episodeSelect.value = presetEpisode;
        
    } else {
        elements.tvControls.classList.add('hidden');
    }

    if (updateUrl) pushPlayerUrl(presetSeason, presetEpisode);
    
    // Inject automatically upon click to S1E1 (or preset for URL restore)
    loadVideoIframe(appState.currentMediaId, appState.currentMediaType, '1', presetSeason, presetEpisode);

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
        appState.loadedMedia[tvObject.id] = fullData; // Update cache deeply
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
    loadVideoIframe(appState.currentMediaId, appState.currentMediaType, serverId, sea, epi);
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
    url.searchParams.set('id', appState.currentMediaId);
    url.searchParams.set('type', appState.currentMediaType);
    if(appState.currentMediaType === 'tv') {
        url.searchParams.set('sea', s);
        url.searchParams.set('epi', e);
    } else {
        url.searchParams.delete('sea');
        url.searchParams.delete('epi');
    }
    window.history.pushState({}, '', url);
}

export {
    fetchMediaDetailsAndPlay,
    openPlayer,
    populateSeasons,
    populateEpisodes,
    triggerIframeUpdate,
    openTrailerModal,
    setupFullscreenControls,
    getFullscreenElement,
    loadVideoIframe
};
