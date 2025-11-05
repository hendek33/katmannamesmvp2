import { useEffect, useState, useRef } from 'react';
import { videoBufferManager } from '@/services/VideoBufferManager';
import { adaptiveStreaming } from '@/services/AdaptiveVideoStreaming';
import { videoErrorHandler } from '@/services/VideoErrorHandler';
import { VideoBase64Converter } from '@/services/VideoBase64Converter';

interface OptimizedVideoState {
  isReady: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
  bufferHealth: number;
  currentQuality?: string;
  videoElement?: HTMLVideoElement;
  base64Src?: string;
}

export function useOptimizedVideo(videoSrc: string, priority: 'high' | 'medium' | 'low' = 'medium') {
  const [state, setState] = useState<OptimizedVideoState>({
    isReady: false,
    isLoading: true,
    hasError: false,
    bufferHealth: 0
  });
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const cleanupRef = useRef<(() => void)[]>([]);
  
  useEffect(() => {
    if (!videoSrc) return;
    
    let isMounted = true;
    
    const initializeVideo = async () => {
      try {
        // First check if we have base64 version
        let base64Src = VideoBase64Converter.getBase64(videoSrc);
        
        if (!base64Src) {
          // Convert to base64 if not already cached
          setState(prev => ({ ...prev, isLoading: true }));
          base64Src = await VideoBase64Converter.convertToBase64(videoSrc);
        }
        
        if (!isMounted) return;
        
        // Register with buffer manager
        videoBufferManager.registerVideo(base64Src || videoSrc, priority, 'aggressive');
        
        // Initialize adaptive streaming
        const streamConfig = adaptiveStreaming.initializeStream(base64Src || videoSrc, true);
        
        // Get or create video element
        let video = videoBufferManager.getVideoElement(base64Src || videoSrc);
        
        if (!video) {
          video = document.createElement('video');
          video.src = base64Src || videoSrc;
          video.preload = 'auto';
          video.muted = true;
          video.playsInline = true;
          video.style.position = 'fixed';
          video.style.left = '-9999px';
          document.body.appendChild(video);
        }
        
        videoRef.current = video;
        
        // Apply quality settings
        adaptiveStreaming.applyQualityToVideo(video, streamConfig.currentProfile);
        
        // Setup error handling
        const unsubscribeError = videoErrorHandler.onError(base64Src || videoSrc, (error) => {
          if (!isMounted) return;
          
          setState(prev => ({
            ...prev,
            hasError: true,
            errorMessage: error.message
          }));
        });
        
        cleanupRef.current.push(unsubscribeError);
        
        // Monitor buffer health
        const bufferInterval = setInterval(() => {
          if (!isMounted) return;
          
          const metrics = videoBufferManager.getBufferMetrics(base64Src || videoSrc);
          if (metrics) {
            setState(prev => ({
              ...prev,
              bufferHealth: metrics.bufferHealth,
              isReady: metrics.isHealthy,
              isLoading: !metrics.isHealthy
            }));
          }
        }, 500);
        
        cleanupRef.current.push(() => clearInterval(bufferInterval));
        
        // Listen for quality changes
        const handleQualityChange = (event: CustomEvent) => {
          if (event.detail.videoSrc === (base64Src || videoSrc)) {
            if (!isMounted) return;
            
            setState(prev => ({
              ...prev,
              currentQuality: event.detail.profile.name
            }));
          }
        };
        
        window.addEventListener('video-quality-changed', handleQualityChange as EventListener);
        cleanupRef.current.push(() => 
          window.removeEventListener('video-quality-changed', handleQualityChange as EventListener)
        );
        
        // Wait for initial buffer
        await videoBufferManager.preloadVideo(base64Src || videoSrc, 'aggressive');
        
        if (!isMounted) return;
        
        setState(prev => ({
          ...prev,
          isReady: true,
          isLoading: false,
          videoElement: video,
          base64Src: base64Src || undefined
        }));
        
      } catch (error) {
        if (!isMounted) return;
        
        console.error('Failed to initialize optimized video:', error);
        setState(prev => ({
          ...prev,
          hasError: true,
          errorMessage: 'Video yüklenemedi',
          isLoading: false
        }));
      }
    };
    
    initializeVideo();
    
    return () => {
      isMounted = false;
      
      // Run all cleanup functions
      cleanupRef.current.forEach(cleanup => cleanup());
      cleanupRef.current = [];
      
      // Clean up video element
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        if (videoRef.current.parentElement) {
          videoRef.current.remove();
        }
      }
      
      // Unregister from buffer manager to prevent memory leaks
      const srcToUnregister = VideoBase64Converter.getBase64(videoSrc) || videoSrc;
      videoBufferManager.unregisterVideo(srcToUnregister);
    };
  }, [videoSrc, priority]);
  
  const play = async () => {
    if (videoRef.current && state.isReady) {
      try {
        await videoRef.current.play();
      } catch (error) {
        console.error('Failed to play video:', error);
      }
    }
  };
  
  const pause = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };
  
  const setQuality = (quality: string) => {
    adaptiveStreaming.setQuality(videoSrc, quality);
  };
  
  const setAutoQuality = (enabled: boolean) => {
    adaptiveStreaming.setAutoQuality(videoSrc, enabled);
  };
  
  const retry = async () => {
    if (videoRef.current) {
      setState(prev => ({ ...prev, hasError: false, isLoading: true }));
      await videoErrorHandler.recoverVideo(videoRef.current);
    }
  };
  
  return {
    ...state,
    play,
    pause,
    setQuality,
    setAutoQuality,
    retry
  };
}