/** NeonStream-VOD — my-list.js */
import { MY_LIST_KEY } from './config.js';
import { elements, appState } from './state.js';

// ============================================
// Mi Lista — localStorage
// ============================================
function getMyList() {
    try {
        return JSON.parse(localStorage.getItem(MY_LIST_KEY)) || [];
    } catch {
        return [];
    }
}

function saveMyList(list) {
    localStorage.setItem(MY_LIST_KEY, JSON.stringify(list));
}

function isInMyList(id, type) {
    return getMyList().some(item => item.id === id && item.type === type);
}

function toggleMyList(media) {
    const type = media.custom_type || media.media_type || 'movie';
    const list = getMyList();
    const idx = list.findIndex(item => item.id === media.id && item.type === type);

    if (idx >= 0) {
        list.splice(idx, 1);
    } else {
        list.unshift({
            id: media.id,
            type,
            title: media.title || media.name,
            poster_path: media.poster_path,
            backdrop_path: media.backdrop_path,
            vote_average: media.vote_average,
            release_date: media.release_date || media.first_air_date
        });
    }

    saveMyList(list);
    return idx < 0;
}

function updateListButtonStates() {
    document.querySelectorAll('.card-action-btn.list-btn').forEach(btn => {
        const id = parseInt(btn.dataset.id, 10);
        const type = btn.dataset.type;
        btn.classList.toggle('in-list', isInMyList(id, type));
        btn.innerHTML = btn.classList.contains('in-list')
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>';
    });

    if (elements.detailAddListBtn && appState.detailMedia) {
        const inList = isInMyList(appState.detailMedia.id, appState.detailMedia.custom_type || 'movie');
        elements.detailAddListBtn.classList.toggle('in-list', inList);
    }
}

function setupNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    if (!navbar) return;

    const onScroll = () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
}

export {
    getMyList,
    isInMyList,
    toggleMyList,
    updateListButtonStates,
    setupNavbarScroll
};
