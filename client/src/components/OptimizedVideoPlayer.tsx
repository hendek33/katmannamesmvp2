import { useEffect, useRef, useState } from "react";
import { enhancedVideoCache } from "@/services/EnhancedVideoCache";
import { VideoLoadingIndicator } from "./VideoLoadingIndicator";

interface OptimizedVideoPlayerProps {
  src: string;
  onComplete?: () => void;
  onStart?: () => void;
  className?: string;
  showLoadingIndicator?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
}

export function OptimizedVideoPlayer({
  src,
  onComplete,
  onStart,
  className = "",
  showLoadingIndicator = true,
  autoPlay = true,
  loop = false
}: OptimizedVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const bufferCheckIntervalRef = useRef<number>();
  const playPromiseRef = useRef<Promise<void>>();
  
  useEffect(() => {
    let mounted = true;
    
    const setupVideo = async () => {
      if (!videoRef.current) return;
      
      try {
        // Get the blob URL for the video to reuse buffered data
        const blobUrl = await enhancedVideoCache.getVideoUrl(src);
        
        if (!mounted) return;
        
        // Set up our video element with the blob URL
        const targetVideo = videoRef.current;
        targetVideo.src = blobUrl;
        targetVideo.preload = 'auto';
        targetVideo.muted = true;
        targetVideo.playsInline = true;
        targetVideo.loop = loop;
        
        // Warm up the video for immediate playback
        await enhancedVideoCache.warmUpVideo(src);
        
        // Set up buffer monitoring
        bufferCheckIntervalRef.current = window.setInterval(() => {
          if (targetVideo.buffered.length > 0) {
            const bufferedEnd = targetVideo.buffered.end(targetVideo.buffered.length - 1);
            const currentTime = targetVideo.currentTime;
            const bufferAhead = bufferedEnd - currentTime;
            
            // Check if we're running low on buffer
            if (bufferAhead < 1 && !targetVideo.paused) {
              setIsBuffering(true);
              console.warn(`⚠️ Low buffer detected: ${bufferAhead.toFixed(2)}s ahead`);
            } else if (bufferAhead > 2 && isBuffering) {
              setIsBuffering(false);
              console.log(`✅ Buffer recovered: ${bufferAhead.toFixed(2)}s ahead`);
            }
          }
        }, 500);
        
        // Event handlers
        const handleCanPlay = () => {
          setIsReady(true);
          if (autoPlay && !hasStarted) {
            playVideo();
          }
        };
        
        const handlePlaying = () => {
          if (!hasStarted) {
            setHasStarted(true);
            onStart?.();
          }
          setIsBuffering(false);
        };
        
        const handleWaiting = () => {
          console.log(`⏳ Video buffering: ${src}`);
          setIsBuffering(true);
        };
        
        const handleEnded = () => {
          console.log(`✅ Video ended: ${src}`);
          onComplete?.();
        };
        
        const handleError = (e: Event) => {
          console.error(`❌ Video playback error: ${src}`, e);
          // Try to recover
          if (targetVideo.error?.code === MediaError.MEDIA_ERR_DECODE) {
            // Decoding error - try reloading
            targetVideo.load();
          }
        };
        
        const handleStalled = () => {
          console.warn(`⏸️ Video stalled: ${src}`);
          // Try to jumpstart playback
          const currentTime = targetVideo.currentTime;
          targetVideo.currentTime = currentTime + 0.1;
        };
        
        // Attach event listeners
        targetVideo.addEventListener('canplay', handleCanPlay);
        targetVideo.addEventListener('playing', handlePlaying);
        targetVideo.addEventListener('waiting', handleWaiting);
        targetVideo.addEventListener('ended', handleEnded);
        targetVideo.addEventListener('error', handleError);
        targetVideo.addEventListener('stalled', handleStalled);
        
        // Load the video
        targetVideo.load();
        
        // Cleanup function
        return () => {
          targetVideo.removeEventListener('canplay', handleCanPlay);
          targetVideo.removeEventListener('playing', handlePlaying);
          targetVideo.removeEventListener('waiting', handleWaiting);
          targetVideo.removeEventListener('ended', handleEnded);
          targetVideo.removeEventListener('error', handleError);
          targetVideo.removeEventListener('stalled', handleStalled);
        };
      } catch (error) {
        console.error(`Failed to setup video: ${src}`, error);
      }
    };
    
    const cleanup = setupVideo();
    
    return () => {
      mounted = false;
      if (bufferCheckIntervalRef.current) {
        clearInterval(bufferCheckIntervalRef.current);
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
      }
      cleanup?.then(fn => fn?.());
    };
  }, [src, autoPlay, loop, hasStarted, isBuffering, onComplete, onStart]);
  
  const playVideo = async () => {
    if (!videoRef.current) return;
    
    try {
      // Cancel any pending play promise
      if (playPromiseRef.current) {
        await playPromiseRef.current.catch(() => {});
      }
      
      // Use requestAnimationFrame for smooth start
      requestAnimationFrame(async () => {
        if (!videoRef.current) return;
        
        playPromiseRef.current = videoRef.current.play();
        await playPromiseRef.current;
        console.log(`▶️ Video playing: ${src}`);
      });
    } catch (error) {
      console.error(`Failed to play video: ${src}`, error);
      
      // Retry with user interaction if needed
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        console.log('⚠️ Autoplay blocked, waiting for user interaction');
        // Could show a play button here
      }
    }
  };
  
  return (
    <>
      {showLoadingIndicator && (
        <VideoLoadingIndicator
          videoSrc={src}
          onReady={() => setIsReady(true)}
          showOverlay={!isReady}
        />
      )}
      
      <video
        ref={videoRef}
        className={className}
        style={{
          opacity: isBuffering ? 0.7 : 1,
          transition: 'opacity 0.3s ease'
        }}
      />
      
      {/* Buffering Indicator Overlay */}
      {isBuffering && hasStarted && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-slate-900/90 px-4 py-2 rounded-lg flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent" />
            <span className="text-white text-sm">Yükleniyor...</span>
          </div>
        </div>
      )}
    </>
  );
}