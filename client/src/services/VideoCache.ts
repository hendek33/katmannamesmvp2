class VideoCache {
  private static instance: VideoCache;
  private preloadedVideos = new Map<string, HTMLVideoElement>();
  private preloadPromise: Promise<void> | null = null;
  
  private constructor() {}
  
  static getInstance(): VideoCache {
    if (!VideoCache.instance) {
      VideoCache.instance = new VideoCache();
    }
    return VideoCache.instance;
  }
  
  async preloadAllVideos(): Promise<void> {
    // Return existing promise if already preloading
    if (this.preloadPromise) {
      return this.preloadPromise;
    }
    
    const videoPaths = [
      '/mavi takım video tur.mp4',
      '/kırmızı takım video tur.mp4',
      '/siyah kelime seçme yeni.mp4',
      '/mavi takım normal kazanma.mp4',
      '/kırmızı takım normal kazanma.mp4'
    ];
    
    this.preloadPromise = this.preloadVideosInternal(videoPaths);
    return this.preloadPromise;
  }
  
  private async preloadVideosInternal(videoPaths: string[]): Promise<void> {
    const promises = videoPaths.map(path => this.preloadSingleVideo(path));
    
    try {
      await Promise.all(promises);
      console.log('All videos preloaded and ready to play');
    } catch (error) {
      console.error('Some videos failed to preload:', error);
    }
  }
  
  private preloadSingleVideo(src: string): Promise<void> {
    if (this.preloadedVideos.has(src)) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = src;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      
      // Keep video in memory but hidden
      video.style.position = 'fixed';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      
      const handleCanPlayThrough = () => {
        // Store video element in memory for reuse
        this.preloadedVideos.set(src, video);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('error', handleError);
        console.log(`Video ready (canplaythrough): ${src}`);
        resolve();
      };
      
      const handleError = (e: Event) => {
        console.error(`Failed to preload video: ${src}`, e);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('error', handleError);
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
        // Continue even on error
        resolve();
      };
      
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('error', handleError);
      
      // Add to DOM to trigger loading
      document.body.appendChild(video);
      
      // Force load
      video.load();
      
      // Timeout fallback (10 seconds for larger files)
      setTimeout(() => {
        if (!this.preloadedVideos.has(src)) {
          console.warn(`Timeout preloading video: ${src}`);
          handleError(new Event('timeout'));
        }
      }, 10000);
    });
  }
  
  // Check if all videos are ready
  isReady(): boolean {
    const expectedCount = 5; // Number of video files
    return this.preloadedVideos.size >= expectedCount;
  }
  
  // Wait until all videos are ready
  async waitForVideosReady(): Promise<void> {
    if (!this.preloadPromise) {
      await this.preloadAllVideos();
    } else {
      await this.preloadPromise;
    }
  }
  
  // Get a preloaded video element if available
  getVideo(src: string): HTMLVideoElement | undefined {
    return this.preloadedVideos.get(src);
  }
  
  dispose(): void {
    // Remove all video elements from DOM
    this.preloadedVideos.forEach(video => {
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      video.pause();
      video.src = '';
    });
    this.preloadedVideos.clear();
    this.preloadPromise = null;
  }
}

export const videoCache = VideoCache.getInstance();