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
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoReady = () => {
    setIsVideoLoaded(true);
    // Show bubble only after video is loaded
    setTimeout(() => {
      setIsVisible(true);
      if (videoRef.current) {
        videoRef.current.play()
          .catch(err => console.error('Taunt video play error:', err));
      }
    }, 100);
  };

  useEffect(() => {
    // Preload the video
    if (videoRef.current) {
      videoRef.current.load();
    }
    
    // Start fade out after 2.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 2500);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  // Determine position based on team (red/light is now on left, blue/dark is on right)
  const isLeftSide = senderTeam === 'light';

  // Don't show until video is loaded
  if (!isVideoLoaded) {
    return (
      <div className="hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          onCanPlay={handleVideoReady}
          onLoadedData={handleVideoReady}
          muted
          playsInline
          preload="auto"
        />
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "fixed z-[100] pointer-events-none transition-all duration-700 ease-out",
        isLeftSide ? "left-[8%] lg:left-[12%] xl:left-[15%]" : "right-[8%] lg:right-[12%] xl:right-[15%]",
        "top-[9vh] lg:top-[11vh] xl:top-[13vh]",
        isVisible && !isLeaving ? "opacity-100" : "opacity-0",
        isLeaving && "animate-fade-out"
      )}
      style={{
        transform: `${isVisible && !isLeaving ? 'translateY(0)' : 'translateY(-20px)'}`,
      }}
    >
      {/* Speech bubble with video */}
      <div className={cn(
        "relative backdrop-blur-lg rounded-2xl p-1.5 shadow-2xl border-2",
        "w-[90px] h-[90px] animate-bounce-gentle",
        senderTeam === 'dark' 
          ? "bg-blue-900/80 border-blue-500/60" 
          : "bg-red-900/80 border-red-500/60"
      )}>
        {/* Sender name */}
        <div className={cn(
          "absolute -top-7 left-2 text-xs font-black px-2 py-1 rounded-lg z-10",
          "backdrop-blur-md border",
          senderTeam === 'dark'
            ? "bg-blue-900/80 text-blue-100 border-blue-500/50"
            : "bg-red-900/80 text-red-100 border-red-500/50"
        )}
        style={{
          textShadow: senderTeam === "dark" 
            ? '0 0 10px rgba(59,130,246,1), 0 2px 4px rgba(0,0,0,0.8)' 
            : '0 0 10px rgba(239,68,68,1), 0 2px 4px rgba(0,0,0,0.8)',
          boxShadow: senderTeam === "dark"
            ? '0 2px 8px rgba(59,130,246,0.5), 0 0 15px rgba(59,130,246,0.3)'
            : '0 2px 8px rgba(239,68,68,0.5), 0 0 15px rgba(239,68,68,0.3)'
        }}>
          {senderUsername}
        </div>
        
        {/* Circular video container */}
        <div 
          className={cn(
            "relative w-full h-full rounded-full overflow-hidden",
            "border-2",
            senderTeam === 'dark' ? "border-blue-400/50" : "border-red-400/50"
          )}
          style={{
            boxShadow: senderTeam === 'dark'
              ? '0 0 15px rgba(59,130,246,0.4) inset'
              : '0 0 15px rgba(239,68,68,0.4) inset'
          }}
        >
          <video
            ref={videoRef}
            src={videoSrc}
            muted
            playsInline
            className="w-full h-full object-cover"
            style={{
              clipPath: 'circle(50%)'
            }}
          />
        </div>
        
        {/* Tail */}
        <div 
          className={cn(
            "absolute -bottom-2 w-3 h-3 transform rotate-45",
            isLeftSide ? "left-4" : "right-4",
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
            transform: translateY(-3px);
          }
        }
      `}</style>
    </div>
  );
}