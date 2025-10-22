import { useEffect, useState } from 'react';

interface VideoPreloadStatus {
  isLoading: boolean;
  loaded: number;
  total: number;
  error: boolean;
}

export function useVideoPreloader() {
  const [status, setStatus] = useState<VideoPreloadStatus>({
    isLoading: true,
    loaded: 0,
    total: 0,
    error: false
  });

  useEffect(() => {
    const videoPaths = [
      '/mavi takım video tur.mp4',
      '/kırmızı takım video tur.mp4',
      '/siyah kelime seçme.mp4',
      '/mavi takım normal kazanma.mp4',
      '/kırmızı takım normal kazanma.mp4'
    ];

    setStatus(prev => ({ ...prev, total: videoPaths.length }));

    const preloadVideo = (src: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.src = src;
        video.preload = 'auto';
        video.muted = true;
        
        // Create a hidden video element
        video.style.position = 'absolute';
        video.style.visibility = 'hidden';
        video.style.width = '1px';
        video.style.height = '1px';
        
        const handleCanPlay = () => {
          cleanup();
          setStatus(prev => ({ ...prev, loaded: prev.loaded + 1 }));
          resolve();
        };
        
        const handleError = () => {
          console.error('Video preload failed:', src);
          cleanup();
          setStatus(prev => ({ ...prev, loaded: prev.loaded + 1, error: true }));
          resolve(); // Continue even on error
        };

        const cleanup = () => {
          video.removeEventListener('canplaythrough', handleCanPlay);
          video.removeEventListener('error', handleError);
          // Clean up the video element
          video.src = '';
          video.load();
        };

        video.addEventListener('canplaythrough', handleCanPlay);
        video.addEventListener('error', handleError);
        
        // Start loading
        video.load();
        
        // Timeout after 10 seconds
        setTimeout(() => {
          cleanup();
          resolve();
        }, 10000);
      });
    };

    const preloadAll = async () => {
      try {
        // Preload videos in parallel but limit to 2 at a time to prevent overload
        for (let i = 0; i < videoPaths.length; i += 2) {
          const batch = videoPaths.slice(i, i + 2);
          await Promise.all(batch.map(preloadVideo));
        }
        
        setStatus(prev => ({ ...prev, isLoading: false }));
      } catch (error) {
        console.error('Video preloading error:', error);
        setStatus(prev => ({ ...prev, isLoading: false, error: true }));
      }
    };

    preloadAll();
  }, []);

  return status;
}