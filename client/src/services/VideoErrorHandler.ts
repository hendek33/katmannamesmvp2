/**
 * Advanced video error handling and retry mechanism
 */

interface VideoError {
  type: 'network' | 'decode' | 'source' | 'abort' | 'not-supported' | 'unknown';
  message: string;
  timestamp: number;
  videoSrc: string;
  retryCount: number;
  maxRetries: number;
  canRetry: boolean;
  originalError?: Error | DOMException;
}

interface RetryStrategy {
  maxRetries: number;
  baseDelay: number; // ms
  maxDelay: number; // ms
  backoffMultiplier: number;
  jitterRange: number; // 0-1, adds randomness to delay
}

interface RecoveryAction {
  type: 'reload' | 'quality-downgrade' | 'source-switch' | 'wait' | 'fallback';
  execute: () => Promise<void>;
  description: string;
}

export class VideoErrorHandler {
  private static instance: VideoErrorHandler;
  private errorHistory: Map<string, VideoError[]> = new Map();
  private retryQueues: Map<string, NodeJS.Timeout> = new Map();
  private errorListeners: Map<string, Set<(error: VideoError) => void>> = new Map();
  
  // Retry strategies for different error types
  private readonly retryStrategies: Record<VideoError['type'], RetryStrategy> = {
    network: {
      maxRetries: 5,
      baseDelay: 1000,
      maxDelay: 30000,
      backoffMultiplier: 2,
      jitterRange: 0.3
    },
    decode: {
      maxRetries: 2,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 1.5,
      jitterRange: 0.2
    },
    source: {
      maxRetries: 3,
      baseDelay: 2000,
      maxDelay: 10000,
      backoffMultiplier: 1.5,
      jitterRange: 0.1
    },
    abort: {
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 5000,
      backoffMultiplier: 2,
      jitterRange: 0.4
    },
    'not-supported': {
      maxRetries: 0, // Can't retry unsupported formats
      baseDelay: 0,
      maxDelay: 0,
      backoffMultiplier: 1,
      jitterRange: 0
    },
    unknown: {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
      backoffMultiplier: 2,
      jitterRange: 0.3
    }
  };
  
  private constructor() {
    this.setupGlobalErrorHandling();
  }
  
  static getInstance(): VideoErrorHandler {
    if (!this.instance) {
      this.instance = new VideoErrorHandler();
    }
    return this.instance;
  }
  
  /**
   * Setup global error handling for video elements
   */
  private setupGlobalErrorHandling(): void {
    // Intercept video element creation
    const originalCreateElement = document.createElement;
    document.createElement = function(tagName: string, ...args: any[]) {
      const element = originalCreateElement.apply(this, [tagName, ...args] as any);
      
      if (tagName.toLowerCase() === 'video') {
        const videoElement = element as HTMLVideoElement;
        VideoErrorHandler.getInstance().attachErrorHandlers(videoElement);
      }
      
      return element;
    };
  }
  
  /**
   * Attach error handlers to a video element
   */
  attachErrorHandlers(video: HTMLVideoElement): void {
    // Error event handler
    video.addEventListener('error', (event) => {
      const error = this.createVideoError(video, event);
      this.handleError(error, video);
    });
    
    // Stalled event handler
    video.addEventListener('stalled', () => {
      const error: VideoError = {
        type: 'network',
        message: 'Video loading stalled',
        timestamp: Date.now(),
        videoSrc: video.src,
        retryCount: 0,
        maxRetries: this.retryStrategies.network.maxRetries,
        canRetry: true
      };
      this.handleError(error, video);
    });
    
    // Waiting event handler (buffer underrun)
    video.addEventListener('waiting', () => {
      console.warn(`Video buffering: ${video.src}`);
      // Don't treat as error immediately, give it time to recover
      setTimeout(() => {
        if (video.readyState < 3) { // HAVE_FUTURE_DATA
          const error: VideoError = {
            type: 'network',
            message: 'Video buffer underrun',
            timestamp: Date.now(),
            videoSrc: video.src,
            retryCount: 0,
            maxRetries: this.retryStrategies.network.maxRetries,
            canRetry: true
          };
          this.handleError(error, video);
        }
      }, 5000); // Wait 5 seconds before treating as error
    });
  }
  
  /**
   * Create a VideoError from a video error event
   */
  private createVideoError(video: HTMLVideoElement, event: Event): VideoError {
    const mediaError = video.error;
    let type: VideoError['type'] = 'unknown';
    let message = 'Unknown video error';
    
    if (mediaError) {
      switch (mediaError.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          type = 'abort';
          message = 'Video playback aborted';
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          type = 'network';
          message = 'Network error while loading video';
          break;
        case MediaError.MEDIA_ERR_DECODE:
          type = 'decode';
          message = 'Video decoding error';
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          type = 'not-supported';
          message = 'Video format not supported';
          break;
      }
      
      // Add specific message if available
      if (mediaError.message) {
        message += `: ${mediaError.message}`;
      }
    }
    
    return {
      type,
      message,
      timestamp: Date.now(),
      videoSrc: video.src,
      retryCount: this.getRetryCount(video.src),
      maxRetries: this.retryStrategies[type].maxRetries,
      canRetry: this.canRetry(type, video.src),
      originalError: mediaError as any
    };
  }
  
  /**
   * Handle video error with recovery strategies
   */
  private async handleError(error: VideoError, video: HTMLVideoElement): Promise<void> {
    console.error(`Video Error [${error.type}]: ${error.message} - ${error.videoSrc}`);
    
    // Add to error history
    this.addToErrorHistory(error);
    
    // Notify listeners
    this.notifyErrorListeners(error);
    
    // Cancel any pending retries for this video
    this.cancelRetry(error.videoSrc);
    
    // Determine recovery strategy
    const recoveryActions = this.determineRecoveryActions(error, video);
    
    // Execute recovery actions
    for (const action of recoveryActions) {
      console.log(`🔧 Attempting recovery: ${action.description}`);
      try {
        await action.execute();
        console.log(`✅ Recovery successful: ${action.description}`);
        break; // Stop if successful
      } catch (recoveryError) {
        console.warn(`❌ Recovery failed: ${action.description}`, recoveryError);
        // Continue to next recovery action
      }
    }
    
    // If all recovery attempts fail and we can retry
    if (error.canRetry && error.retryCount < error.maxRetries) {
      this.scheduleRetry(error, video);
    } else if (error.retryCount >= error.maxRetries) {
      this.handleFinalFailure(error, video);
    }
  }
  
  /**
   * Determine recovery actions based on error type
   */
  private determineRecoveryActions(error: VideoError, video: HTMLVideoElement): RecoveryAction[] {
    const actions: RecoveryAction[] = [];
    
    switch (error.type) {
      case 'network':
        // Network errors: try reload, then quality downgrade
        actions.push({
          type: 'reload',
          description: 'Reloading video',
          execute: async () => {
            video.load();
            await this.waitForReadyState(video, 2); // HAVE_CURRENT_DATA
          }
        });
        
        if (error.retryCount > 2) {
          actions.push({
            type: 'quality-downgrade',
            description: 'Reducing video quality',
            execute: async () => {
              // Trigger quality downgrade through adaptive streaming
              const event = new CustomEvent('video-force-quality-downgrade', {
                detail: { videoSrc: error.videoSrc }
              });
              window.dispatchEvent(event);
              video.load();
              await this.waitForReadyState(video, 2);
            }
          });
        }
        break;
        
      case 'decode':
        // Decode errors: try seeking, then reload
        actions.push({
          type: 'reload',
          description: 'Seeking to recover from decode error',
          execute: async () => {
            const currentTime = video.currentTime;
            video.currentTime = Math.max(0, currentTime - 1); // Seek back 1 second
            await this.waitForReadyState(video, 3); // HAVE_FUTURE_DATA
          }
        });
        break;
        
      case 'source':
        // Source errors: try alternative sources if available
        actions.push({
          type: 'source-switch',
          description: 'Switching to alternative source',
          execute: async () => {
            // Try to use a fallback source or different quality
            const fallbackSrc = this.getFallbackSource(error.videoSrc);
            if (fallbackSrc) {
              video.src = fallbackSrc;
              video.load();
              await this.waitForReadyState(video, 2);
            } else {
              throw new Error('No fallback source available');
            }
          }
        });
        break;
        
      case 'abort':
        // Abort errors: wait then reload
        actions.push({
          type: 'wait',
          description: 'Waiting before retry',
          execute: async () => {
            await this.delay(2000);
            video.load();
            await this.waitForReadyState(video, 2);
          }
        });
        break;
    }
    
    // Add fallback action as last resort
    if (error.retryCount >= error.maxRetries - 1) {
      actions.push({
        type: 'fallback',
        description: 'Using fallback content',
        execute: async () => {
          this.showFallbackContent(video, error);
        }
      });
    }
    
    return actions;
  }
  
  /**
   * Schedule a retry with exponential backoff
   */
  private scheduleRetry(error: VideoError, video: HTMLVideoElement): void {
    const strategy = this.retryStrategies[error.type];
    
    // Calculate delay with exponential backoff and jitter
    let delay = strategy.baseDelay * Math.pow(strategy.backoffMultiplier, error.retryCount);
    delay = Math.min(delay, strategy.maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = delay * strategy.jitterRange * (Math.random() - 0.5) * 2;
    delay += jitter;
    
    console.log(`⏱️ Scheduling retry #${error.retryCount + 1} in ${Math.round(delay)}ms`);
    
    const timeout = setTimeout(() => {
      error.retryCount++;
      video.load();
      
      // Re-attach error handler for next potential error
      video.addEventListener('error', () => {
        this.handleError(error, video);
      }, { once: true });
    }, delay);
    
    this.retryQueues.set(error.videoSrc, timeout);
  }
  
  /**
   * Cancel pending retry
   */
  private cancelRetry(videoSrc: string): void {
    const timeout = this.retryQueues.get(videoSrc);
    if (timeout) {
      clearTimeout(timeout);
      this.retryQueues.delete(videoSrc);
    }
  }
  
  /**
   * Wait for video ready state
   */
  private waitForReadyState(video: HTMLVideoElement, targetState: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (video.readyState >= targetState) {
        resolve();
        return;
      }
      
      const checkState = () => {
        if (video.readyState >= targetState) {
          clearInterval(interval);
          clearTimeout(timeout);
          resolve();
        }
      };
      
      const interval = setInterval(checkState, 100);
      
      // Timeout after 10 seconds
      const timeout = setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Timeout waiting for video ready state'));
      }, 10000);
    });
  }
  
  /**
   * Get fallback source for a video
   */
  private getFallbackSource(originalSrc: string): string | null {
    // Map of original sources to fallback sources
    const fallbackMap: Record<string, string> = {
      // Add fallback mappings here if available
    };
    
    return fallbackMap[originalSrc] || null;
  }
  
  /**
   * Show fallback content when video fails completely
   */
  private showFallbackContent(video: HTMLVideoElement, error: VideoError): void {
    const fallbackDiv = document.createElement('div');
    fallbackDiv.className = 'video-error-fallback';
    fallbackDiv.innerHTML = `
      <div class="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
        <p class="text-red-400 mb-2">⚠️ Video yüklenemedi</p>
        <p class="text-sm text-gray-400">${error.message}</p>
        <button class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
                onclick="location.reload()">
          Sayfayı Yenile
        </button>
      </div>
    `;
    
    // Replace video with fallback content
    if (video.parentElement) {
      video.style.display = 'none';
      video.parentElement.appendChild(fallbackDiv);
    }
  }
  
  /**
   * Handle final failure after all retries exhausted
   */
  private handleFinalFailure(error: VideoError, video: HTMLVideoElement): void {
    console.error(`❌ Video failed permanently after ${error.retryCount} retries: ${error.videoSrc}`);
    
    // Emit final failure event
    const event = new CustomEvent('video-permanent-failure', {
      detail: error
    });
    window.dispatchEvent(event);
    
    // Show fallback content
    this.showFallbackContent(video, error);
  }
  
  /**
   * Helper functions
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private getRetryCount(videoSrc: string): number {
    const history = this.errorHistory.get(videoSrc) || [];
    return history.length;
  }
  
  private canRetry(errorType: VideoError['type'], videoSrc: string): boolean {
    const strategy = this.retryStrategies[errorType];
    const retryCount = this.getRetryCount(videoSrc);
    return retryCount < strategy.maxRetries;
  }
  
  private addToErrorHistory(error: VideoError): void {
    const history = this.errorHistory.get(error.videoSrc) || [];
    history.push(error);
    
    // Keep only last 10 errors per video
    if (history.length > 10) {
      history.shift();
    }
    
    this.errorHistory.set(error.videoSrc, history);
  }
  
  private notifyErrorListeners(error: VideoError): void {
    const listeners = this.errorListeners.get(error.videoSrc);
    if (listeners) {
      listeners.forEach(listener => listener(error));
    }
  }
  
  /**
   * Public API
   */
  
  /**
   * Register error listener for a specific video
   */
  onError(videoSrc: string, callback: (error: VideoError) => void): () => void {
    if (!this.errorListeners.has(videoSrc)) {
      this.errorListeners.set(videoSrc, new Set());
    }
    
    this.errorListeners.get(videoSrc)!.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.errorListeners.get(videoSrc)?.delete(callback);
    };
  }
  
  /**
   * Get error history for a video
   */
  getErrorHistory(videoSrc: string): VideoError[] {
    return this.errorHistory.get(videoSrc) || [];
  }
  
  /**
   * Clear error history for a video
   */
  clearErrorHistory(videoSrc: string): void {
    this.errorHistory.delete(videoSrc);
  }
  
  /**
   * Manually trigger error recovery
   */
  async recoverVideo(video: HTMLVideoElement): Promise<void> {
    const error: VideoError = {
      type: 'unknown',
      message: 'Manual recovery triggered',
      timestamp: Date.now(),
      videoSrc: video.src,
      retryCount: 0,
      maxRetries: 1,
      canRetry: true
    };
    
    await this.handleError(error, video);
  }
}

export const videoErrorHandler = VideoErrorHandler.getInstance();