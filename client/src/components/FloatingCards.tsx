import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface FloatingCard {
  id: number;
  word: string;
  type: "dark" | "light" | "neutral" | "assassin";
  x: number;
  y: number;
  z: number;
  rotation: number;
  scale: number;
}

const cardStyles = {
  dark: {
    gradient: "from-blue-600 via-blue-700 to-blue-900",
    border: "border-blue-500",
    shadow: "shadow-blue-500/30",
    text: "text-blue-100"
  },
  light: {
    gradient: "from-red-600 via-red-700 to-red-900",
    border: "border-red-500",
    shadow: "shadow-red-500/30",
    text: "text-red-100"
  },
  neutral: {
    gradient: "from-gray-600 via-gray-700 to-gray-800",
    border: "border-gray-500",
    shadow: "shadow-gray-500/30",
    text: "text-gray-100"
  },
  assassin: {
    gradient: "from-purple-900 via-black to-purple-950",
    border: "border-purple-600",
    shadow: "shadow-purple-600/50",
    text: "text-purple-100"
  }
};

const sampleWords = [
  { word: "KALE", type: "dark" as const },
  { word: "KÖPRÜ", type: "light" as const },
  { word: "ORMAN", type: "neutral" as const },
  { word: "DENIZ", type: "dark" as const },
  { word: "GÜNEŞ", type: "light" as const },
  { word: "BULUT", type: "neutral" as const },
  { word: "DAĞ", type: "dark" as const },
  { word: "YILDIZ", type: "light" as const },
  { word: "KAPI", type: "neutral" as const },
  { word: "PENCERE", type: "dark" as const },
  { word: "GÖL", type: "light" as const },
  { word: "ŞEHİR", type: "neutral" as const },
  { word: "ROBOT", type: "assassin" as const },
  { word: "MARS", type: "dark" as const },
  { word: "AY", type: "light" as const }
];

export function FloatingCards() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cards, setCards] = useState<FloatingCard[]>([]);

  useEffect(() => {
    // Generate random positions for cards
    const generatedCards = sampleWords.map((word, index) => ({
      id: index,
      word: word.word,
      type: word.type,
      x: Math.random() * 100, // Percentage position
      y: Math.random() * 100,
      z: Math.floor(Math.random() * 5), // Layer depth
      rotation: (Math.random() - 0.5) * 30, // -15 to 15 degrees
      scale: 0.8 + Math.random() * 0.4 // 0.8 to 1.2 scale
    }));
    setCards(generatedCards);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      setMousePosition({ x: x - 0.5, y: y - 0.5 });
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      return () => container.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  const getCardTransform = (card: FloatingCard) => {
    // Calculate parallax based on z-index (deeper cards move less)
    const parallaxMultiplier = 1 - (card.z * 0.15);
    const translateX = mousePosition.x * 30 * parallaxMultiplier;
    const translateY = mousePosition.y * 30 * parallaxMultiplier;
    
    return {
      transform: `
        translate(${translateX}px, ${translateY}px) 
        rotate(${card.rotation}deg) 
        scale(${card.scale})
      `,
      zIndex: card.z * 10,
      // Stronger shadow for cards higher in z-index
      filter: `drop-shadow(0 ${4 + card.z * 2}px ${8 + card.z * 3}px rgba(0,0,0,${0.3 + card.z * 0.1}))`
    };
  };

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ perspective: '1000px' }}
    >
      {cards.map((card) => {
        const style = cardStyles[card.type];
        const transform = getCardTransform(card);
        
        return (
          <div
            key={card.id}
            className={cn(
              "absolute w-32 h-20 sm:w-40 sm:h-24 md:w-48 md:h-28 rounded-lg border-2 backdrop-blur-sm",
              "transition-transform duration-300 ease-out",
              "pointer-events-auto hover:scale-110",
              style.border,
              style.shadow,
              `bg-gradient-to-br ${style.gradient}`
            )}
            style={{
              left: `${card.x}%`,
              top: `${card.y}%`,
              transform: transform.transform,
              zIndex: transform.zIndex,
              filter: transform.filter,
              opacity: 0.85 + (card.z * 0.03) // Slightly more opaque for higher cards
            }}
          >
            {/* Card layers effect */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-transparent via-white/5 to-white/10" />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-transparent via-transparent to-black/20" />
            
            {/* Card content */}
            <div className="relative h-full flex items-center justify-center p-2">
              <span className={cn(
                "text-sm sm:text-base md:text-lg font-bold tracking-wider",
                style.text,
                "drop-shadow-lg"
              )}>
                {card.word}
              </span>
            </div>
            
            {/* Reveal effect overlay */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-white/0 via-white/5 to-white/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
          </div>
        );
      })}
    </div>
  );
}