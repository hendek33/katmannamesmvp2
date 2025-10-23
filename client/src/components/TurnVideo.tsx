import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface TurnVideoProps {
  team: "dark" | "light";
  teamName: string;
  onComplete?: () => void;
}

export function TurnVideo({ team, teamName, onComplete }: TurnVideoProps) {
  const [show, setShow] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const videoSrc = team === "dark" 
    ? "/mavi takım video tur.mp4"
    : "/kırmızı takım video tur.mp4";

  useEffect(() => {
    // Auto hide after 4 seconds
    const timer = setTimeout(() => {
      setIsClosing(true);
      const closeTimer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 600);
      timersRef.current.push(closeTimer);
    }, 4000);
    
    timersRef.current.push(timer);

    return () => {
      // Clear all timers on unmount
      timersRef.current.forEach(t => clearTimeout(t));
      // Cleanup video
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = '';
        videoRef.current.load();
      }
    };
  }, [onComplete]);

  const handleVideoEnd = () => {
    // Only handle video end if we haven't already started closing
    if (!isClosing) {
      setVideoEnded(true);
      setIsClosing(true);
      const endTimer = setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 600);
      timersRef.current.push(endTimer);
    }
  };

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none"
      style={{
        animation: isClosing 
          ? 'fadeOut 0.6s ease-in-out forwards' 
          : 'fadeIn 0.5s ease-in-out forwards',
      }}
    >
      <div className="relative">
        {/* Circular video container with glow */}
        <div 
          className="relative"
          style={{
            animation: isClosing 
              ? 'zoomOutRotate 0.6s ease-in forwards'
              : 'zoomInRotate 0.8s ease-out forwards',
          }}
        >
          {/* Glow effect */}
          <div 
            className={cn(
              "absolute -inset-8 rounded-full blur-3xl opacity-60 animate-pulse",
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
              autoPlay
              muted
              playsInline
              preload="auto"
              onLoadedData={() => setVideoReady(true)}
              onError={() => {
                console.error("Video yüklenemedi:", videoSrc);
                setVideoError(true);
                // Hata durumunda yine de devam et
                const errorTimer = setTimeout(() => {
                  setIsClosing(true);
                  const errorCloseTimer = setTimeout(() => {
                    setShow(false);
                    onComplete?.();
                  }, 600);
                  timersRef.current.push(errorCloseTimer);
                }, 1000);
                timersRef.current.push(errorTimer);
              }}
              onEnded={handleVideoEnd}
              className="w-full h-full object-cover"
              style={{ opacity: videoReady ? 1 : 0 }}
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

        {/* Turn notification text */}
        <div 
          className="absolute -top-20 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap"
        >
          <div className={cn(
            "text-3xl md:text-4xl font-black tracking-wide",
            team === "dark" ? "text-blue-400" : "text-red-400"
          )}
          style={{
            textShadow: team === "dark" 
              ? '0 2px 20px rgba(59,130,246,0.8)' 
              : '0 2px 20px rgba(239,68,68,0.8)'
          }}
          >
            {`Sıra ${teamName} Takımında`.split('').map((char, index) => (
              <span
                key={index}
                className="inline-block"
                style={{
                  animation: 'letterDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  animationDelay: `${0.5 + index * 0.025}s`,
                  opacity: 0
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </span>
            ))}
          </div>
        </div>

        {/* Decorative particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-1 h-1 rounded-full",
                team === "dark" ? "bg-blue-400" : "bg-red-400"
              )}
              style={{
                left: '50%',
                top: '50%',
                animation: `floatParticle ${2 + Math.random() * 2}s ease-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                '--particle-distance': `${100 + Math.random() * 150}px`,
                '--particle-angle': `${Math.random() * 360}deg`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      </div>
    </div>
  );
}