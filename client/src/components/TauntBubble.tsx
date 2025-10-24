import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { useBubbleManager } from "@/contexts/BubbleManager";

interface TauntBubbleProps {
  senderUsername: string;
  senderTeam: "dark" | "light" | null;
  videoSrc: string;
  timestamp?: number;
}

export function TauntBubble({ senderUsername, senderTeam, videoSrc, timestamp }: TauntBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [position, setPosition] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const bubbleManager = useBubbleManager();
  const bubbleIdRef = useRef(`taunt-${timestamp || Date.now()}-${Math.random()}`);

  const handleVideoReady = () => {
    if (!isVideoLoaded) {
      setIsVideoLoaded(true);
      // Show bubble only after video is loaded
      setTimeout(() => {
        setIsVisible(true);
        if (videoRef.current) {
          videoRef.current.play()
            .catch(err => console.error('Taunt video play error:', err));
        }
      }, 100);
    }
  };

  useEffect(() => {
    if (senderTeam && senderTeam !== null) {
      // Register bubble and get initial position
      const initialPosition = bubbleManager.registerBubble(bubbleIdRef.current, 'taunt', senderTeam);
      setPosition(initialPosition);
    }
    
    // Fallback mechanism to show bubble even if video doesn't load properly
    const loadTimeout = setTimeout(() => {
      if (!isVideoLoaded) {
        console.log('Video load timeout, showing bubble anyway');
        setIsVideoLoaded(true);
        setIsVisible(true);
        if (videoRef.current && videoRef.current.readyState >= 2) {
          videoRef.current.play()
            .catch(err => console.error('Taunt video play error:', err));
        }
      }
    }, 500);
    
    // Preload the video
    if (videoRef.current) {
      // Check if video is already loaded
      if (videoRef.current.readyState >= 3) {
        handleVideoReady();
      } else {
        videoRef.current.load();
      }
    }
    
    // Start fade out after 2.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsLeaving(true);
      // Unregister after animation completes
      setTimeout(() => {
        if (senderTeam && senderTeam !== null) {
          bubbleManager.unregisterBubble(bubbleIdRef.current);
        }
      }, 700);
    }, 2500);

    return () => {
      clearTimeout(loadTimeout);
      clearTimeout(fadeOutTimer);
      if (senderTeam && senderTeam !== null) {
        bubbleManager.unregisterBubble(bubbleIdRef.current);
      }
    };
  }, [senderTeam, bubbleManager, timestamp]);

  // Update position when bubble manager changes
  useEffect(() => {
    if (senderTeam && senderTeam !== null) {
      const interval = setInterval(() => {
        const newPosition = bubbleManager.getBubblePosition(bubbleIdRef.current);
        if (newPosition !== position) {
          setPosition(newPosition);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [position, bubbleManager, senderTeam]);

  // Determine position based on team
  const isLeftSide = senderTeam === 'dark';
  
  // Calculate vertical position based on stack index
  const baseTop = 9; // Base top position in vh
  const spacing = 14; // Spacing between bubbles in vh (larger for taunt bubbles as they're bigger)
  const topPosition = baseTop + (position * spacing);

  // Show a loading state with the video
  if (!isVideoLoaded) {
    return (
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px', visibility: 'hidden' }}>
        <video
          ref={videoRef}
          src={videoSrc}
          onCanPlay={handleVideoReady}
          onLoadedData={handleVideoReady}
          onLoadedMetadata={handleVideoReady}
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
        isVisible && !isLeaving ? "opacity-100" : "opacity-0",
        isLeaving && "animate-fade-out"
      )}
      style={{
        top: `${topPosition}vh`,
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