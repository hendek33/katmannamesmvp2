/**
 * Card Image Optimizer Service
 * Optimizes and lazy loads card images for better performance
 */
export class CardImageOptimizer {
  private static cache: Map<string, HTMLImageElement> = new Map();
  private static base64Cache: Map<string, string> = new Map();
  private static loadingPromises: Map<string, Promise<HTMLImageElement>> = new Map();
  
  /**
   * Get optimized image URL - returns smaller version if available
   */
  static getOptimizedPath(imageName: string): string {
    // First try the smaller version
    const smallPath = `/acilmiskartgorselküçültülmüş/${imageName}`;
    // Fallback to original if needed
    const originalPath = `/acilmiskartgorsel/${imageName}`;
    
    // Return the smaller version path
    return smallPath;
  }
  
  /**
   * Lazy load a single image
   */
  static async lazyLoadImage(imageName: string): Promise<HTMLImageElement> {
    // Check cache first
    if (this.cache.has(imageName)) {
      return this.cache.get(imageName)!;
    }
    
    // Check if already loading
    if (this.loadingPromises.has(imageName)) {
      return this.loadingPromises.get(imageName)!;
    }
    
    // Start loading
    const loadPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      // Add loading optimization attributes
      img.loading = 'lazy';
      img.decoding = 'async';
      
      img.onload = () => {
        this.cache.set(imageName, img);
        this.loadingPromises.delete(imageName);
        resolve(img);
      };
      
      img.onerror = () => {
        console.warn(`Failed to load image: ${imageName}`);
        this.loadingPromises.delete(imageName);
        
        // Create placeholder on error
        const placeholder = this.createPlaceholder();
        this.cache.set(imageName, placeholder);
        resolve(placeholder);
      };
      
      // Try optimized path first
      img.src = this.getOptimizedPath(imageName);
    });
    
    this.loadingPromises.set(imageName, loadPromise);
    return loadPromise;
  }
  
  /**
   * Batch load images with priority
   */
  static async batchLoadWithPriority(
    highPriority: string[],
    lowPriority: string[]
  ): Promise<void> {
    // Load high priority images first
    await Promise.all(highPriority.map(name => this.lazyLoadImage(name)));
    
    // Then load low priority images in background
    setTimeout(() => {
      lowPriority.forEach(name => this.lazyLoadImage(name));
    }, 100);
  }
  
  /**
   * Convert small images to base64 for inline loading
   */
  static async convertToBase64(imageName: string): Promise<string> {
    if (this.base64Cache.has(imageName)) {
      return this.base64Cache.get(imageName)!;
    }
    
    try {
      const img = await this.lazyLoadImage(imageName);
      
      // Create canvas to convert to base64
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Canvas context not available');
      
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Convert to base64 - use WEBP for better compression
      const base64 = canvas.toDataURL('image/webp', 0.8);
      
      this.base64Cache.set(imageName, base64);
      return base64;
    } catch (error) {
      console.error(`Failed to convert ${imageName} to base64:`, error);
      return this.getOptimizedPath(imageName);
    }
  }
  
  /**
   * Create a placeholder image
   */
  static createPlaceholder(): HTMLImageElement {
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 120;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Create a gradient placeholder
      const gradient = ctx.createLinearGradient(0, 0, 180, 120);
      gradient.addColorStop(0, '#1e293b');
      gradient.addColorStop(1, '#334155');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 180, 120);
      
      // Add text
      ctx.fillStyle = '#64748b';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Yükleniyor...', 90, 60);
    }
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }
  
  /**
   * Preload only critical images
   */
  static async preloadCritical(imageNames: string[]): Promise<void> {
    // Only preload first few images that are visible
    const criticalCount = 5;
    const critical = imageNames.slice(0, criticalCount);
    
    await Promise.all(critical.map(name => this.lazyLoadImage(name)));
    
    console.log(`✅ Preloaded ${critical.length} critical card images`);
  }
  
  /**
   * Clear cache
   */
  static clearCache(): void {
    this.cache.clear();
    this.base64Cache.clear();
    this.loadingPromises.clear();
  }
  
  /**
   * Get cache stats
   */
  static getCacheStats(): {
    imagesLoaded: number;
    base64Converted: number;
    currentlyLoading: number;
  } {
    return {
      imagesLoaded: this.cache.size,
      base64Converted: this.base64Cache.size,
      currentlyLoading: this.loadingPromises.size
    };
  }
}