export {};

declare global {
  namespace YT {
    interface PlayerOptions {
      videoId?: string;
      width?: string | number;
      height?: string | number;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: Player }) => void;
        onStateChange?: (event: { data: number; target: Player }) => void;
      };
    }

    class Player {
      constructor(elementId: string | HTMLElement, options: PlayerOptions);
      loadVideoById(videoId: string): void;
      playVideo(): void;
      stopVideo(): void;
      mute(): void;
      unMute(): void;
      setVolume(volume: number): void;
      destroy(): void;
    }
  }

  interface Window {
    YT?: typeof YT;
    onYouTubeIframeAPIReady?: () => void;
  }
}
