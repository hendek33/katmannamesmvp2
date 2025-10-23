import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface AssassinVideoProps {
  winnerTeam: "dark" | "light";
  winnerTeamName: string;
  startX?: number;
  startY?: number;
  onComplete?: () => void;
}

export function AssassinVideo({ winnerTeam, winnerTeamName, onComplete }: AssassinVideoProps) {
  const [show, setShow] = useState(true);
  const [showFlash, setShowFlash] = useState(false);
  const [showWinnerText, setShowWinnerText] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [fadeOutWinner, setFadeOutWinner] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnd = () => {
    // Flash effect
    setShowFlash(true);
    setTimeout(() => {
      setShowFlash(false);
      // Start closing animation and show winner text
      setIsClosing(true);
      setShowWinnerText(true);
      // Fade out after 4 seconds
      setTimeout(() => {
        setFadeOutWinner(true);
        // Complete after fade out
        setTimeout(() => {
          onComplete?.();
        }, 800);
      }, 4000);
    }, 300);
  };

  useEffect(() => {
    // If video doesn't end naturally, trigger end after 5 seconds
    const timeout = setTimeout(() => {
      handleVideoEnd();
    }, 5000);
    
    return () => {
      clearTimeout(timeout);
    };
  }, []);

  if (!show && !showWinnerText) return null;

  return (
    <>
      {/* Flash effect overlay */}
      {showFlash && (
        <div 
          className="fixed inset-0 z-[150] pointer-events-none bg-white"
          style={{
            animation: 'flash 0.3s ease-out forwards'
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div 
            className="relative"
            style={{
              animation: isClosing 
                ? 'circleCollapse 0.6s ease-in forwards'
                : 'circleExpand 0.8s ease-out forwards'
            }}
          >
            {/* Glow effect */}
            <div 
              className="absolute -inset-8 rounded-full blur-3xl opacity-80 animate-pulse bg-purple-600"
            />
            
            {/* Video in circular frame */}
            <div 
              className="relative w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden border-4 shadow-2xl border-purple-600"
              style={{
                boxShadow: '0 0 100px rgba(147,51,234,0.8), inset 0 0 50px rgba(147,51,234,0.4)'
              }}
            >
              <video
                ref={videoRef}
                src="/siyah kelime seçme.mp4"
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
                className="w-full h-full object-cover"
              />
              
              {/* Dark gradient overlay */}
              <div 
                className="absolute inset-0 pointer-events-none rounded-xl"
                style={{
                  background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.7) 100%)'
                }}
              />
            </div>
            
            {/* Smoke effect particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4 bg-purple-500 rounded-full blur-md"
                  style={{
                    left: `${50 + Math.cos(i * Math.PI / 10) * 40}%`,
                    top: `${50 + Math.sin(i * Math.PI / 10) * 40}%`,
                    animation: `smoke ${2 + Math.random()}s ease-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                    opacity: 0
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Winner text */}
      {showWinnerText && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none"
          style={{
            animation: fadeOutWinner 
              ? 'fadeOut 0.8s ease-out forwards'
              : 'fadeIn 0.5s ease-in forwards'
          }}
        >
          <div className="text-center">
            <div 
              className="text-5xl md:text-7xl font-black mb-4"
              style={{
                color: winnerTeam === "dark" ? '#3b82f6' : '#ef4444',
                textShadow: winnerTeam === "dark" 
                  ? '0 0 60px rgba(59,130,246,0.9), 0 0 120px rgba(59,130,246,0.6)' 
                  : '0 0 60px rgba(239,68,68,0.9), 0 0 120px rgba(239,68,68,0.6)',
                animation: 'winnerPulse 1s ease-in-out infinite'
              }}
            >
              {winnerTeamName}
            </div>
            <div 
              className="text-3xl md:text-5xl font-bold text-white"
              style={{
                textShadow: '0 2px 20px rgba(255,255,255,0.5)',
                animation: 'fadeInUp 0.8s ease-out forwards 0.3s',
                opacity: 0
              }}
            >
              KAZANDI!
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes flash {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes circleExpand {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes circleCollapse {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0);
            opacity: 0;
          }
        }
        
        @keyframes smoke {
          0% {
            transform: translateY(0) scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-100px) scale(2);
            opacity: 0;
          }
        }
        
        @keyframes winnerPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}