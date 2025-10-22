import { useEffect, useRef } from "react";

/**
 * HeroPhysicsCards
 * Canvas tabanlı kart animasyonu (mouse ile itme + rotasyon)
 *
 * Kart görselleri "client/public/acilmiskartgorsel" klasöründe barınır ve
 * runtime'da "/acilmiskartgorsel/<dosya>" yolundan çekilir.
 */

type Props = {
  /** Örnek: ["k1.png", "k2.png", "k3.png", "k4.png"] */
  imageNames: string[];
  /** Hero yüksekliği (px) */
  height?: number;
  /** Küçük ekran optimizasyonu için opsiyonel kart sayısı override */
  countMobile?: number;
};

export default function HeroPhysicsCards({ imageNames, height = 560, countMobile = 16 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runningRef = useRef<boolean>(true);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // ---- Parametreler (Arda'nın sevdiği his) ----
    const params = {
      count: 24,
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
    };

    const CARD_W = 92, CARD_H = 58;

    // Küçük ekranlarda kart sayısını düşür (opsiyonel)
    try {
      if (window.matchMedia && window.matchMedia('(max-width: 768px)').matches) {
        params.count = countMobile;
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

    function buildPaths(names: string[]) {
      // public altında olduğundan, runtime yolu "/acilmiskartgorsel/<name>"
      return names.map((n) => `/acilmiskartgorsel/${n}`);
    }

    function loadImages(paths: string[]) {
      return Promise.all(paths.map(src => new Promise<HTMLImageElement>((res, rej) => {
        const im = new Image(); im.src = src; im.onload = () => res(im); im.onerror = rej;
      })));
    }

    function resetCards() {
      cards = [];
      const pad = 40;
      for (let i=0;i<params.count;i++){
        const x = rand(pad, bounds.w - pad - CARD_W);
        const y = rand(pad, bounds.h - pad - CARD_H);
        const img = images[i % images.length];
        cards.push({ x, y, w: CARD_W, h: CARD_H, vx:0, vy:0, a:(Math.random()-0.5)*0.3, av:0, img });
      }
    }

    function step(dt: number) {
      const mvx = (mouse.x - mouse.px) / Math.max(dt, 1/120);
      const mvy = (mouse.y - mouse.py) / Math.max(dt, 1/120);
      const radius = params.pushRadius;
      const baseStrength = params.pushStrength * (mouse.boost ? 2 : 1);

      for (const c of cards) {
        const cx = c.x + c.w/2, cy = c.y + c.h/2;
        const dx = cx - mouse.x, dy = cy - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < radius) {
          const fall = Math.max(0, 1 - dist / radius);
          const fallPow = Math.pow(fall, params.falloffPower);
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
            const F_MAX = params.forceClamp;
            if (fMag > F_MAX) { const s = F_MAX/fMag; fx*=s; fy*=s; }
          }
          c.vx += fx; c.vy += fy;
          const rx = mouse.x - cx, ry = mouse.y - cy;
          const torque = (rx * fy - ry * fx) * 0.00035;
          c.av += torque * params.torqueGain;
        }
      }

      for (const c of cards) {
        c.vx *= params.drag; c.vy *= params.drag; c.av *= params.angularDrag;
        c.av = clamp(c.av, -6, 6);
        c.x += c.vx * dt; c.y += c.vy * dt; c.a += c.av * dt;
        if (c.x < 0){ c.x = 0; c.vx = -c.vx * (1-params.wallBounce); c.vy *= params.contactFriction; c.av *= params.contactFriction; }
        if (c.y < 0){ c.y = 0; c.vy = -c.vy * (1-params.wallBounce); c.vx *= params.contactFriction; c.av *= params.contactFriction; }
        if (c.x + c.w > bounds.w){ c.x = bounds.w - c.w; c.vx = -c.vx * (1-params.wallBounce); c.vy *= params.contactFriction; c.av *= params.contactFriction; }
        if (c.y + c.h > bounds.h){ c.y = bounds.h - c.h; c.vy = -c.vy * (1-params.wallBounce); c.vx *= params.contactFriction; c.av *= params.contactFriction; }
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

        // gölge
        ctx.save();
        ctx.shadowColor = "#0009";
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.fillStyle = "#00000040";
        roundRect(ctx, -c.w/2, -c.h/2, c.w, c.h, 10);
        ctx.fill();
        ctx.restore();

        // yüz: görseli karta sığdır (fit)
        ctx.drawImage(c.img, -c.w/2, -c.h/2, c.w, c.h);

        // ince kenar
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        roundRect(ctx, -c.w/2, -c.h/2, c.w, c.h, 10);
        ctx.stroke();

        ctx.restore();
      }

      // hafif çerçeve
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 20; ctx.strokeRect(10,10,bounds.w-20,bounds.h-20);
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
    const prm = matchMedia('(prefers-reduced-motion: reduce)');
    if (prm.matches) runningRef.current = false;

    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("keydown", (e)=>{
      if(e.key === " ") mouse.blower = true;
      if(e.key === "Shift") mouse.boost = true;
    });
    window.addEventListener("keyup", (e)=>{
      if(e.key === " ") mouse.blower = false;
      if(e.key === "Shift") mouse.boost = false;
    });

    window.addEventListener("resize", resize);

    (async () => {
      const paths = buildPaths(imageNames);
      images = await loadImages(paths);
      resize();
      resetCards();
      raf = requestAnimationFrame(loop);
    })();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
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
