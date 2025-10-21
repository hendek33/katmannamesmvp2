import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AssassinVideoProps {
  winnerTeam: "dark" | "light";
  winnerTeamName: string;
  startX?: number;
  startY?: number;
  onComplete?: () => void;
}

export function AssassinVideo({ winnerTeam, winnerTeamName, startX, startY, onComplete }: AssassinVideoProps) {
  const [show, setShow] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showWinnerText, setShowWinnerText] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [fadeOutWinner, setFadeOutWinner] = useState(false);

  const handleVideoEnd = () => {
    setVideoEnded(true);
    // Flash effect
    setShowFlash(true);
    setTimeout(() => {
      setShowFlash(false);
      // Start closing animation and show winner text immediately
      setIsClosing(true);
      setShowWinnerText(true);
      // Start fade out after 4 seconds
      setTimeout(() => {
        setFadeOutWinner(true);
        // Complete after fade out animation
        setTimeout(() => {
          onComplete?.();
        }, 800);
      }, 4000);
    }, 300);
  };

  if (!show && !showWinnerText) return null;

  return (
    <>
      {/* Flash effect overlay */}
      {showFlash && (
        <div 
          className="fixed inset-0 z-[150] pointer-events-none"
          style={{
            animation: 'flash 0.3s ease-out forwards',
            backgroundColor: 'white'
          }}
        />
      )}
      
      {/* Dark overlay - persists until winner text fades */}
      {(show || showWinnerText) && (
        <div 
          className="fixed inset-0 z-[99] bg-black/95 backdrop-blur-sm pointer-events-none"
          style={{
            animation: fadeOutWinner 
              ? 'fadeOut 0.8s ease-out forwards'
              : 'fadeIn 0.5s ease-in-out forwards',
          }}
        />
      )}
      
      {/* Video */}
      {show && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
        >
          <div 
            className="relative"
            style={{
              animation: isClosing 
                ? 'shrinkToPoint 0.6s ease-in forwards'
                : 'expandFromPoint 0.8s ease-out forwards',
              transformOrigin: startX && startY ? `${startX}px ${startY}px` : 'center',
              '--start-x': startX ? `${startX}px` : '50vw',
              '--start-y': startY ? `${startY}px` : '50vh',
            } as React.CSSProperties}
          >
            {/* Video with rounded corners */}
            <div className="relative w-[35vw] max-w-sm rounded-xl overflow-hidden shadow-2xl"
              style={{
                clipPath: isClosing ? 'circle(0% at center)' : 'circle(100% at center)',
                animation: isClosing ? 'circleCollapse 0.6s ease-in forwards' : 'circleExpand 0.8s ease-out forwards'
              }}
            >
              <video
                src="/siyah kelime seçme.mp4"
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
                className="w-full h-auto"
              />
              
              {/* Dark gradient overlay for better blending */}
              <div 
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{
                  background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.4) 100%)'
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Winner text */}
      {showWinnerText && (
        <div 
          className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none"
          style={{
            animation: fadeOutWinner ? 'fadeOut 0.8s ease-out forwards' : 'fadeIn 0.3s ease-in forwards'
          }}
        >
          <div className="text-center space-y-4">
            <div className="text-2xl md:text-3xl font-bold text-red-500 animate-letter-fall-sequence">
              {"Siyah Kelime Bulundu!".split('').map((char, index) => (
                <span
                  key={index}
                  className="inline-block"
                  style={{
                    animation: 'letterDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                    animationDelay: `${index * 0.03}s`,
                    opacity: 0
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </div>
            <div className={cn(
              "text-4xl md:text-6xl font-black",
              winnerTeam === "dark" ? "text-blue-400" : "text-red-400"
            )}>
              {"Kazanan:".split('').map((char, index) => (
                <span
                  key={index}
                  className="inline-block"
                  style={{
                    animation: 'letterDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                    animationDelay: `${0.5 + index * 0.03}s`,
                    opacity: 0
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
              {' '}
              {winnerTeamName.split('').map((char, index) => (
                <span
                  key={index}
                  className="inline-block"
                  style={{
                    animation: 'letterDrop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                    animationDelay: `${0.7 + index * 0.03}s`,
                    opacity: 0,
                    textShadow: winnerTeam === "dark" 
                      ? '0 4px 20px rgba(59,130,246,0.8)' 
                      : '0 4px 20px rgba(239,68,68,0.8)'
                  }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}