import { useEffect, useRef, useState } from "react";

export function useVideoPlayer(videoSrc: string, autoPlay = true) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    // Video'yu hazırla
    video.src = videoSrc;
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    video.autoplay = false; // Manuel kontrol için
    
    // Event listeners
    const handleCanPlay = () => {
      setIsReady(true);
      if (autoPlay) {
        // Küçük bir gecikme ile oynat (render tamamlansın)
        requestAnimationFrame(() => {
          video.play().catch(err => {
            console.error('Video play error:', err);
            setHasError(true);
          });
        });
      }
    };
    
    const handleError = () => {
      console.error(`Video error: ${videoSrc}`);
      setHasError(true);
    };
    
    video.addEventListener('canplaythrough', handleCanPlay);
    video.addEventListener('error', handleError);
    
    // Video'yu yükle
    video.load();
    
    return () => {
      video.removeEventListener('canplaythrough', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.pause();
      video.src = '';
    };
  }, [videoSrc, autoPlay]);
  
  return { videoRef, isReady, hasError };
}