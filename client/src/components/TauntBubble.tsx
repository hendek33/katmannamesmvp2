import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface TauntBubbleProps {
  senderUsername: string;
  senderTeam: "dark" | "light" | null;
  videoSrc: string;
}

export function TauntBubble({ senderUsername, senderTeam, videoSrc }: TauntBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoReady = () => {
    setIsVideoReady(true);
    if (videoRef.current) {
      videoRef.current.play()
        .catch(err => console.error('Taunt video play error:', err));
    }
  };

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);
    
    // Preload the video
    if (videoRef.current) {
      videoRef.current.load();
    }
    
    // Start fade out after 2 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 2000);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  // Determine position based on team
  const isLeftSide = senderTeam === 'dark';

  return (
    <div 
      className={cn(
        "fixed z-[100] pointer-events-none transition-all duration-700 ease-out",
        isLeftSide ? "left-[10%] lg:left-[15%] xl:left-[18%]" : "right-[10%] lg:right-[15%] xl:right-[18%]",
        "top-[10vh] lg:top-[12vh] xl:top-[15vh]",
        isVisible && !isLeaving ? "opacity-100" : "opacity-0",
        isLeaving && "animate-fade-out"
      )}
      style={{
        transform: `${isVisible && !isLeaving ? 'translateY(0)' : 'translateY(-20px)'}`,
      }}
    >
      {/* Speech bubble with video */}
      <div className={cn(
        "relative backdrop-blur-lg rounded-2xl p-3 shadow-2xl border-2",
        "w-[180px] h-[180px] animate-bounce-gentle",
        senderTeam === 'dark' 
          ? "bg-blue-900/80 border-blue-500/60" 
          : "bg-red-900/80 border-red-500/60"
      )}>
        {/* Sender name */}
        <div className={cn(
          "absolute -top-8 left-4 text-sm font-black px-3 py-1.5 rounded-lg z-10",
          "backdrop-blur-md border",
          senderTeam === 'dark'
            ? "bg-blue-900/80 text-blue-100 border-blue-500/50"
            : "bg-red-900/80 text-red-100 border-red-500/50"
        )}
        style={{
          textShadow: senderTeam === "dark" 
            ? '0 0 15px rgba(59,130,246,1), 0 2px 4px rgba(0,0,0,0.8)' 
            : '0 0 15px rgba(239,68,68,1), 0 2px 4px rgba(0,0,0,0.8)',
          boxShadow: senderTeam === "dark"
            ? '0 4px 12px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.3)'
            : '0 4px 12px rgba(239,68,68,0.5), 0 0 20px rgba(239,68,68,0.3)'
        }}>
          {senderUsername}
        </div>
        
        {/* Circular video container */}
        <div 
          className={cn(
            "relative w-full h-full rounded-xl overflow-hidden",
            "border-2",
            senderTeam === 'dark' ? "border-blue-400/50" : "border-red-400/50"
          )}
          style={{
            boxShadow: senderTeam === 'dark'
              ? '0 0 20px rgba(59,130,246,0.4) inset'
              : '0 0 20px rgba(239,68,68,0.4) inset',
            opacity: isVideoReady ? 1 : 0.3
          }}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            onCanPlay={handleVideoReady}
            onLoadedData={handleVideoReady}
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Tail */}
        <div 
          className={cn(
            "absolute -bottom-2 w-4 h-4 transform rotate-45",
            isLeftSide ? "left-8" : "right-8",
            senderTeam === 'dark'
              ? "bg-blue-900/80 border-r-2 border-b-2 border-blue-500/60"
              : "bg-red-900/80 border-r-2 border-b-2 border-red-500/60"
          )}
        />
      </div>

      <style>{`
        @keyframes animate-fade-out {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
        }
        
        @keyframes animate-bounce-gentle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}