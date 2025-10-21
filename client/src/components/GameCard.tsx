import { type Card } from "@shared/schema";
import { cn } from "@/lib/utils";
import { CheckSquare } from "lucide-react";
import { useState, useEffect } from "react";
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
}

export function GameCard({ card, onReveal, onVote, isSpymaster, disabled, voters = [], hasVoted = false, revealedImage }: GameCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isLifted, setIsLifted] = useState(false);

  const getCardColors = () => {
    if (card.revealed || isSpymaster) {
      switch (card.type) {
        case "dark":
          return {
            bg: "bg-gradient-to-br from-blue-500 to-blue-600",
            border: "border-blue-400",
            panel: "bg-white",
            textColor: "text-black",
            shadow: "shadow-xl shadow-blue-900/50",
          };
        case "light":
          return {
            bg: "bg-gradient-to-br from-red-500 to-red-600",
            border: "border-red-400",
            panel: "bg-white",
            textColor: "text-black",
            shadow: "shadow-xl shadow-red-900/50",
          };
        case "neutral":
          return {
            bg: "bg-gradient-to-br from-stone-200 to-stone-300",
            border: "border-stone-100",
            panel: "bg-white",
            textColor: "text-black",
            shadow: "shadow-lg shadow-stone-700/30",
          };
        case "assassin":
          return {
            bg: "bg-gradient-to-br from-gray-600 to-gray-700",
            border: "border-gray-500",
            panel: "bg-black",
            textColor: "text-white",
            shadow: "shadow-2xl shadow-black/70",
          };
      }
    }
    
    return {
      bg: "bg-gradient-to-br from-slate-300 to-slate-400",
      border: "border-slate-200",
      panel: "bg-white",
      textColor: "text-black",
      shadow: "shadow-lg shadow-slate-800/40",
    };
  };

  const canVote = !card.revealed && !disabled && !isSpymaster && onVote;
  const canReveal = !card.revealed && !disabled && !isSpymaster && onReveal;
  const colors = getCardColors();
  
  // Preload image when card is revealed
  useEffect(() => {
    if (card.revealed && revealedImage) {
      const img = new Image();
      img.onload = () => setImageLoaded(true);
      img.src = revealedImage;
    } else {
      setImageLoaded(false);
      setIsLifted(false); // Reset lift state when card is unrevealed
    }
  }, [card.revealed, revealedImage]);

  return (
    <div
      className={cn(
        "relative rounded-lg border-[6px] p-0.5 sm:p-1 lg:p-1.5 w-full",
        "aspect-[3/2]",
        "flex flex-col",
        !card.revealed && "overflow-hidden",
        card.revealed && "overflow-visible",
        "transition-all transform-gpu duration-500",
        colors.border,
        colors.bg,
        colors.shadow,
        !card.revealed && "cursor-pointer",
        "ring-2 ring-black/20",
        card.revealed && "animate-pulse-once",
        "shadow-inner"
      )}
      style={{
        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
        overflow: card.revealed ? 'visible' : 'hidden'
      }}
    >
      {/* Logo watermark */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${logoImg})`,
          backgroundSize: '85%',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.15,
          filter: 'grayscale(100%)',
          zIndex: 10
        }}
      />
      
      {/* Revealed card overlay - drops in after image loads */}
      {card.revealed && imageLoaded && revealedImage && (
        <div 
          className={cn(
            "absolute cursor-pointer animate-card-drop rounded-lg",
            isLifted ? "card-lifted" : "card-not-lifted"
          )}
          onClick={() => setIsLifted(!isLifted)}
          title={isLifted ? "Kartı indirmek için tıklayın" : "Altındaki kelimeyi görmek için tıklayın"}
          style={{
            top: '-6px',
            left: '-6px',
            right: '-6px', 
            bottom: '-6px',
            backgroundImage: `url('${revealedImage}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            zIndex: isLifted ? 30 : 20,
            boxShadow: isLifted ? '0 20px 40px rgba(0,0,0,0.5)' : '0 4px 8px rgba(0,0,0,0.3)',
            transform: 'scale(1.05)'
          }}
        />
      )}
      
      {/* Reveal button in top-left corner */}
      {canReveal && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onReveal();
          }}
          className="absolute top-1 left-1 z-10 p-1 bg-green-600/80 hover:bg-green-500 rounded transition-colors"
          title="Kartı Aç"
        >
          <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
        </button>
      )}
      
      {/* Voters display */}
      {voters.length > 0 && !card.revealed && (
        <div className="absolute top-1 right-1 z-10 max-w-[60%]">
          <div className="flex flex-wrap gap-0.5 justify-end">
            {voters.map((voter, idx) => (
              <span
                key={voter}
                className={cn(
                  "px-1 py-0.5 text-[8px] sm:text-[9px] rounded animate-pop-in",
                  hasVoted && voter === voters[voters.length - 1] ? 
                    "bg-yellow-500/90 text-white font-bold" : 
                    "bg-black/60 text-white"
                )}
                style={{
                  animationDelay: `${idx * 0.05}s`
                }}
              >
                {voter}
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
          "flex-1 w-full flex flex-col",
          canVote && "hover:scale-[1.02] active:scale-[1.01]"
        )}
      >
        <div className="flex-1" />
        
        {/* Word panel - always show */}
        <div className={cn(
          "relative rounded px-1 py-0.5 sm:px-1.5 sm:py-0.5 md:px-2 md:py-1 lg:px-2.5 lg:py-1 xl:px-3 xl:py-1 2xl:px-3 2xl:py-1",
          "flex items-center justify-center",
          "border-t border-black/20",
          colors.panel
        )}>
          <span className={cn(
            "font-bold text-[8px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base uppercase tracking-wide text-center leading-tight drop-shadow-md",
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
