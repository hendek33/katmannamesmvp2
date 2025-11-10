import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface ProphetVideoProps {
  team: "dark" | "light";
  teamName: string;
  onComplete?: () => void;
}

export function ProphetVideo({ team, teamName, onComplete }: ProphetVideoProps) {
  const [show, setShow] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const emergencyTimeoutRef = useRef<NodeJS.Timeout>();

  const videoSrc = team === "dark" 
    ? "/kahin bilgilendirme mavi.webm"
    : "/kahin bilgilendirme kırmızı.webm";

  useEffect(() => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    
    // Reset video for new playback
    video.currentTime = 0;
    setVideoReady(false);
    
    const handleLoadedData = () => {
      // Video data is loaded and ready to play
      video.play()
        .then(() => {
          setVideoReady(true);
        })
        .catch(err => {
          console.error('Prophet video play error:', err);
          // If play fails, still show the overlay
          setVideoReady(true);
        });
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
    
    // Load the video
    video.load();
    
    // Emergency timeout (5 seconds) in case video never loads
    emergencyTimeoutRef.current = setTimeout(() => {
      console.warn('Emergency timeout triggered for prophet video');
      handleVideoEnd();
    }, 5000);

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
        {/* Prophet notification text - ABOVE video and CENTERED */}
        {videoReady && (
          <div 
            className="mb-8 text-center"
            style={{
              animation: isClosing 
                ? 'fadeOutUp 0.5s ease-out forwards'
                : 'fadeInDown 0.6s ease-out forwards'
            }}
          >
            <div className="text-3xl md:text-4xl font-black tracking-wide">
              <span 
                className={cn(
                  team === "dark" ? "text-blue-400" : "text-red-400"
                )}
                style={{
                  textShadow: team === "dark" 
                    ? '0 2px 20px rgba(59,130,246,0.8)' 
                    : '0 2px 20px rgba(239,68,68,0.8)',
                }}
              >
                {teamName} Takımının{' '}
              </span>
              <span 
                className="text-purple-400 inline-block"
                style={{
                  textShadow: '0 0 25px rgba(168,85,247,0.9), 0 0 50px rgba(168,85,247,0.6), 0 2px 20px rgba(168,85,247,0.8)',
                  animation: 'purpleGlow 2s ease-in-out infinite alternate',
                  filter: 'brightness(1.2)',
                }}
              >
                KAHİN AJANI
              </span>
              <span 
                className={cn(
                  team === "dark" ? "text-blue-400" : "text-red-400"
                )}
                style={{
                  textShadow: team === "dark" 
                    ? '0 2px 20px rgba(59,130,246,0.8)' 
                    : '0 2px 20px rgba(239,68,68,0.8)',
                }}
              >
                {' '}seçildin!
              </span>
            </div>
            <div className="text-xl md:text-2xl font-bold text-orange-400 mt-3"
              style={{
                textShadow: '0 2px 15px rgba(251,146,60,0.8)',
              }}
            >
              Karşı takıma sakın belli etme!
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
                ? 'mysticalDisappear 0.8s ease-in forwards'
                : 'mysticalAppear 1.5s ease-out forwards')
              : 'none',
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          {/* Portal glow effects - multiple layers */}
          <div 
            className="absolute -inset-12 rounded-full blur-3xl opacity-40"
            style={{
              background: team === "dark" 
                ? 'radial-gradient(circle, rgba(147,51,234,0.6) 0%, rgba(59,130,246,0.4) 50%, transparent 70%)'
                : 'radial-gradient(circle, rgba(147,51,234,0.6) 0%, rgba(239,68,68,0.4) 50%, transparent 70%)',
              animation: videoReady ? 'portalPulse 3s ease-in-out infinite' : 'none'
            }}
          />
          <div 
            className="absolute -inset-8 rounded-full blur-2xl opacity-60"
            style={{
              background: team === "dark" 
                ? 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 60%)'
                : 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, transparent 60%)',
              animation: videoReady ? 'mysticRotate 5s linear infinite' : 'none'
            }}
          />
          <div 
            className="absolute -inset-4 rounded-full opacity-30"
            style={{
              background: `conic-gradient(from 0deg, 
                transparent, 
                ${team === "dark" ? 'rgba(147,51,234,0.8)' : 'rgba(217,70,239,0.8)'}, 
                transparent, 
                ${team === "dark" ? 'rgba(59,130,246,0.8)' : 'rgba(239,68,68,0.8)'}, 
                transparent)`,
              animation: videoReady ? 'spiralRotate 4s linear infinite' : 'none',
              filter: 'blur(10px)'
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
        
        @keyframes mysticalAppear {
          0% {
            transform: scale(0) rotateY(90deg);
            opacity: 0;
            filter: blur(20px) brightness(2);
          }
          20% {
            transform: scale(1.2) rotateY(75deg);
            opacity: 0.3;
            filter: blur(15px) brightness(1.8);
          }
          40% {
            transform: scale(0.9) rotateY(45deg);
            opacity: 0.6;
            filter: blur(10px) brightness(1.5);
          }
          60% {
            transform: scale(1.1) rotateY(20deg);
            opacity: 0.8;
            filter: blur(5px) brightness(1.3);
          }
          80% {
            transform: scale(0.95) rotateY(5deg);
            opacity: 0.9;
            filter: blur(2px) brightness(1.1);
          }
          90% {
            transform: scale(1.02) rotateY(0deg);
            opacity: 0.95;
            filter: blur(1px) brightness(1.05);
          }
          100% {
            transform: scale(1) rotateY(0deg);
            opacity: 1;
            filter: blur(0px) brightness(1);
          }
        }
        
        @keyframes mysticalDisappear {
          0% {
            transform: scale(1) rotateY(0deg);
            opacity: 1;
            filter: blur(0px) brightness(1);
          }
          30% {
            transform: scale(1.05) rotateY(-20deg);
            opacity: 0.8;
            filter: blur(3px) brightness(1.2);
          }
          60% {
            transform: scale(0.8) rotateY(-60deg);
            opacity: 0.5;
            filter: blur(8px) brightness(1.5);
          }
          100% {
            transform: scale(0) rotateY(-90deg);
            opacity: 0;
            filter: blur(20px) brightness(2);
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
        
        @keyframes purpleGlow {
          0% {
            filter: brightness(1.2) saturate(1.2);
            transform: scale(1);
          }
          50% {
            filter: brightness(1.4) saturate(1.5);
            transform: scale(1.05);
          }
          100% {
            filter: brightness(1.2) saturate(1.2);
            transform: scale(1);
          }
        }
        
        @keyframes portalPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.4;
          }
          50% {
            transform: scale(1.3);
            opacity: 0.7;
          }
        }
        
        @keyframes mysticRotate {
          from {
            transform: rotate(0deg) scale(1);
          }
          to {
            transform: rotate(360deg) scale(1);
          }
        }
        
        @keyframes spiralRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(-360deg);
          }
        }
      `}</style>
    </div>
  );
}