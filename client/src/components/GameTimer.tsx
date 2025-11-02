import { useState, useEffect } from "react";
import { Timer, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

interface GameTimerProps {
  isActive: boolean;
  startTime: number | null;
  duration: number;
  label?: string;
}

export function GameTimer({ isActive, startTime, duration, label = "Süre" }: GameTimerProps) {
  const { serverTimer } = useWebSocketContext();
  const [timeRemaining, setTimeRemaining] = useState(duration);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!isActive || !startTime) {
      setTimeRemaining(duration);
      setIsExpired(false);
      return;
    }

    // Use server-synchronized timer if available
    if (serverTimer) {
      setTimeRemaining(serverTimer.timeRemaining);
      setIsExpired(serverTimer.isExpired);
      return;
    }

    // Fallback to local timer calculation
    const updateTimer = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, duration - elapsed);
      setTimeRemaining(remaining);
      setIsExpired(remaining === 0);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime, duration, serverTimer]);

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const progress = (timeRemaining / duration) * 100;

  // Color based on time remaining
  const getColor = () => {
    if (!isActive) return "text-muted-foreground";
    if (isExpired) return "text-red-500";
    if (timeRemaining <= 30) return "text-orange-500";
    if (timeRemaining <= 60) return "text-yellow-500";
    return "text-green-500";
  };

  const getProgressColor = () => {
    if (!isActive) return "bg-gray-500";
    if (isExpired) return "bg-red-500";
    if (timeRemaining <= 30) return "bg-orange-500";
    if (timeRemaining <= 60) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex flex-col items-center space-y-2 p-3 rounded-lg bg-background/50 backdrop-blur-sm border">
      <div className="flex items-center gap-2">
        <Clock className={cn("w-4 h-4", getColor())} />
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      
      <div className={cn(
        "text-2xl font-mono font-bold tabular-nums",
        getColor(),
        isExpired && "animate-pulse"
      )}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </div>

      <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-1000 ease-linear",
            getProgressColor(),
            isExpired && "animate-pulse"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>

      {isExpired && (
        <div className="text-xs font-medium text-red-500 animate-pulse">
          Süre Doldu!
        </div>
      )}
    </div>
  );
}