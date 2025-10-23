/**
 * VideoPreloadManager - İlk yüklemede video takılmalarını önler
 * İlk yüklemede videolar tam olarak cache'lenmeden oynatılmaya çalışıldığı için takılma oluyor.
 * Bu servis, videoları önceden yükleyip cache'e alarak sorunu çözer.
 */

class VideoPreloadManager {
  private static instance: VideoPreloadManager;
  private loadedVideos = new Map<string, boolean>();
  private videoElements = new Map<string, HTMLVideoElement>();
  private isPreloading = false;
  private preloadPromise: Promise<void> | null = null;
  
  private constructor() {}
  
  static getInstance(): VideoPreloadManager {
    if (!VideoPreloadManager.instance) {
      VideoPreloadManager.instance = new VideoPreloadManager();
    }
    return VideoPreloadManager.instance;
  }
  
  /**
   * Tüm videoları yükle ve cache'e al
   * İlk yüklemede bu method'un tamamlanmasını beklemeliyiz
   */
  async ensureAllVideosLoaded(): Promise<void> {
    // Eğer zaten preload başlamışsa, mevcut promise'i döndür
    if (this.preloadPromise) {
      return this.preloadPromise;
    }
    
    // Eğer tüm videolar yüklenmişse, hemen resolve et
    if (this.areAllVideosLoaded()) {
      return Promise.resolve();
    }
    
    this.isPreloading = true;
    
    const videoPaths = [
      '/mavi takım video tur.mp4',
      '/kırmızı takım video tur.mp4',
      '/siyah kelime seçme.mp4',
      '/mavi takım normal kazanma.mp4',
      '/kırmızı takım normal kazanma.mp4'
    ];
    
    this.preloadPromise = this.preloadVideos(videoPaths);
    
    try {
      await this.preloadPromise;
      console.log('✅ Tüm videolar başarıyla yüklendi ve cache\'e alındı');
    } finally {
      this.isPreloading = false;
    }
    
    return this.preloadPromise;
  }
  
  private async preloadVideos(paths: string[]): Promise<void> {
    const promises = paths.map(path => this.preloadSingleVideo(path));
    await Promise.all(promises);
  }
  
  private preloadSingleVideo(src: string): Promise<void> {
    return new Promise((resolve) => {
      // Eğer video zaten yüklenmişse, direkt resolve et
      if (this.loadedVideos.get(src)) {
        resolve();
        return;
      }
      
      const video = document.createElement('video');
      
      // Video özelliklerini ayarla
      video.src = src;
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.autoplay = false;
      
      // Video'yu görünmez yap ama DOM'da tut (cache için)
      video.style.position = 'fixed';
      video.style.left = '-9999px';
      video.style.width = '1px';
      video.style.height = '1px';
      video.style.pointerEvents = 'none';
      
      let loadTimeout: NodeJS.Timeout;
      
      const cleanup = () => {
        clearTimeout(loadTimeout);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('error', handleError);
      };
      
      const handleCanPlayThrough = () => {
        // Video tamamen yüklenip oynatılabilir durumda
        this.loadedVideos.set(src, true);
        this.videoElements.set(src, video);
        console.log(`✓ Video yüklendi: ${src}`);
        cleanup();
        resolve();
      };
      
      const handleError = (e: Event) => {
        console.error(`✗ Video yüklenemedi: ${src}`, e);
        cleanup();
        // Hata olsa bile devam et
        resolve();
      };
      
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('error', handleError);
      
      // Video'yu DOM'a ekle (cache için gerekli)
      document.body.appendChild(video);
      
      // Video'yu yüklemeye başla
      video.load();
      
      // 10 saniye timeout (yavaş bağlantılar için)
      loadTimeout = setTimeout(() => {
        console.warn(`⚠️ Video yükleme zaman aşımı: ${src}`);
        cleanup();
        resolve();
      }, 10000);
    });
  }
  
  /**
   * Belirli bir video yüklendi mi?
   */
  isVideoLoaded(src: string): boolean {
    return this.loadedVideos.get(src) === true;
  }
  
  /**
   * Tüm videolar yüklendi mi?
   */
  areAllVideosLoaded(): boolean {
    const requiredVideos = [
      '/mavi takım video tur.mp4',
      '/kırmızı takım video tur.mp4',
      '/siyah kelime seçme.mp4',
      '/mavi takım normal kazanma.mp4',
      '/kırmızı takım normal kazanma.mp4'
    ];
    
    return requiredVideos.every(src => this.isVideoLoaded(src));
  }
  
  /**
   * Preloading durumunu kontrol et
   */
  isCurrentlyPreloading(): boolean {
    return this.isPreloading;
  }
  
  /**
   * Cache'lenmiş video elementini al (performans için)
   */
  getCachedVideoElement(src: string): HTMLVideoElement | undefined {
    return this.videoElements.get(src);
  }
  
  /**
   * Temizlik
   */
  dispose(): void {
    // Video elementlerini DOM'dan kaldır
    this.videoElements.forEach(video => {
      if (video.parentNode) {
        video.parentNode.removeChild(video);
      }
      video.src = '';
    });
    
    this.videoElements.clear();
    this.loadedVideos.clear();
    this.preloadPromise = null;
    this.isPreloading = false;
  }
}

export const videoPreloadManager = VideoPreloadManager.getInstance();