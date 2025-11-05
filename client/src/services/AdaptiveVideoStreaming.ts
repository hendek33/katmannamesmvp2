/**
 * Adaptive Video Streaming System
 * Automatically adjusts video quality based on network conditions and device capabilities
 */

interface NetworkMetrics {
  bandwidth: number; // Mbps
  latency: number; // ms
  packetLoss: number; // percentage
  jitter: number; // ms
  connectionType: 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';
}

interface QualityProfile {
  name: string;
  resolution: { width: number; height: number };
  bitrate: number; // kbps
  framerate: number;
  priority: number; // Higher = better quality
}

interface StreamingConfig {
  currentProfile: QualityProfile;
  availableProfiles: QualityProfile[];
  autoQuality: boolean;
  bufferTarget: number; // seconds
  adaptationInterval: number; // ms
}

export class AdaptiveVideoStreaming {
  private static instance: AdaptiveVideoStreaming;
  private networkMetrics: NetworkMetrics;
  private streamingConfigs: Map<string, StreamingConfig> = new Map();
  private metricsHistory: NetworkMetrics[] = [];
  private monitoringInterval?: number;
  
  // Quality profiles from lowest to highest
  private readonly qualityProfiles: QualityProfile[] = [
    { name: 'ultra-low', resolution: { width: 426, height: 240 }, bitrate: 300, framerate: 15, priority: 1 },
    { name: 'low', resolution: { width: 640, height: 360 }, bitrate: 600, framerate: 24, priority: 2 },
    { name: 'medium', resolution: { width: 854, height: 480 }, bitrate: 1200, framerate: 30, priority: 3 },
    { name: 'high', resolution: { width: 1280, height: 720 }, bitrate: 2500, framerate: 30, priority: 4 },
    { name: 'full-hd', resolution: { width: 1920, height: 1080 }, bitrate: 5000, framerate: 30, priority: 5 }
  ];
  
  private constructor() {
    this.networkMetrics = this.initializeNetworkMetrics();
    this.startNetworkMonitoring();
  }
  
  static getInstance(): AdaptiveVideoStreaming {
    if (!this.instance) {
      this.instance = new AdaptiveVideoStreaming();
    }
    return this.instance;
  }
  
  /**
   * Initialize network metrics
   */
  private initializeNetworkMetrics(): NetworkMetrics {
    return {
      bandwidth: this.estimateInitialBandwidth(),
      latency: 50,
      packetLoss: 0,
      jitter: 0,
      connectionType: this.detectConnectionType()
    };
  }
  
  /**
   * Estimate initial bandwidth based on connection type
   */
  private estimateInitialBandwidth(): number {
    const connection = (navigator as any).connection;
    
    if (connection) {
      // Use Network Information API if available
      const downlink = connection.downlink; // Mbps
      if (downlink) return downlink;
      
      // Fallback to effective type estimation
      switch (connection.effectiveType) {
        case 'slow-2g': return 0.05;
        case '2g': return 0.15;
        case '3g': return 2;
        case '4g': return 10;
        default: return 5;
      }
    }
    
    // Default assumption
    return 5; // Mbps
  }
  
  /**
   * Detect connection type
   */
  private detectConnectionType(): NetworkMetrics['connectionType'] {
    const connection = (navigator as any).connection;
    
    if (connection) {
      const type = connection.type;
      const effectiveType = connection.effectiveType;
      
      if (type === 'wifi') return 'wifi';
      if (type === 'ethernet') return 'ethernet';
      if (type === 'cellular') {
        switch (effectiveType) {
          case 'slow-2g': return 'slow-2g';
          case '2g': return '2g';
          case '3g': return '3g';
          case '4g': return '4g';
          case '5g': return '5g';
          default: return '4g';
        }
      }
    }
    
    return 'unknown';
  }
  
  /**
   * Start monitoring network conditions
   */
  private startNetworkMonitoring(): void {
    // Monitor connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        this.networkMetrics = this.initializeNetworkMetrics();
        this.adaptAllStreams();
      });
    }
    
    // Periodic bandwidth measurement
    this.monitoringInterval = window.setInterval(() => {
      this.measureBandwidth();
      this.updateMetricsHistory();
      this.adaptAllStreams();
    }, 5000); // Every 5 seconds
  }
  
  /**
   * Measure current bandwidth
   */
  private async measureBandwidth(): Promise<void> {
    // Use navigator.connection if available for immediate estimate
    const connection = (navigator as any).connection;
    if (connection?.downlink) {
      this.networkMetrics.bandwidth = this.smoothBandwidth(connection.downlink);
      return;
    }
    
    // Fallback: Fetch a small test video chunk to measure real network speed
    const testUrl = '/mavi takım video tur.mp4';
    const startTime = performance.now();
    
    try {
      // Fetch first 200KB of video with range request
      const response = await fetch(testUrl, {
        headers: {
          'Range': 'bytes=0-204799' // 200KB
        },
        cache: 'no-store' // Bypass cache for accurate measurement
      });
      
      if (response.ok) {
        const data = await response.arrayBuffer();
        const endTime = performance.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const bitsTransferred = data.byteLength * 8;
        const bandwidth = (bitsTransferred / duration) / 1000000; // Mbps
        
        // Smooth the measurement with history
        this.networkMetrics.bandwidth = this.smoothBandwidth(bandwidth);
      } else {
        // If range request fails, use conservative estimate
        this.networkMetrics.bandwidth = this.smoothBandwidth(2); // 2 Mbps fallback
      }
    } catch (error) {
      console.warn('Bandwidth measurement failed, using conservative estimate:', error);
      // Use conservative bandwidth estimate on failure
      this.networkMetrics.bandwidth = this.smoothBandwidth(1); // 1 Mbps fallback
    }
  }
  
  /**
   * Smooth bandwidth measurement with history
   */
  private smoothBandwidth(newMeasurement: number): number {
    const history = this.metricsHistory.slice(-5).map(m => m.bandwidth);
    history.push(newMeasurement);
    
    // Weighted average (recent measurements have more weight)
    const weights = history.map((_, i) => i + 1);
    const weightedSum = history.reduce((sum, val, i) => sum + val * weights[i], 0);
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    
    return weightedSum / totalWeight;
  }
  
  /**
   * Update metrics history
   */
  private updateMetricsHistory(): void {
    this.metricsHistory.push({ ...this.networkMetrics });
    
    // Keep only last 20 measurements
    if (this.metricsHistory.length > 20) {
      this.metricsHistory.shift();
    }
  }
  
  /**
   * Initialize streaming for a video
   */
  initializeStream(videoSrc: string, autoQuality: boolean = true): StreamingConfig {
    const optimalProfile = this.selectOptimalQuality();
    
    const config: StreamingConfig = {
      currentProfile: optimalProfile,
      availableProfiles: this.qualityProfiles,
      autoQuality,
      bufferTarget: this.calculateBufferTarget(optimalProfile),
      adaptationInterval: 2000
    };
    
    this.streamingConfigs.set(videoSrc, config);
    
    // Start adaptation if auto quality is enabled
    if (autoQuality) {
      this.startQualityAdaptation(videoSrc);
    }
    
    return config;
  }
  
  /**
   * Select optimal quality based on current conditions
   */
  private selectOptimalQuality(): QualityProfile {
    const bandwidth = this.networkMetrics.bandwidth;
    
    // Find the highest quality that fits within bandwidth constraints
    // Use 70% of available bandwidth to leave headroom
    const availableBandwidth = bandwidth * 0.7 * 1000; // Convert to kbps
    
    let selectedProfile = this.qualityProfiles[0]; // Start with lowest
    
    for (const profile of this.qualityProfiles) {
      if (profile.bitrate <= availableBandwidth) {
        selectedProfile = profile;
      } else {
        break; // Profiles are sorted by quality
      }
    }
    
    // Additional constraints based on connection type
    if (this.networkMetrics.connectionType === 'slow-2g' || 
        this.networkMetrics.connectionType === '2g') {
      selectedProfile = this.qualityProfiles[0]; // Force lowest quality
    }
    
    return selectedProfile;
  }
  
  /**
   * Calculate buffer target based on quality profile
   */
  private calculateBufferTarget(profile: QualityProfile): number {
    // Higher quality needs larger buffer
    const baseBuffer = 3; // seconds
    const qualityMultiplier = profile.priority * 0.5;
    
    // Adjust for connection type
    let connectionMultiplier = 1;
    switch (this.networkMetrics.connectionType) {
      case 'slow-2g':
      case '2g':
        connectionMultiplier = 2;
        break;
      case '3g':
        connectionMultiplier = 1.5;
        break;
      case 'wifi':
      case 'ethernet':
        connectionMultiplier = 0.8;
        break;
    }
    
    return Math.min(15, baseBuffer + qualityMultiplier * connectionMultiplier);
  }
  
  /**
   * Start quality adaptation for a stream
   */
  private startQualityAdaptation(videoSrc: string): void {
    const adapt = () => {
      const config = this.streamingConfigs.get(videoSrc);
      if (!config || !config.autoQuality) return;
      
      const newOptimal = this.selectOptimalQuality();
      
      // Check if quality switch is needed
      if (newOptimal.name !== config.currentProfile.name) {
        const shouldUpgrade = newOptimal.priority > config.currentProfile.priority;
        const shouldDowngrade = newOptimal.priority < config.currentProfile.priority;
        
        // Be more conservative with upgrades to avoid oscillation
        if (shouldUpgrade) {
          const stability = this.checkNetworkStability();
          if (stability > 0.8) {
            this.switchQuality(videoSrc, newOptimal);
          }
        } else if (shouldDowngrade) {
          // Downgrade immediately when needed
          this.switchQuality(videoSrc, newOptimal);
        }
      }
      
      // Schedule next adaptation
      setTimeout(adapt, config.adaptationInterval);
    };
    
    setTimeout(adapt, 2000); // Initial delay
  }
  
  /**
   * Check network stability (0-1, higher is more stable)
   */
  private checkNetworkStability(): number {
    if (this.metricsHistory.length < 3) return 0.5;
    
    const recentMetrics = this.metricsHistory.slice(-5);
    const bandwidths = recentMetrics.map(m => m.bandwidth);
    
    // Calculate variance
    const mean = bandwidths.reduce((a, b) => a + b, 0) / bandwidths.length;
    const variance = bandwidths.reduce((sum, bw) => sum + Math.pow(bw - mean, 2), 0) / bandwidths.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalize to 0-1 (lower variance = higher stability)
    const coefficientOfVariation = stdDev / mean;
    const stability = Math.max(0, 1 - coefficientOfVariation);
    
    return stability;
  }
  
  /**
   * Switch video quality
   */
  private switchQuality(videoSrc: string, newProfile: QualityProfile): void {
    const config = this.streamingConfigs.get(videoSrc);
    if (!config) return;
    
    console.log(`📊 Switching quality for ${videoSrc}: ${config.currentProfile.name} → ${newProfile.name}`);
    
    config.currentProfile = newProfile;
    config.bufferTarget = this.calculateBufferTarget(newProfile);
    
    // Emit quality change event
    this.emitQualityChange(videoSrc, newProfile);
  }
  
  /**
   * Emit quality change event
   */
  private emitQualityChange(videoSrc: string, profile: QualityProfile): void {
    const event = new CustomEvent('video-quality-changed', {
      detail: { videoSrc, profile }
    });
    window.dispatchEvent(event);
  }
  
  /**
   * Adapt all active streams
   */
  private adaptAllStreams(): void {
    this.streamingConfigs.forEach((config, videoSrc) => {
      if (config.autoQuality) {
        const optimal = this.selectOptimalQuality();
        if (optimal.name !== config.currentProfile.name) {
          this.switchQuality(videoSrc, optimal);
        }
      }
    });
  }
  
  /**
   * Get current streaming configuration
   */
  getStreamConfig(videoSrc: string): StreamingConfig | null {
    return this.streamingConfigs.get(videoSrc) || null;
  }
  
  /**
   * Get network metrics
   */
  getNetworkMetrics(): NetworkMetrics {
    return { ...this.networkMetrics };
  }
  
  /**
   * Manually set quality
   */
  setQuality(videoSrc: string, profileName: string): void {
    const config = this.streamingConfigs.get(videoSrc);
    if (!config) return;
    
    const profile = this.qualityProfiles.find(p => p.name === profileName);
    if (!profile) return;
    
    config.autoQuality = false; // Disable auto quality
    this.switchQuality(videoSrc, profile);
  }
  
  /**
   * Enable/disable auto quality
   */
  setAutoQuality(videoSrc: string, enabled: boolean): void {
    const config = this.streamingConfigs.get(videoSrc);
    if (!config) return;
    
    config.autoQuality = enabled;
    
    if (enabled) {
      this.startQualityAdaptation(videoSrc);
    }
  }
  
  /**
   * Apply quality settings to video element
   */
  applyQualityToVideo(video: HTMLVideoElement, profile: QualityProfile): void {
    // Set dimensions (browser will handle scaling)
    video.width = profile.resolution.width;
    video.height = profile.resolution.height;
    
    // If the video supports it, set quality hints
    if ('requestVideoFrameCallback' in video) {
      (video as any).requestVideoFrameCallback(() => {
        // Modern browsers may support quality hints
        if ('videoPlaybackQuality' in video) {
          console.log(`Applied quality: ${profile.name} (${profile.resolution.width}x${profile.resolution.height})`);
        }
      });
    }
  }
  
  /**
   * Cleanup
   */
  destroy(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    
    this.streamingConfigs.clear();
    this.metricsHistory = [];
  }
}

export const adaptiveStreaming = AdaptiveVideoStreaming.getInstance();