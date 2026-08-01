import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

let youtubeReadyPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (youtubeReadyPromise) return youtubeReadyPromise;

  youtubeReadyPromise = new Promise((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  });

  return youtubeReadyPromise;
}

export function useYouTubePlayer(containerRef: RefObject<HTMLDivElement | null>) {
  const playerRef = useRef<YT.Player | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const currentKeyRef = useRef<string | null>(null);

  const destroyPlayer = useCallback(() => {
    playerRef.current?.destroy();
    playerRef.current = null;
    setIsReady(false);
  }, []);

  const loadVideo = useCallback(
    async (videoKey: string | null) => {
      if (!containerRef.current) return;

      if (!videoKey) {
        currentKeyRef.current = null;
        playerRef.current?.stopVideo();
        setIsReady(false);
        return;
      }

      await loadYouTubeApi();
      if (!containerRef.current) return;

      currentKeyRef.current = videoKey;
      setIsMuted(true);

      if (playerRef.current) {
        playerRef.current.loadVideoById(videoKey);
        playerRef.current.mute();
        setIsReady(true);
        return;
      }

      playerRef.current = new window.YT!.Player(containerRef.current, {
        videoId: videoKey,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          loop: 1,
          playlist: videoKey,
          enablejsapi: 1,
        },
        events: {
          onReady: (event: { target: YT.Player }) => {
            event.target.mute();
            event.target.playVideo();
            setIsReady(true);
          },
        },
      });
    },
    [containerRef],
  );

  const toggleMute = useCallback(() => {
    const player = playerRef.current;
    if (!player) return;

    if (isMuted) {
      player.unMute();
      player.setVolume(100);
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  }, [isMuted]);

  useEffect(() => () => destroyPlayer(), [destroyPlayer]);

  return { loadVideo, toggleMute, isMuted, isReady, destroyPlayer };
}
