import { type Team } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface GameStatusProps {
  currentTeam: Team;
  darkCardsRemaining: number;
  lightCardsRemaining: number;
}

export function GameStatus({ currentTeam, darkCardsRemaining, lightCardsRemaining }: GameStatusProps) {
  return (
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
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2" data-testid="dark-remaining">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-600 to-blue-400" />
            <span className="text-sm font-semibold">{darkCardsRemaining}</span>
          </div>
          
          <div className="h-4 w-px bg-border" />
          
          <div className="flex items-center gap-2" data-testid="light-remaining">
            <div className="w-3 h-3 rounded-full bg-gradient-to-r from-red-600 to-red-400" />
            <span className="text-sm font-semibold">{lightCardsRemaining}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
