import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface TurnVideoProps {
  team: "dark" | "light";
  teamName: string;
  onComplete?: () => void;
}

export function TurnVideo({ team, teamName, onComplete }: TurnVideoProps) {
  const [show, setShow] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSrc = team === "dark" 
    ? "/mavi takım video tur.mp4"
    : "/kırmızı takım video tur.mp4";

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    // Auto hide after 4 seconds
    timeoutId = setTimeout(() => {
      setIsClosing(true);
      setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 600);
    }, 4000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [onComplete]);

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
          className="absolute -top-20 left-1/2 transform -translate-x-1/2 text-center whitespace-nowrap"
        >
          <div className={cn(
            "text-3xl md:text-4xl font-black tracking-wide",
            team === "dark" ? "text-blue-400" : "text-red-400"
          )}
          style={{
            textShadow: team === "dark" 
              ? '0 2px 20px rgba(59,130,246,0.8)' 
              : '0 2px 20px rgba(239,68,68,0.8)',
            animation: 'fadeInUp 0.6s ease-out forwards'
          }}
          >
            Sıra {teamName} Takımında
          </div>
        </div>

        {/* Decorative particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className={cn(
                "absolute w-2 h-2 rounded-full",
                team === "dark" ? "bg-blue-400" : "bg-red-400"
              )}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`,
                opacity: 0.6
              }}
            />
          ))}
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
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-20px) translateX(10px);
          }
          50% {
            transform: translateY(10px) translateX(-10px);
          }
          75% {
            transform: translateY(-10px) translateX(20px);
          }
        }
      `}</style>
    </div>
  );
}