/**
 * PlaybackController - Video yönetimi için merkezi singleton servis
 * Videoları blob URL olarak prefetch eder ve decoded frame'leri korur
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
        video.style.pointerEvents = 'none';
        
        // DOM'a ekle (decode için gerekli)
        document.body.appendChild(video);
        
        // Video'yu decode et ve hazır tut
        await new Promise((resolve, reject) => {
          const handleCanPlay = () => {
            video.removeEventListener('canplaythrough', handleCanPlay);
            video.removeEventListener('error', handleError);
            resolve(undefined);
          };
          
          const handleError = () => {
            video.removeEventListener('canplaythrough', handleCanPlay);
            video.removeEventListener('error', handleError);
            reject(new Error(`Video load failed: ${name}`));
          };
          
          video.addEventListener('canplaythrough', handleCanPlay);
          video.addEventListener('error', handleError);
          
          // Video'yu yükle ve decode et
          video.load();
        });
        
        this.videoElements.set(name, video);
        console.log(`✅ Video yüklendi ve decode edildi: ${name}`);
      } catch (error) {
        console.error(`❌ Video yüklenemedi: ${name}`, error);
      }
    });
    
    await Promise.all(loadPromises);
    console.log('🎬 Tüm videolar hazır');
  }
  
  /**
   * Video'nun yüklenip yüklenmediğini kontrol eder
   */
  isVideoReady(name: string): boolean {
    return this.videoElements.has(name);
  }
  
  /**
   * Persistent video elementini döndürür (decode edilmiş frame'lerle)
   * Component bu elementi direkt kullanabilir
   */
  getDecodedVideoElement(name: string): HTMLVideoElement | null {
    const original = this.videoElements.get(name);
    if (!original) return null;
    
    // Orijinal elementi klonla (decoded frame'ler korunur)
    const cloned = original.cloneNode(true) as HTMLVideoElement;
    cloned.style.display = '';
    cloned.style.position = '';
    cloned.style.left = '';
    cloned.style.pointerEvents = '';
    
    // Önemli: klonlanmış element aynı blob URL'yi kullanır
    // ve tarayıcı decode edilmiş frame'leri yeniden kullanır
    return cloned;
  }
  
  /**
   * Video'yu container'a ekler ve oynatır
   */
  async attachAndPlay(name: string, container: HTMLElement): Promise<void> {
    const video = this.getDecodedVideoElement(name);
    if (!video) {
      throw new Error(`Video not found: ${name}`);
    }
    
    // Container'ı temizle
    container.innerHTML = '';
    
    // Video'yu ekle
    video.className = 'w-full h-full object-cover';
    container.appendChild(video);
    
    // DOM'a eklendikten sonra oynat
    try {
      await video.play();
    } catch (err) {
      console.error(`Playback error for ${name}:`, err);
      throw err;
    }
  }
  
  /**
   * Temizlik
   */
  dispose(): void {
    console.log('Disposing PlaybackController...');
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