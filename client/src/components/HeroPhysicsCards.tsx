import { useEffect, useRef, useState } from "react";

interface Card {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  av: number; // angular velocity
  image?: HTMLImageElement;
  imageIndex: number;
}

interface HeroPhysicsCardsProps {
  imagePaths?: string[];
  height?: number;
}

const DEFAULT_IMAGES = [
  { word: "KALE", type: "dark" },
  { word: "KÖPRÜ", type: "light" },
  { word: "ORMAN", type: "neutral" },
  { word: "DENIZ", type: "dark" },
  { word: "GÜNEŞ", type: "light" },
  { word: "BULUT", type: "neutral" },
  { word: "DAĞ", type: "dark" },
  { word: "YILDIZ", type: "light" },
  { word: "KAPI", type: "neutral" },
  { word: "PENCERE", type: "dark" },
  { word: "GÖL", type: "light" },
  { word: "ŞEHİR", type: "neutral" },
  { word: "ROBOT", type: "assassin" },
  { word: "MARS", type: "dark" },
  { word: "AY", type: "light" },
  { word: "IŞIK", type: "neutral" },
  { word: "GÖLGE", type: "dark" },
  { word: "ATEŞ", type: "light" },
  { word: "BARIŞ", type: "neutral" },
  { word: "SAVAŞ", type: "dark" },
  { word: "ZEHİR", type: "assassin" },
  { word: "UMUT", type: "light" },
  { word: "KORKU", type: "dark" },
  { word: "SEVINÇ", type: "light" }
];

const cardColors = {
  dark: { bg: "#1e3a8a", border: "#3b82f6", text: "#dbeafe" },
  light: { bg: "#991b1b", border: "#ef4444", text: "#fee2e2" },
  neutral: { bg: "#374151", border: "#6b7280", text: "#e5e7eb" },
  assassin: { bg: "#581c87", border: "#a855f7", text: "#f3e8ff" }
};

export function HeroPhysicsCards({ imagePaths, height = 560 }: HeroPhysicsCardsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cardsRef = useRef<Card[]>([]);
  const animationRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0 });
  const lastTimeRef = useRef(0);
  const isVisibleRef = useRef(true);
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const [isBlowing, setIsBlowing] = useState(false);
  const [isBoosting, setIsBoosting] = useState(false);

  // Physics parameters
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
    cardWidth: 92,
    cardHeight: 58
  };

  // Reduce cards on mobile
  const getCardCount = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      return 16;
    }
    return params.count;
  };

  // Create synthetic card images with words
  const createCardImage = (word: string, type: keyof typeof cardColors): HTMLImageElement => {
    const canvas = document.createElement('canvas');
    canvas.width = params.cardWidth;
    canvas.height = params.cardHeight;
    const ctx = canvas.getContext('2d')!;

    const colors = cardColors[type];

    // Card background with gradient
    const gradient = ctx.createLinearGradient(0, 0, params.cardWidth, params.cardHeight);
    gradient.addColorStop(0, colors.bg);
    gradient.addColorStop(0.5, colors.border);
    gradient.addColorStop(1, colors.bg);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, params.cardWidth, params.cardHeight);

    // Card border
    ctx.strokeStyle = colors.border;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, params.cardWidth - 2, params.cardHeight - 2);

    // Inner lighter border
    ctx.strokeStyle = colors.text + '30';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 4, params.cardWidth - 8, params.cardHeight - 8);

    // Card text
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 14px Poppins, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(word, params.cardWidth / 2, params.cardHeight / 2);

    // Convert canvas to image
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  };

  // Initialize cards with random positions
  const resetCards = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const count = getCardCount();
    const cards: Card[] = [];
    const padding = Math.max(params.cardWidth, params.cardHeight);

    for (let i = 0; i < count; i++) {
      cards.push({
        x: padding + Math.random() * (canvas.width - padding * 2),
        y: padding + Math.random() * (canvas.height - padding * 2),
        vx: (Math.random() - 0.5) * 2,
        vy: (Math.random() - 0.5) * 2,
        angle: Math.random() * Math.PI * 2,
        av: 0,
        image: imagesRef.current[i % imagesRef.current.length],
        imageIndex: i % imagesRef.current.length
      });
    }

    cardsRef.current = cards;
  };

  // Physics step
  const step = (dt: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const mouse = mouseRef.current;
    const cards = cardsRef.current;
    const baseStrength = isBoosting ? params.pushStrength * 2 : params.pushStrength;

    cards.forEach(card => {
      // Calculate distance to mouse
      const dx = card.x - mouse.x;
      const dy = card.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < params.pushRadius && dist > 0) {
        // Calculate falloff
        let falloff = Math.max(0, 1 - dist / params.pushRadius);
        falloff = Math.pow(falloff, params.falloffPower);

        // Calculate force
        let fx = (dx / dist) * baseStrength * falloff * mouse.vx * 100;
        let fy = (dy / dist) * baseStrength * falloff * mouse.vy * 100;

        // Apply force clamp
        const fMag = Math.sqrt(fx * fx + fy * fy);
        if (fMag > params.forceClamp) {
          fx = (fx / fMag) * params.forceClamp;
          fy = (fy / fMag) * params.forceClamp;
        }

        // Apply force
        card.vx += fx * dt;
        card.vy += fy * dt;

        // Calculate torque
        const rx = dx / dist;
        const ry = dy / dist;
        const torque = (rx * fy - ry * fx) * 0.00035 * params.torqueGain;
        card.av += torque * dt;
      }

      // Apply blower effect
      if (isBlowing) {
        const blowerForce = 150;
        card.vx += (Math.random() - 0.5) * blowerForce * dt;
        card.vy += (Math.random() - 0.5) * blowerForce * dt;
        card.av += (Math.random() - 0.5) * 10 * dt;
      }

      // Apply drag
      card.vx *= params.drag;
      card.vy *= params.drag;
      card.av *= params.angularDrag;

      // Clamp angular velocity
      card.av = Math.max(-6, Math.min(6, card.av));

      // Update position
      card.x += card.vx * dt;
      card.y += card.vy * dt;
      card.angle += card.av * dt;

      // Wall collisions
      const halfWidth = params.cardWidth / 2;
      const halfHeight = params.cardHeight / 2;

      if (card.x - halfWidth < 0) {
        card.x = halfWidth;
        card.vx = Math.abs(card.vx) * params.wallBounce;
        card.vx *= params.contactFriction;
        card.av *= params.contactFriction;
      } else if (card.x + halfWidth > canvas.width) {
        card.x = canvas.width - halfWidth;
        card.vx = -Math.abs(card.vx) * params.wallBounce;
        card.vx *= params.contactFriction;
        card.av *= params.contactFriction;
      }

      if (card.y - halfHeight < 0) {
        card.y = halfHeight;
        card.vy = Math.abs(card.vy) * params.wallBounce;
        card.vy *= params.contactFriction;
        card.av *= params.contactFriction;
      } else if (card.y + halfHeight > canvas.height) {
        card.y = canvas.height - halfHeight;
        card.vy = -Math.abs(card.vy) * params.wallBounce;
        card.vy *= params.contactFriction;
        card.av *= params.contactFriction;
      }
    });
  };

  // Draw cards
  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw cards
    cardsRef.current.forEach(card => {
      ctx.save();
      ctx.translate(card.x, card.y);
      ctx.rotate(card.angle);

      // Draw shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Draw card
      if (card.image && card.image.complete) {
        ctx.drawImage(
          card.image,
          -params.cardWidth / 2,
          -params.cardHeight / 2,
          params.cardWidth,
          params.cardHeight
        );
      } else {
        // Fallback rectangle
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(
          -params.cardWidth / 2,
          -params.cardHeight / 2,
          params.cardWidth,
          params.cardHeight
        );
      }

      ctx.restore();
    });
  };

  // Animation loop
  const animate = (time: number) => {
    if (!isVisibleRef.current) return;

    const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = time;

    step(dt);
    draw();

    animationRef.current = requestAnimationFrame(animate);
  };

  // Handle mouse move
  const handleMouseMove = (e: MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const mouse = mouseRef.current;
    mouse.px = mouse.x;
    mouse.py = mouse.y;
    mouse.x = x;
    mouse.y = y;
    mouse.vx = x - mouse.px;
    mouse.vy = y - mouse.py;
  };

  // Handle keyboard
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      e.preventDefault();
      setIsBlowing(true);
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      setIsBoosting(true);
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.code === 'Space') {
      setIsBlowing(false);
    } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      setIsBoosting(false);
    }
  };

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      resetCards();
    };

    // Load images
    const loadImages = async () => {
      const images: HTMLImageElement[] = [];
      
      if (imagePaths && imagePaths.length > 0) {
        // Load custom images
        for (const path of imagePaths) {
          const img = new Image();
          img.src = path;
          await new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
          images.push(img);
        }
      } else {
        // Create synthetic card images
        DEFAULT_IMAGES.forEach(item => {
          const img = createCardImage(item.word, item.type as keyof typeof cardColors);
          images.push(img);
        });
      }

      imagesRef.current = images;
      resetCards();
    };

    loadImages();
    handleResize();

    // Start animation
    lastTimeRef.current = performance.now();
    animationRef.current = requestAnimationFrame(animate);

    // Event listeners
    window.addEventListener('resize', handleResize);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Visibility handling
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      if (isVisibleRef.current) {
        lastTimeRef.current = performance.now();
        animationRef.current = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(animationRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Intersection observer for performance
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          lastTimeRef.current = performance.now();
          animationRef.current = requestAnimationFrame(animate);
        } else {
          cancelAnimationFrame(animationRef.current);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(canvas);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      observer.disconnect();
    };
  }, [imagePaths]);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    return (
      <div 
        style={{ height }}
        className="bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center"
      >
        <p className="text-muted-foreground">Animasyon kapalı (azaltılmış hareket tercihi)</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ 
        width: '100%', 
        height,
        display: 'block'
      }}
      className="absolute inset-0"
    />
  );
}