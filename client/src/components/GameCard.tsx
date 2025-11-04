import { type Card } from "@shared/schema";
import { cn } from "@/lib/utils";
import { CheckSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import logoImg from "@assets/logoo.png";

interface GameCardProps {
  card: Card;
  onReveal?: () => void;
  onVote?: () => void;
  isSpymaster: boolean;
  disabled?: boolean;
  voters?: string[];
  hasVoted?: boolean;
  revealedImage?: string;
  rowIndex?: number;
  isLastCard?: boolean;
  isAssassinCard?: boolean;
  gameEnded?: boolean;
  isKnownCard?: boolean;
}

export function GameCard({ card, onReveal, onVote, isSpymaster, disabled, voters = [], hasVoted = false, revealedImage, rowIndex = 0, isLastCard = false, isAssassinCard = false, gameEnded = false, isKnownCard = false }: GameCardProps) {
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
          console.warn("Unknown card type:", card.type);
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
          background: `linear-gradient(to bottom left, 
            rgba(255,255,255,0.15) 0%, 
            transparent 70%)`,
          zIndex: 11
        }}
      />
      
      
      {/* Logo watermark - lower z-index for revealed cards */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${logoImg})`,
          backgroundSize: '85%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.15,
          filter: 'grayscale(100%)',
          zIndex: card.revealed ? 1 : 10
        }}
      />
      
      {/* Black particles for assassin card */}
      {isAssassinCard && gameEnded && (
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 200 }}>
          {[...Array(20)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-2 h-2 bg-black rounded-full animate-assassin-particle"
              style={{
                left: '50%',
                top: '50%',
                animationDelay: `${i * 0.1}s`,
                '--particle-x': `${(Math.random() - 0.5) * 200}px`,
                '--particle-y': `${(Math.random() - 0.5) * 200}px`,
              } as React.CSSProperties}
            />
          ))}
        </div>
      )}
      
      {/* Revealed card overlay with 3D container - drops in after image loads */}
      {card.revealed && imageLoaded && revealedImage && (
        <div 
          className="absolute inset-0 card-3d-container"
          style={{
            zIndex: isLifted ? 999 : 15,
            pointerEvents: 'none'
          }}
        >
          <div 
            className={cn(
              "absolute cursor-pointer animate-card-drop rounded-lg",
              isLifted ? "card-lifted" : "card-not-lifted"
            )}
            onClick={(e) => {
              e.stopPropagation();
              setIsLifted(!isLifted);
            }}
            title={isLifted ? "Kartı indirmek için tıklayın" : "Altındaki kelimeyi görmek için tıklayın"}
            style={{
              top: card.type === 'assassin' ? '0px' : '-6px',
              left: card.type === 'assassin' ? '0px' : '-6px',
              right: card.type === 'assassin' ? '0px' : '-6px', 
              bottom: card.type === 'assassin' ? '0px' : '-6px',
              backgroundImage: `url('${revealedImage}')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              boxShadow: isLifted 
                ? '0 20px 40px rgba(0,0,0,0.5), 0 10px 20px rgba(0,0,0,0.3)'
                : '0 4px 8px rgba(0,0,0,0.3)',
              pointerEvents: 'auto'
            }}
          />
        </div>
      )}
      
      {/* Reveal button in top-left corner */}
      {canReveal && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReveal();
          }}
          className="absolute top-1 left-1 z-20 p-1 bg-green-600/80 hover:bg-green-500 rounded transition-colors"
          title="Kartı Aç"
        >
          <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </button>
      )}

      {/* Voters display */}
      {voters.length > 0 && !card.revealed && (
        <div className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 z-[5] max-w-[85%]">
          <div className="flex flex-wrap gap-0.5 justify-end">
            {voters.map((voter, idx) => (
              <span
                key={voter}
                className={cn(
                  "inline-block px-0.5 py-0 sm:px-0.5 sm:py-0 md:px-1 md:py-0.5 lg:px-1 lg:py-0.5 xl:px-1.5 xl:py-0.5",
                  "text-[5px] sm:text-[6px] md:text-[7px] lg:text-[9px] xl:text-[10px] 2xl:text-[11px]",
                  "rounded animate-pop-in bg-red-950/80 text-red-200",
                  hasVoted && voter === voters[voters.length - 1] ? "font-bold" : ""
                )}
                style={{
                  animationDelay: `${idx * 0.05}s`
                }}
                title={voter}
              >
                {voter.length > 6 ? voter.substring(0, 6) + '...' : voter}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <button
        onClick={canVote ? onVote : undefined}
        disabled={!canVote}
        data-testid={`card-${card.id}`}
        className={cn(
          "flex-1 w-full flex flex-col"
        )}
      >
        <div className="flex-1" />
        
        {/* Word panel - always show */}
        <div className={cn(
          "relative rounded-md px-0.5 py-0 sm:px-0.5 sm:py-0.5 md:px-1 md:py-0.5 lg:px-1.5 lg:py-0.5 xl:px-2 xl:py-1 2xl:px-3 2xl:py-1",
          "flex items-center justify-center",
          "border-t border-black/20",
          "backdrop-blur-none bg-opacity-100",
          colors.panel
        )} style={{ position: 'relative', zIndex: 12 }}>
          <span className={cn(
            "font-bold text-[8px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg uppercase tracking-wide text-center leading-tight drop-shadow-md",
            colors.textColor
          )}>
            {card.word}
          </span>
        </div>
      </button>
      
      {/* Bottom edge shadow for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/30 to-transparent" />
    </div>
  );
}
