import { useEffect, useRef } from 'react';

export function useIntroductionMusic(isIntroductionPhase: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioAvailable = useRef<boolean>(false);

  useEffect(() => {
    // Try to create audio element on mount
    const tryCreateAudio = async () => {
      try {
        const testAudio = new Audio('/effects (Cover) (1).aac');
        
        // Test if the file exists by trying to load it
        await new Promise((resolve, reject) => {
          testAudio.addEventListener('canplaythrough', resolve, { once: true });
          testAudio.addEventListener('error', reject, { once: true });
          testAudio.load();
        });
        
        // If successful, create the actual audio element
        audioRef.current = new Audio('/effects (Cover) (1).aac');
        audioRef.current.loop = true;
        audioRef.current.volume = 0.5;
        audioAvailable.current = true;
        console.log('Introduction music loaded successfully');
      } catch (err) {
        // Audio file doesn't exist or can't be loaded, silently fail
        console.log('Introduction music not available - continuing without music');
        audioAvailable.current = false;
      }
    };
    
    tryCreateAudio();

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
    if (!audio || !audioAvailable.current) return;

    if (isIntroductionPhase) {
      // Start playing music with fade in
      audio.volume = 0;
      audio.play().catch(err => {
        // Silently fail if autoplay is blocked or other issues
        console.log('Could not autoplay introduction music - user interaction may be required');
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