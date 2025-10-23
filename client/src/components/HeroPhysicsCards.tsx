import { useEffect, useRef, memo } from "react";

/**
 * HeroPhysicsCards
 * Canvas tabanlı kart animasyonu (mouse ile itme + rotasyon)
 *
 * Kart görselleri "client/public/acilmiskartgorselküçültülmüş" klasöründe barınır ve
 * runtime'da "/acilmiskartgorselküçültülmüş/<dosya>" yolundan çekilir.
 *
 * Hata düzeltmesi:
 * - imageNames undefined olabildiğinde buildPaths(names.map) TypeError veriyordu.
 *   -> imageNames için güvenli varsayılan [] kullanıldı ve tüm kullanım noktaları korumalı hale getirildi.
 */

type Props = {
  /** Örnek: ["k1.png", "k2.png", "k3.png", "k4.png"] */
  imageNames: string[];
  /** Hero yüksekliği (px) */
  height?: number;
  /** Küçük ekran optimizasyonu için opsiyonel kart sayısı override */
  countMobile?: number;
};

function HeroPhysicsCards({ imageNames = [], height = 560, countMobile = 16 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runningRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // ---- Parametreler (Arda'nın sevdiği his) ----
    const params = {
      count: 40,
      pushStrength: 0.7,
      pushRadius: 90,
      drag: 0.96,
      contactFriction: 0.80,
      wallBounce: 0.20,
      angularDrag: 0.96,
      torqueGain: 1.4,
      falloffPower: 1.6,
      forceClamp: 450,
      collisions: false,
    } as const;

    const CARD_W = 180, CARD_H = 120; // 3:2 aspect ratio

    // Küçük ekranlarda kart sayısını düşür (opsiyonel)
    try {
      if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore - params readonly; çalışma zamanı override sorun değil
        (params as any).count = countMobile;
      }
    } catch {}

    const bounds = { w: 0, h: 0 };
    const mouse = { x: 0, y: 0, px: 0, py: 0, boost: false, blower: false };

    type Card = {
      x: number; y: number; w: number; h: number;
      vx: number; vy: number; a: number; av: number;
      img: HTMLImageElement;
    };

    let cards: Card[] = [];
    let images: HTMLImageElement[] = [];
    let raf = 0;

    function resize() {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.floor(w * ratio);
      canvas.height = Math.floor(h * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      bounds.w = w; bounds.h = h;
    }

    function rand(a: number, b: number){ return a + Math.random()*(b-a); }
    function clamp(v: number, a: number, b: number){ return Math.max(a, Math.min(b, v)); }

    function buildPaths(names?: string[]) {
      const safe = Array.isArray(names) ? names : [];
      // public altında olduğundan, runtime yolu "/acilmiskartgorselküçültülmüş/<name>"
      return safe.map((n) => `/acilmiskartgorselküçültülmüş/${n}`);
    }

    function loadImages(paths: string[]) {
      if (!paths || paths.length === 0) return Promise.resolve([] as HTMLImageElement[]);
      return Promise.all(paths.map(src => new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image(); im.src = src; im.onload = () => res(im); im.onerror = rej;
      })));
    }

    function makePlaceholder(): HTMLImageElement {
      const c = document.createElement('canvas');
      c.width = CARD_W; c.height = CARD_H;
      const g = c.getContext('2d')!;
      g.fillStyle = '#2a2e39'; g.fillRect(0,0,c.width,c.height);
      g.strokeStyle = '#8aa1b4'; g.lineWidth = 2; g.strokeRect(2,2,c.width-4,c.height-4);
      g.fillStyle = '#8aa1b4'; g.font = '12px system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText('No Image', c.width/2, c.height/2);
      const img = new Image(); img.src = c.toDataURL();
      return img;
    }

    function resetCards() {
      cards = [];
      const pad = 20;
      const fallback = images.length === 0 ? [makePlaceholder()] : images;
      const count = (params as any).count;
      
      // Grid tabanlı dağıtım için kare kök hesapla
      const cols = Math.ceil(Math.sqrt(count * (bounds.w / bounds.h)));
      const rows = Math.ceil(count / cols);
      
      for (let i=0;i<count;i++){
        // Grid pozisyonu hesapla
        const col = i % cols;
        const row = Math.floor(i / cols);
        
        // Grid hücresinin merkezi
        const cellW = (bounds.w - 2 * pad) / cols;
        const cellH = (bounds.h - 2 * pad) / rows;
        const cellCenterX = pad + cellW * (col + 0.5);
        const cellCenterY = pad + cellH * (row + 0.5);
        
        // Rastgele sapma ekle (daha geniş dağılım için)
        const offsetX = (Math.random() - 0.5) * cellW * 0.8;
        const offsetY = (Math.random() - 0.5) * cellH * 0.8;
        
        // Final pozisyon
        let x = cellCenterX + offsetX - CARD_W / 2;
        let y = cellCenterY + offsetY - CARD_H / 2;
        
        // Sınırları kontrol et
        x = Math.max(pad, Math.min(bounds.w - pad - CARD_W, x));
        y = Math.max(pad, Math.min(bounds.h - pad - CARD_H, y));
        
        // Hafif başlangıç hızı ekle (dışa doğru)
        const vx = (x + CARD_W/2 - bounds.w/2) * 0.02;
        const vy = (y + CARD_H/2 - bounds.h/2) * 0.02;
        
        const img = fallback[i % fallback.length];
        cards.push({ x, y, w: CARD_W, h: CARD_H, vx, vy, a:(Math.random()-0.5)*0.3, av:0, img });
      }
    }

    function step(dt: number) {
      const mvx = (mouse.x - mouse.px) / Math.max(dt, 1/120);
      const mvy = (mouse.y - mouse.py) / Math.max(dt, 1/120);
      const radius = (params as any).pushRadius;
      const baseStrength = (params as any).pushStrength * (mouse.boost ? 2 : 1);

      for (const c of cards) {
        const cx = c.x + c.w/2, cy = c.y + c.h/2;
        const dx = cx - mouse.x, dy = cy - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < radius) {
          const fall = Math.max(0, 1 - dist / radius);
          const fallPow = Math.pow(fall, (params as any).falloffPower);
          let fx = mvx * (baseStrength * fallPow * 0.16);
          let fy = mvy * (baseStrength * fallPow * 0.16);
          if (mouse.blower) {
            const ndx = dx / Math.max(dist, 1e-3);
            const ndy = dy / Math.max(dist, 1e-3);
            fx = ndx * fallPow * 90 * baseStrength;
            fy = ndy * fallPow * 90 * baseStrength;
          }
          // tavan
          {
            const fMag = Math.hypot(fx, fy);
            const F_MAX = (params as any).forceClamp;
            if (fMag > F_MAX) { const s = F_MAX/fMag; fx*=s; fy*=s; }
          }
          c.vx += fx; c.vy += fy;
          const rx = mouse.x - cx, ry = mouse.y - cy;
          const torque = (rx * fy - ry * fx) * 0.00035;
          c.av += torque * (params as any).torqueGain;
        }
      }

      for (const c of cards) {
        c.vx *= (params as any).drag; c.vy *= (params as any).drag; c.av *= (params as any).angularDrag;
        c.av = clamp(c.av, -6, 6);
        c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.av * dt;
        if (c.x < 0){ c.x = 0; c.vx = -c.vx * (1-(params as any).wallBounce); c.vy *= (params as any).contactFriction; c.av *= (params as any).contactFriction; }
        if (c.y < 0){ c.y = 0; c.vy = -c.vy * (1-(params as any).wallBounce); c.vx *= (params as any).contactFriction; c.av *= (params as any).contactFriction; }
        if (c.x + c.w > bounds.w){ c.x = bounds.w - c.w; c.vx = -c.vx * (1-(params as any).wallBounce); c.vy *= (params as any).contactFriction; c.av *= (params as any).contactFriction; }
        if (c.y + c.h > bounds.h){ c.y = bounds.h - c.h; c.vy = -c.vy * (1-(params as any).wallBounce); c.vx *= (params as any).contactFriction; c.av *= (params as any).contactFriction; }
      }

      mouse.px = mouse.x; mouse.py = mouse.y;
    }

    function draw() {
      ctx.clearRect(0,0,bounds.w,bounds.h);

      // kart çizimi (görsel + rotasyon)
      for (const c of cards) {
        const cx = c.x + c.w/2, cy = c.y + c.h/2;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(c.a);

        // gölge - daha belirgin
        ctx.save();
        ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 4;
        ctx.shadowOffsetY = 10;
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        roundRect(ctx, -c.w/2, -c.h/2, c.w, c.h, 12);
        ctx.fill();
        ctx.restore();

        // Kartı clip et (köşelerin taşmaması için)
        ctx.save();
        roundRect(ctx, -c.w/2, -c.h/2, c.w, c.h, 12);
        ctx.clip();
        
        // yüz: görseli karta sığdır (fit)
        ctx.drawImage(c.img, -c.w/2, -c.h/2, c.w, c.h);
        ctx.restore();

        // Daha belirgin kenar (özellikle beyaz kartlar için)
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "rgba(0,0,0,0.4)";
        roundRect(ctx, -c.w/2, -c.h/2, c.w, c.h, 12);
        ctx.stroke();
        
        // İkinci ince kenar (parlaklık için)
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        roundRect(ctx, -c.w/2+1, -c.h/2+1, c.w-2, c.h-2, 12);
        ctx.stroke();

        ctx.restore();
      }

      // Çerçeve kaldırıldı

      // Bilgi mesajı: görsel bulunamadıysa köşeye ipucu yaz
      if (images.length === 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('Görseller yüklenmedi. imageNames boş olabilir. (/acilmiskartgorselküçültülmüş/...)', 16, bounds.h - 16);
        ctx.restore();
      }
    }

    function roundRect(ctx: CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number){
      ctx.beginPath();
      ctx.moveTo(x+r, y);
      ctx.lineTo(x+w-r, y);
      ctx.quadraticCurveTo(x+w, y, x+w, y+r);
      ctx.lineTo(x+w, y+h-r);
      ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h);
      ctx.lineTo(x+r, y+h);
      ctx.quadraticCurveTo(x, y+h, x, y+h-r);
      ctx.lineTo(x, y+r);
      ctx.quadraticCurveTo(x, y, x+r, y);
      ctx.closePath();
    }

    function onMove(e: MouseEvent) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if(e.key === " ") mouse.blower = true;
      if(e.key === "Shift") mouse.boost = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if(e.key === " ") mouse.blower = false;
      if(e.key === "Shift") mouse.boost = false;
    };

    let last = performance.now();
    function loop(t: number) {
      if (!runningRef.current) return; // pause edilmişse çizme
      const dt = Math.min(0.033, (t - last)/1000);
      step(dt);
      draw();
      last = t;
      raf = requestAnimationFrame(loop);
    }

    // animasyon kontrolü: görünürlük/IntersectionObserver
    const io = new IntersectionObserver((entries)=>{
      for (const e of entries){
        runningRef.current = e.isIntersecting;
        if (runningRef.current) {
          last = performance.now();
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(loop);
        }
      }
    }, { threshold: 0.1 });

    io.observe(canvas);

    // prefers-reduced-motion
    try {
      const prm = matchMedia('(prefers-reduced-motion: reduce)');
      if (prm.matches) runningRef.current = false;
    } catch {}

    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("resize", resize);

    (async () => {
      // Güvenli: imageNames undefined ise []
      const paths = buildPaths(imageNames);
      images = await loadImages(paths);
      resize();
      resetCards();
      raf = requestAnimationFrame(loop);

      // --- Basit runtime testleri ---
      try {
        console.assert(Array.isArray(buildPaths(undefined)), 'TEST1: buildPaths undefined ile array dönmeli');
        console.assert((await loadImages([])).length === 0, 'TEST2: loadImages([]) boş dizi dönmeli');
        console.assert(cards.length === (window.matchMedia && window.matchMedia('(max-width: 768px)').matches ? countMobile : (params as any).count), 'TEST3: kart sayısı beklendiği gibi');
      } catch (e) { console.warn('Self-tests warning', e); }
    })();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMove);
      io.disconnect();
    };
  }, [imageNames, height, countMobile]);

  return (
    <div
      style={{ position: "relative", width: "100%", height, overflow: "hidden" }}
      aria-hidden
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </div>
  );
}

export default memo(HeroPhysicsCards);
