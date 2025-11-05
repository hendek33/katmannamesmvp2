import { useEffect, useState, useRef } from "react";
import { VideoBase64Converter } from "@/services/VideoBase64Converter";

interface UseInlineVideoOptions {
  autoPlay?: boolean;
  onComplete?: () => void;
  onStart?: () => void;
}

/**
 * Hook that loads video as base64 and plays it inline
 */
export function useInlineVideo(
  videoSrc: string,
  options: UseInlineVideoOptions = {}
) {
  const { autoPlay = true, onComplete, onStart } = options;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [base64Url, setBase64Url] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    let mounted = true;
    
    const loadVideo = async () => {
      try {
        // First check if we already have it in cache
        let dataUrl = VideoBase64Converter.getBase64(videoSrc);
        
        if (!dataUrl) {
          // Convert to base64 if not cached
          dataUrl = await VideoBase64Converter.convertToBase64(videoSrc);
        }
        
        if (!mounted) return;
        
        setBase64Url(dataUrl);
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load video as base64:", err);
        setError("Video yüklenemedi");
        setIsLoading(false);
        
        // Fallback to original URL
        setBase64Url(videoSrc);
      }
    };
    
    loadVideo();
    
    return () => {
      mounted = false;
    };
  }, [videoSrc]);
  
  useEffect(() => {
    if (!videoRef.current || !base64Url || isLoading) return;
    
    const video = videoRef.current;
    
    const handleCanPlay = () => {
      if (autoPlay) {
        video.play()
          .then(() => onStart?.())
          .catch(err => console.error("Play failed:", err));
      }
    };
    
    const handleEnded = () => {
      onComplete?.();
    };
    
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [base64Url, isLoading, autoPlay, onComplete, onStart]);
  
  return {
    videoRef,
    isLoading,
    base64Url,
    error
  };
}