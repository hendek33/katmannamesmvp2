import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface InsultBubbleProps {
  senderUsername: string;
  senderTeam: 'dark' | 'light';
  message: string;
  timestamp: number;
}

export function InsultBubble({ senderUsername, senderTeam, message }: InsultBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);
    
    // Start fade out after 2.5 seconds
    const fadeOutTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 2500);

    return () => clearTimeout(fadeOutTimer);
  }, []);

  // Determine position based on team
  const isLeftSide = senderTeam === 'dark';

  return (
    <div 
      className={cn(
        "fixed z-[100] pointer-events-none transition-all duration-500",
        isLeftSide ? "left-[22%]" : "right-[22%]",
        "top-[30%]",
        isVisible && !isLeaving ? "opacity-100 scale-100" : "opacity-0 scale-75",
        isLeaving && "opacity-0 scale-110"
      )}
      style={{
        transform: `${isVisible && !isLeaving ? 'translateX(0)' : isLeftSide ? 'translateX(-100px)' : 'translateX(100px)'} scale(${isVisible && !isLeaving ? 1 : isLeaving ? 1.1 : 0.75})`,
      }}
    >
      {/* Speech bubble */}
      <div className={cn(
        "relative backdrop-blur-lg rounded-2xl p-4 shadow-2xl border-2",
        "max-w-[150px] animate-bounce-gentle",
        senderTeam === 'dark' 
          ? "bg-blue-900/80 border-blue-500/60 text-blue-100" 
          : "bg-red-900/80 border-red-500/60 text-red-100"
      )}>
        {/* Sender name */}
        <div className={cn(
          "absolute -top-6 left-4 text-xs font-bold px-2 py-1 rounded",
          senderTeam === 'dark'
            ? "bg-blue-700/80 text-blue-100"
            : "bg-red-700/80 text-red-100"
        )}>
          {senderUsername}
        </div>
        
        {/* Message */}
        <p className="text-sm font-bold tracking-wide">
          {message}
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