export interface VideoLoadProgress {
  loaded: number;
  total: number;
  percentage: number;
  buffered: number;
  canPlay: boolean;
  isStalled: boolean;
}

interface VideoMetadata {
  src: string;
  element: HTMLVideoElement;
  loadProgress: VideoLoadProgress;
  retryCount: number;
  lastError?: Error;
  qualityLevel: 'high' | 'medium' | 'low';
}

export class EnhancedVideoCache {
  private static instance: EnhancedVideoCache;
  private videos: Map<string, VideoMetadata> = new Map();
  private loadingPromises: Map<string, Promise<HTMLVideoElement>> = new Map();
  private progressCallbacks: Map<string, (progress: VideoLoadProgress) => void> = new Map();
  private blobUrls: Map<string, string> = new Map(); // Store blob URLs for reuse
  
  // Buffer thresholds
  private readonly MIN_BUFFER_SECONDS = 3; // Minimum buffer before playing
  private readonly IDEAL_BUFFER_SECONDS = 5; // Ideal buffer for smooth playback
  private readonly MAX_RETRY_COUNT = 3;
  
  private constructor() {}
  
  static getInstance(): EnhancedVideoCache {
    if (!EnhancedVideoCache.instance) {
      EnhancedVideoCache.instance = new EnhancedVideoCache();
    }
    return EnhancedVideoCache.instance;
  }
  
  /**
   * Preload all game videos with enhanced buffering
   */
  async preloadAllVideos(): Promise<void> {
    const videoPaths = [
      '/mavi takım video tur.webm',
      '/kırmızı takım video tur.webm',
      '/siyah kelime seçme yeni.webm',
      '/mavi takım normal kazanma.webm',
      '/kırmızı takım normal kazanma.webm'
    ];
    
    // Start preloading all videos in parallel
    const promises = videoPaths.map(path => this.preloadVideoEnhanced(path));
    
    try {
      await Promise.all(promises);
      console.log('✅ All videos preloaded with enhanced buffering');
    } catch (error) {
      console.error('⚠️ Some videos failed to preload:', error);
    }
  }
  
  /**
   * Enhanced video preloading with buffer monitoring
   */
  private async preloadVideoEnhanced(src: string): Promise<HTMLVideoElement> {
    // Check if already loading or loaded
    if (this.loadingPromises.has(src)) {
      return this.loadingPromises.get(src)!;
    }
    
    const loadPromise = this.createEnhancedVideoLoader(src);
    this.loadingPromises.set(src, loadPromise);
    
    try {
      const video = await loadPromise;
      return video;
    } finally {
      this.loadingPromises.delete(src);
    }
  }
  
  /**
   * Create video element with enhanced loading strategy
   */
  private createEnhancedVideoLoader(src: string): Promise<HTMLVideoElement> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      const metadata: VideoMetadata = {
        src,
        element: video,
        loadProgress: {
          loaded: 0,
          total: 0,
          percentage: 0,
          buffered: 0,
          canPlay: false,
          isStalled: false
        },
        retryCount: 0,
        qualityLevel: 'high'
      };
      
      // Configure video element
      video.src = src;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      
      // Hidden but in DOM for loading
      video.style.position = 'fixed';
      video.style.left = '-9999px';
      video.style.width = '1920px'; // Full HD for proper buffering
      video.style.height = '1080px';
      video.style.pointerEvents = 'none';
      
      let stallTimeout: number;
      let lastLoadedBytes = 0;
      
      // Monitor loading progress
      const progressMonitor = setInterval(() => {
        if (video.buffered.length > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          const duration = video.duration || 1;
          
          metadata.loadProgress = {
            loaded: bufferedEnd,
            total: duration,
            percentage: (bufferedEnd / duration) * 100,
            buffered: bufferedEnd,
            canPlay: bufferedEnd >= this.MIN_BUFFER_SECONDS,
            isStalled: false
          };
          
          // Call progress callback if registered
          const callback = this.progressCallbacks.get(src);
          if (callback) {
            callback(metadata.loadProgress);
          }
          
          // Check if we have enough buffer to start
          if (bufferedEnd >= this.IDEAL_BUFFER_SECONDS) {
            console.log(`✅ Video ${src} has ideal buffer: ${bufferedEnd.toFixed(2)}s`);
            clearInterval(progressMonitor);
          }
        }
      }, 100);
      
      // Stall detection
      const stallDetector = setInterval(() => {
        if (video.buffered.length > 0) {
          const currentLoaded = video.buffered.end(video.buffered.length - 1);
          if (currentLoaded === lastLoadedBytes && currentLoaded < video.duration * 0.9) {
            metadata.loadProgress.isStalled = true;
            console.warn(`⚠️ Video loading stalled for ${src} at ${currentLoaded}s`);
            
            // Try to kickstart loading
            video.currentTime = currentLoaded + 0.1;
            video.load();
          }
          lastLoadedBytes = currentLoaded;
        }
      }, 2000);
      
      // Event handlers
      const handleCanPlayThrough = () => {
        console.log(`✅ Video ready: ${src}`);
        metadata.loadProgress.canPlay = true;
        cleanup();
        this.videos.set(src, metadata);
        resolve(video);
      };
      
      const handleLoadedMetadata = () => {
        console.log(`📊 Video metadata loaded: ${src}, duration: ${video.duration}s`);
      };
      
      const handleProgress = () => {
        if (video.buffered.length > 0) {
          const buffered = video.buffered.end(video.buffered.length - 1);
          const percentage = (buffered / video.duration) * 100;
          console.log(`📥 Loading ${src}: ${percentage.toFixed(1)}% (${buffered.toFixed(1)}s/${video.duration.toFixed(1)}s)`);
        }
      };
      
      const handleError = (error: Event) => {
        console.error(`❌ Video error for ${src}:`, error);
        metadata.lastError = new Error(`Failed to load video: ${src}`);
        metadata.retryCount++;
        
        if (metadata.retryCount < this.MAX_RETRY_COUNT) {
          console.log(`🔄 Retrying video load (${metadata.retryCount}/${this.MAX_RETRY_COUNT}): ${src}`);
          setTimeout(() => {
            video.load();
          }, 1000 * metadata.retryCount);
        } else {
          cleanup();
          reject(metadata.lastError);
        }
      };
      
      const handleStalled = () => {
        console.warn(`⏸️ Video loading stalled: ${src}`);
        metadata.loadProgress.isStalled = true;
        
        // Try to resume loading
        video.load();
      };
      
      const handleWaiting = () => {
        console.warn(`⏳ Video waiting for data: ${src}`);
      };
      
      const cleanup = () => {
        clearInterval(progressMonitor);
        clearInterval(stallDetector);
        if (stallTimeout) clearTimeout(stallTimeout);
        
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('progress', handleProgress);
        video.removeEventListener('error', handleError);
        video.removeEventListener('stalled', handleStalled);
        video.removeEventListener('waiting', handleWaiting);
        
        if (video.parentNode) {
          video.parentNode.removeChild(video);
        }
      };
      
      // Attach event listeners
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('progress', handleProgress);
      video.addEventListener('error', handleError);
      video.addEventListener('stalled', handleStalled);
      video.addEventListener('waiting', handleWaiting);
      
      // Add to DOM to trigger loading
      document.body.appendChild(video);
      
      // Start loading
      video.load();
      
      // Ultimate timeout fallback
      setTimeout(() => {
        if (!this.videos.has(src)) {
          console.error(`⏱️ Ultimate timeout for video: ${src}`);
          cleanup();
          reject(new Error(`Video loading timeout: ${src}`));
        }
      }, 30000); // 30 second timeout
    });
  }
  
  /**
   * Get a blob URL for the preloaded video to reuse buffered data
   */
  async getVideoUrl(src: string): Promise<string> {
    // Check if we already have a blob URL
    const existingBlobUrl = this.blobUrls.get(src);
    if (existingBlobUrl) {
      return existingBlobUrl;
    }
    
    // Ensure video is loaded
    const metadata = this.videos.get(src);
    if (!metadata) {
      await this.preloadVideoEnhanced(src);
    }
    
    // Create blob URL from the video
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      this.blobUrls.set(src, blobUrl);
      console.log(`🎯 Created blob URL for ${src}`);
      return blobUrl;
    } catch (error) {
      console.error(`Failed to create blob URL for ${src}:`, error);
      // Fallback to original URL
      return src;
    }
  }
  
  /**
   * Get the preloaded video element directly (for special cases)
   */
  getVideoElement(src: string): HTMLVideoElement | null {
    const metadata = this.videos.get(src);
    return metadata?.element || null;
  }
  
  /**
   * Register a progress callback for a video
   */
  onProgress(src: string, callback: (progress: VideoLoadProgress) => void): void {
    this.progressCallbacks.set(src, callback);
  }
  
  /**
   * Get loading progress for a video
   */
  getProgress(src: string): VideoLoadProgress | null {
    const metadata = this.videos.get(src);
    return metadata?.loadProgress || null;
  }
  
  /**
   * Check if all videos are ready
   */
  isAllReady(): boolean {
    const requiredVideos = 5;
    return this.videos.size >= requiredVideos;
  }
  
  /**
   * Warm up video for immediate playback
   */
  async warmUpVideo(src: string): Promise<void> {
    const metadata = this.videos.get(src);
    if (metadata && metadata.element) {
      // Play and immediately pause to decode first frames
      try {
        await metadata.element.play();
        metadata.element.pause();
        metadata.element.currentTime = 0;
        console.log(`🔥 Video warmed up: ${src}`);
      } catch (error) {
        console.warn(`Failed to warm up video: ${src}`, error);
      }
    }
  }
  
  /**
   * Clear all cached videos
   */
  dispose(): void {
    // Clean up blob URLs
    this.blobUrls.forEach(blobUrl => {
      URL.revokeObjectURL(blobUrl);
    });
    
    // Clean up video elements
    this.videos.forEach(metadata => {
      if (metadata.element.parentNode) {
        metadata.element.parentNode.removeChild(metadata.element);
      }
      metadata.element.src = '';
    });
    
    this.videos.clear();
    this.blobUrls.clear();
    this.loadingPromises.clear();
    this.progressCallbacks.clear();
  }
}

export const enhancedVideoCache = EnhancedVideoCache.getInstance();