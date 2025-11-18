import { useEffect, useState } from 'react';

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
  const [phase, setPhase] = useState<'flying' | 'impact'>('flying');

  useEffect(() => {
    // Flying phase: 2 seconds
    const flyTimer = setTimeout(() => {
      setPhase('impact');
    }, 2000);

    return () => {
      clearTimeout(flyTimer);
    };
  }, []);

  // CRITICAL: Server sends normalized coords (0-1), convert to viewport percentages
  // NO DEFAULT VALUES - use server values directly
  const startXPercent = (position?.x ?? 0.5) * 100;
  const startYPercent = (position?.y ?? 0.5) * 100;
  const endXPercent = (targetPosition?.x ?? 0.5) * 100;
  const endYPercent = (targetPosition?.y ?? 0.5) * 100;

  console.log('🍅 TOMATO RENDER:', {
    serverPosition: position,
    serverTargetPosition: targetPosition,
    viewportStart: { x: startXPercent, y: startYPercent },
    viewportEnd: { x: endXPercent, y: endYPercent },
    phase
  });

  if (phase === 'impact') {
    // Impact phase: splat effect at target position
    return (
      <div 
        className="fixed z-[9999] pointer-events-none"
        style={{
          left: `${endXPercent}%`,
          top: `${endYPercent}%`,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Explosion particles */}
        <div className="relative">
          <div className="text-6xl animate-ping">💥</div>
          {[...Array(8)].map((_, i) => {
            const angle = (i / 8) * 360;
            const rad = (angle * Math.PI) / 180;
            const distance = 60;
            return (
              <div
                key={i}
                className="absolute text-2xl animate-fade-out"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(${Math.cos(rad) * distance}px, ${Math.sin(rad) * distance}px)`,
                  animationDuration: '0.5s',
                }}
              >
                🍅
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Flying phase: animate from start to end
  return (
    <div 
      className="fixed z-[9999] pointer-events-none"
      style={{
        left: `${startXPercent}%`,
        top: `${startYPercent}%`,
        transform: 'translate(-50%, -50%)',
        animation: `tomato-fly-${timestamp} 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
      }}
    >
      <div className="text-7xl animate-spin" style={{ animationDuration: '1s' }}>
        🍅
      </div>
      
      <style>{`
        @keyframes tomato-fly-${timestamp} {
          0% {
            left: ${startXPercent}%;
            top: ${startYPercent}%;
          }
          50% {
            left: ${(startXPercent + endXPercent) / 2}%;
            top: ${Math.min(startYPercent, endYPercent) - 15}%;
          }
          100% {
            left: ${endXPercent}%;
            top: ${endYPercent}%;
          }
        }
        
        @keyframes fade-out {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
