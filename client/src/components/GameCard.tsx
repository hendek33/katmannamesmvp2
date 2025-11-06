import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Users, Eye, Target } from "lucide-react";

interface GameCardProps {
  card: {
    id: string;
    word: string;
    type: "dark" | "light" | "neutral" | "assassin";
    revealed: boolean;
  };
  onReveal?: () => void;
  onVote?: () => void;
  isSpymaster: boolean;
  disabled?: boolean;
  voters?: string[];
  hasVoted?: boolean;
  revealedImage?: string | null;
  rowIndex: number;
  isLastCard?: boolean;
  isAssassinCard?: boolean;
  gameEnded?: boolean;
  isKnownCard?: boolean; // For prophets who can see all cards
}

export function GameCard({
  card,
  onReveal,
  onVote,
  isSpymaster,
  disabled = false,
  voters = [],
  hasVoted = false,
  revealedImage,
  rowIndex,
  isLastCard = false,
  isAssassinCard = false,
  gameEnded = false,
  isKnownCard = false,
}: GameCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLifted, setIsLifted] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);


  const getCardColors = () => {
    // Show colors for: revealed cards, spymasters, prophets (isKnownCard), or unrevealed cards when game ends
    if (card.revealed || isSpymaster || isKnownCard || (gameEnded && !card.revealed)) {
      switch (card.type) {
        case "dark":
          return {
            bg: "bg-gradient-to-br from-blue-700 to-blue-800",
            border: "border-blue-400",
            panel: "bg-blue-900",
            textColor: "text-white",
            shadow: "",
          };
        case "light":
          return {
            bg: "bg-gradient-to-br from-red-700 to-red-800",
            border: "border-red-400",
            panel: "bg-red-900",
            textColor: "text-white",
            shadow: "",
          };
        case "neutral":
          return {
            bg: "bg-gradient-to-br from-[#d4c0a0] to-[#c9b592]",
            border: "border-[#b8a483]",
            panel: "bg-[#9b8872]",
            textColor: "text-white",
            shadow: "",
          };
        case "assassin":
          return {
            bg: "bg-gradient-to-br from-gray-900 to-black",
            border: "border-gray-700",
            panel: "bg-black",
            textColor: "text-white",
            shadow: "",
          };
        default:
          // This should not happen, but if it does, return neutral colors
          return {
            bg: "bg-gradient-to-br from-[#d4c0a0] to-[#c9b592]",
            border: "border-[#b8a483]",
            panel: "bg-[#9b8872]",
            textColor: "text-white",
            shadow: "",
          };
      }
    }
    
    // Unrevealed cards for regular players (not spymasters, not prophets)
    return {
      bg: "bg-gradient-to-br from-[#d4c0a0] to-[#c9b592]",
      border: "border-[#b8a483]",
      panel: "bg-[#9b8872]",
      textColor: "text-white",
      shadow: "",
    };
  };

  const canVote = !card.revealed && !disabled && !isSpymaster && onVote;
  const canReveal = !card.revealed && !disabled && !isSpymaster && onReveal;
  const colors = getCardColors();
  
  
  
  // Preload image when card is revealed
  useEffect(() => {
    if (card.revealed && revealedImage) {
      // Trigger reveal animation
      setIsRevealing(true);
      
      const img = new Image();
      img.onload = () => {
        setImageLoaded(true);
        // Remove revealing state after animation completes
        setTimeout(() => setIsRevealing(false), 600);
      };
      img.src = revealedImage;
    } else {
      setImageLoaded(false);
      setIsLifted(false); // Reset lift state when card is unrevealed
      setIsRevealing(false);
    }
  }, [card.revealed, revealedImage]);

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative rounded-lg border-[8px] p-0.5 sm:p-1 lg:p-1.5 w-full",
        "aspect-[3/2]",
        "flex flex-col",
        !card.revealed && "overflow-hidden",
        card.revealed && "overflow-visible",
        "transition-all transform-gpu duration-200",
        colors.border,
        colors.bg,
        colors.shadow,
        !card.revealed && "cursor-pointer",
        card.revealed && "cursor-pointer",
        "ring-2 ring-black/20",
        // Animation classes - takım bazlı efektler direkt kart açıldığında (bounce kaldırıldı)
        isRevealing && card.type === "dark" && "animate-card-flip animate-reveal-glow",
        isRevealing && card.type === "light" && "animate-card-flip animate-reveal-glow",
        isRevealing && card.type === "neutral" && "animate-card-flip animate-reveal-glow animate-card-shake",
        isRevealing && card.type === "assassin" && "animate-card-flip animate-reveal-glow",
        card.revealed && !isRevealing && !isAssassinCard && !isLastCard && "animate-pulse-once",
        isAssassinCard && gameEnded && "animate-assassin-reveal",
        isLastCard && gameEnded && !isAssassinCard && "border-green-500 ring-4 ring-green-400/50",
        "shadow-inner",
        canVote && "hover:brightness-125 hover:contrast-110"
      )}
      style={{
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3), 0 8px 12px rgba(0,0,0,0.6), 0 4px 6px rgba(0,0,0,0.4)',
        borderRadius: '8px',
        overflow: card.revealed ? 'visible' : 'hidden',
        transformStyle: 'preserve-3d',
        transition: 'all 0.2s ease-out',
        zIndex: isLifted ? 1000 : card.revealed ? 20 : 1
      }}
    >
      {/* Soft gradient overlay */}
      <div 
        className="absolute -inset-[2px] rounded-lg pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.05) 100%)',
          mixBlendMode: 'screen'
        }}
      />
      
      {/* Inner content wrapper */}
      <div className="relative h-full flex flex-col">
        {/* Top panel with word */}
        <div
          className={cn(
            "relative rounded-md p-2 sm:p-3 min-h-0 flex-1 flex items-center justify-center",
            colors.panel,
            "transition-all duration-200",
            "shadow-lg"
          )}
          style={{
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)',
            borderRadius: '4px'
          }}
        >
          {/* Revealed Image */}
          {card.revealed && revealedImage && (
            <div className="absolute inset-0">
              <img 
                src={revealedImage}
                alt={card.word}
                className={cn(
                  "w-full h-full object-cover rounded-md transition-opacity duration-500",
                  imageLoaded ? "opacity-100" : "opacity-0"
                )}
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-md" />
            </div>
          )}

          {/* Word Text */}
          <span
            className={cn(
              "select-none transition-all duration-200 text-center relative z-10",
              "font-bold break-all leading-tight px-1",
              // Dynamic font sizes based on word length
              card.word.length <= 5 && "text-lg sm:text-2xl md:text-3xl lg:text-xl xl:text-2xl 2xl:text-3xl",
              card.word.length > 5 && card.word.length <= 8 && "text-base sm:text-xl md:text-2xl lg:text-lg xl:text-xl 2xl:text-2xl",
              card.word.length > 8 && card.word.length <= 11 && "text-sm sm:text-lg md:text-xl lg:text-base xl:text-lg 2xl:text-xl",
              card.word.length > 11 && card.word.length <= 14 && "text-xs sm:text-base md:text-lg lg:text-sm xl:text-base 2xl:text-lg",
              card.word.length > 14 && "text-[10px] sm:text-sm md:text-base lg:text-xs xl:text-sm 2xl:text-base",
              // Word display
              card.revealed ? "text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" : colors.textColor,
              !card.revealed && "shadow-sm"
            )}
            style={{
              textShadow: card.revealed ? '0 1px 2px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)' : '0 1px 2px rgba(0,0,0,0.3)',
              letterSpacing: '0.05em',
              fontFamily: 'Poppins, sans-serif'
            }}
          >
            {card.word}
          </span>

          {/* Eye icon for prophets who can see the card type */}
          {isKnownCard && !card.revealed && !isSpymaster && (
            <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1">
              <Eye className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-purple-300 opacity-40" />
            </div>
          )}
        </div>

        {/* Bottom action panel (only for unrevealed cards) */}
        {!card.revealed && (
          <div className="mt-1 px-1 py-0.5 sm:py-1 flex justify-between items-center">
            {/* Vote Button */}
            {canVote && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  onVote();
                }}
                disabled={disabled}
                className={cn(
                  "h-5 sm:h-6 px-1 sm:px-1.5 bg-slate-800/40 hover:bg-slate-800/60 flex items-center gap-0.5 rounded-md",
                  hasVoted && "bg-green-900/50 border border-green-600/50"
                )}
              >
                <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/80" />
                {voters.length > 0 && (
                  <span className="text-[8px] sm:text-[10px] text-white/80 font-medium">
                    {voters.length}
                  </span>
                )}
              </Button>
            )}

            {/* Reveal Button */}
            {canReveal && (
              <Button
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onReveal) {
                    // Lift card first
                    setIsLifted(true);
                    // Small delay then trigger reveal
                    setTimeout(() => {
                      onReveal();
                      setTimeout(() => {
                        setIsLifted(false); // Return to normal position after reveal
                      }, 300);
                    }, 200);
                  }
                }}
                disabled={disabled}
                className="ml-auto h-5 sm:h-6 px-1 sm:px-1.5 bg-amber-700/40 hover:bg-amber-700/60 text-white/90 rounded-md"
              >
                <Target className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="ml-0.5 text-[8px] sm:text-[10px] font-medium">SEÇ</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}