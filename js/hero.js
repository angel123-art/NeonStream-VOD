/** NeonStream-VOD — hero.js */
import { elements, appState } from './state.js';

// ============================================
// Hero YouTube Player + Volume
// ============================================
function loadYouTubeAPI() {
    if (appState.youtubeApiReady) return appState.youtubeApiReady;

    appState.youtubeApiReady = new Promise((resolve) => {
        if (window.YT?.Player) {
            resolve();
            return;
        }
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            prev?.();
            resolve();
        };
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.head.appendChild(tag);
    });

    return appState.youtubeApiReady;
}

function buildYoutubeEmbedUrl(key, { mute = true, controls = false } = {}) {
    const params = new URLSearchParams({
        autoplay: '1',
        mute: mute ? '1' : '0',
        controls: controls ? '1' : '0',
        rel: '0',
        showinfo: '0',
        modestbranding: '1',
        playsinline: '1',
        enablejsapi: '1',
        loop: '1',
        playlist: key
    });
    return `https://www.youtube.com/embed/${key}?${params}`;
}

function setupHeroVolumeControl() {
    elements.heroVolumeBtn?.addEventListener('click', toggleHeroVolume);
    updateHeroVolumeUI();
}

function updateHeroVolumeUI() {
    if (!elements.heroVolumeBtn) return;
    elements.heroVolumeBtn.querySelector('.icon-muted')?.classList.toggle('hidden', !appState.heroMuted);
    elements.heroVolumeBtn.querySelector('.icon-unmuted')?.classList.toggle('hidden', appState.heroMuted);
    elements.heroVolumeBtn.setAttribute('aria-label', appState.heroMuted ? 'Activar sonido' : 'Silenciar');
    elements.heroVolumeBtn.setAttribute('aria-pressed', String(!appState.heroMuted));
}

function toggleHeroVolume() {
    if (!appState.heroYtPlayer) return;

    if (appState.heroMuted) {
        appState.heroYtPlayer.unMute();
        appState.heroYtPlayer.setVolume(100);
        appState.heroMuted = false;
    } else {
        appState.heroYtPlayer.mute();
        appState.heroMuted = true;
    }
    updateHeroVolumeUI();
}

async function initHeroYoutubePlayer(videoKey) {
    if (!elements.heroVideoPlayer || !videoKey) return;

    await loadYouTubeAPI();
    appState.heroCurrentVideoKey = videoKey;
    appState.heroMuted = true;
    updateHeroVolumeUI();

    if (appState.heroYtPlayer) {
        appState.heroYtPlayer.loadVideoById(videoKey);
        appState.heroYtPlayer.mute();
        appState.heroMuted = true;
        updateHeroVolumeUI();
        elements.heroVideoWrap.style.display = '';
        elements.heroVideoPlayer.classList.add('loaded');
        return;
    }

    appState.heroYtPlayer = new YT.Player('hero-video-player', {
        videoId: videoKey,
        width: '100%',
        height: '100%',
        playerVars: {
            autoplay: 1,
            mute: 1,
            controls: 0,
            rel: 0,
            showinfo: 0,
            modestbranding: 1,
            playsinline: 1,
            loop: 1,
            playlist: videoKey,
            enablejsapi: 1
        },
        events: {
            onReady: (event) => {
                event.target.mute();
                event.target.playVideo();
                elements.heroVideoWrap.style.display = '';
                elements.heroVideoPlayer.classList.add('loaded');
            }
        }
    });
}

export {
    buildYoutubeEmbedUrl,
    setupHeroVolumeControl,
    initHeroYoutubePlayer
};
