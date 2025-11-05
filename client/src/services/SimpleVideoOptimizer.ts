/**
 * Simple video optimizer for better playback performance
 */
export class SimpleVideoOptimizer {
  private static instance: SimpleVideoOptimizer;
  private videoCache: Map<string, HTMLVideoElement> = new Map();
  
  private constructor() {}
  
  static getInstance(): SimpleVideoOptimizer {
    if (!SimpleVideoOptimizer.instance) {
      SimpleVideoOptimizer.instance = new SimpleVideoOptimizer();
    }
    return SimpleVideoOptimizer.instance;
  }
  
  /**
   * Preload a video with optimal settings
   */
  async preloadVideo(src: string): Promise<void> {
    if (this.videoCache.has(src)) {
      return;
    }
    
    return new Promise((resolve) => {
      const video = document.createElement('video');
      
      // Optimal settings for fast loading
      video.src = src;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('webkit-playsinline', 'true');
      
      // Force load
      video.load();
      
      // Store reference
      this.videoCache.set(src, video);
      
      // Mark as ready when we have enough data
      const handleCanPlay = () => {
        video.removeEventListener('canplay', handleCanPlay);
        resolve();
      };
      
      video.addEventListener('canplay', handleCanPlay);
      
      // Timeout fallback
      setTimeout(() => {
        video.removeEventListener('canplay', handleCanPlay);
        resolve();
      }, 3000);
    });
  }
  
  /**
   * Preload all game videos in parallel
   */
  async preloadAllVideos(): Promise<void> {
    const videoPaths = [
      '/mavi takım video tur.mp4',
      '/kırmızı takım video tur.mp4',
      '/siyah kelime seçme yeni.mp4',
      '/mavi takım normal kazanma.mp4',
      '/kırmızı takım normal kazanma.mp4'
    ];
    
    // Load all in parallel
    await Promise.allSettled(
      videoPaths.map(path => this.preloadVideo(path))
    );
  }
  
  /**
   * Get optimized video attributes for a video element
   */
  getOptimizedAttributes(videoElement: HTMLVideoElement): void {
    // Apply optimal attributes
    videoElement.preload = 'auto';
    videoElement.muted = true;
    videoElement.playsInline = true;
    videoElement.setAttribute('webkit-playsinline', 'true');
    videoElement.setAttribute('disablePictureInPicture', 'true');
    videoElement.setAttribute('controlsList', 'nodownload');
    
    // Optimize buffering
    if ('requestVideoFrameCallback' in videoElement) {
      // Modern browsers: use frame callback for smoother playback
      (videoElement as any).requestVideoFrameCallback(() => {});
    }
  }
  
  /**
   * Play video with retry logic
   */
  async playVideoSafely(videoElement: HTMLVideoElement, maxRetries = 3): Promise<void> {
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        await videoElement.play();
        return;
      } catch (error) {
        console.warn(`Play attempt ${retries + 1} failed:`, error);
        retries++;
        
        if (retries < maxRetries) {
          // Wait a bit before retrying
          await new Promise(r => setTimeout(r, 100 * retries));
        }
      }
    }
    
    console.error('Failed to play video after all retries');
  }
  
  /**
   * Clear cache
   */
  dispose(): void {
    this.videoCache.clear();
  }
}

export const videoOptimizer = SimpleVideoOptimizer.getInstance();