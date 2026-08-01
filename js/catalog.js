/** NeonStream-VOD — catalog.js */
import {
    API_KEY,
    TMDB_BASE_URL,
    KIDS_MOVIE_CERT,
    KIDS_TV_CERT,
    HOME_REFRESH_MS,
    IMAGE_BASE_URL,
    BACKDROP_BASE_URL,
    HERO_IMAGE_BASE_URL,
    LOGO_BASE_URL
} from './config.js';
import { elements, appState } from './state.js';
import { AuditLogger } from './audit-logger.js';
import {
    isKidsProfile,
    getKidsMovieParams,
    getKidsTvParams
} from './profiles.js';
import { getMyList, isInMyList, updateListButtonStates } from './my-list.js';
import {
    showSkeletonLoader,
    toggleSpinner,
    stopAllCardTrailers
} from './skeleton-hover.js';
import { closeDetailModal } from './detail-modal.js';
import { fetchTrailerKey } from './detail-modal.js';
import { initHeroYoutubePlayer } from './hero.js';
import { fetchMediaDetailsAndPlay } from './player.js';
import { showView, resetGenreButtons } from './helpers.js';

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
    appState.currentView = view;
    updateNavActiveState(view);
    clearUrlParam();
    clearInterval(appState.carouselInterval);
    clearInterval(appState.homeRefreshInterval);
    
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
            if (isKidsProfile()) {
                fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc${getKidsMovieParams()}`, 'movie');
            } else {
                fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`, 'movie');
            }
            break;
        case 'series':
            elements.gridTitle.textContent = 'Series';
            elements.gridTitle.classList.remove('hidden');
            if (isKidsProfile()) {
                fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc${getKidsTvParams()}`, 'tv');
            } else {
                fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`, 'tv');
            }
            break;
        case 'new':
            elements.gridTitle.textContent = 'Novedades';
            elements.gridTitle.classList.remove('hidden');
            if (isKidsProfile()) {
                fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=release_date.desc&primary_release_date.lte=2026-12-31${KIDS_MOVIE_CERT}&with_genres=10751,16`, 'movie');
            } else {
                fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=release_date.desc&primary_release_date.lte=2026-12-31`, 'movie');
            }
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

    mediaItems.forEach(item => { appState.loadedMedia[item.id] = item; });

    let html = '<div class="dynamic-grid">';
    mediaItems.forEach(item => { html += createCardHTML(item); });
    html += '</div>';

    elements.dynamicCatalog.innerHTML = html;
    updateListButtonStates();
}

async function loadHomeRows(silent = false) {
    if (isKidsProfile()) {
        return loadKidsRows(silent);
    }
    return loadAdultRows(silent);
}

async function loadAdultRows(silent = false) {
    if (!silent) toggleSpinner(true);
    if (!silent) appState.loadedMedia = {};

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

async function loadKidsRows(silent = false) {
    if (!silent) toggleSpinner(true);
    if (!silent) appState.loadedMedia = {};

    try {
        const [familyMovies, kidsTv, animatedMovies, animatedTv, fantasyMovies, fantasyTv, newKidsMovies] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&with_genres=10751&sort_by=popularity.desc${KIDS_MOVIE_CERT}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&with_genres=10751&sort_by=popularity.desc${KIDS_TV_CERT}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&with_genres=16&sort_by=popularity.desc${KIDS_MOVIE_CERT}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&with_genres=16&sort_by=popularity.desc${KIDS_TV_CERT}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&with_genres=14&sort_by=popularity.desc${KIDS_MOVIE_CERT}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&with_genres=14&sort_by=popularity.desc${KIDS_TV_CERT}`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=release_date.desc&primary_release_date.lte=2026-12-31${KIDS_MOVIE_CERT}&with_genres=10751,16`).then(r => r.json())
        ]);

        const heroPool = (familyMovies.results || []).filter(i => i.backdrop_path || i.poster_path);

        if (!silent && heroPool.length > 0) {
            initHeroCarousel(overrideMediaType(heroPool.slice(0, 5), 'movie'));
        } else if (!silent) {
            elements.heroSection.classList.add('hidden');
        }

        let combinedHtml = '';
        combinedHtml += generateRowHTML('Películas familiares', overrideMediaType((familyMovies.results || []).slice(0, 18), 'movie'));
        combinedHtml += generateRowHTML('Series de TV infantiles', overrideMediaType((kidsTv.results || []).slice(0, 18), 'tv'));
        combinedHtml += generateRowHTML('Títulos animados',
            [...(animatedMovies.results || []), ...(animatedTv.results || [])].slice(0, 18)
        );
        combinedHtml += generateRowHTML('Magia y Fantasía',
            [...(fantasyMovies.results || []), ...(fantasyTv.results || [])].slice(0, 18)
        );
        combinedHtml += generateRowHTML('Novedades para toda la familia', overrideMediaType(
            (newKidsMovies.results || []).filter(m => m.poster_path).slice(0, 18),
            'movie'
        ));

        elements.dynamicCatalog.innerHTML = combinedHtml;
        updateListButtonStates();

        if (!silent) startHomeAutoRefresh();
    } catch (e) {
        console.error('Error loading kids home:', e);
        if (!silent) {
            elements.dynamicCatalog.innerHTML = '<p style="color:red; text-align:center;">Error cargando contenido infantil.</p>';
        }
    }
}

function startHomeAutoRefresh() {
    clearInterval(appState.homeRefreshInterval);
    appState.homeRefreshInterval = setInterval(() => {
        if (appState.currentView === 'home' && elements.catalogSection.classList.contains('active-view')) {
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
        AuditLogger.error('TMDB', 'Error al renderizar grid del catálogo', AuditLogger.sanitizeObject({
            message: e?.message,
            url: AuditLogger.sanitizeTmdbUrl(finalUrl)
        }));
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
function initHeroCarousel(items) {
    appState.currentHeroItems = items;
    appState.currentHeroIdx = 0;
    renderHeroContent(appState.currentHeroItems[0]);

    clearInterval(appState.carouselInterval);
    appState.carouselInterval = setInterval(() => {
        appState.currentHeroIdx = (appState.currentHeroIdx + 1) % appState.currentHeroItems.length;

        elements.heroSection.classList.add('fade');
        setTimeout(() => {
            renderHeroContent(appState.currentHeroItems[appState.currentHeroIdx]);
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

    appState.loadedMedia[item.id] = { ...item, custom_type: type };

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
        if (appState.heroYtPlayer?.stopVideo) appState.heroYtPlayer.stopVideo();
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

    appState.loadedMedia[item.id] = item;
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

    appState.loadedMedia[item.id] = item;
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

    appState.loadedMedia[item.id] = item;

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

export {
    clearUrlParam,
    checkUrlState,
    updateNavActiveState,
    switchCategory,
    fetchAndRenderGrid
};
