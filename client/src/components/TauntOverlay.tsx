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
  const [isPlaying, setIsPlaying] = useState(false);
  
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => console.error('Taunt video play error:', err));
    }
  }, []);

  // Calculate position relative to board
  const size = Math.min(boardRect.width, boardRect.height) * 0.15; // ~15% of board size (half of card size)
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
        animation: 'tauntFadeInOut 3s ease-in-out forwards'
      }}
    >
      {/* Player name above video */}
      <div 
        className={cn(
          "absolute -top-6 left-1/2 transform -translate-x-1/2 whitespace-nowrap",
          "text-sm font-bold px-2 py-1 rounded",
          taunt.team === "dark" ? "text-blue-400" : "text-red-400"
        )}
        style={{
          textShadow: taunt.team === "dark" 
            ? '0 0 10px rgba(59,130,246,0.8)' 
            : '0 0 10px rgba(239,68,68,0.8)'
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
          autoPlay
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