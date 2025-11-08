import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import type { GameState } from "@shared/schema";
import { TurnVideoInline } from "./TurnVideoInline";

interface EndGameGuessSequenceProps {
  sequence: GameState["endGameGuessSequence"];
  onComplete?: () => void;
}

export function EndGameGuessSequence({ sequence, onComplete }: EndGameGuessSequenceProps) {
  const [currentSentence, setCurrentSentence] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  
  useEffect(() => {
    if (!sequence || isComplete) return;
    
    const timers: NodeJS.Timeout[] = [];
    
    // Cümle 1: "X Takımı Y oyuncusunun Kahin olduğuna karar verdi!" (0s başla, 3s göster)
    // Cümle 2: "Y oyuncusunun gerçek rolü aslında... Z İDİ!" (3s başla, 3s göster)  
    // Cümle 3: "DOĞRU/YANLIŞ TAHMİN! X TAKIMI KAZANDI!" (6s başla, 3s göster)
    // Sonuç ve video (eğer doğruysa): (9s başla, 4s göster)
    // Toplam: 13s (doğru tahmin) veya 10s (yanlış tahmin)
    
    // Başlangıç - ilk cümle hemen görünsün
    setCurrentSentence(1);
    
    // 3 saniye sonra ikinci cümle
    timers.push(setTimeout(() => {
      setCurrentSentence(2);
    }, 3000));
    
    // 6 saniye sonra üçüncü cümle (sonuç)
    timers.push(setTimeout(() => {
      setCurrentSentence(3);
    }, 6000));
    
    // 9 saniye sonra - doğru tahminde video göster
    if (sequence.success) {
      timers.push(setTimeout(() => {
        setShowVideo(true);
        setCurrentSentence(0); // Yazıları gizle
      }, 9000));
      
      // Video bitince (13 saniye sonra) kapat
      timers.push(setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 13000));
    } else {
      // Yanlış tahminde 10 saniye sonra (9+1 saniye bekleme) kapat
      timers.push(setTimeout(() => {
        setIsComplete(true);
        onComplete?.();
      }, 10000));
    }
    
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [sequence, onComplete, isComplete]);
  
  if (!sequence || isComplete) return null;
  
  const roleText = "Kahin";
  const actualRoleText = sequence.actualRole === "prophet" ? "KAHİN" : "NORMAL AJAN";
  const isCorrect = sequence.success;
  
  // Video gösteriliyorsa sadece video göster
  if (showVideo && isCorrect && sequence.finalWinner && sequence.finalWinnerName) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
        <TurnVideoInline 
          team={sequence.finalWinner}
          teamName={sequence.finalWinnerName}
          onComplete={() => {
            setIsComplete(true);
            onComplete?.();
          }}
        />
      </div>
    );
  }
  
  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4">
      <div className="max-w-5xl w-full text-center space-y-12">
        
        {/* Başlık - her zaman görünsün */}
        <div className="text-5xl md:text-7xl font-black text-purple-400">
          KAHİN TAHMİNİ
        </div>
        
        {/* Cümle 1: Takım kararı */}
        {currentSentence >= 1 && (
          <div 
            className="text-3xl md:text-5xl font-bold"
            style={{
              animation: 'fadeIn 0.5s ease-out forwards',
            }}
          >
            <span className="text-slate-300">{sequence.guessingTeamName} Takımı</span>
            <br />
            <span className="text-yellow-400 text-4xl md:text-6xl">{sequence.targetPlayer}</span>
            <span className="text-slate-300"> oyuncusunun</span>
            <br />
            <span className="text-purple-400 text-4xl md:text-6xl">{roleText}</span>
            <span className="text-slate-300"> olduğuna karar verdi!</span>
          </div>
        )}
        
        {/* Cümle 2: Gerçek rol açıklaması */}
        {currentSentence >= 2 && (
          <div 
            className="text-3xl md:text-5xl font-bold"
            style={{
              animation: 'fadeIn 0.5s ease-out forwards',
            }}
          >
            <span className="text-yellow-400 text-4xl md:text-6xl">{sequence.targetPlayer}</span>
            <span className="text-slate-300"> oyuncusunun</span>
            <br />
            <span className="text-slate-300">gerçek rolü aslında...</span>
            <br />
            <div 
              className={cn(
                "text-6xl md:text-8xl font-black mt-6",
                sequence.actualRole === "prophet" 
                  ? "text-purple-500 drop-shadow-[0_0_30px_rgba(168,85,247,0.7)]" 
                  : "text-slate-400"
              )}
              style={{
                animation: 'zoomIn 0.5s ease-out forwards',
                animationDelay: '0.5s',
                opacity: 0,
              }}
            >
              {actualRoleText} İDİ!
            </div>
          </div>
        )}
        
        {/* Cümle 3: Sonuç */}
        {currentSentence >= 3 && (
          <div 
            className="space-y-6"
            style={{
              animation: 'fadeIn 0.5s ease-out forwards',
            }}
          >
            <div className="text-5xl md:text-7xl font-black">
              {isCorrect ? (
                <span className="text-green-400 drop-shadow-[0_0_20px_rgba(74,222,128,0.6)]">
                  ✓ DOĞRU TAHMİN!
                </span>
              ) : (
                <span className="text-red-400 drop-shadow-[0_0_20px_rgba(248,113,113,0.6)]">
                  ✗ YANLIŞ TAHMİN!
                </span>
              )}
            </div>
            
            <div 
              className={cn(
                "text-6xl md:text-8xl font-black",
                sequence.finalWinner === "dark" ? "text-blue-400" : "text-red-400"
              )}
              style={{
                textShadow: sequence.finalWinner === "dark"
                  ? '0 0 40px rgba(59,130,246,0.9), 0 0 80px rgba(59,130,246,0.5)'
                  : '0 0 40px rgba(239,68,68,0.9), 0 0 80px rgba(239,68,68,0.5)',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            >
              {sequence.finalWinnerName} TAKIMI KAZANDI!
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.3);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
      `}</style>
    </div>
  );
}