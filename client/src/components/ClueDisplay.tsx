import { type Clue } from "@shared/schema";
import { Card } from "@/components/ui/card";
import { Lightbulb } from "lucide-react";

interface ClueDisplayProps {
  clue: Clue | null;
}

export function ClueDisplay({ clue }: ClueDisplayProps) {
  if (!clue) {
    return (
      <Card className="p-4 border-dashed">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Lightbulb className="w-5 h-5" />
          <span className="text-sm">İpucu bekleniyor...</span>
        </div>
      </Card>
    );
  }

  const teamColor = clue.team === "dark" 
    ? "from-blue-600 to-blue-400" 
    : "from-red-600 to-red-400";

  return (
    <Card className="p-4 border-2 border-primary/30 bg-card/80" data-testid="clue-display">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md bg-gradient-to-r ${teamColor}`}>
          <Lightbulb className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-muted-foreground mb-1">
            {clue.team === "dark" ? "Katman Koyu" : "Katman Açık"} İpucu
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground" data-testid="clue-word">
              {clue.word}
            </span>
            <span className="text-2xl font-bold text-primary" data-testid="clue-count">
              {clue.count}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
