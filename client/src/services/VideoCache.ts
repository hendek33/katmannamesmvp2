class VideoCache {
  private static instance: VideoCache;
  private preloadedVideos = new Set<string>();
  
  private constructor() {}
  
  static getInstance(): VideoCache {
    if (!VideoCache.instance) {
      VideoCache.instance = new VideoCache();
    }
    return VideoCache.instance;
  }
  
  async preloadAllVideos(): Promise<void> {
    const videoPaths = [
      '/mavi takım video tur.webm',
      '/kırmızı takım video tur.webm',
      '/siyah kelime seçme yeni.webm',
      '/mavi takım normal kazanma.webm',
      '/kırmızı takım normal kazanma.webm'
    ];
    
    const promises = videoPaths.map(path => this.preloadSingleVideo(path));
    
    try {
      await Promise.all(promises);
    } catch (error) {
    }
  }
  
  private preloadSingleVideo(src: string): Promise<void> {
    if (this.preloadedVideos.has(src)) {
      return Promise.resolve();
    }
    
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.src = src;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      
      // Hidden element
      video.style.position = 'fixed';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      
      const handleLoad = () => {
        this.preloadedVideos.add(src);
        cleanup();
        resolve();
      };
      
      const handleError = () => {
        cleanup();
        resolve(); // Continue even on error
      };
      
      const cleanup = () => {
        video.removeEventListener('loadeddata', handleLoad);
        video.removeEventListener('error', handleError);
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      };
      
      video.addEventListener('loadeddata', handleLoad);
      video.addEventListener('error', handleError);
      
      // Add to DOM temporarily
      document.body.appendChild(video);
      
      // Timeout fallback
      setTimeout(() => {
        cleanup();
        resolve();
      }, 5000);
    });
  }
  
  dispose(): void {
    this.preloadedVideos.clear();
  }
}

export const videoCache = VideoCache.getInstance();