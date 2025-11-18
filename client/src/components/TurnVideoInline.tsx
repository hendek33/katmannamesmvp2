import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useInlineVideo } from "@/hooks/useInlineVideo";

interface TurnVideoInlineProps {
  team: "dark" | "light";
  teamName: string;
  onComplete?: () => void;
  isGameStart?: boolean;
}

export function TurnVideoInline({ team, teamName, onComplete, isGameStart = false }: TurnVideoInlineProps) {
  const [show, setShow] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [videoStarted, setVideoStarted] = useState(false);
  
  const videoSrc = team === "dark" 
    ? "/mavi takım video tur.webm"
    : "/kırmızı takım video tur.webm";
  
  const { videoRef, isLoading, base64Url } = useInlineVideo(videoSrc, {
    autoPlay: true,
    onStart: () => setVideoStarted(true),
    onComplete: () => {
      setIsClosing(true);
      setTimeout(() => {
        setShow(false);
        onComplete?.();
      }, 500);
    }
  });

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
        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-xl">Video yükleniyor...</div>
            <div className="ml-3 animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
          </div>
        )}
        
        {/* Turn notification text */}
        {videoStarted && (
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

        {/* Video container */}
        <div 
          className="relative"
          style={{
            opacity: !isLoading && base64Url ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          {/* Glow effect */}
          <div 
            className={cn(
              "absolute -inset-8 rounded-full blur-3xl opacity-60",
              videoStarted ? "animate-pulse" : ""
            )}
            style={{
              background: team === "dark" 
                ? 'radial-gradient(circle, rgba(59,130,246,0.8) 0%, transparent 60%)'
                : 'radial-gradient(circle, rgba(239,68,68,0.8) 0%, transparent 60%)'
            }}
          />
          
          {/* Video in circular frame */}
          <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden"
            style={{
              border: `4px solid ${team === "dark" ? '#3b82f6' : '#ef4444'}`,
              boxShadow: team === "dark" 
                ? '0 0 40px rgba(59,130,246,0.5)'
                : '0 0 40px rgba(239,68,68,0.5)',
              transform: 'translateZ(0)', // Force GPU acceleration
              backfaceVisibility: 'hidden', // Prevent flickering
              WebkitBackfaceVisibility: 'hidden',
              willChange: 'transform' // Optimize for animations
            }}
          >
            {base64Url && (
              <video
                ref={videoRef}
                src={base64Url}
                muted
                playsInline
                className="w-full h-full object-cover"
                style={{
                  transform: 'translateZ(0)',
                  WebkitTransform: 'translateZ(0)'
                }}
              />
            )}
            
            {/* Gradient overlay */}
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