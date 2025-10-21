import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TurnVideoProps {
  team: "dark" | "light";
  teamName: string;
  onComplete?: () => void;
}

export function TurnVideo({ team, teamName, onComplete }: TurnVideoProps) {
  const [show, setShow] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);

  const videoSrc = team === "dark" 
    ? "/mavi takım video tur.mp4"
    : "/kırmızı takım video tur.mp4";

  useEffect(() => {
    // Auto hide after 5 seconds
    const timer = setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 1000);
  };

  if (!show) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-none"
      style={{
        animation: 'fadeIn 0.5s ease-in-out forwards',
      }}
    >
      <div className="relative">
        {/* Circular video container with glow */}
        <div 
          className="relative"
          style={{
            animation: 'zoomInRotate 0.8s ease-out forwards',
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
              src={videoSrc}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
              className="w-full h-full object-cover"
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
          className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 text-center"
          style={{
            animation: 'slideUp 0.8s ease-out 0.5s forwards',
            opacity: 0
          }}
        >
          <div className="space-y-2">
            <div className="text-2xl md:text-3xl font-bold text-white/90">
              Sıra
            </div>
            <div className={cn(
              "text-4xl md:text-5xl font-black tracking-wide",
              team === "dark" ? "text-blue-400" : "text-red-400"
            )}
            style={{
              textShadow: team === "dark" 
                ? '0 2px 20px rgba(59,130,246,0.8)' 
                : '0 2px 20px rgba(239,68,68,0.8)'
            }}
            >
              {teamName} Takımında
            </div>
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