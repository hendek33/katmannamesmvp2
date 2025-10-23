import { useEffect, useState, useRef } from 'react';

interface VideoPreloadStatus {
  isLoading: boolean;
  loaded: number;
  total: number;
  error: boolean;
  videoBlobUrls: Map<string, string>;
}

// Global cache for blob URLs to persist across component remounts
const globalVideoBlobCache = new Map<string, string>();
let isPreloading = false;

export function useVideoPreloader() {
  const [status, setStatus] = useState<VideoPreloadStatus>({
    isLoading: !globalVideoBlobCache.size, // Not loading if already cached
    loaded: globalVideoBlobCache.size,
    total: 5,
    error: false,
    videoBlobUrls: globalVideoBlobCache
  });
  
  const mountedRef = useRef(true);

  useEffect(() => {
    // If videos already preloaded, skip
    if (globalVideoBlobCache.size >= 5 || isPreloading) {
      setStatus({
        isLoading: false,
        loaded: globalVideoBlobCache.size,
        total: 5,
        error: false,
        videoBlobUrls: globalVideoBlobCache
      });
      return;
    }

    isPreloading = true;
    
    const videoPaths = [
      '/mavi takım video tur.mp4',
      '/kırmızı takım video tur.mp4',
      '/siyah kelime seçme.mp4',
      '/mavi takım normal kazanma.mp4',
      '/kırmızı takım normal kazanma.mp4'
    ];

    setStatus(prev => ({ ...prev, total: videoPaths.length, isLoading: true }));

    const preloadVideo = async (src: string): Promise<void> => {
      try {
        // Check if already cached
        if (globalVideoBlobCache.has(src)) {
          setStatus(prev => ({ ...prev, loaded: prev.loaded + 1 }));
          return;
        }

        // Fetch video as blob
        const response = await fetch(src);
        if (!response.ok) throw new Error(`Failed to fetch ${src}`);
        
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        // Test that video can actually play
        const video = document.createElement('video');
        video.src = blobUrl;
        video.muted = true;
        
        await new Promise((resolve, reject) => {
          const handleCanPlay = () => {
            // Store in global cache
            globalVideoBlobCache.set(src, blobUrl);
            video.removeEventListener('canplaythrough', handleCanPlay);
            video.removeEventListener('error', handleError);
            resolve(undefined);
          };
          
          const handleError = () => {
            URL.revokeObjectURL(blobUrl);
            video.removeEventListener('canplaythrough', handleCanPlay);
            video.removeEventListener('error', handleError);
            reject(new Error(`Video cannot play: ${src}`));
          };
          
          video.addEventListener('canplaythrough', handleCanPlay);
          video.addEventListener('error', handleError);
          video.load();
          
          // Timeout after 15 seconds
          setTimeout(() => {
            handleError();
          }, 15000);
        });
        
        if (mountedRef.current) {
          setStatus(prev => ({ 
            ...prev, 
            loaded: prev.loaded + 1,
            videoBlobUrls: globalVideoBlobCache
          }));
        }
        
      } catch (error) {
        console.error('Video preload failed:', src, error);
        if (mountedRef.current) {
          setStatus(prev => ({ 
            ...prev, 
            loaded: prev.loaded + 1, 
            error: true 
          }));
        }
      }
    };

    const preloadAll = async () => {
      try {
        // Load first 2 videos with high priority
        const priorityVideos = videoPaths.slice(0, 2);
        await Promise.all(priorityVideos.map(preloadVideo));
        
        // Then load the rest
        const remainingVideos = videoPaths.slice(2);
        await Promise.all(remainingVideos.map(preloadVideo));
        
        if (mountedRef.current) {
          setStatus(prev => ({ 
            ...prev, 
            isLoading: false,
            videoBlobUrls: globalVideoBlobCache
          }));
        }
      } catch (error) {
        console.error('Video preloading error:', error);
        if (mountedRef.current) {
          setStatus(prev => ({ 
            ...prev, 
            isLoading: false, 
            error: true 
          }));
        }
      } finally {
        isPreloading = false;
      }
    };

    preloadAll();
    
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return status;
}