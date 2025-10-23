import { useEffect, useState } from 'react';

interface VideoPreloadStatus {
  isLoading: boolean;
  loaded: number;
  total: number;
  error: boolean;
  preloadedVideos: Set<string>;
}

// Global cache to track which videos have been preloaded
const globalPreloadedVideos = new Set<string>();

export function useVideoPreloader() {
  const [status, setStatus] = useState<VideoPreloadStatus>({
    isLoading: false,
    loaded: globalPreloadedVideos.size,
    total: 5,
    error: false,
    preloadedVideos: globalPreloadedVideos
  });

  useEffect(() => {
    const videoPaths = [
      '/mavi takım video tur.mp4',
      '/kırmızı takım video tur.mp4',
      '/siyah kelime seçme.mp4',
      '/mavi takım normal kazanma.mp4',
      '/kırmızı takım normal kazanma.mp4'
    ];

    // Check if already preloaded
    if (globalPreloadedVideos.size >= videoPaths.length) {
      setStatus({
        isLoading: false,
        loaded: videoPaths.length,
        total: videoPaths.length,
        error: false,
        preloadedVideos: globalPreloadedVideos
      });
      return;
    }

    setStatus(prev => ({ ...prev, isLoading: true }));

    const preloadVideo = (src: string): Promise<void> => {
      return new Promise((resolve) => {
        // If already preloaded, resolve immediately
        if (globalPreloadedVideos.has(src)) {
          resolve();
          return;
        }

        // Create a hidden video element to preload
        const video = document.createElement('video');
        video.src = src;
        video.preload = 'auto';
        video.muted = true;
        video.style.position = 'fixed';
        video.style.top = '-9999px';
        video.style.left = '-9999px';
        video.style.width = '1px';
        video.style.height = '1px';
        
        const handleLoad = () => {
          globalPreloadedVideos.add(src);
          setStatus(prev => ({ 
            ...prev, 
            loaded: prev.loaded + 1,
            preloadedVideos: globalPreloadedVideos
          }));
          cleanup();
          resolve();
        };
        
        const handleError = () => {
          console.warn('Video preload warning (will retry on play):', src);
          // Still mark as "loaded" to not block the app
          globalPreloadedVideos.add(src); 
          setStatus(prev => ({ 
            ...prev, 
            loaded: prev.loaded + 1,
            error: true,
            preloadedVideos: globalPreloadedVideos
          }));
          cleanup();
          resolve();
        };

        const cleanup = () => {
          video.removeEventListener('canplaythrough', handleLoad);
          video.removeEventListener('error', handleError);
          if (video.parentNode) {
            video.parentNode.removeChild(video);
          }
        };

        video.addEventListener('canplaythrough', handleLoad);
        video.addEventListener('error', handleError);
        
        // Add to DOM to trigger loading
        document.body.appendChild(video);
        
        // Force load
        video.load();
        
        // Timeout fallback
        setTimeout(() => {
          if (!globalPreloadedVideos.has(src)) {
            handleError();
          }
        }, 5000);
      });
    };

    // Preload all videos sequentially for better reliability
    const preloadAll = async () => {
      for (const path of videoPaths) {
        await preloadVideo(path);
      }
      setStatus(prev => ({ ...prev, isLoading: false }));
    };

    preloadAll();
  }, []);

  return status;
}