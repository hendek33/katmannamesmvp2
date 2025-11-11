import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import type { GameState } from "@shared/schema";
import { Zap, Sparkles, Star } from "lucide-react";
import { ProphetTieVideo } from "./ProphetTieVideo";

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

// Parçacık efekti component
function ParticleEffect({ type }: { type: 'success' | 'fail' }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "absolute w-2 h-2 rounded-full",
            type === 'success' ? "bg-green-400" : "bg-red-400"
          )}
          style={{
            left: '50%',
            top: '50%',
            animation: `particle${i % 4} 2s ease-out forwards`,
            animationDelay: `${i * 0.05}s`,
          }}
        />
      ))}
    </div>
  );
}

export function EndGameGuessSequence({ sequence, onComplete }: EndGameGuessSequenceProps) {
  const [phase, setPhase] = useState<'reveal' | 'decision' | 'result' | 'video' | 'finished'>('reveal');
  const [showDrumRoll, setShowDrumRoll] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [shake, setShake] = useState(false);
  const hasStartedRef = useRef(false);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  
  useEffect(() => {
    if (!sequence || hasStartedRef.current) {
      return;
    }
    
    hasStartedRef.current = true;
    
    // Faz süreleri (milisaniye)
    const phaseDurations = {
      reveal: 4000,      // İlk mesaj görüntülenme süresi (3 saniye)
      decisionIntro: 0, // Decision'a geçiş
      drumRoll: 4000,     // Davul rulosu animasyonu
      result: 5000        // Sonuç gösterimi
    };
    
    // Kümülatif zamanlama hesaplaması
    let elapsed = 0;
    
    // Timer 1: Reveal → Decision
    elapsed += phaseDurations.reveal;
    const timer1 = setTimeout(() => setPhase('decision'), elapsed);
    
    // Timer 2: Drum roll başlangıcı
    elapsed += phaseDurations.decisionIntro;
    const timer2 = setTimeout(() => {
      setShowDrumRoll(true);
    }, elapsed);
    
    // Timer 3: Decision → Result
    elapsed += phaseDurations.drumRoll;
    const timer3 = setTimeout(() => {
      setPhase('result');
      setShowDrumRoll(false);
      setShake(true);
      setShowParticles(true);
      setTimeout(() => setShake(false), 500);
    }, elapsed);
    
    // Timer 4: Result → Video/Finished
    elapsed += phaseDurations.result;
    const timer4 = setTimeout(() => {
      if (sequence.success) {
        setPhase('video');
      } else {
        setPhase('finished');
        onComplete?.();
      }
    }, elapsed);
    
    timersRef.current = [timer1, timer2, timer3, timer4];
    
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
      timersRef.current = [];
    };
  }, []);
  
  const handleVideoComplete = () => {
    setPhase('finished');
    onComplete?.();
  };

  if (!sequence || phase === 'finished') return null;
  
  const roleText = "Kahin";
  const actualRoleText = sequence.actualRole === "prophet" ? "KAHİN" : "NORMAL AJAN";
  const isCorrect = sequence.success;
  
  // Video gösteriliyorsa (beraberlik durumu)
  if (phase === 'video' && isCorrect) {
    return <ProphetTieVideo onComplete={handleVideoComplete} />;
  }
  
  return (
    <div 
      className={cn(
        "fixed inset-0 z-[100] bg-black flex items-center justify-center p-4",
        shake && "animate-shake"
      )}
    >
      {/* Arka plan efektleri */}
      <div className="absolute inset-0">
        {/* Radial gradient background */}
        <div 
          className="absolute inset-0"
          style={{
            background: phase === 'result' 
              ? isCorrect 
                ? 'radial-gradient(circle at center, rgba(74,222,128,0.1) 0%, transparent 50%)'
                : 'radial-gradient(circle at center, rgba(248,113,113,0.1) 0%, transparent 50%)'
              : 'radial-gradient(circle at center, rgba(168,85,247,0.05) 0%, transparent 50%)',
          }}
        />
        
        {/* Dönen ışınlar */}
        {(phase === 'decision' || showDrumRoll) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div 
              className="w-[200%] h-[200%]"
              style={{
                background: 'conic-gradient(from 0deg, transparent, rgba(168,85,247,0.1), transparent, rgba(168,85,247,0.1), transparent)',
                animation: 'spin 2s linear infinite',
              }}
            />
          </div>
        )}
      </div>
      
      {/* Parçacık efektleri */}
      {showParticles && <ParticleEffect type={isCorrect ? 'success' : 'fail'} />}
      
      {/* Ana içerik */}
      <div className="max-w-5xl w-full text-center space-y-12 relative z-10">
        
        {/* Başlık - her zaman görünsün */}
        {(
          <div 
            className="text-5xl md:text-7xl font-black text-purple-400 drop-shadow-[0_0_40px_rgba(168,85,247,0.6)]"
            style={{
              animation: phase === 'reveal' ? 'titleSlam 0.8s ease-out' : undefined,
            }}
          >
            <div className="flex items-center justify-center gap-4">
              <Sparkles className="w-12 h-12 md:w-16 md:h-16 animate-pulse" />
              <span>KAHİN TAHMİNİ</span>
              <Sparkles className="w-12 h-12 md:w-16 md:h-16 animate-pulse" />
            </div>
          </div>
        )}
        
        {/* Reveal aşaması: Takım kararı */}
        {phase === 'reveal' && (
          <div className="text-3xl md:text-5xl font-bold">
            <div className="mb-4">
              <AnimatedText text={sequence.guessingTeamName + " Takımı"} className="text-slate-300" />
            </div>
            <div className="mb-4">
              <span 
                className="text-yellow-400 text-5xl md:text-7xl inline-block font-black"
                style={{
                  animation: 'namePop 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
                  animationDelay: '0.5s',
                  opacity: 0,
                  textShadow: '0 0 30px rgba(251,191,36,0.8)',
                }}
              >
                {sequence.targetPlayer}
              </span>
              <AnimatedText text=" oyuncusunun" className="text-slate-300" delay={0.8} />
            </div>
            <div>
              <span 
                className="text-purple-400 text-5xl md:text-7xl inline-block font-black"
                style={{
                  animation: 'rolePop 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
                  animationDelay: '1.2s',
                  opacity: 0,
                  textShadow: '0 0 40px rgba(168,85,247,0.8)',
                }}
              >
                {roleText}
              </span>
              <AnimatedText text=" olduğuna karar verdi!" className="text-slate-300" delay={1.5} />
            </div>
          </div>
        )}
        
        {/* Decision aşaması: Gerçek rol açıklaması */}
        {phase === 'decision' && (
          <div className="text-3xl md:text-5xl font-bold">
            <div className="mb-6">
              <span 
                className="text-yellow-400 text-5xl md:text-7xl inline-block font-black"
                style={{
                  animation: 'namePop 0.6s ease-out forwards',
                  opacity: 0,
                  textShadow: '0 0 30px rgba(251,191,36,0.8)',
                }}
              >
                {sequence.targetPlayer}
              </span>
            </div>
            
            {!showDrumRoll ? (
              <div className="space-y-4">
                <AnimatedText text="oyuncusunun gerçek rolü" className="text-slate-300 text-3xl md:text-4xl" delay={0.4} />
                <AnimatedText text="aslında..." className="text-white text-4xl md:text-5xl font-black" delay={1} />
              </div>
            ) : (
              <div className="space-y-8">
                <div className="text-white text-3xl md:text-4xl">gerçek rolü...</div>
                <div className="flex justify-center items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 md:w-4 md:h-4 bg-purple-400 rounded-full"
                      style={{
                        animation: `dotPulse 1s ease-in-out infinite`,
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </div>
                <div className="text-5xl md:text-7xl font-black text-purple-500 animate-pulse">
                  AÇIKLANIYOR...
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Result aşaması: Sonuç */}
        {phase === 'result' && (
          <div className="space-y-12">
            {/* Rol açıklaması */}
            <div 
              className={cn(
                "text-7xl md:text-9xl font-black",
                sequence.actualRole === "prophet" 
                  ? "text-purple-500" 
                  : "text-slate-400"
              )}
              style={{
                animation: 'roleRevealExplosion 1.2s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
                textShadow: sequence.actualRole === "prophet"
                  ? '0 0 80px rgba(168,85,247,1), 0 0 160px rgba(168,85,247,0.5)'
                  : '0 0 40px rgba(148,163,184,0.8)',
              }}
            >
              {actualRoleText}!
            </div>
            
            {/* Doğru/Yanlış */}
            <div 
              className="text-5xl md:text-7xl font-black"
              style={{
                animation: 'resultSlam 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) forwards',
                animationDelay: '0.6s',
                opacity: 0,
              }}
            >
              {isCorrect ? (
                <div className="text-green-400">
                  <div className="flex items-center justify-center gap-4">
                    <Star className="w-16 h-16 fill-current animate-spin" />
                    <span style={{ textShadow: '0 0 60px rgba(74,222,128,1)' }}>
                      DOĞRU TAHMİN!
                    </span>
                    <Star className="w-16 h-16 fill-current animate-spin" />
                  </div>
                </div>
              ) : (
                <div className="text-red-400">
                  <div className="flex items-center justify-center gap-4">
                    <Zap className="w-16 h-16 animate-pulse" />
                    <span style={{ textShadow: '0 0 60px rgba(248,113,113,1)' }}>
                      YANLIŞ TAHMİN!
                    </span>
                    <Zap className="w-16 h-16 animate-pulse" />
                  </div>
                </div>
              )}
            </div>
            
            {/* Kazanan takım veya beraberlik */}
            <div className="text-6xl md:text-8xl font-black">
              {isCorrect ? (
                // Doğru tahmin - Beraberlik
                <>
                  <div
                    className="text-yellow-400 mb-4"
                    style={{
                      animation: 'winnerReveal 1.5s ease-out forwards',
                      animationDelay: '1.2s',
                      opacity: 0,
                      textShadow: '0 0 80px rgba(250,204,21,1), 0 0 160px rgba(250,204,21,0.5)',
                    }}
                  >
                    BERABERLIK
                  </div>
                  <AnimatedText 
                    text="SAĞLANDI!" 
                    className="text-5xl md:text-6xl text-yellow-300"
                    delay={1.8} 
                  />
                </>
              ) : (
                // Yanlış tahmin - Normal kazanan
                <>
                  <div
                    className={cn(
                      "mb-4",
                      sequence.finalWinner === "dark" 
                        ? "text-blue-400" 
                        : "text-red-400"
                    )}
                    style={{
                      animation: 'winnerReveal 1.5s ease-out forwards',
                      animationDelay: '1.2s',
                      opacity: 0,
                      textShadow: sequence.finalWinner === "dark"
                        ? '0 0 80px rgba(59,130,246,1), 0 0 160px rgba(59,130,246,0.5)'
                        : '0 0 80px rgba(239,68,68,1), 0 0 160px rgba(239,68,68,0.5)',
                    }}
                  >
                     {sequence.finalWinnerName} 
                  </div>
                  <AnimatedText 
                    text="TAKIMI KAZANDI!" 
                    className={cn(
                      "text-5xl md:text-6xl",
                      sequence.finalWinner === "dark" ? "text-blue-300" : "text-red-300"
                    )}
                    delay={1.8} 
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @keyframes countBounce {
          0% {
            opacity: 0;
            transform: scale(0.1);
          }
          50% {
            transform: scale(1.2);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes countPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        @keyframes titleSlam {
          0% {
            opacity: 0;
            transform: translateY(-100px) scale(0.5);
          }
          60% {
            opacity: 1;
            transform: translateY(10px) scale(1.05);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }
        
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
        
        @keyframes roleRevealExplosion {
          0% {
            opacity: 0;
            transform: scale(5) rotate(720deg);
            filter: blur(30px);
          }
          40% {
            opacity: 0.5;
            transform: scale(2) rotate(360deg);
            filter: blur(10px);
          }
          70% {
            opacity: 1;
            transform: scale(0.8) rotate(0);
            filter: blur(0);
          }
          85% {
            transform: scale(1.1) rotate(-5deg);
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
            transform: translateY(-150px) scale(3);
          }
          50% {
            opacity: 0.8;
            transform: translateY(20px) scale(0.9);
          }
          75% {
            opacity: 1;
            transform: translateY(-10px) scale(1.05);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes winnerReveal {
          0% {
            opacity: 0;
            transform: scale(0.1) rotateY(720deg);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.3) rotateY(360deg);
          }
          75% {
            opacity: 1;
            transform: scale(0.95) rotateY(0);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotateY(0);
          }
        }
        
        @keyframes dotPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0.3;
          }
          50% {
            transform: scale(1.5);
            opacity: 1;
          }
        }
        
        @keyframes particle0 {
          to {
            transform: translate(-200px, -300px);
            opacity: 0;
          }
        }
        
        @keyframes particle1 {
          to {
            transform: translate(250px, -250px);
            opacity: 0;
          }
        }
        
        @keyframes particle2 {
          to {
            transform: translate(-180px, 280px);
            opacity: 0;
          }
        }
        
        @keyframes particle3 {
          to {
            transform: translate(200px, 300px);
            opacity: 0;
          }
        }
        
        .animate-shake {
          animation: shake 0.5s;
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
      `}</style>
    </div>
  );
}