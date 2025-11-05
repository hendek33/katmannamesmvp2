/**
 * Advanced video buffer management system with preloading and memory optimization
 */

interface BufferMetrics {
  bufferHealth: number; // 0-100 score
  currentBuffer: number; // seconds buffered ahead
  targetBuffer: number; // ideal buffer size
  isHealthy: boolean;
  needsOptimization: boolean;
  memoryUsage: number; // MB
}

interface VideoBufferState {
  src: string;
  element: HTMLVideoElement | null;
  bufferMetrics: BufferMetrics;
  priority: 'high' | 'medium' | 'low';
  lastAccessTime: number;
  preloadStrategy: 'aggressive' | 'moderate' | 'lazy';
}

export class VideoBufferManager {
  private static instance: VideoBufferManager;
  private bufferStates: Map<string, VideoBufferState> = new Map();
  private memoryLimit: number = 500; // MB
  private currentMemoryUsage: number = 0;
  private bufferMonitorInterval?: number;
  
  // Buffer thresholds
  private readonly MIN_BUFFER = 2; // seconds
  private readonly IDEAL_BUFFER = 5; // seconds
  private readonly MAX_BUFFER = 10; // seconds
  
  private constructor() {
    this.startBufferMonitoring();
    this.setupMemoryManagement();
  }
  
  static getInstance(): VideoBufferManager {
    if (!this.instance) {
      this.instance = new VideoBufferManager();
    }
    return this.instance;
  }
  
  /**
   * Register a video for buffer management
   */
  registerVideo(
    src: string, 
    priority: 'high' | 'medium' | 'low' = 'medium',
    preloadStrategy: 'aggressive' | 'moderate' | 'lazy' = 'moderate'
  ): void {
    if (!this.bufferStates.has(src)) {
      this.bufferStates.set(src, {
        src,
        element: null,
        bufferMetrics: {
          bufferHealth: 0,
          currentBuffer: 0,
          targetBuffer: this.getTargetBuffer(priority),
          isHealthy: false,
          needsOptimization: false,
          memoryUsage: 0
        },
        priority,
        lastAccessTime: Date.now(),
        preloadStrategy
      });
      
      this.optimizePreloadStrategy(src);
    }
  }
  
  /**
   * Get target buffer based on priority
   */
  private getTargetBuffer(priority: 'high' | 'medium' | 'low'): number {
    switch (priority) {
      case 'high': return this.MAX_BUFFER;
      case 'medium': return this.IDEAL_BUFFER;
      case 'low': return this.MIN_BUFFER;
    }
  }
  
  /**
   * Optimize preload strategy based on network and memory
   */
  private optimizePreloadStrategy(src: string): void {
    const state = this.bufferStates.get(src);
    if (!state) return;
    
    // Create optimized video element
    const video = document.createElement('video');
    video.src = src;
    
    // Apply strategy-specific settings
    switch (state.preloadStrategy) {
      case 'aggressive':
        video.preload = 'auto';
        video.load();
        // Force buffering by playing and immediately pausing
        video.play().then(() => {
          video.pause();
          video.currentTime = 0;
        }).catch(() => {});
        break;
        
      case 'moderate':
        video.preload = 'metadata';
        // Load metadata first, then upgrade to auto
        video.addEventListener('loadedmetadata', () => {
          video.preload = 'auto';
        }, { once: true });
        break;
        
      case 'lazy':
        video.preload = 'none';
        // Only load when explicitly requested
        break;
    }
    
    // Common optimizations
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    
    // Hide video element
    video.style.position = 'fixed';
    video.style.left = '-9999px';
    video.style.pointerEvents = 'none';
    
    state.element = video;
    document.body.appendChild(video);
  }
  
  /**
   * Start monitoring buffer health
   */
  private startBufferMonitoring(): void {
    this.bufferMonitorInterval = window.setInterval(() => {
      this.bufferStates.forEach((state, src) => {
        if (state.element && state.element.buffered.length > 0) {
          const bufferedEnd = state.element.buffered.end(state.element.buffered.length - 1);
          const currentTime = state.element.currentTime;
          const bufferAhead = bufferedEnd - currentTime;
          
          // Calculate buffer health score (0-100)
          const healthScore = Math.min(100, (bufferAhead / state.bufferMetrics.targetBuffer) * 100);
          
          // Update metrics
          state.bufferMetrics = {
            ...state.bufferMetrics,
            bufferHealth: healthScore,
            currentBuffer: bufferAhead,
            isHealthy: bufferAhead >= this.MIN_BUFFER,
            needsOptimization: healthScore < 50 || bufferAhead < this.MIN_BUFFER,
            memoryUsage: this.estimateMemoryUsage(state.element)
          };
          
          // Apply optimizations if needed
          if (state.bufferMetrics.needsOptimization) {
            this.optimizeBuffer(src);
          }
        }
      });
      
      this.updateMemoryUsage();
    }, 500);
  }
  
  /**
   * Optimize buffer for a specific video
   */
  private optimizeBuffer(src: string): void {
    const state = this.bufferStates.get(src);
    if (!state || !state.element) return;
    
    const video = state.element;
    
    // Strategy 1: Adjust playback rate temporarily to build buffer
    if (video.playbackRate > 0.9 && state.bufferMetrics.currentBuffer < this.MIN_BUFFER) {
      video.playbackRate = 0.9; // Slow down slightly to build buffer
      setTimeout(() => {
        video.playbackRate = 1.0; // Reset after buffer improves
      }, 3000);
    }
    
    // Strategy 2: Pause and prebuffer if critically low
    if (state.bufferMetrics.currentBuffer < 0.5) {
      const wasPlaying = !video.paused;
      video.pause();
      
      // Resume after buffer builds
      setTimeout(() => {
        if (wasPlaying && state.bufferMetrics.currentBuffer >= this.MIN_BUFFER) {
          video.play().catch(() => {});
        }
      }, 2000);
    }
    
    // Strategy 3: Adjust quality if repeatedly struggling
    if (state.bufferMetrics.bufferHealth < 30) {
      this.adjustVideoQuality(video, 'lower');
    }
  }
  
  /**
   * Adjust video quality for better performance
   */
  private adjustVideoQuality(video: HTMLVideoElement, direction: 'lower' | 'higher'): void {
    // This would integrate with adaptive bitrate streaming if available
    // For now, we can adjust resolution by scaling
    if (direction === 'lower') {
      video.style.width = '640px';
      video.style.height = '360px';
    } else {
      video.style.width = '1280px';
      video.style.height = '720px';
    }
  }
  
  /**
   * Setup memory management
   */
  private setupMemoryManagement(): void {
    // Monitor memory usage and clean up if needed
    setInterval(() => {
      if (this.currentMemoryUsage > this.memoryLimit) {
        this.performMemoryCleanup();
      }
    }, 5000);
    
    // Listen for memory pressure events
    if ('memory' in performance) {
      (performance as any).memory.addEventListener('pressure', () => {
        console.warn('Memory pressure detected, cleaning up video buffers');
        this.performMemoryCleanup();
      });
    }
  }
  
  /**
   * Estimate memory usage of a video element
   */
  private estimateMemoryUsage(video: HTMLVideoElement): number {
    if (!video.videoWidth || !video.videoHeight) return 0;
    
    // Rough estimate: width * height * 4 bytes per pixel * buffered seconds * 30 fps
    const bufferedSeconds = video.buffered.length > 0 
      ? video.buffered.end(video.buffered.length - 1) 
      : 0;
    
    const bytesPerFrame = video.videoWidth * video.videoHeight * 4;
    const estimatedFrames = bufferedSeconds * 30;
    const estimatedBytes = bytesPerFrame * estimatedFrames;
    
    return estimatedBytes / (1024 * 1024); // Convert to MB
  }
  
  /**
   * Update total memory usage
   */
  private updateMemoryUsage(): void {
    this.currentMemoryUsage = 0;
    this.bufferStates.forEach(state => {
      this.currentMemoryUsage += state.bufferMetrics.memoryUsage;
    });
  }
  
  /**
   * Perform memory cleanup
   */
  private performMemoryCleanup(): void {
    // Sort by priority and last access time
    const sortedStates = Array.from(this.bufferStates.entries())
      .sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityWeight[b[1].priority] - priorityWeight[a[1].priority];
        if (priorityDiff !== 0) return priorityDiff;
        
        return b[1].lastAccessTime - a[1].lastAccessTime;
      });
    
    // Remove low priority or old videos
    for (const [src, state] of sortedStates) {
      if (this.currentMemoryUsage <= this.memoryLimit * 0.8) break;
      
      if (state.priority === 'low' || Date.now() - state.lastAccessTime > 60000) {
        this.releaseVideo(src);
      }
    }
  }
  
  /**
   * Release a video from memory
   */
  private releaseVideo(src: string): void {
    const state = this.bufferStates.get(src);
    if (state?.element) {
      state.element.pause();
      state.element.src = '';
      state.element.load();
      state.element.remove();
      state.element = null;
      
      console.log(`Released video buffer for: ${src}`);
    }
  }
  
  /**
   * Get buffer metrics for a video
   */
  getBufferMetrics(src: string): BufferMetrics | null {
    return this.bufferStates.get(src)?.bufferMetrics || null;
  }
  
  /**
   * Update video priority
   */
  updatePriority(src: string, priority: 'high' | 'medium' | 'low'): void {
    const state = this.bufferStates.get(src);
    if (state) {
      state.priority = priority;
      state.bufferMetrics.targetBuffer = this.getTargetBuffer(priority);
      state.lastAccessTime = Date.now();
    }
  }
  
  /**
   * Preload video with specific strategy
   */
  async preloadVideo(src: string, strategy: 'aggressive' | 'moderate' | 'lazy' = 'moderate'): Promise<void> {
    this.registerVideo(src, 'high', strategy);
    
    return new Promise((resolve) => {
      const checkBuffer = setInterval(() => {
        const metrics = this.getBufferMetrics(src);
        if (metrics && metrics.currentBuffer >= this.MIN_BUFFER) {
          clearInterval(checkBuffer);
          resolve();
        }
      }, 100);
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkBuffer);
        resolve();
      }, 10000);
    });
  }
  
  /**
   * Get video element for playback
   */
  getVideoElement(src: string): HTMLVideoElement | null {
    const state = this.bufferStates.get(src);
    if (state) {
      state.lastAccessTime = Date.now();
      return state.element;
    }
    return null;
  }
  
  /**
   * Cleanup and destroy
   */
  destroy(): void {
    if (this.bufferMonitorInterval) {
      clearInterval(this.bufferMonitorInterval);
    }
    
    this.bufferStates.forEach((state, src) => {
      this.releaseVideo(src);
    });
    
    this.bufferStates.clear();
  }
}

export const videoBufferManager = VideoBufferManager.getInstance();