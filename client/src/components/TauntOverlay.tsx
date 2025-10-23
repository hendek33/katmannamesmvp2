import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TauntData {
  playerId: string;
  username: string;
  team: "dark" | "light" | null;
  videoSrc: string;
  position: { x: number; y: number };
  expiresAt: number;
}

interface TauntOverlayProps {
  taunts: TauntData[];
  boardRef: React.RefObject<HTMLDivElement>;
}

export function TauntOverlay({ taunts, boardRef }: TauntOverlayProps) {
  const [visibleTaunts, setVisibleTaunts] = useState<TauntData[]>([]);
  
  useEffect(() => {
    // Add new taunts to visible list
    const newTaunts = taunts.filter(t => 
      !visibleTaunts.find(vt => vt.playerId === t.playerId && vt.expiresAt === t.expiresAt)
    );
    
    if (newTaunts.length > 0) {
      setVisibleTaunts(prev => [...prev, ...newTaunts]);
    }
  }, [taunts]);

  useEffect(() => {
    // Clean up expired taunts
    const interval = setInterval(() => {
      const now = Date.now();
      setVisibleTaunts(prev => prev.filter(t => t.expiresAt > now));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  if (!boardRef.current || visibleTaunts.length === 0) return null;

  const boardRect = boardRef.current.getBoundingClientRect();

  return (
    <>
      {visibleTaunts.map((taunt) => (
        <TauntVideo
          key={`${taunt.playerId}-${taunt.expiresAt}`}
          taunt={taunt}
          boardRect={boardRect}
        />
      ))}
    </>
  );
}

function TauntVideo({ taunt, boardRect }: { taunt: TauntData; boardRect: DOMRect }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  
  const handleVideoReady = () => {
    setIsVideoReady(true);
    if (videoRef.current) {
      videoRef.current.play()
        .catch(err => console.error('Taunt video play error:', err));
    }
  };
  
  useEffect(() => {
    // Preload the video
    if (videoRef.current) {
      videoRef.current.load();
    }
  }, []);

  // Calculate position relative to board
  const size = Math.min(boardRect.width, boardRect.height) * 0.20; // ~20% of board size (increased from 15%)
  const left = boardRect.left + (boardRect.width * taunt.position.x) - (size / 2);
  const top = boardRect.top + (boardRect.height * taunt.position.y) - (size / 2);
  
  // Clamp to keep within board bounds
  const clampedLeft = Math.max(boardRect.left, Math.min(left, boardRect.left + boardRect.width - size));
  const clampedTop = Math.max(boardRect.top, Math.min(top, boardRect.top + boardRect.height - size));

  return (
    <div
      className="fixed pointer-events-none"
      style={{
        left: clampedLeft,
        top: clampedTop,
        width: size,
        height: size,
        zIndex: 200,
        opacity: isVideoReady ? 1 : 0,
        animation: isVideoReady ? 'tauntFadeInOut 2s ease-in-out forwards' : 'none'
      }}
    >
      {/* Player name above video - Enhanced visibility */}
      <div 
        className={cn(
          "absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap",
          "text-base font-black px-3 py-1.5 rounded-lg",
          "backdrop-blur-md border",
          taunt.team === "dark" 
            ? "bg-blue-900/80 text-blue-100 border-blue-500/50" 
            : "bg-red-900/80 text-red-100 border-red-500/50"
        )}
        style={{
          textShadow: taunt.team === "dark" 
            ? '0 0 15px rgba(59,130,246,1), 0 2px 4px rgba(0,0,0,0.8)' 
            : '0 0 15px rgba(239,68,68,1), 0 2px 4px rgba(0,0,0,0.8)',
          boxShadow: taunt.team === "dark"
            ? '0 4px 12px rgba(59,130,246,0.5), 0 0 20px rgba(59,130,246,0.3)'
            : '0 4px 12px rgba(239,68,68,0.5), 0 0 20px rgba(239,68,68,0.3)'
        }}
      >
        {taunt.username}
      </div>
      
      {/* Circular video container */}
      <div 
        className={cn(
          "relative w-full h-full rounded-full overflow-hidden",
          "border-4",
          taunt.team === "dark" ? "border-blue-500" : "border-red-500"
        )}
        style={{
          boxShadow: taunt.team === "dark"
            ? '0 0 20px rgba(59,130,246,0.6), 0 0 40px rgba(59,130,246,0.4)'
            : '0 0 20px rgba(239,68,68,0.6), 0 0 40px rgba(239,68,68,0.4)'
        }}
      >
        <video
          ref={videoRef}
          src={taunt.videoSrc}
          onCanPlay={handleVideoReady}
          onLoadedData={handleVideoReady}
          muted
          playsInline
          className="w-full h-full object-cover"
          style={{
            clipPath: 'circle(50%)'
          }}
        />
      </div>
      
      <style>{`
        @keyframes tauntFadeInOut {
          0% {
            opacity: 0;
            transform: scale(0);
          }
          20% {
            opacity: 1;
            transform: scale(1.1);
          }
          30% {
            transform: scale(1);
          }
          80% {
            opacity: 1;
            transform: scale(1);
          }
          100% {
            opacity: 0;
            transform: scale(0.8);
          }
        }
      `}</style>
    </div>
  );
}