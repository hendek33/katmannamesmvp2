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
  position = { x: 0.5, y: 0.5 },
  targetPosition = { x: 0.5, y: 0.5 },
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

  // Calculate start and end positions using provided positions or defaults based on teams
  const startX = position.x * 100; // Convert 0-1 to percentage
  const startY = position.y * 100;
  const endX = targetPosition.x * 100;
  const endY = targetPosition.y * 100;
  
  // Parabolic arc calculation for realistic trajectory
  const currentX = startX + (endX - startX) * progress;
  const arcHeight = 25; // Higher arc for more dramatic effect
  const currentY = startY + (endY - startY) * progress - arcHeight * Math.sin(progress * Math.PI);
  
  // Rotation increases throughout flight for spin effect
  const rotation = progress * 1080; // 3 full rotations
  
  // Scale grows as it approaches for impact effect
  const scale = 1 + progress * 0.8;

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
            {/* Main tomato */}
            <span className="text-6xl drop-shadow-2xl filter brightness-110">
              🍅
            </span>
            
            {/* Enhanced motion trail with multiple layers */}
            <div className="absolute inset-0 -z-10 -translate-x-3 -translate-y-1">
              <span className="text-6xl opacity-40 blur-[2px]">🍅</span>
            </div>
            <div className="absolute inset-0 -z-10 -translate-x-6 -translate-y-2">
              <span className="text-6xl opacity-25 blur-[4px]">🍅</span>
            </div>
            <div className="absolute inset-0 -z-10 -translate-x-9 -translate-y-3">
              <span className="text-6xl opacity-15 blur-[6px]">🍅</span>
            </div>
            
            {/* Speed lines for dramatic effect */}
            {progress > 0.3 && (
              <div className="absolute inset-0 -z-20">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-16 h-0.5 bg-gradient-to-r from-red-500/60 to-transparent"
                    style={{
                      left: '-60px',
                      top: `${12 + i * 8}px`,
                      transform: `rotate(-15deg)`,
                      opacity: 0.6 - i * 0.15,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Sender name tag with team colors */}
          <div className={cn(
            "absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap",
            "text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg",
            "border-2 animate-pulse",
            fromTeam === 'dark'
              ? "bg-blue-600/90 text-blue-50 border-blue-400/70"
              : "bg-red-600/90 text-red-50 border-red-400/70"
          )}>
            💥 {senderUsername}
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
          {/* Explosive impact container */}
          <div className="relative">
            {/* Central explosion blast */}
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="w-40 h-40 lg:w-56 lg:h-56 bg-gradient-radial from-red-600/90 via-red-500/60 to-transparent rounded-full animate-expand-splat" />
            </div>
            
            {/* Secondary shockwave */}
            <div className="absolute inset-0 flex items-center justify-center -z-20">
              <div className="w-48 h-48 lg:w-64 lg:h-64 bg-gradient-radial from-orange-500/50 via-red-400/30 to-transparent rounded-full animate-expand-splat" 
                style={{ animationDelay: '0.1s' }} />
            </div>
            
            {/* Splatter particles in all directions */}
            {[...Array(16)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 16;
              const distance = 100 + Math.random() * 40;
              return (
                <div
                  key={i}
                  className="absolute w-6 h-6 lg:w-8 lg:h-8 bg-red-600 rounded-full animate-splatter shadow-lg"
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
            {[...Array(12)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 12 + 0.26;
              const distance = 60 + Math.random() * 30;
              return (
                <div
                  key={`small-${i}`}
                  className="absolute w-3 h-3 lg:w-4 lg:h-4 bg-red-500/80 rounded-full animate-splatter"
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

            {/* Impact text with massive emphasis */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn(
                "text-6xl lg:text-8xl font-black animate-impact-text drop-shadow-2xl",
                "tracking-wider",
                targetTeam === 'dark' 
                  ? "text-blue-100 [text-shadow:_0_0_30px_rgb(59_130_246_/_80%)]" 
                  : "text-red-100 [text-shadow:_0_0_30px_rgb(239_68_68_/_80%)]"
              )}>
                SPLAT!
              </span>
            </div>
            
            {/* Multiple drip effects for realism */}
            {[...Array(5)].map((_, i) => (
              <div
                key={`drip-${i}`}
                className="absolute top-1/2"
                style={{
                  left: `calc(50% + ${(i - 2) * 20}px)`,
                }}
              >
                <div 
                  className="w-3 h-20 bg-gradient-to-b from-red-600/90 via-red-600/60 to-transparent animate-drip rounded-full"
                  style={{
                    animationDelay: `${i * 100}ms`,
                  }}
                />
              </div>
            ))}
            
            {/* Juice splashes */}
            {[...Array(8)].map((_, i) => {
              const spreadAngle = (i * Math.PI) / 4;
              return (
                <div
                  key={`juice-${i}`}
                  className="absolute w-2 h-12 bg-gradient-to-b from-red-500/70 to-transparent animate-drip"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `rotate(${spreadAngle}rad) translateY(-20px)`,
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
