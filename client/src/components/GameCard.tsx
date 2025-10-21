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
            bg: "bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700",
            border: "border-blue-400/80",
            panel: "bg-gradient-to-r from-blue-900 to-blue-950",
            shadow: "shadow-2xl shadow-blue-600/60",
            glow: "before:bg-gradient-radial before:from-blue-400/30 before:to-transparent",
            textGlow: "drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]",
          };
        case "light":
          return {
            bg: "bg-gradient-to-br from-red-500 via-red-600 to-red-700",
            border: "border-red-400/80",
            panel: "bg-gradient-to-r from-red-900 to-red-950",
            shadow: "shadow-2xl shadow-red-600/60",
            glow: "before:bg-gradient-radial before:from-red-400/30 before:to-transparent",
            textGlow: "drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]",
          };
        case "neutral":
          return {
            bg: "bg-gradient-to-br from-stone-200 via-stone-300 to-stone-400",
            border: "border-stone-400/70",
            panel: "bg-gradient-to-r from-stone-700 to-stone-800",
            shadow: "shadow-xl shadow-stone-600/40",
            glow: "before:bg-gradient-radial before:from-stone-300/20 before:to-transparent",
            textGlow: "drop-shadow-[0_0_5px_rgba(120,113,108,0.3)]",
          };
        case "assassin":
          return {
            bg: "bg-gradient-to-br from-gray-800 via-gray-900 to-black",
            border: "border-gray-600/80",
            panel: "bg-gradient-to-r from-black via-gray-950 to-black",
            shadow: "shadow-2xl shadow-black/80",
            glow: "before:bg-gradient-radial before:from-gray-700/20 before:to-transparent",
            textGlow: "drop-shadow-[0_0_15px_rgba(0,0,0,0.9)]",
          };
      }
    }
    
    return {
      bg: "bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600",
      border: "border-slate-500/70",
      panel: "bg-gradient-to-r from-slate-700 to-slate-800",
      shadow: "shadow-lg shadow-slate-600/50",
      glow: "",
      textGlow: "",
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
        "transition-all transform-gpu",
        "before:absolute before:inset-0 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        colors.border,
        colors.bg,
        colors.shadow,
        colors.glow,
        canClick && "cursor-pointer hover:scale-[1.08] hover:-translate-y-1.5 hover:rotate-1 active:scale-[1.02] active:rotate-0",
        !card.revealed && !isSpymaster && "opacity-100 backdrop-blur-sm",
        card.revealed && "opacity-[0.97] ring-2 ring-white/20",
        !canClick && "cursor-default"
      )}
      style={{
        backgroundImage: card.revealed || isSpymaster 
          ? `linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)` 
          : undefined,
        boxShadow: card.revealed || isSpymaster 
          ? `inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -1px 2px rgba(0,0,0,0.3)` 
          : `inset 0 1px 1px rgba(255,255,255,0.1)`,
      }}
    >
      {/* Glass effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/10 pointer-events-none" />
      
      {/* Top shine effect */}
      <div className="absolute top-0 left-0 right-0 h-[30%] bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
      
      <div className="flex-1" />
      
      {/* Word panel with depth */}
      <div className={cn(
        "relative rounded-md px-0.5 py-0.5 sm:px-1 sm:py-0.5 md:px-2 md:py-1 lg:px-3 lg:py-1.5 xl:px-4 xl:py-2 2xl:px-5 2xl:py-2.5",
        "flex items-center justify-center",
        "backdrop-blur-md",
        colors.panel
      )}
      style={{
        boxShadow: `inset 0 2px 4px rgba(0,0,0,0.4), 0 1px 2px rgba(255,255,255,0.1)`,
      }}
      >
        <span className={cn(
          "text-white font-bold text-[8px] sm:text-[10px] md:text-xs lg:text-sm xl:text-base 2xl:text-lg",
          "uppercase tracking-wider text-center leading-tight",
          "text-shadow-lg",
          colors.textGlow
        )}>
          {card.word}
        </span>
      </div>
      
      {/* Bottom reflection */}
      {(card.revealed || isSpymaster) && (
        <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
      )}
    </button>
  );
}
