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
            border: "border-blue-500",
            panel: "bg-blue-900",
            shadow: "shadow-lg shadow-blue-500/50",
          };
        case "light":
          return {
            bg: "bg-gradient-to-b from-red-400 to-red-500",
            border: "border-red-500",
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
            border: "border-gray-900",
            panel: "bg-black",
            shadow: "shadow-xl shadow-gray-900/60",
          };
      }
    }
    
    return {
      bg: "bg-gradient-to-b from-slate-300 to-slate-400",
      border: "border-slate-500",
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
        "relative rounded-xl border-[3px] p-2.5 min-h-[90px] md:min-h-[110px]",
        "transition-all duration-300 flex flex-col overflow-hidden",
        colors.border,
        colors.bg,
        colors.shadow,
        canClick && "cursor-pointer hover:scale-[1.08] hover:-translate-y-2 active:scale-100",
        !card.revealed && !isSpymaster && "opacity-100",
        card.revealed && "opacity-95",
        !canClick && "cursor-default"
      )}
    >
      <div className="flex-1" />
      
      <div className={cn(
        "rounded-lg px-3 py-2.5 flex items-center justify-center min-h-[38px]",
        colors.panel
      )}>
        <span className="text-white font-bold text-sm md:text-base uppercase tracking-wider text-center leading-tight">
          {card.word}
        </span>
      </div>
    </button>
  );
}
