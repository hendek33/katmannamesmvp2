import { type Team } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Timer, Zap } from "lucide-react";

interface GameStatusProps {
  currentTeam: Team;
  darkCardsRemaining: number;
  lightCardsRemaining: number;
  onTriggerTaunt?: () => void;
  tauntCooldown?: number;
  currentPlayerTeam?: Team | null;
}

export function GameStatus({ currentTeam, darkCardsRemaining, lightCardsRemaining, onTriggerTaunt, tauntCooldown = 0, currentPlayerTeam }: GameStatusProps) {
  return (
    <div className="flex flex-col gap-3">
      {/* Turn Status Card */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Sıra:</span>
            <Badge 
              variant={currentTeam === "dark" ? "default" : "secondary"}
              className={currentTeam === "dark" 
                ? "bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500" 
                : "bg-gradient-to-r from-red-600 to-red-400 hover:from-red-700 hover:to-red-500 text-gray-900"
              }
              data-testid="current-turn"
            >
              {currentTeam === "dark" ? "Katman Koyu" : "Katman Açık"}
            </Badge>
          </div>
        </div>
      </Card>
      
      {/* Cards Remaining - Styled like actual cards with hover effects */}
      <div className="grid grid-cols-2 gap-3">
        {/* Dark Team Card Count */}
        <div 
          className="relative group cursor-pointer transition-all duration-200 hover-shimmer"
          data-testid="dark-remaining"
        >
          <div className="relative bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg border-4 border-blue-400 p-3 shadow-xl shadow-blue-900/50 hover:scale-105 hover:shadow-2xl transition-all">
            <div className="text-center">
              <div className="text-white text-xs font-medium mb-1">Mavi</div>
              <div className="text-white text-2xl font-bold">{darkCardsRemaining}</div>
              <div className="text-blue-200 text-xs">Kalan</div>
            </div>
          </div>
        </div>
        
        {/* Light Team Card Count */}
        <div 
          className="relative group cursor-pointer transition-all duration-200 hover-shimmer"
          data-testid="light-remaining"
        >
          <div className="relative bg-gradient-to-br from-red-500 to-red-600 rounded-lg border-4 border-red-400 p-3 shadow-xl shadow-red-900/50 hover:scale-105 hover:shadow-2xl transition-all">
            <div className="text-center">
              <div className="text-white text-xs font-medium mb-1">Kırmızı</div>
              <div className="text-white text-2xl font-bold">{lightCardsRemaining}</div>
              <div className="text-red-200 text-xs">Kalan</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Taunt Button - Only show if onTriggerTaunt is provided */}
      {onTriggerTaunt && currentPlayerTeam && (
        <div className="relative">
          <div className={`absolute inset-0 rounded-lg blur-md transition-all ${
            currentPlayerTeam === "dark" 
              ? "bg-blue-600/40" 
              : "bg-red-600/40"
          }`} />
          <button
            onClick={onTriggerTaunt}
            disabled={tauntCooldown > 0}
            className={`
              relative w-full px-4 py-3 rounded-lg font-bold text-sm transition-all
              backdrop-blur-md border shadow-lg
              ${currentPlayerTeam === "dark" 
                ? "bg-blue-900/60 border-blue-600/50 text-blue-100 hover:bg-blue-900/80 hover:border-blue-500/60" 
                : "bg-red-900/60 border-red-600/50 text-red-100 hover:bg-red-900/80 hover:border-red-500/60"}
              ${tauntCooldown > 0 ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
            `}
            data-testid="button-trigger-taunt"
          >
            {tauntCooldown > 0 ? (
              <span className="flex items-center justify-center gap-1.5">
                <Timer className="w-4 h-4" />
                {tauntCooldown}s
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4" />
                Hareket Çek
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
