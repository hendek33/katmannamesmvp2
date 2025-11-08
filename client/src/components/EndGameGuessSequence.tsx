import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { GameState } from "@shared/schema";

interface EndGameGuessSequenceProps {
  sequence: GameState["endGameGuessSequence"];
  onComplete?: () => void;
}

export function EndGameGuessSequence({ sequence, onComplete }: EndGameGuessSequenceProps) {
  const [step, setStep] = useState(0);
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    if (!sequence) return;
    
    // Progress through steps with delays - HIZLANDIRILDI
    const timers: NodeJS.Timeout[] = [];
    
    // Step 1: Show team decision (1s delay)
    timers.push(setTimeout(() => setStep(1), 1000));
    
    // Step 2: Show actual role reveal (2s delay) - KISALTILDI
    timers.push(setTimeout(() => setStep(2), 2000));
    
    // Step 3: Show final result (3.5s delay)  
    timers.push(setTimeout(() => setStep(3), 3500));
    
    // Hide and complete (5.5s delay)
    timers.push(setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 5500));
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [sequence, onComplete]);
  
  if (!sequence || !show) return null;
  
  const roleText = "Kahin";
  const actualRoleText = sequence.actualRole === "prophet" 
    ? "KAHİN" 
    : "NORMAL AJAN";
  
  const isCorrect = sequence.success;
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full text-center space-y-8">
        
        {/* Step 0: Initial fade in */}
        {step >= 0 && (
          <div 
            className="text-4xl md:text-6xl font-black"
            style={{
              animation: 'fadeInScale 1s ease-out forwards',
              opacity: 0,
            }}
          >
            <span className="text-purple-400">KAHİN TAHMİNİ</span>
          </div>
        )}
        
        {/* Step 1: Team decision */}
        {step >= 1 && (
          <div 
            className="text-2xl md:text-4xl font-bold"
            style={{
              animation: 'slideInFromLeft 1s ease-out forwards',
              opacity: 0,
              animationDelay: '0.2s',
            }}
          >
            <span className="text-slate-400">{sequence.guessingTeamName} Takımı</span>
            <br />
            <span className="text-yellow-400">{sequence.targetPlayer}</span>
            <span className="text-slate-400"> oyuncusunun</span>
            <br />
            <span className="text-purple-300">{roleText} olduğuna karar verdi!</span>
          </div>
        )}
        
        {/* Step 2: Actual role reveal */}
        {step >= 2 && (
          <div 
            className="text-2xl md:text-4xl font-bold"
            style={{
              animation: 'slideInFromRight 1s ease-out forwards',
              opacity: 0,
              animationDelay: '0.2s',
            }}
          >
            <span className="text-yellow-400">{sequence.targetPlayer}</span>
            <span className="text-slate-400"> oyuncusunun gerçek rolü aslında...</span>
            <br />
            <div 
              className={cn(
                "text-5xl md:text-7xl font-black mt-4",
                sequence.actualRole === "prophet" ? "text-purple-500" : "text-slate-500"
              )}
              style={{
                animation: 'zoomInRotate 0.6s ease-out forwards',
                opacity: 0,
                animationDelay: '0.3s',  // 1s'den 0.3s'ye düşürüldü
              }}
            >
              {actualRoleText} İDİ!
            </div>
          </div>
        )}
        
        {/* Step 3: Final result */}
        {step >= 3 && (
          <div 
            className="text-4xl md:text-6xl font-black"
            style={{
              animation: 'bounceIn 1s ease-out forwards',
              opacity: 0,
              animationDelay: '0.3s',
            }}
          >
            <div className="mb-4">
              {isCorrect ? (
                <span className="text-green-400">✓ DOĞRU TAHMİN!</span>
              ) : (
                <span className="text-red-400">✗ YANLIŞ TAHMİN!</span>
              )}
            </div>
            <div 
              className={cn(
                "text-5xl md:text-7xl",
                sequence.finalWinner === "dark" ? "text-blue-400" : "text-red-400"
              )}
              style={{
                textShadow: sequence.finalWinner === "dark"
                  ? '0 0 30px rgba(59,130,246,0.8)'
                  : '0 0 30px rgba(239,68,68,0.8)',
              }}
            >
              {sequence.finalWinnerName} TAKIMI KAZANDI!
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideInFromLeft {
          from {
            opacity: 0;
            transform: translateX(-100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideInFromRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes zoomInRotate {
          from {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          to {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
}