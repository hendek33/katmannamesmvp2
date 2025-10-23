import { useEffect } from "react";

export function VideoPreloader() {
  useEffect(() => {
    // Videoları önceden yükle ve cache'le
    const videos = [
      '/mavi takım video tur.mp4',
      '/kırmızı takım video tur.mp4',
      '/siyah kelime seçme.mp4',
      '/mavi takım normal kazanma.mp4',
      '/kırmızı takım normal kazanma.mp4'
    ];

    const preloadVideo = (src: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'video';
      link.href = src;
      document.head.appendChild(link);
      
      // Video elementini oluştur ve yükle
      const video = document.createElement('video');
      video.src = src;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.style.display = 'none';
      
      // Video'yu belleğe al
      video.load();
      
      return video;
    };

    // Tüm videoları yükle
    videos.forEach(preloadVideo);
    
    console.log('Videos preloaded via link tags');
  }, []);

  return null;
}