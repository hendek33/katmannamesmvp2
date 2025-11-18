import { useEffect, useRef } from 'react';

export function useIntroductionMusic(isIntroductionPhase: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Create audio element on mount
    if (!audioRef.current) {
      audioRef.current = new Audio('/effects (Cover) (1).aac');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5; // Start at 50% volume
    }

    return () => {
      // Cleanup on unmount
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isIntroductionPhase) {
      // Start playing music with fade in
      audio.volume = 0;
      audio.play().catch(err => {
        console.log('Could not play introduction music:', err.message);
      });
      
      // Fade in
      let volume = 0;
      const fadeIn = setInterval(() => {
        if (volume < 0.5) {
          volume += 0.025;
          audio.volume = Math.min(volume, 0.5);
        } else {
          clearInterval(fadeIn);
        }
      }, 50);
    } else {
      // Fade out and stop
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
      }

      let volume = audio.volume;
      fadeIntervalRef.current = setInterval(() => {
        if (volume > 0) {
          volume -= 0.025;
          audio.volume = Math.max(volume, 0);
        } else {
          audio.pause();
          audio.currentTime = 0;
          if (fadeIntervalRef.current) {
            clearInterval(fadeIntervalRef.current);
            fadeIntervalRef.current = null;
          }
        }
      }, 50);
    }
  }, [isIntroductionPhase]);

  return null;
}