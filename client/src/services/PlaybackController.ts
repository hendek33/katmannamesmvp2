/**
 * PlaybackController - Video yönetimi için merkezi singleton servis
 * Videoları blob URL olarak prefetch eder ve persistent video elementleri tutar
 */
class PlaybackController {
  private static instance: PlaybackController;
  private videoBlobs = new Map<string, Blob>();
  private videoElements = new Map<string, HTMLVideoElement>();
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;
  
  private constructor() {}
  
  static getInstance(): PlaybackController {
    if (!PlaybackController.instance) {
      PlaybackController.instance = new PlaybackController();
    }
    return PlaybackController.instance;
  }
  
  /**
   * Tüm videoları başlatır ve memory'e alır
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    if (this.initPromise) return this.initPromise;
    
    this.initPromise = this.loadVideos();
    await this.initPromise;
    this.isInitialized = true;
  }
  
  private async loadVideos(): Promise<void> {
    const videos = [
      { name: 'turn-dark', path: '/mavi takım video tur.mp4' },
      { name: 'turn-light', path: '/kırmızı takım video tur.mp4' },
      { name: 'assassin', path: '/siyah kelime seçme.mp4' },
      { name: 'win-dark', path: '/mavi takım normal kazanma.mp4' },
      { name: 'win-light', path: '/kırmızı takım normal kazanma.mp4' }
    ];
    
    console.log('🎬 Video yükleme başlıyor...');
    
    const loadPromises = videos.map(async ({ name, path }) => {
      try {
        // Video'yu fetch et
        const response = await fetch(path);
        if (!response.ok) throw new Error(`Failed to fetch ${path}`);
        
        const blob = await response.blob();
        this.videoBlobs.set(name, blob);
        
        // Persistent video elementi oluştur
        const video = document.createElement('video');
        const blobUrl = URL.createObjectURL(blob);
        
        video.src = blobUrl;
        video.muted = true;
        video.playsInline = true;
        video.preload = 'auto';
        video.style.display = 'none';
        video.style.position = 'fixed';
        video.style.left = '-9999px';
        
        // Video'yu decode et
        await new Promise((resolve, reject) => {
          video.addEventListener('loadeddata', resolve, { once: true });
          video.addEventListener('error', reject, { once: true });
          video.load();
        });
        
        // DOM'a ekle (persistent tutmak için)
        document.body.appendChild(video);
        this.videoElements.set(name, video);
        
        console.log(`✅ Video yüklendi: ${name}`);
      } catch (error) {
        console.error(`❌ Video yüklenemedi: ${name}`, error);
      }
    });
    
    await Promise.all(loadPromises);
    console.log('🎬 Tüm videolar hazır');
  }
  
  /**
   * Video oynatmak için element döndürür
   */
  getVideoElement(name: string): HTMLVideoElement | null {
    return this.videoElements.get(name) || null;
  }
  
  /**
   * Video'nun yüklenip yüklenmediğini kontrol eder
   */
  isVideoReady(name: string): boolean {
    return this.videoElements.has(name);
  }
  
  /**
   * Belirli bir video'yu klonlar ve oynatır
   */
  async playVideo(name: string): Promise<HTMLVideoElement> {
    await this.initialize();
    
    const original = this.videoElements.get(name);
    if (!original) {
      throw new Error(`Video not found: ${name}`);
    }
    
    // Orijinal video'nun src'sini kullanarak yeni element oluştur
    const video = document.createElement('video');
    video.src = original.src;
    video.muted = true;
    video.playsInline = true;
    video.autoplay = true;
    
    // Oynatmaya çalış
    try {
      await video.play();
    } catch (err) {
      console.error(`Playback error for ${name}:`, err);
    }
    
    return video;
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
      // Blob URL'leri temizle
      if (video.src.startsWith('blob:')) {
        URL.revokeObjectURL(video.src);
      }
      video.src = '';
    });
    
    this.videoElements.clear();
    this.videoBlobs.clear();
    this.isInitialized = false;
    this.initPromise = null;
  }
}

export const playbackController = PlaybackController.getInstance();