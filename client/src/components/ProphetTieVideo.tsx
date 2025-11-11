import { useEffect, useState } from "react";
import { useInlineVideo } from "@/hooks/useInlineVideo";

interface ProphetTieVideoProps {
  onComplete?: () => void;
}

export function ProphetTieVideo({ onComplete }: ProphetTieVideoProps) {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const videoSrc = "/kahin beraberlik.webm";
  const { videoRef, base64Url } = useInlineVideo(videoSrc, {
    autoPlay: true,
    onComplete: handleVideoEnd
  });
  
  function handleVideoEnd() {
    // Start fade out animation
    setFadeOut(true);
    // Complete after fade out
    setTimeout(() => {
      setShow(false);
      onComplete?.();
    }, 800);
  }
  
  if (!show) return null;
  
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black"
      style={{
        animation: fadeOut 
          ? 'fadeOut 0.8s ease-out forwards'
          : 'fadeIn 0.5s ease-in forwards'
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }
      `}</style>
      <video
        ref={videoRef}
        src={base64Url || videoSrc}
        className="w-full h-full object-contain"
        autoPlay
        playsInline
        onEnded={handleVideoEnd}
        style={{ maxWidth: '100%', maxHeight: '100%' }}
      />
    </div>
  );
}