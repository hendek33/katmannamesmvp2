import { type Card } from "@shared/schema";
import { cn } from "@/lib/utils";

interface GameCardProps {
  card: Card;
  onReveal?: () => void;
  isSpymaster: boolean;
  disabled?: boolean;
}

export function GameCard({ card, onReveal, isSpymaster, disabled }: GameCardProps) {
  const getCardStyles = () => {
    if (card.revealed) {
      switch (card.type) {
        case "dark":
          return "bg-metallic-dark border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.4)]";
        case "light":
          return "bg-neon-light border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.4)]";
        case "neutral":
          return "bg-neutral-texture border-gray-500/50 shadow-sm";
        case "assassin":
          return "bg-assassin-danger border-red-600/70 shadow-[0_0_25px_rgba(220,38,38,0.5)] animate-pulse";
      }
    }
    
    if (isSpymaster) {
      switch (card.type) {
        case "dark":
          return "bg-metallic-dark/30 border-blue-500/30";
        case "light":
          return "bg-neon-light/30 border-red-500/30";
        case "neutral":
          return "bg-neutral-texture/30 border-gray-500/30";
        case "assassin":
          return "bg-assassin-danger/30 border-red-600/40";
      }
    }
    
    return "bg-card border-card-border";
  };

  const getTextColor = () => {
    if (!card.revealed && !isSpymaster) return "text-foreground";
    
    switch (card.type) {
      case "dark":
        return "text-blue-100 font-semibold";
      case "light":
        return "text-red-100 font-semibold";
      case "neutral":
        return "text-gray-200";
      case "assassin":
        return "text-red-100 font-bold";
      default:
        return "text-foreground";
    }
  };

  const canClick = !card.revealed && !disabled && !isSpymaster && onReveal;

  return (
    <button
      onClick={canClick ? onReveal : undefined}
      disabled={!canClick}
      data-testid={`card-${card.id}`}
      className={cn(
        "relative rounded-md border-2 p-3 md:p-4 min-h-[80px] md:min-h-[100px]",
        "transition-all duration-300",
        "bg-grid-pattern",
        getCardStyles(),
        canClick && "hover-elevate active-elevate-2 cursor-pointer hover:scale-105",
        card.revealed && "opacity-90",
        !canClick && "cursor-default"
      )}
    >
      <div className={cn(
        "flex items-center justify-center h-full text-center text-sm md:text-base font-medium leading-tight",
        getTextColor()
      )}>
        {card.word}
      </div>
      
      {card.revealed && (
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent pointer-events-none rounded-md" />
      )}
    </button>
  );
}
