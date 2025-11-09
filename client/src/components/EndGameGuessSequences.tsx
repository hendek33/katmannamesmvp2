import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface EndGameGuessSequencesProps {
  sequences?: any[]; // Array of sequences from backend
  singleSequence?: any; // Fallback for legacy single sequence
  onComplete?: () => void;
}

export function EndGameGuessSequences({ 
  sequences, 
  singleSequence,
  onComplete 
}: EndGameGuessSequencesProps) {
  const [step, setStep] = useState(0);
  const [showResult, setShowResult] = useState(false);
  
  // Prepare sequences array - fallback to single sequence if needed
  const allSequences = sequences || (singleSequence ? [singleSequence] : []);
  
  if (allSequences.length === 0) {
    onComplete?.();
    return null;
  }
  
  // Get both sequences (loser first, winner second)
  const loserSequence = allSequences[0];
  const winnerSequence = allSequences[1];
  
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];
    
    // Step 0: Show losing team's prophet and guess (3s)
    if (step === 0) {
      timers.push(setTimeout(() => setStep(1), 3000));
    }
    // Step 1: Show losing team's card reveal (2s)
    else if (step === 1) {
      timers.push(setTimeout(() => setStep(2), 2000));
    }
    // Step 2: Show "ama daha bitmedi..." transition (2s)
    else if (step === 2 && winnerSequence) {
      timers.push(setTimeout(() => setStep(3), 2000));
    }
    // Step 3: Show winning team's prophet and guess (3s)
    else if (step === 3) {
      timers.push(setTimeout(() => setStep(4), 3000));
    }
    // Step 4: Show winning team's card reveal (2s)
    else if (step === 4) {
      timers.push(setTimeout(() => setStep(5), 2000));
    }
    // Step 5: Show final result (3s then complete)
    else if (step === 5) {
      setShowResult(true);
      timers.push(setTimeout(() => onComplete?.(), 3000));
    }
    // If no winner sequence, go straight to result after loser reveal
    else if (step === 2 && !winnerSequence) {
      setShowResult(true);
      timers.push(setTimeout(() => onComplete?.(), 3000));
    }
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, [step, winnerSequence, onComplete]);
  
  const getTeamColor = (team: string) => {
    return team === "dark" 
      ? "from-blue-600 via-blue-500 to-blue-400"
      : "from-red-600 via-red-500 to-red-400";
  };
  
  const getTeamLabel = (team: string) => {
    return team === "dark" ? "Katman Koyu" : "Katman Açık";
  };
  
  // Determine final winner
  const determineWinner = () => {
    if (!loserSequence) return null;
    
    const loserCorrect = loserSequence.targetCard?.word === loserSequence.guessedCard?.word;
    const winnerCorrect = winnerSequence?.targetCard?.word === winnerSequence?.guessedCard?.word;
    
    if (loserCorrect && winnerCorrect) {
      // Both correct - original winner wins
      return loserSequence.votingTeam === "dark" ? "light" : "dark";
    } else if (loserCorrect) {
      // Only loser correct - loser wins
      return loserSequence.votingTeam;
    } else if (winnerCorrect) {
      // Only winner correct - winner wins
      return winnerSequence.votingTeam;
    } else {
      // Both wrong - original winner wins
      return loserSequence.votingTeam === "dark" ? "light" : "dark";
    }
  };
  
  const finalWinner = determineWinner();
  
  return (
    <div className="fixed inset-0 z-[100] bg-black">
      <AnimatePresence mode="wait">
        {/* Step 0-1: Losing team's sequence */}
        {(step === 0 || step === 1) && loserSequence && (
          <motion.div
            key="loser-sequence"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8"
          >
            {/* Team Header */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className={`mb-8 px-8 py-4 rounded-2xl bg-gradient-to-r ${getTeamColor(loserSequence.votingTeam)} shadow-2xl`}
            >
              <h2 className="text-3xl font-bold text-white">
                {getTeamLabel(loserSequence.votingTeam)} Takımı
              </h2>
            </motion.div>
            
            {/* Prophet and Guess */}
            {step === 0 && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mb-12"
              >
                <div className="text-2xl text-gray-300 mb-4">
                  Kahin: <span className="text-yellow-400 font-bold">{loserSequence.prophetName}</span>
                </div>
                <div className="text-xl text-gray-400">
                  Tahmin: <span className="text-white font-semibold">"{loserSequence.guessedCard?.word}"</span>
                </div>
              </motion.div>
            )}
            
            {/* Card Reveal */}
            {step === 1 && (
              <motion.div
                initial={{ scale: 0, rotate: 360 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10 }}
                className="relative"
              >
                <div className={`
                  w-64 h-40 rounded-xl flex items-center justify-center
                  ${loserSequence.targetCard?.type === "dark" ? "bg-gradient-to-br from-blue-700 to-blue-900" :
                    loserSequence.targetCard?.type === "light" ? "bg-gradient-to-br from-red-700 to-red-900" :
                    loserSequence.targetCard?.type === "neutral" ? "bg-gradient-to-br from-yellow-600 to-yellow-800" :
                    "bg-gradient-to-br from-gray-800 to-black"}
                  shadow-2xl transform hover:scale-105 transition-transform
                `}>
                  <span className="text-2xl font-bold text-white px-4 text-center">
                    {loserSequence.targetCard?.word}
                  </span>
                </div>
                
                {/* Result Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-4 -right-4"
                >
                  <div className={`
                    px-4 py-2 rounded-full font-bold text-lg
                    ${loserSequence.targetCard?.word === loserSequence.guessedCard?.word
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"}
                  `}>
                    {loserSequence.targetCard?.word === loserSequence.guessedCard?.word ? "✓ Doğru" : "✗ Yanlış"}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Step 2: Transition */}
        {step === 2 && winnerSequence && (
          <motion.div
            key="transition"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="h-full flex items-center justify-center"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-center"
            >
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                Ama daha bitmedi...
              </h1>
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="mt-4 text-2xl text-gray-400"
              >
                ⚡
              </motion.div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Step 3-4: Winning team's sequence */}
        {(step === 3 || step === 4) && winnerSequence && (
          <motion.div
            key="winner-sequence"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-full flex flex-col items-center justify-center p-8"
          >
            {/* Team Header */}
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15 }}
              className={`mb-8 px-8 py-4 rounded-2xl bg-gradient-to-r ${getTeamColor(winnerSequence.votingTeam)} shadow-2xl`}
            >
              <h2 className="text-3xl font-bold text-white">
                {getTeamLabel(winnerSequence.votingTeam)} Takımı
              </h2>
            </motion.div>
            
            {/* Prophet and Guess */}
            {step === 3 && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center mb-12"
              >
                <div className="text-2xl text-gray-300 mb-4">
                  Kahin: <span className="text-yellow-400 font-bold">{winnerSequence.prophetName}</span>
                </div>
                <div className="text-xl text-gray-400">
                  Tahmin: <span className="text-white font-semibold">"{winnerSequence.guessedCard?.word}"</span>
                </div>
              </motion.div>
            )}
            
            {/* Card Reveal */}
            {step === 4 && (
              <motion.div
                initial={{ scale: 0, rotate: -360 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", damping: 10 }}
                className="relative"
              >
                <div className={`
                  w-64 h-40 rounded-xl flex items-center justify-center
                  ${winnerSequence.targetCard?.type === "dark" ? "bg-gradient-to-br from-blue-700 to-blue-900" :
                    winnerSequence.targetCard?.type === "light" ? "bg-gradient-to-br from-red-700 to-red-900" :
                    winnerSequence.targetCard?.type === "neutral" ? "bg-gradient-to-br from-yellow-600 to-yellow-800" :
                    "bg-gradient-to-br from-gray-800 to-black"}
                  shadow-2xl transform hover:scale-105 transition-transform
                `}>
                  <span className="text-2xl font-bold text-white px-4 text-center">
                    {winnerSequence.targetCard?.word}
                  </span>
                </div>
                
                {/* Result Badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute -top-4 -right-4"
                >
                  <div className={`
                    px-4 py-2 rounded-full font-bold text-lg
                    ${winnerSequence.targetCard?.word === winnerSequence.guessedCard?.word
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"}
                  `}>
                    {winnerSequence.targetCard?.word === winnerSequence.guessedCard?.word ? "✓ Doğru" : "✗ Yanlış"}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
        
        {/* Step 5: Final Result */}
        {step === 5 && showResult && finalWinner && (
          <motion.div
            key="final-result"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex items-center justify-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="text-center"
            >
              {/* Trophy Animation */}
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="text-8xl mb-8"
              >
                🏆
              </motion.div>
              
              {/* Winner Text */}
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`
                  text-6xl font-bold mb-4
                  bg-gradient-to-r ${getTeamColor(finalWinner)}
                  bg-clip-text text-transparent
                `}
              >
                {getTeamLabel(finalWinner)}
              </motion.h1>
              
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="text-3xl text-yellow-400 font-bold"
              >
                KAZANDI!
              </motion.p>
              
              {/* Fireworks Effect */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ 
                      x: 0, 
                      y: 0,
                      scale: 0
                    }}
                    animate={{ 
                      x: [0, (i % 2 ? 1 : -1) * (100 + i * 30)],
                      y: [0, -200 - i * 50],
                      scale: [0, 1.5, 0],
                      opacity: [1, 0]
                    }}
                    transition={{
                      delay: 1 + i * 0.1,
                      duration: 1.5
                    }}
                    className="absolute left-1/2 top-1/2"
                  >
                    <div className={`
                      w-4 h-4 rounded-full
                      ${i % 3 === 0 ? "bg-yellow-400" : i % 3 === 1 ? "bg-purple-400" : "bg-pink-400"}
                    `} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* Single sequence result (no winner sequence) */}
        {step === 2 && !winnerSequence && showResult && (
          <motion.div
            key="single-result"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="h-full flex items-center justify-center"
          >
            <div className="text-center">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", damping: 10 }}
                className="text-8xl mb-8"
              >
                {loserSequence.targetCard?.word === loserSequence.guessedCard?.word ? "🎯" : "❌"}
              </motion.div>
              
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-4xl font-bold text-white mb-4"
              >
                {loserSequence.targetCard?.word === loserSequence.guessedCard?.word
                  ? "Kahin Doğru Bildi!"
                  : "Kahin Yanıldı!"}
              </motion.h1>
              
              <motion.p
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7 }}
                className={`
                  text-3xl font-bold
                  ${loserSequence.targetCard?.word === loserSequence.guessedCard?.word
                    ? "text-green-400"
                    : "text-red-400"}
                `}
              >
                {loserSequence.targetCard?.word === loserSequence.guessedCard?.word
                  ? `${getTeamLabel(loserSequence.votingTeam)} Takımı Kazandı!`
                  : `${getTeamLabel(loserSequence.votingTeam === "dark" ? "light" : "dark")} Takımı Kazandı!`}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}