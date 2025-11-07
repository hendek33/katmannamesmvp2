// Oyun Koruma Sistemi
export class GameProtection {
  private static readonly ALLOWED_DOMAINS = [
    'replit.app',
    'repl.co',
    'localhost',
    '127.0.0.1'
  ];

  private static readonly COPYRIGHT = '© 2025 Katmannames - Tüm hakları saklıdır';
  private static readonly GAME_ID = 'ktmn-' + btoa('katmannames-hype-2025').substring(0, 8);

  // Domain kontrolü
  static checkDomain(): boolean {
    const hostname = window.location.hostname;
    return this.ALLOWED_DOMAINS.some(domain => 
      hostname.includes(domain) || hostname === domain
    );
  }

  // Konsol mesajı
  static showCopyrightWarning(): void {
    const styles = [
      'color: #ff0000',
      'font-size: 20px',
      'font-weight: bold',
      'text-shadow: 2px 2px 4px rgba(0,0,0,0.5)'
    ].join(';');

    console.log('%c⚠️ UYARI ⚠️', styles);
    console.log('%cBu oyun telif hakkı ile korunmaktadır!', 'color: #ff6b6b; font-size: 14px;');
    console.log(`%c${this.COPYRIGHT}`, 'color: #ffd93d; font-size: 12px;');
    console.log('%cİzinsiz kopyalama veya dağıtım yasaktır.', 'color: #ff6b6b; font-size: 12px;');
    console.log(`%cGame ID: ${this.GAME_ID}`, 'color: #6bcf7f; font-size: 10px;');
  }

  // Sağ tık engelleme
  static disableRightClick(): void {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  }

  // Metin seçmeyi engelleme
  static disableTextSelection(): void {
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    (document.body.style as any).msUserSelect = 'none';
  }

  // DevTools algılama (basit)
  static detectDevTools(): void {
    let devtools = { open: false, orientation: null as string | null };
    const threshold = 160;
    
    setInterval(() => {
      if (window.outerHeight - window.innerHeight > threshold || 
          window.outerWidth - window.innerWidth > threshold) {
        if (!devtools.open) {
          devtools.open = true;
          console.clear();
          this.showCopyrightWarning();
        }
      } else {
        devtools.open = false;
      }
    }, 500);
  }

  // Kaynak kodda watermark
  static addWatermark(): void {
    const watermark = document.createElement('div');
    watermark.id = this.GAME_ID;
    watermark.style.display = 'none';
    watermark.innerHTML = `<!-- ${this.COPYRIGHT} | ${this.GAME_ID} | Protected Game -->`;
    document.body.appendChild(watermark);
  }

  // Tüm korumaları başlat
  static initializeProtection(): void {
    // Domain kontrolü
    if (!this.checkDomain()) {
      document.body.innerHTML = `
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-family: Arial, sans-serif;
          text-align: center;
        ">
          <div>
            <h1 style="font-size: 48px; margin-bottom: 20px;">⛔ İzinsiz Erişim</h1>
            <p style="font-size: 20px;">Bu oyun sadece yetkili domainlerde çalışabilir.</p>
            <p style="font-size: 16px; margin-top: 30px; opacity: 0.8;">${this.COPYRIGHT}</p>
            <p style="font-size: 12px; margin-top: 10px; opacity: 0.6;">Game ID: ${this.GAME_ID}</p>
          </div>
        </div>
      `;
      return;
    }

    // Diğer korumaları aktif et
    this.showCopyrightWarning();
    this.disableRightClick();
    this.disableTextSelection();
    this.detectDevTools();
    this.addWatermark();

    // Window objesine copyright bilgisi ekle
    (window as any).__KATMANNAMES__ = {
      copyright: this.COPYRIGHT,
      gameId: this.GAME_ID,
      protected: true,
      version: '1.0.0'
    };
  }
}