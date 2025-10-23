import { createContext, useContext } from 'react';
import { useVideoPreloader } from '@/hooks/useVideoPreloader';

interface VideoContextType {
  getVideoUrl: (originalPath: string) => string;
  isLoading: boolean;
  videosReady: boolean;
}

const VideoContext = createContext<VideoContextType | null>(null);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const videoStatus = useVideoPreloader();
  
  const getVideoUrl = (originalPath: string) => {
    // Try to get blob URL from cache, fallback to original
    return videoStatus.videoBlobUrls.get(originalPath) || originalPath;
  };
  
  const videosReady = !videoStatus.isLoading && videoStatus.loaded >= 2; // At least turn videos loaded
  
  return (
    <VideoContext.Provider value={{ 
      getVideoUrl, 
      isLoading: videoStatus.isLoading,
      videosReady 
    }}>
      {children}
    </VideoContext.Provider>
  );
}

export function useVideoContext() {
  const context = useContext(VideoContext);
  if (!context) {
    // Return default implementation if not in provider
    return {
      getVideoUrl: (path: string) => path,
      isLoading: false,
      videosReady: true
    };
  }
  return context;
}