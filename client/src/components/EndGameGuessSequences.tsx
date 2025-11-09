import { useState, useEffect } from "react";
import { EndGameGuessSequence } from "./EndGameGuessSequence";

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPause, setShowPause] = useState(false);
  
  // Prepare sequences array - fallback to single sequence if needed
  const allSequences = sequences || (singleSequence ? [singleSequence] : []);
  
  if (allSequences.length === 0) {
    onComplete?.();
    return null;
  }
  
  const currentSequence = allSequences[currentIndex];
  
  const handleSequenceComplete = () => {
    if (currentIndex < allSequences.length - 1) {
      // Show pause before next sequence
      setShowPause(true);
      
      // After 2 second pause, advance to next sequence
      setTimeout(() => {
        setShowPause(false);
        setCurrentIndex(currentIndex + 1);
      }, 2000);
    } else {
      // All sequences complete
      onComplete?.();
    }
  };
  
  // Show pause screen between sequences
  if (showPause) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-purple-400 font-bold animate-pulse">
            ...
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <EndGameGuessSequence
      sequence={currentSequence}
      onComplete={handleSequenceComplete}
    />
  );
}