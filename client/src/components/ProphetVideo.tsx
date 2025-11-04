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
    ? "/kahin bilgilendirme mavi.mp4"
    : "/kahin bilgilendirme kırmızı.mp4";

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
      {/* Circle with video - same as TurnVideo */}
      <div 
        className="relative"
        style={{
          animation: !isClosing ? 'zoomIn 0.7s ease-out forwards' : 'zoomOut 0.5s ease-in forwards',
        }}
      >
        {/* Glow effect */}
        <div 
          className={cn(
            "absolute inset-0 w-[500px] h-[500px] rounded-full blur-2xl",
            team === "dark" 
              ? "bg-blue-500/30" 
              : "bg-red-500/30"
          )}
          style={{
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
        
        {/* Circle container */}
        <div 
          className={cn(
            "relative w-[500px] h-[500px] rounded-full overflow-hidden border-8 shadow-2xl",
            team === "dark" 
              ? "border-blue-400/80 bg-blue-950" 
              : "border-red-400/80 bg-red-950"
          )}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={cn(
              "absolute inset-0 w-full h-full object-cover transition-opacity duration-500",
              videoReady ? "opacity-100" : "opacity-0"
            )}
          >
            <source src={videoSrc} type="video/mp4" />
          </video>
          
          {/* Overlay gradient - more vibrant */}
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 opacity-60"
            )} 
          />
        </div>
        
        {/* Prophet Badge */}
        <div 
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10"
          style={{
            animation: !isClosing ? 'fadeInDown 0.5s ease-out 0.3s forwards' : 'fadeOutUp 0.3s ease-in forwards',
            opacity: 0,
            animationFillMode: 'both'
          }}
        >
          <div className="flex items-center gap-3">
            <span className="text-5xl animate-pulse">🔮</span>
            <div className="text-purple-400 text-3xl font-black uppercase tracking-wider">
              Kahin Ajanı
            </div>
            <span className="text-5xl animate-pulse">🔮</span>
          </div>
        </div>
        
        {/* Main Text */}
        <div 
          className="absolute bottom-8 left-0 right-0 px-12 text-center z-10"
          style={{
            animation: !isClosing ? 'fadeInUp 0.5s ease-out 0.5s forwards' : 'fadeOutDown 0.3s ease-in forwards',
            opacity: 0,
            animationFillMode: 'both'
          }}
        >
          <div 
            className={cn(
              "text-5xl font-black mb-4",
              team === "dark" ? "text-blue-300" : "text-red-300"
            )}
          >
            {teamName} Takımının
          </div>
          <div className="text-white text-2xl font-bold mb-4">
            kahin ajanı seçildin!
          </div>
          <div className="text-yellow-300 text-xl font-semibold mb-2">
            Bütün kartları görebiliyorsun!
          </div>
          <div className="text-orange-400 text-lg font-semibold animate-pulse">
            ⚠️ Karşı takıma sakın belli etme! ⚠️
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.3) rotate(-10deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes zoomOut {
          from {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          to {
            opacity: 0;
            transform: scale(0.3) rotate(10deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
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
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeOutDown {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(20px);
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