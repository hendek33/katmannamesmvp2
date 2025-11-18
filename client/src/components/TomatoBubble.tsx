import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface TomatoBubbleProps {
  senderUsername: string;
  fromTeam: 'dark' | 'light';
  targetTeam: 'dark' | 'light';
  position?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  timestamp: number;
}

export function TomatoBubble({ 
  senderUsername, 
  fromTeam, 
  targetTeam, 
  position = { x: 0.5, y: 0.5 },
  targetPosition = { x: 0.5, y: 0.5 },
  timestamp 
}: TomatoBubbleProps) {
  const [phase, setPhase] = useState<'throwing' | 'impact' | 'done'>('throwing');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Start animation immediately
    const showTimer = setTimeout(() => setIsVisible(true), 10);
    
    // Change to impact phase after throw animation
    const impactTimer = setTimeout(() => {
      setPhase('impact');
    }, 800);

    // Remove completely after animation completes
    const removeTimer = setTimeout(() => {
      setPhase('done');
    }, 2000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(impactTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (phase === 'done') return null;

  // Calculate start and end positions based on teams
  const startX = fromTeam === 'light' ? '10%' : '90%';
  const endX = targetTeam === 'light' ? '30%' : '70%';
  const startY = '40%';
  const endY = '50%';

  return (
    <>
      {/* Throwing phase - flying tomato */}
      {phase === 'throwing' && (
        <div 
          className={cn(
            "fixed z-[150] pointer-events-none transition-all duration-[800ms] ease-out",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          style={{
            left: isVisible ? endX : startX,
            top: isVisible ? endY : startY,
            transform: `rotate(${isVisible ? '720deg' : '0deg'}) scale(${isVisible ? '1.5' : '0.5'})`,
          }}
        >
          {/* Tomato emoji with motion blur */}
          <div className="relative">
            <span className="text-4xl lg:text-5xl drop-shadow-2xl animate-spin">
              🍅
            </span>
            {/* Motion trail */}
            <div className="absolute inset-0 -z-10">
              <span className="text-4xl lg:text-5xl opacity-30 blur-sm">🍅</span>
            </div>
            <div className="absolute inset-0 -z-10 -translate-x-2">
              <span className="text-4xl lg:text-5xl opacity-20 blur-md">🍅</span>
            </div>
            <div className="absolute inset-0 -z-10 -translate-x-4">
              <span className="text-4xl lg:text-5xl opacity-10 blur-lg">🍅</span>
            </div>
          </div>
          
          {/* Sender name tag */}
          <div className={cn(
            "absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap",
            "text-xs font-bold px-2 py-1 rounded backdrop-blur-md",
            fromTeam === 'dark'
              ? "bg-blue-700/80 text-blue-100 border border-blue-500/50"
              : "bg-red-700/80 text-red-100 border border-red-500/50"
          )}>
            {senderUsername}
          </div>
        </div>
      )}

      {/* Impact phase - splat effect */}
      {phase === 'impact' && (
        <div 
          className="fixed z-[150] pointer-events-none animate-splat"
          style={{
            left: endX,
            top: endY,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Main splat */}
          <div className="relative">
            {/* Central splat */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-red-600/80 rounded-full animate-expand-splat blur-xl" />
            </div>
            
            {/* Splatter particles */}
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="absolute w-4 h-4 bg-red-500 rounded-full animate-splatter"
                style={{
                  left: '50%',
                  top: '50%',
                  animationDelay: `${i * 50}ms`,
                  '--splatter-x': `${Math.cos(i * Math.PI / 4) * 80}px`,
                  '--splatter-y': `${Math.sin(i * Math.PI / 4) * 80}px`,
                } as React.CSSProperties}
              />
            ))}

            {/* Impact text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "text-4xl lg:text-5xl font-black animate-impact-text",
                targetTeam === 'dark' 
                  ? "text-blue-200" 
                  : "text-red-200"
              )}>
                SPLAT!
              </span>
            </div>
            
            {/* Drip effect */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2">
              <div className="w-8 h-16 bg-gradient-to-b from-red-600/80 to-transparent animate-drip" />
            </div>
          </div>
        </div>
      )}
    </>
  );
}