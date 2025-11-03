import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface InsultBubbleProps {
  senderUsername: string;
  senderTeam: 'dark' | 'light';
  targetUsername?: string;
  targetTeam?: 'dark' | 'light';
  message: string;
  timestamp: number;
  onRemove?: () => void;
}

export function InsultBubble({ senderUsername, senderTeam, targetUsername, targetTeam, message, onRemove }: InsultBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);
    
    // Start fade out after 2.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsLeaving(true);
      // Remove from parent state after animation
      if (onRemove) {
        setTimeout(onRemove, 700); // Wait for fade animation
      }
    }, 2500);

    return () => clearTimeout(fadeOutTimer);
  }, [onRemove]);

  // Determine position based on team
  const isLeftSide = senderTeam === 'dark';

  return (
    <div 
      className={cn(
        "fixed z-[100] pointer-events-none transition-all duration-700 ease-out",
        isLeftSide ? "left-[8%] lg:left-[12%] xl:left-[15%]" : "right-[8%] lg:right-[12%] xl:right-[15%]",
        "top-[9vh] lg:top-[11vh] xl:top-[13vh]",
        isVisible && !isLeaving ? "opacity-100" : "opacity-0",
        isLeaving && "animate-fade-out"
      )}
      style={{
        transform: `${isVisible && !isLeaving ? 'translateY(0)' : 'translateY(-20px)'}`,
      }}
    >
      {/* Speech bubble */}
      <div className={cn(
        "relative backdrop-blur-lg rounded-2xl p-4 shadow-2xl border-2",
        "max-w-[200px] animate-bounce-gentle",
        senderTeam === 'dark' 
          ? "bg-blue-900/80 border-blue-500/60 text-blue-100" 
          : "bg-red-900/80 border-red-500/60 text-red-100"
      )}>
        {/* Sender name */}
        <div className={cn(
          "absolute -top-6 left-3 text-xs font-bold px-2 py-1 rounded",
          senderTeam === 'dark'
            ? "bg-blue-700/80 text-blue-100"
            : "bg-red-700/80 text-red-100"
        )}>
          {senderUsername}
        </div>
        
        {/* Message with highlighted target */}
        <p className="text-sm font-bold tracking-wide">
          {targetUsername ? (
            <>
              <span 
                className={cn(
                  "font-black",
                  targetTeam === 'dark' 
                    ? "text-blue-400" 
                    : "text-red-400"
                )}
              >
                {targetUsername}
              </span>
              {message.replace(targetUsername, '')}
            </>
          ) : (
            message
          )}
        </p>
        
        {/* Tail */}
        <div 
          className={cn(
            "absolute -bottom-2 w-4 h-4 transform rotate-45",
            isLeftSide ? "left-8" : "right-8",
            senderTeam === 'dark'
              ? "bg-blue-900/80 border-r-2 border-b-2 border-blue-500/60"
              : "bg-red-900/80 border-r-2 border-b-2 border-red-500/60"
          )}
        />
        
      </div>
    </div>
  );
}