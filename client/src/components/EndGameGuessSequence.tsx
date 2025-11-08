import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { GameState } from "@shared/schema";
import { NormalWinVideo } from "./NormalWinVideo";

interface EndGameGuessSequenceProps {
  sequence: GameState["endGameGuessSequence"];
  onComplete?: () => void;
}

// Kelime kelime animasyon için yardımcı component
function AnimatedText({ text, className = "", delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(' ');
  
  return (
    <>
      {words.map((word, index) => (
        <span key={index}>
          <span
            className={cn("inline-block", className)}
            style={{
              animation: 'wordFadeIn 0.4s ease-out forwards',
              animationDelay: `${delay + (index * 0.15)}s`,
              opacity: 0,
            }}
          >
            {word}
          </span>
          {index < words.length - 1 && '\u00A0'}
        </span>
      ))}
    </>
  );
}

export function EndGameGuessSequence({ sequence, onComplete }: EndGameGuessSequenceProps) {
  const [currentSentence, setCurrentSentence] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  
  useEffect(() => {
    if (!sequence) return;
    
    const timers: NodeJS.Timeout[] = [];
    
    // Zamanlama açıklaması:
    // Cümle 1: 0-1 saniye arası gösterilir (1 saniye)
    // Cümle 2: 1-6 saniye arası gösterilir (5 saniye) 
    // Cümle 3: 6-10 saniye arası gösterilir (4 saniye)
    // Video/Bitiş: 10+ saniye
    
    // İlk cümle başlasın
    setCurrentSentence(1);
    
    // 1 saniye sonra ikinci cümleye geç
    timers.push(setTimeout(() => {
      setCurrentSentence(2);
    }, 1000));
    
    // 6 saniye sonra üçüncü cümleye geç
    timers.push(setTimeout(() => {
      setCurrentSentence(3);
    }, 6000));
    
    // 10 saniye sonra bitir veya video göster
    timers.push(setTimeout(() => {
      if (sequence.success) {
        setShowVideo(true);
        setCurrentSentence(0); // Yazıları gizle
        // NormalWinVideo kendi onComplete'ini çağıracak
      } else {
        // Yanlış tahmin - direkt bitir
        onComplete?.();
      }
    }, 10000));
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [sequence, onComplete]);
  
  if (!sequence) return null;
  
  const roleText = "Kahin";
  const actualRoleText = sequence.actualRole === "prophet" ? "KAHİN" : "NORMAL AJAN";
  const isCorrect = sequence.success;
  
  // Video gösteriliyorsa sadece video göster - normal kazanma videosu kullan
  if (showVideo && isCorrect && sequence.finalWinner && sequence.finalWinnerName) {
    return (
      <NormalWinVideo 
        winnerTeam={sequence.finalWinner}
        winnerTeamName={sequence.finalWinnerName}
        onComplete={onComplete}
      />
    );
  }
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full text-center space-y-12">
        
        {/* Başlık - her zaman görünsün */}
        <div className="text-5xl md:text-7xl font-black text-purple-400 drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]">
          KAHİN TAHMİNİ
        </div>
        
        {/* Cümle 1: Takım kararı */}
        {currentSentence === 1 && (
          <div className="text-3xl md:text-5xl font-bold">
            <div className="mb-2">
              <AnimatedText text={sequence.guessingTeamName + " Takımı"} className="text-slate-300" />
            </div>
            <div className="mb-2">
              <span 
                className="text-yellow-400 text-4xl md:text-6xl inline-block font-black"
                style={{
                  animation: 'namePop 0.6s ease-out forwards',
                  animationDelay: '0.5s',
                  opacity: 0,
                }}
              >
                {sequence.targetPlayer}
              </span>
              <AnimatedText text=" oyuncusunun" className="text-slate-300" delay={0.8} />
            </div>
            <div>
              <span 
                className="text-purple-400 text-4xl md:text-6xl inline-block font-black"
                style={{
                  animation: 'rolePop 0.6s ease-out forwards',
                  animationDelay: '1.2s',
                  opacity: 0,
                }}
              >
                {roleText}
              </span>
              <AnimatedText text=" olduğuna karar verdi!" className="text-slate-300" delay={1.5} />
            </div>
          </div>
        )}
        
        {/* Cümle 2: Gerçek rol açıklaması */}
        {currentSentence === 2 && (
          <div className="text-3xl md:text-5xl font-bold">
            <div className="mb-4">
              <span 
                className="text-yellow-400 text-4xl md:text-6xl inline-block font-black"
                style={{
                  animation: 'namePop 0.6s ease-out forwards',
                  opacity: 0,
                }}
              >
                {sequence.targetPlayer}
              </span>
              <AnimatedText text=" oyuncusunun" className="text-slate-300" delay={0.4} />
            </div>
            <div className="mb-6">
              <AnimatedText text="gerçek rolü aslında..." className="text-slate-300 text-4xl" delay={0.8} />
            </div>
            <div 
              className={cn(
                "text-6xl md:text-8xl font-black",
                sequence.actualRole === "prophet" 
                  ? "text-purple-500 drop-shadow-[0_0_50px_rgba(168,85,247,0.8)]" 
                  : "text-slate-400 drop-shadow-[0_0_30px_rgba(148,163,184,0.5)]"
              )}
              style={{
                animation: 'roleReveal 1s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
                animationDelay: '1.8s',
                opacity: 0,
              }}
            >
              {actualRoleText} İDİ!
            </div>
          </div>
        )}
        
        {/* Cümle 3: Sonuç */}
        {currentSentence === 3 && (
          <div className="space-y-8">
            <div 
              className="text-5xl md:text-7xl font-black"
              style={{
                animation: 'resultSlam 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
                opacity: 0,
              }}
            >
              {isCorrect ? (
                <span className="text-green-400 drop-shadow-[0_0_40px_rgba(74,222,128,0.8)]">
                  ✓ DOĞRU TAHMİN!
                </span>
              ) : (
                <span className="text-red-400 drop-shadow-[0_0_40px_rgba(248,113,113,0.8)]">
                  ✗ YANLIŞ TAHMİN!
                </span>
              )}
            </div>
            
            <div className="text-5xl md:text-7xl font-black">
              <div
                className={cn(
                  sequence.finalWinner === "dark" 
                    ? "text-blue-400 drop-shadow-[0_0_60px_rgba(59,130,246,1)]" 
                    : "text-red-400 drop-shadow-[0_0_60px_rgba(239,68,68,1)]"
                )}
                style={{
                  animation: 'winnerPulse 2s ease-in-out infinite',
                  animationDelay: '0.8s',
                  opacity: 0,
                }}
              >
                {sequence.finalWinnerName}
              </div>
              <AnimatedText 
                text="TAKIMI KAZANDI!" 
                className={cn(
                  "text-6xl md:text-8xl",
                  sequence.finalWinner === "dark" ? "text-blue-300" : "text-red-300"
                )}
                delay={1.2} 
              />
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes wordFadeIn {
          0% {
            opacity: 0;
            transform: translateY(20px) scale(0.8);
            filter: blur(10px);
          }
          50% {
            opacity: 0.5;
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
            filter: blur(0);
          }
        }
        
        @keyframes namePop {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-180deg);
          }
          50% {
            transform: scale(1.2) rotate(10deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
          }
        }
        
        @keyframes rolePop {
          0% {
            opacity: 0;
            transform: translateX(-100px) scale(0.5);
          }
          70% {
            transform: translateX(20px) scale(1.1);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        
        @keyframes roleReveal {
          0% {
            opacity: 0;
            transform: scale(3) rotate(720deg);
            filter: blur(20px);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.5) rotate(360deg);
            filter: blur(5px);
          }
          80% {
            transform: scale(0.9) rotate(0);
            filter: blur(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0);
            filter: blur(0);
          }
        }
        
        @keyframes resultSlam {
          0% {
            opacity: 0;
            transform: translateY(-100px) scale(2);
          }
          60% {
            opacity: 1;
            transform: translateY(10px) scale(0.95);
          }
          80% {
            transform: translateY(-5px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes winnerPulse {
          0% {
            opacity: 0;
            transform: scale(0.5);
          }
          25% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          75% {
            transform: scale(1.05);
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