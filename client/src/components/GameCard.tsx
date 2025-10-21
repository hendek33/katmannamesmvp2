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
            bg: "bg-gradient-to-br from-blue-500 to-blue-600",
            border: "border-blue-700",
            panel: "bg-blue-900",
            shadow: "shadow-xl shadow-blue-900/50",
            texture: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent",
          };
        case "light":
          return {
            bg: "bg-gradient-to-br from-red-500 to-red-600",
            border: "border-red-700",
            panel: "bg-red-900",
            shadow: "shadow-xl shadow-red-900/50",
            texture: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-400/20 via-transparent to-transparent",
          };
        case "neutral":
          return {
            bg: "bg-gradient-to-br from-stone-200 to-stone-300",
            border: "border-stone-400",
            panel: "bg-stone-700",
            shadow: "shadow-lg shadow-stone-700/30",
            texture: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-stone-100/30 via-transparent to-transparent",
          };
        case "assassin":
          return {
            bg: "bg-gradient-to-br from-gray-800 to-gray-900",
            border: "border-gray-950",
            panel: "bg-black",
            shadow: "shadow-2xl shadow-black/70",
            texture: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-600/20 via-transparent to-transparent",
          };
      }
    }
    
    return {
      bg: "bg-gradient-to-br from-slate-300 to-slate-400",
      border: "border-slate-500",
      panel: "bg-slate-700",
      shadow: "shadow-lg shadow-slate-800/40",
      texture: "",
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
        "relative rounded-lg border-2 p-0.5 sm:p-1 lg:p-1.5 w-full",
        "aspect-[3/2]",
        "flex flex-col overflow-hidden",
        "transition-transform transform-gpu",
        colors.border,
        colors.bg,
        colors.shadow,
        canClick && "cursor-pointer hover:scale-[1.05] hover:-translate-y-1 active:scale-[1.02]",
        !card.revealed && !isSpymaster && "opacity-100",
        card.revealed && "opacity-95",
        !canClick && "cursor-default"
      )}
      style={{
        backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.03) 10px, rgba(255,255,255,0.03) 20px),
                         repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)`,
      }}
    >
      {/* Card texture overlay */}
      <div className={cn("absolute inset-0 pointer-events-none", colors.texture)} />
      
      {/* Subtle top edge highlight for depth */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
      
      <div className="flex-1" />
      
      {/* Word panel */}
      <div className={cn(
        "relative rounded px-0.5 py-0.5 sm:px-1 sm:py-0.5 md:px-2 md:py-1 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 2xl:px-5 2xl:py-2.5",
        "flex items-center justify-center",
        "border-t border-black/20",
        colors.panel
      )}>
        <span className="text-white font-bold text-[8px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg uppercase tracking-wide text-center leading-tight drop-shadow-md">
          {card.word}
        </span>
      </div>
      
      {/* Bottom edge shadow for depth */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-black/30 to-transparent" />
    </button>
  );
}
