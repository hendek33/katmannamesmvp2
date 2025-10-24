import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useBubbleManager } from '@/contexts/BubbleManager';

interface InsultBubbleProps {
  senderUsername: string;
  senderTeam: 'dark' | 'light';
  targetUsername?: string;
  targetTeam?: 'dark' | 'light';
  message: string;
  timestamp: number;
}

export function InsultBubble({ senderUsername, senderTeam, targetUsername, targetTeam, message, timestamp }: InsultBubbleProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [position, setPosition] = useState(0);
  const bubbleManager = useBubbleManager();
  const bubbleIdRef = useRef(`insult-${timestamp}-${Math.random()}`);

  useEffect(() => {
    const bubbleId = bubbleIdRef.current;
    let cleanupTimer: NodeJS.Timeout;
    
    // Register bubble and get initial position
    const initialPosition = bubbleManager.registerBubble(bubbleId, 'insult', senderTeam);
    setPosition(initialPosition);
    
    // Fade in
    const fadeInTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Start fade out after 3 seconds (increased from 2.5)
    const fadeOutTimer = setTimeout(() => {
      setIsLeaving(true);
      // Unregister after animation completes
      cleanupTimer = setTimeout(() => {
        bubbleManager.unregisterBubble(bubbleId);
      }, 700);
    }, 3000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      if (cleanupTimer) clearTimeout(cleanupTimer);
      // Always ensure bubble is unregistered on unmount
      bubbleManager.unregisterBubble(bubbleId);
    };
  }, [senderTeam, bubbleManager, timestamp]);

  // Update position when bubble manager changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newPosition = bubbleManager.getBubblePosition(bubbleIdRef.current);
      if (newPosition !== position) {
        setPosition(newPosition);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [position, bubbleManager]);

  // Determine position based on team
  const isLeftSide = senderTeam === 'dark';
  
  // Calculate vertical position based on stack index
  const baseTop = 9; // Base top position in vh
  const spacing = 12; // Spacing between bubbles in vh
  const topPosition = baseTop + (position * spacing);

  return (
    <div 
      className={cn(
        "fixed z-[100] pointer-events-none transition-all duration-700 ease-out",
        isLeftSide ? "left-[8%] lg:left-[12%] xl:left-[15%]" : "right-[8%] lg:right-[12%] xl:right-[15%]",
        isVisible && !isLeaving ? "opacity-100" : "opacity-0",
        isLeaving && "animate-fade-out"
      )}
      style={{
        top: `${topPosition}vh`,
        transform: `${isVisible && !isLeaving ? 'translateY(0)' : 'translateY(-20px)'}`,
      }}
    >
      {/* Speech bubble */}
      <div className={cn(
        "relative backdrop-blur-lg rounded-2xl p-3 shadow-2xl border-2",
        "max-w-[120px] animate-bounce-gentle",
        senderTeam === 'dark' 
          ? "bg-blue-900/80 border-blue-500/60 text-blue-100" 
          : "bg-red-900/80 border-red-500/60 text-red-100"
      )}>
        {/* Sender name */}
        <div className={cn(
          "absolute -top-5 left-3 text-[10px] font-bold px-1.5 py-0.5 rounded",
          senderTeam === 'dark'
            ? "bg-blue-700/80 text-blue-100"
            : "bg-red-700/80 text-red-100"
        )}>
          {senderUsername}
        </div>
        
        {/* Message with highlighted target */}
        <p className="text-xs font-bold tracking-wide">
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
            "absolute -bottom-2 w-3 h-3 transform rotate-45",
            isLeftSide ? "left-6" : "right-6",
            senderTeam === 'dark'
              ? "bg-blue-900/80 border-r-2 border-b-2 border-blue-500/60"
              : "bg-red-900/80 border-r-2 border-b-2 border-red-500/60"
          )}
        />
        
      </div>
    </div>
  );
}