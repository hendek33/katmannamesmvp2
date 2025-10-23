import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface NormalWinVideoProps {
  winnerTeam: "dark" | "light";
  winnerTeamName: string;
  onComplete?: () => void;
}

export function NormalWinVideo({ winnerTeam, winnerTeamName, onComplete }: NormalWinVideoProps) {
  const [show, setShow] = useState(true);
  const [showWinnerText, setShowWinnerText] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [fadeOutAll, setFadeOutAll] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const videoSrc = winnerTeam === "dark" 
    ? "/mavi takım normal kazanma.mp4"
    : "/kırmızı takım normal kazanma.mp4";

  useEffect(() => {
    // Simple play logic
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('Win video play error:', err);
        // If video fails, still show winner
        handleVideoEnd();
      });
    }
    
    return () => {
      if (videoRef.current) {
        videoRef.current.pause();
      }
    };
  }, []);

  const handleVideoEnd = () => {
    // Start closing animation and show winner text
    setIsClosing(true);
    setShowWinnerText(true);
    
    // Fade out everything after 3 seconds
    setTimeout(() => {
      setFadeOutAll(true);
      // Complete after fade out
      setTimeout(() => {
        onComplete?.();
      }, 800);
    }, 3000);
  };

  if (!show && !showWinnerText) return null;

  return (
    <>
      {/* Dark overlay - persists until everything fades */}
      {(show || showWinnerText) && (
        <div 
          className="fixed inset-0 z-[99] bg-black/95 backdrop-blur-sm pointer-events-none"
          style={{
            animation: fadeOutAll 
              ? 'fadeOut 0.8s ease-out forwards'
              : 'fadeIn 0.5s ease-in-out forwards',
          }}
        />
      )}
      
      {/* Video - FULLSCREEN */}
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            className="w-full h-full object-contain"
            style={{
              animation: isClosing 
                ? 'zoomOut 0.6s ease-in forwards'
                : 'zoomIn 0.8s ease-out forwards'
            }}
          />
        </div>
      )}
      
      {/* Winner text */}
      {showWinnerText && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center pointer-events-none"
          style={{
            animation: fadeOutAll 
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
            
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(30)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute w-3 h-3",
                    i % 3 === 0 
                      ? (winnerTeam === "dark" ? "bg-blue-400" : "bg-red-400")
                      : i % 3 === 1 
                      ? "bg-yellow-400" 
                      : "bg-purple-400"
                  )}
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10%`,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animation: `confetti ${2 + Math.random() * 2}s ease-out forwards`,
                    animationDelay: `${Math.random() * 0.5}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
        
        @keyframes zoomIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes zoomOut {
          from {
            transform: scale(1);
            opacity: 1;
          }
          to {
            transform: scale(0);
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
        
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </>
  );
}