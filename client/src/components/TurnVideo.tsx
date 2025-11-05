import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { videoOptimizer } from "@/services/SimpleVideoOptimizer";

interface TurnVideoProps {
  team: "dark" | "light";
  teamName: string;
  isGameStart?: boolean;
  onComplete?: () => void;
}

export function TurnVideo({ team, teamName, isGameStart, onComplete }: TurnVideoProps) {
  const [show, setShow] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const emergencyTimeoutRef = useRef<NodeJS.Timeout>();

  const videoSrc = team === "dark" 
    ? "/mavi takım video tur.mp4"
    : "/kırmızı takım video tur.mp4";

  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    // Apply optimized attributes
    videoOptimizer.getOptimizedAttributes(video);
    
    // Reset video for new playback
    video.currentTime = 0;
    setVideoReady(false);
    
    const handleLoadedData = async () => {
      // Video data is loaded and ready to play
      try {
        await videoOptimizer.playVideoSafely(video);
        setVideoReady(true);
      } catch (err) {
        console.error('Video play error:', err);
        // If play fails, still show the overlay
        setVideoReady(true);
      }
    };
    
    const handleVideoEnd = () => {
      setIsClosing(true);
      setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 500);
    };
    
    // Add event listeners
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('ended', handleVideoEnd);
    
    // Force load the video
    video.load();
    
    // Emergency timeout (3 seconds) in case video never loads
    emergencyTimeoutRef.current = setTimeout(() => {
      console.warn('Emergency timeout triggered for turn video');
      handleVideoEnd();
    }, 3000);

    return () => {
      if (emergencyTimeoutRef.current) {
        clearTimeout(emergencyTimeoutRef.current);
      }
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('ended', handleVideoEnd);
      video.pause();
    };
  }, [team, onComplete]);

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none"
      style={{
        animation: isClosing 
          ? 'fadeOut 0.5s ease-in-out forwards' 
          : 'fadeIn 0.5s ease-in-out forwards',
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Turn notification text - ABOVE video and CENTERED */}
        {videoReady && (
          <div 
            className="mb-8 text-center"
            style={{
              animation: isClosing 
                ? 'fadeOutUp 0.5s ease-out forwards'
                : 'fadeInDown 0.6s ease-out forwards'
            }}
          >
            <div className={cn(
              "text-3xl md:text-4xl font-black tracking-wide",
              team === "dark" ? "text-blue-400" : "text-red-400"
            )}
            style={{
              textShadow: team === "dark" 
                ? '0 2px 20px rgba(59,130,246,0.8)' 
                : '0 2px 20px rgba(239,68,68,0.8)',
            }}
            >
              {isGameStart ? `${teamName} Takımı Oyuna Başlıyor` : `Sıra ${teamName} Takımında`}
            </div>
          </div>
        )}

        {/* Circular video container with glow - only show when video is ready */}
        <div 
          className="relative"
          style={{
            opacity: videoReady ? 1 : 0,
            animation: videoReady
              ? (isClosing 
                ? 'zoomOutRotate 0.5s ease-in forwards'
                : 'zoomInRotate 0.8s ease-out forwards')
              : 'none',
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          {/* Glow effect */}
          <div 
            className={cn(
              "absolute -inset-8 rounded-full blur-3xl opacity-60",
              videoReady ? "animate-pulse" : ""
            )}
            style={{
              background: team === "dark" 
                ? 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 60%)'
                : 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, transparent 60%)'
            }}
          />
          
          {/* Video in circular frame */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden border-4 shadow-2xl"
            style={{
              borderColor: team === "dark" ? '#3b82f6' : '#ef4444',
              boxShadow: team === "dark" 
                ? '0 0 60px rgba(59,130,246,0.6), inset 0 0 30px rgba(59,130,246,0.3)'
                : '0 0 60px rgba(239,68,68,0.6), inset 0 0 30px rgba(239,68,68,0.3)'
            }}
          >
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
              style={{
                opacity: videoReady ? 1 : 0
              }}
            />
            
            {/* Gradient overlay for better blending */}
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at center, transparent 40%, ${
                  team === "dark" ? 'rgba(59,130,246,0.2)' : 'rgba(239,68,68,0.2)'
                } 70%)`
              }}
            />
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes zoomInRotate {
          from {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          to {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }
        
        @keyframes zoomOutRotate {
          from {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
          to {
            transform: scale(0) rotate(180deg);
            opacity: 0;
          }
        }
        
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeOutUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-20px);
          }
        }
      `}</style>
    </div>
  );
}