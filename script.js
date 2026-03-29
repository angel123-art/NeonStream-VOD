/**
 * NeonStream - Netflix UI Core
 * Features: URLs Persistence, Optimized Batched Rendering, Netflix Rows, Multiserver TV/Movie embeds
 */

// Configuration
const API_KEY = '42d673667b21f76c723454b10c6a9252';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const HERO_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

const elements = {
    catalogSection: document.getElementById('catalog-section'),
    playerSection: document.getElementById('player-section'),
    heroSection: document.getElementById('hero-section'),
    dynamicCatalog: document.getElementById('dynamic-catalog'), // Container for Rows or Grid
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    loadingSpinner: document.getElementById('loading-spinner'),
    gridTitle: document.getElementById('grid-title'),
    genreFilters: document.getElementById('genre-filters'),
    paginationContainer: document.getElementById('pagination-container'),
    mainNav: document.getElementById('main-nav'),
    logoHome: document.getElementById('logo-home'),
    serverOptions: document.getElementById('server-options'),
    
    // Trailer Modal elements
    trailerModal: document.getElementById('trailer-modal'),
    trailerVideoContainer: document.getElementById('trailer-video-container'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    
    // Player
    backBtn: document.getElementById('back-btn'),
    videoContainer: document.getElementById('video-container'),
    playerTitle: document.getElementById('player-title'),
    playerReleaseDate: document.getElementById('player-release-date'),
    playerRating: document.getElementById('player-rating'),
    playerOverview: document.getElementById('player-overview'),
    
    // TV Controls
    tvControls: document.getElementById('tv-controls'),
    seasonSelect: document.getElementById('season-select'),
    episodeSelect: document.getElementById('episode-select')
};

// State
let loadedMedia = {};
let currentMediaId = null;
let currentMediaType = 'movie'; // 'movie' or 'tv'
let currentView = 'home'; // Tracks active navigation tab
let carouselInterval = null;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkUrlState();
});

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

    elements.logoHome.addEventListener('click', () => switchCategory('home'));

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
            if (e.target.classList.contains('server-btn')) {
                updateServerActiveState(e.target);
                const serverId = e.target.dataset.server;
                const sea = elements.seasonSelect.value || '1';
                const epi = elements.episodeSelect.value || '1';
                loadVideoIframe(currentMediaId, currentMediaType, serverId, sea, epi);
            }
        });
    }

    // TV Season / Episode Changes
    elements.seasonSelect.addEventListener('change', async (e) => {
        const seasonNum = e.target.value;
        await populateEpisodes(currentMediaId, seasonNum);
        elements.episodeSelect.value = "1";
        triggerIframeUpdate();
    });

    elements.episodeSelect.addEventListener('change', () => {
        triggerIframeUpdate();
    });

    // Go Back
    elements.backBtn.addEventListener('click', () => {
        elements.videoContainer.innerHTML = ''; 
        clearUrlParam();
        showView('catalog');
        
        if (Object.keys(loadedMedia).length === 0) {
            switchCategory('home');
        }
        window.scrollTo({ top: 0, behavior: 'auto' });
    });

    // Hero Play Button Direct Binding
    const heroPlayBtn = document.getElementById('hero-play-btn');
    if (heroPlayBtn) {
        heroPlayBtn.addEventListener('click', (e) => {
            const media = loadedMedia[e.currentTarget.dataset.id];
            if (media) openPlayer(media);
        });
    }

    // Hero Trailer Button Direct Binding
    const heroTrailerBtn = document.getElementById('hero-trailer-btn');
    if (heroTrailerBtn) {
        heroTrailerBtn.addEventListener('click', (e) => {
            const media = loadedMedia[e.currentTarget.dataset.id];
            if (media) openTrailerModal(media.id, media.custom_type);
        });
    }

    // Details Trailer Button
    const detailsTrailerBtn = document.getElementById('details-trailer-btn');
    if (detailsTrailerBtn) {
        detailsTrailerBtn.addEventListener('click', () => {
            if (currentMediaId && currentMediaType) {
                openTrailerModal(currentMediaId, currentMediaType);
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
        // Handle Slider Arrows
        const sliderBtn = e.target.closest('.slider-btn');
        if (sliderBtn) {
            const rowWrapper = sliderBtn.closest('.row-wrapper');
            const row = rowWrapper.querySelector('.movie-row');
            // Move across 75% of browser viewport width dynamically
            const scrollAmount = window.innerWidth * 0.75; 
            
            if (sliderBtn.classList.contains('left')) {
                row.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            } else {
                row.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
            return;
        }

        // Handle Media Card Clicks
        const card = e.target.closest('.movie-card');
        if (card) {
            const mediaId = card.dataset.id;
            const media = loadedMedia[mediaId];
            if (media) {
                openPlayer(media);
            }
        }
    });

    window.addEventListener('popstate', () => {
        elements.videoContainer.innerHTML = '';
        checkUrlState();
    });
}

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
    currentView = view;
    updateNavActiveState(view);
    clearUrlParam();
    clearInterval(carouselInterval);
    
    elements.searchInput.value = '';
    elements.dynamicCatalog.innerHTML = '';
    if (elements.paginationContainer) elements.paginationContainer.classList.add('hidden');
    elements.heroSection.classList.add('hidden'); // Esconder Hero por defecto a menos en Inicio
    
    // Hide filters unless in 'movies' (since others have specific logic or rows)
    elements.genreFilters.classList.toggle('hidden', view !== 'movies');
    elements.gridTitle.classList.add('hidden');
    
    showView('catalog');
    
    switch(view) {
        case 'home':
            loadHomeRows();
            break;
        case 'movies':
            resetGenreButtons();
            elements.gridTitle.textContent = "Películas Populares";
            elements.gridTitle.classList.remove('hidden');
            fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`, 'movie');
            break;
        case 'series':
            elements.gridTitle.textContent = "Series Populares";
            elements.gridTitle.classList.remove('hidden');
            fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`, 'tv');
            break;
        case 'anime':
            elements.gridTitle.textContent = "Animes";
            elements.gridTitle.classList.remove('hidden');
            fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&with_genres=16&with_original_language=ja&sort_by=popularity.desc`, 'tv');
            break;
        case 'kdrama':
            elements.gridTitle.textContent = "K-Dramas Coreanos";
            elements.gridTitle.classList.remove('hidden');
            fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&with_origin_country=KR&sort_by=popularity.desc`, 'tv');
            break;
    }
}

// ============================================
// Layout Engines
// ============================================

// Netflix Netflix-style Horizontal Rows Logic
async function loadHomeRows() {
    toggleSpinner(true);
    loadedMedia = {};

    try {
        const [trending, animes, kdramas] = await Promise.all([
            fetch(`${TMDB_BASE_URL}/trending/all/week?api_key=${API_KEY}&language=es-MX`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&with_genres=16&with_original_language=ja&sort_by=popularity.desc`).then(r => r.json()),
            fetch(`${TMDB_BASE_URL}/discover/tv?api_key=${API_KEY}&language=es-MX&with_origin_country=KR&sort_by=popularity.desc`).then(r => r.json())
        ]);

        const trendingList = trending.results;
        let combinedHtml = '';

        if (trendingList.length > 0) {
            // Initiate Automatic Banner Carousel with top 5
            initHeroCarousel(trendingList.slice(0, 5));
        }

        combinedHtml += generateRowHTML('Tendencias Ahora', trendingList);
        combinedHtml += generateRowHTML('Animes Populares', overrideMediaType(animes.results, 'tv')); // Force type logic
        combinedHtml += generateRowHTML('Doramas Coreanos', overrideMediaType(kdramas.results, 'tv'));

        elements.dynamicCatalog.innerHTML = combinedHtml;
    } catch(e) {
        console.error("Error loading home:", e);
        elements.dynamicCatalog.innerHTML = '<p style="color:red; text-align:center;">Error cargando portada.</p>';
    } finally {
        toggleSpinner(false);
    }
}

// Grid fallback Logic
async function fetchAndRenderGrid(url, forcedMediaType, page = 1) {
    toggleSpinner(true);
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
        
        // Cargar paginador
        if(data.total_pages > 1) {
            renderPagination(data.page, data.total_pages, baseUrl, forcedMediaType);
        } else {
            if(elements.paginationContainer) elements.paginationContainer.classList.add('hidden');
        }

    } catch (e) {
        elements.dynamicCatalog.innerHTML = '<p style="color:red;">Error en catálogo.</p>';
        if(elements.paginationContainer) elements.paginationContainer.classList.add('hidden');
    } finally {
        toggleSpinner(false);
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
let currentHeroItems = [];
let currentHeroIdx = 0;

function initHeroCarousel(items) {
    currentHeroItems = items;
    currentHeroIdx = 0;
    renderHeroContent(currentHeroItems[0]);
    
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        currentHeroIdx = (currentHeroIdx + 1) % currentHeroItems.length;
        
        elements.heroSection.classList.add('fade');
        setTimeout(() => {
            renderHeroContent(currentHeroItems[currentHeroIdx]);
            elements.heroSection.classList.remove('fade');
        }, 500); // Wait half a second for CSS transition
    }, 7000); // 7 seconds
}

function renderHeroContent(item) {
    if (!item) return;
    const name = item.title || item.name;
    const overview = item.overview || 'Disfruta de la mejor calidad visual en NeonStream con los estrenos más aclamados.';
    const backdropUrl = item.backdrop_path ? `${HERO_IMAGE_BASE_URL}${item.backdrop_path}` : '';
    
    loadedMedia[item.id] = {...item, custom_type: item.media_type || 'movie'};
    
    elements.heroSection.style.backgroundImage = `url('${backdropUrl}')`;
    document.getElementById('hero-title').textContent = name;
    document.getElementById('hero-overview').textContent = overview;
    document.getElementById('hero-play-btn').dataset.id = item.id;
    document.getElementById('hero-trailer-btn').dataset.id = item.id;
    elements.heroSection.classList.remove('hidden');
}

function overrideMediaType(arr, type) {
    return arr.map(i => ({...i, custom_type: i.media_type || type}));
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
    
    // Track globally
    loadedMedia[item.id] = item;
    
    const name = item.title || item.name;
    const year = item.release_date ? item.release_date.substring(0,4) : (item.first_air_date ? item.first_air_date.substring(0,4) : 'N/A');
    const rating = item.vote_average ? item.vote_average.toFixed(1) : 'NR';
    
    return `
        <div class="movie-card" data-id="${item.id}">
            <div class="poster-container">
                <img src="${IMAGE_BASE_URL}${item.poster_path}" alt="${name}" loading="lazy">
                <div class="play-overlay"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>
            </div>
            <div class="movie-info">
                <h3 class="movie-title">${name}</h3>
                <div class="movie-meta"><span>${year}</span><span>⭐ ${rating}</span></div>
            </div>
        </div>
    `;
}

// ============================================
// TV Embed Player & TV Logistics
// ============================================
async function fetchMediaDetailsAndPlay(id, type, presetSeason='1', presetEpisode='1') {
    toggleSpinner(true);
    try {
        const url = `${TMDB_BASE_URL}/${type}/${id}?api_key=${API_KEY}&language=es-MX`;
        const r = await fetch(url);
        if(!r.ok) throw Error();
        const data = await r.json();
        
        data.custom_type = type;
        loadedMedia[data.id] = data; // Cache
        
        openPlayer(data, false, presetSeason, presetEpisode);
    } catch(e) {
        clearUrlParam();
        switchCategory('home');
    } finally {
        toggleSpinner(false);
    }
}

async function openPlayer(media, updateUrl = true, presetSeason='1', presetEpisode='1') {
    currentMediaId = media.id;
    currentMediaType = media.custom_type || 'movie';

    // UI Top updates
    elements.playerTitle.textContent = media.title || media.name;
    elements.playerReleaseDate.textContent = (media.release_date || media.first_air_date || 'N/A').substring(0, 4);
    elements.playerRating.textContent = `⭐ ${media.vote_average ? media.vote_average.toFixed(1) : 'NR'}`;
    elements.playerOverview.textContent = media.overview || 'Sin descripción disponible para este título.';

    // Default to server 1
    updateServerActiveState(elements.serverOptions.querySelector('[data-server="1"]'));

    // Handle Layout
    if (currentMediaType === 'tv') {
        elements.tvControls.classList.remove('hidden');
        await populateSeasons(media);
        
        elements.seasonSelect.value = presetSeason;
        await populateEpisodes(currentMediaId, presetSeason);
        
        elements.episodeSelect.value = presetEpisode;
        
    } else {
        elements.tvControls.classList.add('hidden');
    }

    if (updateUrl) pushPlayerUrl(presetSeason, presetEpisode);
    
    // Inject automatically upon click to S1E1 (or preset for URL restore)
    loadVideoIframe(currentMediaId, currentMediaType, '1', presetSeason, presetEpisode);

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
        loadedMedia[tvObject.id] = fullData; // Update cache deeply
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
    loadVideoIframe(currentMediaId, currentMediaType, serverId, sea, epi);
}

// Trailer Modal Loading Logic
async function openTrailerModal(id, type) {
    if(!id) return;
    elements.trailerVideoContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">Buscando tráiler...</p>';
    elements.trailerModal.classList.remove('hidden');

    try {
        // First try es-MX
        const urlMX = `${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=es-MX`;
        const resMX = await fetch(urlMX);
        const dataMX = await resMX.json();
        
        // Find Official Trailer on YouTube
        let trailer = dataMX.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        
        // If not found in spanish, fallback to en-US
        if (!trailer) {
            const urlUS = `${TMDB_BASE_URL}/${type}/${id}/videos?api_key=${API_KEY}&language=en-US`;
            const resUS = await fetch(urlUS);
            const dataUS = await resUS.json();
            trailer = dataUS.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        }

        // If still not found, show soft failure
        if (trailer) {
            // Mitigating Embedding Error (Param origin restricts unwanted domains, if domain matches Origin header, Youtube unblocks)
            const originStr = window.location.origin !== "null" ? window.location.origin : "https://neonstream.app"; 
            
            elements.trailerVideoContainer.innerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&origin=${encodeURIComponent(originStr)}" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
            
            // Inyectar Botón de Seguridad ("Alternative")
            const fallbackDiv = document.getElementById('trailer-fallback');
            if (fallbackDiv) {
                fallbackDiv.innerHTML = `<a href="https://www.youtube.com/watch?v=${trailer.key}" target="_blank" class="hero-btn secondary" style="text-decoration:none; padding: 0.5rem 1.5rem; border-radius: 30px; font-weight: 500; font-size: 0.95rem;">⚠ ¿Presentas error al cargar? Abrir Tráiler en YouTube</a>`;
                fallbackDiv.classList.remove('hidden');
            }

        } else {
            elements.trailerVideoContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">Tráiler no disponible por el momento</p>';
        }

    } catch(e) {
        console.error("Error fetching trailer:", e);
        elements.trailerVideoContainer.innerHTML = '<p style="color:var(--text-secondary); text-align:center;">Tráiler no disponible por el momento</p>';
    }
}

function loadVideoIframe(id, type, serverId, sNum, eNum) {
    if (!id) return;
    
    // Limpieza: Asegúrate de que al cambiar de servidor, el iframe se limpie antes de cargar el nuevo para evitar que se mezclen audios
    elements.videoContainer.innerHTML = '';
    
    let url = '';
    
    switch (serverId) {
        case '1':
            // Servidor 1: vidsrc.icu (Principal)
            if (type === 'tv') {
                url = `https://vidsrc.icu/embed/tv/${id}/${sNum}/${eNum}?lang=es`;
            } else {
                url = `https://vidsrc.icu/embed/movie/${id}?lang=es`;
            }
            break;
        case '2':
            // Servidor 2: player.autoembed.to
            if (type === 'tv') {
                url = `https://player.autoembed.to/tv/${id}/${sNum}/${eNum}?lang=es`;
            } else {
                url = `https://player.autoembed.to/movie/${id}?lang=es`;
            }
            break;
        case '3':
            // Servidor 3: embed.su
            if (type === 'tv') {
                url = `https://embed.su/embed/tv/${id}/${sNum}/${eNum}?lang=es`;
            } else {
                url = `https://embed.su/embed/movie/${id}?lang=es`;
            }
            break;
        default:
            if (type === 'tv') {
                url = `https://vidsrc.icu/embed/tv/${id}/${sNum}/${eNum}?lang=es`;
            } else {
                url = `https://vidsrc.icu/embed/movie/${id}?lang=es`;
            }
    }
    
    // Pequeño retardo para asegurar que el DOM eliminó el iframe anterior y cortó el audio
    setTimeout(() => {
        const iframeHtml = `<iframe id="reproductor-iframe" src="${url}" width="100%" height="100%" frameborder="0" scrolling="no" allowfullscreen></iframe>`;
        elements.videoContainer.innerHTML = iframeHtml;
    }, 50);
}

function pushPlayerUrl(s, e) {
    const url = new URL(window.location);
    url.searchParams.set('id', currentMediaId);
    url.searchParams.set('type', currentMediaType);
    if(currentMediaType === 'tv') {
        url.searchParams.set('sea', s);
        url.searchParams.set('epi', e);
    } else {
        url.searchParams.delete('sea');
        url.searchParams.delete('epi');
    }
    window.history.pushState({}, '', url);
}

// ============================================
// Miscellaneous Helpers
// ============================================
async function handleSearch() {
    const query = elements.searchInput.value.trim();
    if (!query) return;

    // Reset UI to standard Movie grid layout for mixed search
    currentView = 'search';
    updateNavActiveState(''); // No nav active
    elements.gridTitle.textContent = `Resultados para "${query}"`;
    elements.gridTitle.classList.remove('hidden');
    elements.genreFilters.classList.add('hidden');
    clearUrlParam();
    
    // TMDb Search Multi returns both movies and tvs.
    fetchAndRenderGrid(`${TMDB_BASE_URL}/search/multi?api_key=${API_KEY}&language=es-MX&query=${encodeURIComponent(query)}`, 'movie');
}

async function handleGenreFilter(button) {
    resetGenreButtons();
    button.classList.add('active');
    
    const genreId = button.dataset.id;
    if (!genreId) {
        fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&sort_by=popularity.desc`, 'movie');
        return;
    }
    fetchAndRenderGrid(`${TMDB_BASE_URL}/discover/movie?api_key=${API_KEY}&language=es-MX&with_genres=${genreId}&sort_by=popularity.desc`, 'movie');
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

function toggleSpinner(show) {
    elements.loadingSpinner.classList.toggle('hidden', !show);
}

function updateServerActiveState(targetBtn) {
    if(!elements.serverOptions || !targetBtn) return;
    elements.serverOptions.querySelectorAll('.server-btn').forEach(b => b.classList.remove('active'));
    targetBtn.classList.add('active');
}
