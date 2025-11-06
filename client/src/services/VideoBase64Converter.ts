/**
 * Convert video files to base64 data URLs for embedding
 */
export class VideoBase64Converter {
  private static cache: Map<string, string> = new Map();
  
  /**
   * Convert a video file to base64 data URL
   */
  static async convertToBase64(videoPath: string): Promise<string> {
    // Check cache first
    if (this.cache.has(videoPath)) {
      return this.cache.get(videoPath)!;
    }
    
    try {
      const response = await fetch(videoPath);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          this.cache.set(videoPath, base64);
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      return videoPath; // Fallback to original path
    }
  }
  
  /**
   * Preload and convert all videos to base64
   */
  static async preloadAllAsBase64(): Promise<void> {
    const videoPaths = [
      '/mavi takım video tur.webm',
      '/kırmızı takım video tur.webm', 
      '/siyah kelime seçme yeni.webm',
      '/mavi takım normal kazanma.webm',
      '/kırmızı takım normal kazanma.webm'
    ];
    
    await Promise.all(
      videoPaths.map(async (path) => {
        const base64 = await this.convertToBase64(path);
      })
    );
  }
  
  /**
   * Get base64 data URL for a video
   */
  static getBase64(videoPath: string): string | null {
    return this.cache.get(videoPath) || null;
  }
  
  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
  }
}

// Pre-converted base64 videos (smaller versions for testing)
// NOTE: These are placeholders - actual base64 strings would be much longer
export const PRELOADED_VIDEO_BASE64: Record<string, string> = {
  // These will be populated at build time or runtime
  '/mavi takım video tur.webm': '',
  '/kırmızı takım video tur.webm': '',
  '/siyah kelime seçme yeni.webm': '',
  '/mavi takım normal kazanma.webm': '',
  '/kırmızı takım normal kazanma.webm': ''
};