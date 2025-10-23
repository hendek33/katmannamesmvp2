import { createContext, useContext } from 'react';
import { useVideoPreloader } from '@/hooks/useVideoPreloader';

interface VideoContextType {
  isLoading: boolean;
  videosReady: boolean;
}

const VideoContext = createContext<VideoContextType | null>(null);

export function VideoProvider({ children }: { children: React.ReactNode }) {
  const videoStatus = useVideoPreloader();
  
  const videosReady = !videoStatus.isLoading && videoStatus.loaded >= 2; // At least turn videos loaded
  
  return (
    <VideoContext.Provider value={{ 
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
      isLoading: false,
      videosReady: true
    };
  }
  return context;
}