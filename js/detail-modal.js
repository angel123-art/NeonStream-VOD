/** NeonStream-VOD — detail-modal.js */
import {
    API_KEY,
    TMDB_BASE_URL,
    HERO_IMAGE_BASE_URL
} from './config.js';
import { elements, appState } from './state.js';
import { openPlayer } from './player.js';
import { toggleMyList, updateListButtonStates } from './my-list.js';
import { stopAllCardTrailers } from './skeleton-hover.js';

// ============================================
// Detail Modal — Netflix Info Panel
// ============================================
function setupDetailModalListeners() {
    if (!elements.detailModal) return;

    elements.closeDetailBtn?.addEventListener('click', closeDetailModal);

    elements.detailPlayBtn?.addEventListener('click', () => {
        if (!appState.detailMedia) return;
        const media = { ...detailMedia };
        closeDetailModal();
        openPlayer(media);
    });

    elements.detailTrailerBtn?.addEventListener('click', () => {
        if (!appState.detailMedia) return;
        openTrailerModal(appState.detailMedia.id, appState.detailMedia.custom_type || 'movie');
    });

    elements.detailAddListBtn?.addEventListener('click', () => {
        if (!appState.detailMedia) return;
        toggleMyList(appState.detailMedia);
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
    appState.detailMedia = { ...media, custom_type: type };

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
        appState.loadedMedia[data.id] = data;
        appState.detailMedia = data;
        renderDetailModal(data);
    } catch (e) {
        renderDetailModal(appState.detailMedia);
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
    appState.detailMedia = null;
}

export {
    setupDetailModalListeners,
    fetchTrailerKey,
    openDetailModal,
    closeDetailModal
};
