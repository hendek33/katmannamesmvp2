import { useEffect, useRef, useState } from "react";

export function VideoPreloader() {
  const [loadStatus, setLoadStatus] = useState<Record<string, boolean>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});
  
  useEffect(() => {
    const videoPaths = [
      '/mavi takım video tur.mp4',
      '/kırmızı takım video tur.mp4', 
      '/siyah kelime seçme.mp4',
      '/mavi takım normal kazanma.mp4',
      '/kırmızı takım normal kazanma.mp4'
    ];
    
    // Create and preload videos
    videoPaths.forEach(path => {
      if (!videoRefs.current[path]) {
        const video = document.createElement('video');
        video.src = path;
        video.preload = 'auto';
        video.muted = true;
        video.playsInline = true;
        video.style.position = 'fixed';
        video.style.left = '-9999px';
        video.style.width = '1px';
        video.style.height = '1px';
        
        // Track loading status
        video.addEventListener('canplaythrough', () => {
          console.log(`Video preloaded: ${path}`);
          setLoadStatus(prev => ({ ...prev, [path]: true }));
        });
        
        video.addEventListener('error', (e) => {
          console.error(`Video preload error: ${path}`, e);
          setLoadStatus(prev => ({ ...prev, [path]: false }));
        });
        
        // Add to DOM to force loading
        document.body.appendChild(video);
        video.load();
        
        videoRefs.current[path] = video;
      }
    });
    
    // Cleanup on unmount
    return () => {
      Object.values(videoRefs.current).forEach(video => {
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        video.src = '';
      });
      videoRefs.current = {};
    };
  }, []);
  
  // Also render hidden video elements as backup
  return (
    <div style={{ position: 'fixed', left: '-9999px', width: '1px', height: '1px', overflow: 'hidden' }} aria-hidden="true">
      <video src="/mavi takım video tur.mp4" preload="auto" muted playsInline />
      <video src="/kırmızı takım video tur.mp4" preload="auto" muted playsInline />
      <video src="/siyah kelime seçme.mp4" preload="auto" muted playsInline />
      <video src="/mavi takım normal kazanma.mp4" preload="auto" muted playsInline />
      <video src="/kırmızı takım normal kazanma.mp4" preload="auto" muted playsInline />
    </div>
  );
}