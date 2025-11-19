import { useEffect, useState, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface TomatoBubbleProps {
  senderUsername: string;
  fromTeam: 'dark' | 'light';
  targetTeam: 'dark' | 'light';
  vegetable?: string;
  position?: { x: number; y: number };
  targetPosition?: { x: number; y: number };
  timestamp: number;
}

// Get color scheme based on vegetable (RGB values for inline styles)
const getVegetableColors = (veg: string) => {
  const colorMap: Record<string, { primary: string; secondary: string; particle: string; glow: string; trail: string }> = {
    "🍅": { primary: "220, 38, 38", secondary: "239, 68, 68", particle: "220, 38, 38", glow: "rgb(239 68 68 / 80%)", trail: "239, 68, 68" }, // Domates - Kırmızı
    "🌶️": { primary: "185, 28, 28", secondary: "234, 88, 12", particle: "185, 28, 28", glow: "rgb(239 68 68 / 80%)", trail: "234, 88, 12" }, // Biber - Kırmızı-Turuncu
    "🥒": { primary: "22, 163, 74", secondary: "34, 197, 94", particle: "22, 163, 74", glow: "rgb(34 197 94 / 80%)", trail: "34, 197, 94" }, // Salatalık - Yeşil
    "🥕": { primary: "234, 88, 12", secondary: "249, 115, 22", particle: "234, 88, 12", glow: "rgb(249 115 22 / 80%)", trail: "249, 115, 22" }, // Havuç - Turuncu
    "🍆": { primary: "109, 40, 217", secondary: "147, 51, 234", particle: "109, 40, 217", glow: "rgb(147 51 234 / 80%)", trail: "147, 51, 234" }, // Patlıcan - Mor
    "🥔": { primary: "180, 83, 9", secondary: "161, 98, 7", particle: "180, 83, 9", glow: "rgb(245 158 11 / 80%)", trail: "202, 138, 4" }, // Patates - Kahverengi
    "🧅": { primary: "202, 138, 4", secondary: "245, 158, 11", particle: "202, 138, 4", glow: "rgb(234 179 8 / 80%)", trail: "245, 158, 11" }, // Soğan - Sarı
    "🧄": { primary: "203, 213, 225", secondary: "226, 232, 240", particle: "203, 213, 225", glow: "rgb(203 213 225 / 80%)", trail: "226, 232, 240" }, // Sarımsak - Beyaz
  };
  return colorMap[veg] || colorMap["🍅"]; // Default to tomato colors
};

export function TomatoBubble({ 
  senderUsername, 
  fromTeam, 
  targetTeam,
  vegetable = "🍅",
  position,
  targetPosition,
  timestamp 
}: TomatoBubbleProps) {
  const [phase, setPhase] = useState<'throwing' | 'impact' | 'done'>('throwing');
  const [progress, setProgress] = useState(0);
  
  const colors = getVegetableColors(vegetable);

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
          {/* Vegetable with enhanced motion effects */}
          <div className="relative">
            {/* Main vegetable - EXTRA LARGE size for visibility */}
            <span className="text-7xl drop-shadow-2xl filter brightness-110">
              {vegetable}
            </span>
            
            {/* Enhanced motion trail with multiple layers */}
            <div className="absolute inset-0 -z-10 -translate-x-2 -translate-y-1">
              <span className="text-5xl opacity-40 blur-[2px]">{vegetable}</span>
            </div>
            <div className="absolute inset-0 -z-10 -translate-x-4 -translate-y-1.5">
              <span className="text-5xl opacity-25 blur-[4px]">{vegetable}</span>
            </div>
            <div className="absolute inset-0 -z-10 -translate-x-6 -translate-y-2">
              <span className="text-5xl opacity-15 blur-[6px]">{vegetable}</span>
            </div>
            
            {/* Speed lines for dramatic effect */}
            {progress > 0.3 && (
              <div className="absolute inset-0 -z-20">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-12 h-0.5"
                    style={{
                      left: '-40px',
                      top: `${8 + i * 6}px`,
                      transform: `rotate(-15deg)`,
                      opacity: 0.6 - i * 0.15,
                      background: `linear-gradient(to right, rgba(${colors.trail}, 0.6), transparent)`
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
              <div 
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-full animate-expand-splat"
                style={{
                  background: `radial-gradient(circle, rgba(${colors.primary}, 0.9) 0%, rgba(${colors.secondary}, 0.6) 50%, transparent 100%)`
                }}
              />
            </div>
            
            {/* Secondary shockwave */}
            <div className="absolute inset-0 flex items-center justify-center -z-20">
              <div 
                className="w-32 h-32 lg:w-40 lg:h-40 rounded-full animate-expand-splat"
                style={{ 
                  animationDelay: '0.1s',
                  background: `radial-gradient(circle, rgba(${colors.secondary}, 0.5) 0%, rgba(${colors.primary}, 0.3) 50%, transparent 100%)`
                }} 
              />
            </div>
            
            {/* Splatter particles in all directions */}
            {[...Array(12)].map((_, i) => {
              const angle = (i * Math.PI * 2) / 12;
              const distance = 60 + Math.random() * 30;
              return (
                <div
                  key={i}
                  className="absolute w-4 h-4 lg:w-5 lg:h-5 rounded-full animate-splatter shadow-lg"
                  style={{
                    left: '50%',
                    top: '50%',
                    backgroundColor: `rgb(${colors.particle})`,
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
                  className="absolute w-2 h-2 lg:w-3 lg:h-3 rounded-full animate-splatter"
                  style={{
                    left: '50%',
                    top: '50%',
                    backgroundColor: `rgba(${colors.secondary}, 0.8)`,
                    animationDelay: `${i * 40 + 100}ms`,
                    '--splatter-x': `${Math.cos(angle) * distance}px`,
                    '--splatter-y': `${Math.sin(angle) * distance}px`,
                  } as CSSProperties}
                />
              );
            })}

            {/* Impact text - smaller size */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span 
                className="text-3xl lg:text-4xl font-black animate-impact-text drop-shadow-2xl tracking-wider text-white"
                style={{
                  textShadow: `0 0 20px ${colors.glow}`
                }}
              >
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
                  className="w-2 h-12 animate-drip rounded-full"
                  style={{
                    animationDelay: `${i * 100}ms`,
                    background: `linear-gradient(to bottom, rgba(${colors.particle}, 0.9) 0%, rgba(${colors.particle}, 0.6) 50%, transparent 100%)`
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
