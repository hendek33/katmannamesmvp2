class VideoCache {
  private static instance: VideoCache;
  private videoCache: Map<string, HTMLVideoElement> = new Map();
  private preloadPromises: Map<string, Promise<void>> = new Map();
  
  private constructor() {}
  
  static getInstance(): VideoCache {
    if (!VideoCache.instance) {
      VideoCache.instance = new VideoCache();
    }
    return VideoCache.instance;
  }
  
  async preloadVideo(src: string): Promise<void> {
    // If already preloading, wait for it
    if (this.preloadPromises.has(src)) {
      return this.preloadPromises.get(src);
    }
    
    // If already cached, return immediately
    if (this.videoCache.has(src)) {
      return Promise.resolve();
    }
    
    // Create preload promise
    const preloadPromise = this.createAndPreloadVideo(src);
    this.preloadPromises.set(src, preloadPromise);
    
    try {
      await preloadPromise;
    } finally {
      this.preloadPromises.delete(src);
    }
  }
  
  private async createAndPreloadVideo(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.src = src;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.autoplay = false;
      
      // Position off-screen
      video.style.position = 'fixed';
      video.style.left = '-9999px';
      video.style.width = '320px'; // Small size to actually decode frames
      video.style.height = '240px';
      video.style.pointerEvents = 'none';
      
      let timeoutId: NodeJS.Timeout;
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        video.removeEventListener('canplaythrough', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
      
      const handleCanPlay = async () => {
        try {
          // Actually try to play and pause to decode first frames
          await video.play();
          video.pause();
          video.currentTime = 0;
          
          // Cache the video element
          this.videoCache.set(src, video);
          document.body.appendChild(video);
          
          cleanup();
          resolve();
          console.log(`Video cached successfully: ${src}`);
        } catch (error) {
          console.error(`Failed to cache video ${src}:`, error);
          cleanup();
          reject(error);
        }
      };
      
      const handleError = (e: Event) => {
        console.error(`Video load error for ${src}:`, e);
        cleanup();
        reject(new Error(`Failed to load video: ${src}`));
      };
      
      video.addEventListener('canplaythrough', handleCanPlay);
      video.addEventListener('error', handleError);
      
      // Add to DOM temporarily to trigger loading
      document.body.appendChild(video);
      video.load();
      
      // Timeout after 10 seconds
      timeoutId = setTimeout(() => {
        cleanup();
        document.body.removeChild(video);
        reject(new Error(`Video preload timeout: ${src}`));
      }, 10000);
    });
  }
  
  async preloadAllVideos(): Promise<void> {
    const videoPaths = [
      '/mavi takım video tur.mp4',
      '/kırmızı takım video tur.mp4',
      '/siyah kelime seçme.mp4',
      '/mavi takım normal kazanma.mp4',
      '/kırmızı takım normal kazanma.mp4'
    ];
    
    try {
      // Load turn videos first (high priority)
      await Promise.all([
        this.preloadVideo(videoPaths[0]),
        this.preloadVideo(videoPaths[1])
      ]);
      
      // Then load the rest
      await Promise.all(
        videoPaths.slice(2).map(path => this.preloadVideo(path))
      );
      
      console.log('All videos preloaded successfully');
    } catch (error) {
      console.error('Failed to preload some videos:', error);
    }
  }
  
  getVideo(src: string): HTMLVideoElement | null {
    const cachedVideo = this.videoCache.get(src);
    if (!cachedVideo) {
      console.warn(`Video not in cache: ${src}`);
      return null;
    }
    
    // Clone the cached video for use
    const clonedVideo = cachedVideo.cloneNode(true) as HTMLVideoElement;
    clonedVideo.style.position = '';
    clonedVideo.style.left = '';
    clonedVideo.style.width = '';
    clonedVideo.style.height = '';
    clonedVideo.style.pointerEvents = '';
    
    return clonedVideo;
  }
  
  // Clean up all cached videos
  dispose(): void {
    this.videoCache.forEach(video => {
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      video.src = '';
      video.load();
    });
    this.videoCache.clear();
    this.preloadPromises.clear();
  }
}

export const videoCache = VideoCache.getInstance();