import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface TomatoProps {
  playerId: string;
  username: string;
  fromTeam: "dark" | "light";
  targetTeam: "dark" | "light";
  timestamp: number;
  expiresAt: number;
}

interface TomatoOverlayProps {
  tomatoes: TomatoProps[];
  setTomatoes: (value: TomatoProps[] | ((prev: TomatoProps[]) => TomatoProps[])) => void;
  targetTeam: "dark" | "light" | null; // Current player's team
}

export function TomatoOverlay({ tomatoes, setTomatoes, targetTeam }: TomatoOverlayProps) {
  const [visibleTomatoes, setVisibleTomatoes] = useState<TomatoProps[]>([]);

  useEffect(() => {
    const filteredTomatoes = tomatoes.filter(tomato => tomato.targetTeam === targetTeam);
    setVisibleTomatoes(filteredTomatoes);
  }, [tomatoes, targetTeam]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTomatoes(prev => prev.filter(tomato => now < tomato.expiresAt));
    }, 100);

    return () => clearInterval(interval);
  }, [setTomatoes]);

  return (
    <>
      {visibleTomatoes.map((tomato) => (
        <TomatoAnimation
          key={`${tomato.playerId}-${tomato.timestamp}`}
          tomato={tomato}
        />
      ))}
    </>
  );
}

function TomatoAnimation({ tomato }: { tomato: TomatoProps }) {
  const [position, setPosition] = useState({ x: 0, y: 100 });
  const [rotation, setRotation] = useState(0);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Random starting X position
    const startX = Math.random() * 80 + 10; // 10% to 90% of screen width
    setPosition({ x: startX, y: -10 });

    // Animate falling
    const interval = setInterval(() => {
      setPosition(prev => ({
        x: prev.x + (Math.random() - 0.5) * 2, // Slight horizontal drift
        y: Math.min(prev.y + 5, 110) // Fall down
      }));
      setRotation(prev => prev + 15); // Rotate while falling
    }, 50);

    // Start fading after 2 seconds
    setTimeout(() => {
      setOpacity(0);
    }, 2000);

    // Clean up after 3 seconds
    setTimeout(() => {
      clearInterval(interval);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        opacity,
        transition: "opacity 1s ease-out"
      }}
    >
      {/* Tomato emoji with splat effect */}
      <div className="relative">
        <div className="text-6xl animate-bounce">🍅</div>
        {position.y >= 100 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 bg-red-500/50 rounded-full animate-pulse blur-xl" />
          </div>
        )}
      </div>
      
      {/* Sender name */}
      <div className={cn(
        "absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap",
        "text-sm font-bold px-2 py-1 rounded-md",
        "bg-gradient-to-r",
        tomato.fromTeam === "dark" 
          ? "from-blue-500/80 to-blue-600/80 text-blue-100"
          : "from-red-500/80 to-red-600/80 text-red-100"
      )}>
        {tomato.username} fırlattı!
      </div>
    </div>
  );
}