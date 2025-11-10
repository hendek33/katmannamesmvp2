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
      className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden"
      style={{
        animation: isClosing 
          ? 'spookyFadeOut 1s ease-in-out forwards' 
          : 'spookyFadeIn 1.5s ease-in-out forwards',
        background: isClosing
          ? 'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.95) 100%)'
          : 'radial-gradient(circle at center, rgba(88,28,135,0.3) 0%, rgba(0,0,0,0.95) 100%)',
      }}
    >
      {/* Animated purple fog layers */}
      <div 
        className="absolute inset-0"
        style={{
          animation: 'purpleFog1 10s ease-in-out infinite',
          background: 'radial-gradient(ellipse at top left, rgba(147,51,234,0.3) 0%, transparent 50%)',
          filter: 'blur(60px)',
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          animation: 'purpleFog2 15s ease-in-out infinite reverse',
          background: 'radial-gradient(ellipse at bottom right, rgba(168,85,247,0.25) 0%, transparent 50%)',
          filter: 'blur(80px)',
        }}
      />
      <div 
        className="absolute inset-0"
        style={{
          animation: 'purpleFog3 20s ease-in-out infinite',
          background: 'radial-gradient(ellipse at center, rgba(126,34,206,0.2) 0%, transparent 60%)',
          filter: 'blur(100px)',
        }}
      />
      
      {/* Smoke particles */}
      {!isClosing && videoReady && (
        <>
          <div className="absolute inset-0">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-96 h-96 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: `radial-gradient(circle, rgba(147,51,234,${0.1 + Math.random() * 0.2}) 0%, transparent 70%)`,
                  animation: `floatSmoke ${15 + i * 2}s ease-in-out infinite`,
                  animationDelay: `${i * 0.5}s`,
                  filter: 'blur(40px)',
                }}
              />
            ))}
          </div>
        </>
      )}
      
      <div className="relative flex flex-col items-center">
        {/* Prophet notification text - ABOVE video and CENTERED */}
        {videoReady && (
          <div 
            className="mb-8 text-center"
            style={{
              animation: isClosing 
                ? 'spookyFadeOutUp 0.8s ease-out forwards'
                : 'spookyFadeInDown 1s ease-out forwards'
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
                ? 'ghostDisappear 1.2s ease-in forwards'
                : 'ghostAppear 1.5s ease-out forwards')
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
        @keyframes spookyFadeIn {
          0% { 
            opacity: 0;
            filter: blur(20px) brightness(0.3);
          }
          50% {
            opacity: 0.7;
            filter: blur(10px) brightness(0.6);
          }
          100% { 
            opacity: 1;
            filter: blur(0) brightness(1);
          }
        }
        
        @keyframes spookyFadeOut {
          0% { 
            opacity: 1;
            filter: blur(0) brightness(1);
          }
          50% {
            opacity: 0.5;
            filter: blur(15px) brightness(0.5);
          }
          100% { 
            opacity: 0;
            filter: blur(30px) brightness(0);
          }
        }
        
        @keyframes ghostAppear {
          0% {
            transform: scale(0.3) translateY(100px) rotateZ(-45deg);
            opacity: 0;
            filter: blur(20px) brightness(2);
          }
          30% {
            transform: scale(0.8) translateY(50px) rotateZ(-15deg);
            opacity: 0.3;
            filter: blur(10px) brightness(1.5);
          }
          60% {
            transform: scale(1.1) translateY(-10px) rotateZ(5deg);
            opacity: 0.8;
            filter: blur(3px) brightness(1.2);
          }
          100% {
            transform: scale(1) translateY(0) rotateZ(0deg);
            opacity: 1;
            filter: blur(0) brightness(1);
          }
        }
        
        @keyframes ghostDisappear {
          0% {
            transform: scale(1) translateY(0) rotateZ(0deg);
            opacity: 1;
            filter: blur(0) brightness(1);
          }
          40% {
            transform: scale(1.2) translateY(-20px) rotateZ(10deg);
            opacity: 0.8;
            filter: blur(2px) brightness(0.8);
          }
          70% {
            transform: scale(0.6) translateY(40px) rotateZ(-30deg);
            opacity: 0.3;
            filter: blur(10px) brightness(0.5);
          }
          100% {
            transform: scale(0) translateY(100px) rotateZ(-90deg);
            opacity: 0;
            filter: blur(30px) brightness(0);
          }
        }
        
        @keyframes spookyFadeInDown {
          0% {
            opacity: 0;
            transform: translateY(-50px) scale(0.8);
            filter: blur(10px);
          }
          50% {
            opacity: 0.7;
            transform: translateY(-10px) scale(1.05);
            filter: blur(2px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        
        @keyframes spookyFadeOutUp {
          0% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
          50% {
            opacity: 0.5;
            transform: translateY(-20px) scale(0.95);
            filter: blur(5px);
          }
          100% {
            opacity: 0;
            transform: translateY(-60px) scale(0.7);
            filter: blur(15px);
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
        
        @keyframes purpleFog1 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.3;
          }
          33% {
            transform: translate(30px, -40px) scale(1.2) rotate(45deg);
            opacity: 0.5;
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9) rotate(-30deg);
            opacity: 0.2;
          }
        }
        
        @keyframes purpleFog2 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 0.25;
          }
          25% {
            transform: translate(-40px, 30px) scale(1.3) rotate(-60deg);
            opacity: 0.4;
          }
          50% {
            transform: translate(50px, -20px) scale(0.8) rotate(90deg);
            opacity: 0.15;
          }
          75% {
            transform: translate(-30px, -30px) scale(1.1) rotate(180deg);
            opacity: 0.35;
          }
        }
        
        @keyframes purpleFog3 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0.2;
          }
          50% {
            transform: translate(0, -30px) scale(1.4);
            opacity: 0.35;
          }
        }
        
        @keyframes floatSmoke {
          0%, 100% {
            transform: translate(0, 0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          50% {
            transform: translate(-100px, -150px) scale(1.5);
            opacity: 0.2;
          }
          90% {
            opacity: 0.1;
          }
        }
      `}</style>
    </div>
  );
}