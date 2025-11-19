import { useEffect, useState, type CSSProperties } from 'react';
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
  position,
  targetPosition,
  timestamp 
}: TomatoBubbleProps) {
  const [phase, setPhase] = useState<'throwing' | 'impact' | 'done'>('throwing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Animate the throw with smooth progression
    const throwDuration = 1000; // 1 second throw
    const startTime = Date.now();
    let animationFrameId: number | null = null;
    
    const animateThrow = () => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(elapsed / throwDuration, 1);
      setProgress(newProgress);
      
      if (newProgress < 1) {
        animationFrameId = requestAnimationFrame(animateThrow);
      } else {
        setPhase('impact');
      }
    };
    
    animationFrameId = requestAnimationFrame(animateThrow);

    // Remove after impact animation completes
    const removeTimer = setTimeout(() => {
      setPhase('done');
    }, 2500);

    return () => {
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      clearTimeout(removeTimer);
    };
  }, []);

  if (phase === 'done') return null;

  // Calculate start and end positions based on team panels
  // If positions are provided, use them; otherwise use team-based defaults
  // Dark team panel is on the right (~85%), Light team panel is on the left (~15%)
  // Default to 0.5% vertical (almost at the very top)
  const startX = position ? position.x * 100 : (fromTeam === 'dark' ? 85 : 15);
  const startY = position ? position.y * 100 : 0.5;
  const endX = targetPosition ? targetPosition.x * 100 : (targetTeam === 'dark' ? 85 : 15);
  const endY = targetPosition ? targetPosition.y * 100 : 0.5;
  
  // DEBUG: Log positions
  console.log('🍅 TOMATO POSITION DEBUG:', {
    rawPosition: position,
    rawTargetPosition: targetPosition,
    calculatedStartY: startY,
    calculatedEndY: endY,
    fromTeam,
    targetTeam
  });
  
  // Parabolic arc calculation for realistic trajectory
  const currentX = startX + (endX - startX) * progress;
  const arcHeight = 20; // Arc height for trajectory
  const currentY = startY + (endY - startY) * progress - arcHeight * Math.sin(progress * Math.PI);
  
  // Rotation increases throughout flight for spin effect
  const rotation = progress * 1080; // 3 full rotations
  
  // Scale grows as it approaches for impact effect
  const scale = 0.8 + progress * 0.4;

  return (
    <>
      {/* Throwing phase - flying tomato with arc trajectory */}
      {phase === 'throwing' && (
        <div 
          className="fixed z-[150] pointer-events-none"
          style={{
            left: `${currentX}%`,
            top: `${currentY}%`,
            transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
            transition: 'none', // Use manual animation for smoothness
          }}
        >
          {/* Tomato with enhanced motion effects */}
          <div className="relative">
            {/* Main tomato - EXTRA LARGE size for visibility */}
            <span className="text-7xl drop-shadow-2xl filter brightness-110">
              🍅
            </span>
            
            {/* Enhanced motion trail with multiple layers */}
            <div className="absolute inset-0 -z-10 -translate-x-2 -translate-y-1">
              <span className="text-5xl opacity-40 blur-[2px]">🍅</span>
            </div>
            <div className="absolute inset-0 -z-10 -translate-x-4 -translate-y-1.5">
              <span className="text-5xl opacity-25 blur-[4px]">🍅</span>
            </div>
            <div className="absolute inset-0 -z-10 -translate-x-6 -translate-y-2">
              <span className="text-5xl opacity-15 blur-[6px]">🍅</span>
            </div>
            
            {/* Speed lines for dramatic effect */}
            {progress > 0.3 && (
              <div className="absolute inset-0 -z-20">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-12 h-0.5 bg-gradient-to-r from-red-500/60 to-transparent"
                    style={{
                      left: '-40px',
                      top: `${8 + i * 6}px`,
                      transform: `rotate(-15deg)`,
                      opacity: 0.6 - i * 0.15,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Impact phase - massive splat effect */}
      {phase === 'impact' && (
        <div 
          className="fixed z-[150] pointer-events-none"
          style={{
            left: `${endX}%`,
            top: `${endY}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Explosive impact container - smaller scale */}
          <div className="relative">
            {/* Central explosion blast */}
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-radial from-red-600/90 via-red-500/60 to-transparent rounded-full animate-expand-splat" />
            </div>
            
            {/* Secondary shockwave */}
            <div className="absolute inset-0 flex items-center justify-center -z-20">
              <div className="w-32 h-32 lg:w-40 lg:h-40 bg-gradient-radial from-orange-500/50 via-red-400/30 to-transparent rounded-full animate-expand-splat" 
                style={{ animationDelay: '0.1s' }} />
            </div>
            
            {/* Splatter particles in all directions */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 12;
              const distance = 60 + Math.random() * 30;
              return (
                <div
                  key={i}
                  className="absolute w-4 h-4 lg:w-5 lg:h-5 bg-red-600 rounded-full animate-splatter shadow-lg"
                  style={{
                    left: '50%',
                    top: '50%',
                    animationDelay: `${i * 30}ms`,
                    '--splatter-x': `${Math.cos(angle) * distance}px`,
                    '--splatter-y': `${Math.sin(angle) * distance}px`,
                  } as CSSProperties}
                />
              );
            })}
            
            {/* Additional smaller splatter particles */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 8 + 0.26;
              const distance = 40 + Math.random() * 20;
              return (
                <div
                  key={`small-${i}`}
                  className="absolute w-2 h-2 lg:w-3 lg:h-3 bg-red-500/80 rounded-full animate-splatter"
                  style={{
                    left: '50%',
                    top: '50%',
                    animationDelay: `${i * 40 + 100}ms`,
                    '--splatter-x': `${Math.cos(angle) * distance}px`,
                    '--splatter-y': `${Math.sin(angle) * distance}px`,
                  } as CSSProperties}
                />
              );
            })}

            {/* Impact text - smaller size */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "text-3xl lg:text-4xl font-black animate-impact-text drop-shadow-2xl",
                "tracking-wider",
                targetTeam === 'dark' 
                  ? "text-blue-100 [text-shadow:_0_0_20px_rgb(59_130_246_/_80%)]" 
                  : "text-red-100 [text-shadow:_0_0_20px_rgb(239_68_68_/_80%)]"
              )}>
                SPLAT!
              </span>
            </div>
            
            {/* Multiple drip effects for realism - smaller */}
            {[...Array(4)].map((_, i) => (
              <div
                key={`drip-${i}`}
                className="absolute top-1/2"
                style={{
                  left: `calc(50% + ${(i - 1.5) * 15}px)`,
                }}
              >
                <div 
                  className="w-2 h-12 bg-gradient-to-b from-red-600/90 via-red-600/60 to-transparent animate-drip rounded-full"
                  style={{
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              </div>
            ))}
            
            {/* Juice splashes - fewer and smaller */}
            {[...Array(6)].map((_, i) => {
              const spreadAngle = (i * Math.PI) / 3;
              return (
                <div
                  key={`juice-${i}`}
                  className="absolute w-1.5 h-8 bg-gradient-to-b from-red-500/70 to-transparent animate-drip"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${spreadAngle}rad) translateY(-15px)`,
                    animationDelay: `${i * 80}ms`,
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
