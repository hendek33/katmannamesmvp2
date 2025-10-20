import { type Card } from "@shared/schema";
import { cn } from "@/lib/utils";

interface GameCardProps {
  card: Card;
  onReveal?: () => void;
  isSpymaster: boolean;
  disabled?: boolean;
}

export function GameCard({ card, onReveal, isSpymaster, disabled }: GameCardProps) {
  const getCardColors = () => {
    if (card.revealed || isSpymaster) {
      switch (card.type) {
        case "dark":
          return {
            bg: "bg-gradient-to-b from-blue-400 to-blue-500",
            border: "border-blue-300",
            panel: "bg-blue-900",
            shadow: "shadow-lg shadow-blue-500/50",
          };
        case "light":
          return {
            bg: "bg-gradient-to-b from-red-400 to-red-500",
            border: "border-red-300",
            panel: "bg-red-900",
            shadow: "shadow-lg shadow-red-500/50",
          };
        case "neutral":
          return {
            bg: "bg-gradient-to-b from-stone-100 to-stone-200",
            border: "border-stone-300",
            panel: "bg-stone-700",
            shadow: "shadow-md",
          };
        case "assassin":
          return {
            bg: "bg-gradient-to-b from-gray-700 to-gray-800",
            border: "border-gray-600",
            panel: "bg-black",
            shadow: "shadow-xl shadow-gray-900/60",
          };
      }
    }
    
    return {
      bg: "bg-gradient-to-b from-slate-300 to-slate-400",
      border: "border-slate-400",
      panel: "bg-slate-700",
      shadow: "shadow-md",
    };
  };

  const canClick = !card.revealed && !disabled && !isSpymaster && onReveal;
  const colors = getCardColors();

  return (
    <button
      onClick={canClick ? onReveal : undefined}
      disabled={!canClick}
      data-testid={`card-${card.id}`}
      className={cn(
        "relative rounded-md border-2 p-1 md:p-1.5 w-full",
        "aspect-[4/3]",
        "transition-all duration-300 flex flex-col overflow-hidden",
        colors.border,
        colors.bg,
        colors.shadow,
        canClick && "cursor-pointer hover:scale-[1.05] hover:-translate-y-1 active:scale-100",
        !card.revealed && !isSpymaster && "opacity-100",
        card.revealed && "opacity-95",
        !canClick && "cursor-default"
      )}
    >
      <div className="flex-1" />
      
      <div className={cn(
        "rounded px-2 py-1.5 md:px-3 md:py-2 flex items-center justify-center",
        colors.panel
      )}>
        <span className="text-white font-bold text-xs md:text-sm uppercase tracking-wide text-center leading-tight">
          {card.word}
        </span>
      </div>
    </button>
  );
}
