import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Play, ChevronRight, Loader2 } from "lucide-react";
import HeroPhysicsCards from "@/components/HeroPhysicsCards";
import { cn } from "@/lib/utils";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

export default function Welcome() {
  const [, navigate] = useLocation();
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [username, setUsername] = useState("");
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState("");
  const { send, isConnected } = useWebSocketContext();

  // Clear any old/invalid localStorage keys on mount
  useEffect(() => {
    // Remove old key format if it exists
    localStorage.removeItem("username");
    // Clear form autocomplete cache
    const storedUsername = localStorage.getItem("katmannames_username");
    if (storedUsername === "arda" || storedUsername === "Arda") {
      // Clear if it's the problematic default value
      localStorage.removeItem("katmannames_username");
    }
  }, []);

  // Memoize props for HeroPhysicsCards to prevent re-initialization
  const cardImageNames = useMemo(() => [
    "ali mavi.webp",
    "alik kırmızı.webp",
    "arda siyah.webp",
    "begüm kırmızı.webp",
    "blush beyaz.webp",
    "blush mavi.webp",
    "dobby kırmızı.webp",
    "hasan beyaz.webp",
    "hasan mavi.webp",
    "karaman kırmızı.webp",
    "kasım mavi.webp",
    "mami beyaz.webp",
    "mami mavi.webp",
    "neswin kırmızı.webp",
    "noeldayı kırmızı.webp",
    "noeldayı mavi.webp",
    "nuriben mavi.webp",
    "perver beyaz.webp",
    "çağrı mavi.webp",
    "çağrı normal beyaz.webp",
    "çağrı sigara beyaz.webp"
  ], []);

  const canvasHeight = useMemo(() => window.innerHeight || 720, []);

  // Track when all card images are loaded
  useEffect(() => {
    const loadImages = async () => {
      try {
        const imagePromises = cardImageNames.map(imageName => {
          return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = reject;
            img.src = `/acilmiskartgorselküçültülmüş/${imageName}`;
          });
        });

        await Promise.all(imagePromises);
        setCardsLoaded(true);
      } catch (error) {
        console.error("Error loading card images:", error);
        // Still allow button to be clickable even if some images fail
        setCardsLoaded(true);
      }
    };

    loadImages();
  }, [cardImageNames]);

  // Check username availability
  useEffect(() => {
    if (!username.trim() || username.trim().length < 2) {
      setUsernameError("");
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    const checkTimer = setTimeout(() => {
      if (isConnected) {
        send("check_username", { username: username.trim() });
      }
    }, 300); // Debounce for 300ms

    return () => clearTimeout(checkTimer);
  }, [username, isConnected, send]);

  // Listen for username availability response
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === "username_availability") {
          setIsCheckingUsername(false);
          if (!message.payload.available && message.payload.username === username.trim()) {
            setUsernameError("Bu kullanıcı adı zaten kullanımda!");
          } else {
            setUsernameError("");
          }
        }
      } catch (err) {
        // Ignore parse errors
      }
    };

    // Get WebSocket from window ref (set in useWebSocket hook)
    const ws = (window as any).wsRef?.current;
    if (ws) {
      ws.addEventListener("message", handleMessage);
      return () => ws.removeEventListener("message", handleMessage);
    }
  }, [username]);

  const handleContinue = () => {
    if (username.trim().length >= 2 && !usernameError && !isCheckingUsername) {
      // No need to reserve username here - it will be handled when creating/joining room
      localStorage.setItem("katmannames_username", username.trim());
      navigate("/rooms");
    }
  };

  return (
    <div className="h-screen bg-slate-900 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/arkaplan.webp)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}>
      {/* Light Effects - Reduced for performance */}
      <div className="light-effect light-1" />
      <div className="light-effect light-3" />

      {/* Particles - Reduced from 30 to 8 for better performance */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}

      {/* Hero Section */}
      <section className="relative overflow-hidden w-full h-full">
        {/* Physics Cards Background - Reduced count for performance */}
        <HeroPhysicsCards
          imageNames={cardImageNames}
          height={canvasHeight}
          countMobile={18}
        />

        {/* Vignette Overlay for Depth */}
        <div className="absolute inset-0 pointer-events-none z-0"
          style={{
            background: 'radial-gradient(circle at center, transparent 0%, rgba(15, 23, 42, 0.4) 50%, rgba(15, 23, 42, 0.8) 100%)'
          }}
        />

        {/* Content Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center space-y-8">
            {/* Logo & Tagline Container */}
            <div className="flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-700 pointer-events-auto">
              <img
                src="/logo.webp"
                alt="Katmannames Logo"
                className="w-80 md:w-96 lg:w-[32rem] h-auto object-contain transition-transform duration-300 will-change-transform drop-shadow-2xl hover:scale-105 cursor-pointer"
                style={{
                  transform: 'translateZ(0)',
                  backfaceVisibility: 'hidden',
                  filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))'
                }}
              />
              {/* Tagline */}
              <p className="mt-4 text-lg md:text-xl text-slate-200 font-medium tracking-wide text-center max-w-md px-4 drop-shadow-md opacity-90"
                style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                Arkadaşlarınla kelime savaşına hazır mısın?
              </p>
            </div>

            {/* Start Button Container */}
            <div className="relative flex flex-col items-center justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
              <div className="relative">
                {/* Outer glow rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="absolute w-32 h-32 md:w-36 md:h-36 rounded-full animate-ping opacity-30"
                    style={{ backgroundColor: 'rgba(0, 116, 176, 0.6)' }} />
                  <div className="absolute w-36 h-36 md:w-40 md:h-40 rounded-full animate-ping opacity-20 animation-delay-200"
                    style={{ backgroundColor: 'rgba(0, 116, 176, 0.4)' }} />
                </div>

                <button
                  onClick={() => cardsLoaded && setShowUsernameInput(true)}
                  disabled={!cardsLoaded}
                  className={cn(
                    "group relative w-28 h-28 md:w-32 md:h-32 rounded-full transform transition-all duration-500 pointer-events-auto flex items-center justify-center overflow-hidden",
                    cardsLoaded ? "hover:scale-110 hover:-translate-y-1 active:scale-95 cursor-pointer" : "opacity-75 cursor-not-allowed"
                  )}
                  style={{
                    borderColor: 'rgba(67, 23, 9, 1)',
                    backgroundColor: 'rgba(0, 116, 176, 1)',
                    borderWidth: '8px',
                    borderStyle: 'solid',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 116, 176, 0.4), inset 0 5px 15px rgba(255,255,255,0.2)',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                >
                  {/* Inner shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  {/* Rotating border effect */}
                  <div className="absolute inset-[-2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{
                      background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.5), transparent)',
                      animation: 'spin 3s linear infinite',
                    }} />

                  {/* Play Icon or Loading Spinner */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    {cardsLoaded ? (
                      <Play className="w-14 h-14 md:w-16 md:h-16 transform transition-all duration-500 group-hover:scale-110 ml-1"
                        style={{
                          color: 'rgba(67, 23, 9, 1)',
                          fill: 'rgba(67, 23, 23, 1)',
                          filter: 'drop-shadow(1px 1px 2px rgba(255, 255, 255, 0.2))',
                        }} />
                    ) : (
                      <Loader2 className="w-10 h-10 md:w-12 md:h-12 animate-spin text-amber-900" />
                    )}
                  </div>
                </button>
              </div>

              {/* Button Label */}
              <div className="mt-4 pointer-events-none opacity-0 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-700 fill-mode-forwards">
                <span className="text-sm md:text-base font-bold tracking-widest text-amber-500 uppercase drop-shadow-lg"
                  style={{ textShadow: '0 2px 4px rgba(0,0,0,0.9)' }}>
                  Oyuna Başla
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 w-full z-20 flex justify-center pointer-events-auto">
          <div className="flex gap-6 text-xs md:text-sm text-slate-400/60 font-medium tracking-wide">
            <button className="hover:text-slate-200 transition-colors duration-300 hover:underline decoration-slate-500 underline-offset-4">
              Nasıl Oynanır?
            </button>
            <span className="text-slate-600">•</span>
            <button className="hover:text-slate-200 transition-colors duration-300 hover:underline decoration-slate-500 underline-offset-4">
              Kurallar
            </button>
            <span className="text-slate-600">•</span>
            <span className="hover:text-slate-300 transition-colors duration-300 cursor-default">
              v2.0
            </span>
          </div>
        </div>
      </section>

      {/* Username Input Modal */}
      {showUsernameInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <Card className="w-full max-w-md p-6 md:p-8 space-y-6 shadow-xl border-4 bg-gradient-to-br from-orange-950/95 via-slate-900/95 to-blue-950/95 backdrop-blur-lg border-orange-600/50 animate-in zoom-in-95 duration-300">
            <div className="space-y-3">
              <Label htmlFor="username" className="text-lg font-bold">
                Kullanıcı Adınız
              </Label>
              <Input
                id="username"
                data-testid="input-username"
                placeholder="Adınızı girin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !usernameError && !isCheckingUsername) handleContinue();
                  if (e.key === "Escape") setShowUsernameInput(false);
                }}
                className={cn("text-base", usernameError && "border-red-500")}
                maxLength={20}
                autoFocus
                autoComplete="off"
              />
              {isCheckingUsername && (
                <p className="text-xs text-yellow-500 flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Kullanıcı adı kontrol ediliyor...
                </p>
              )}
              {usernameError && !isCheckingUsername && (
                <p className="text-xs text-red-500">
                  {usernameError}
                </p>
              )}
              {!usernameError && !isCheckingUsername && username.trim().length >= 2 && (
                <p className="text-xs text-green-500">
                  ✓ Kullanıcı adı müsait
                </p>
              )}
              {!usernameError && !isCheckingUsername && username.trim().length < 2 && (
                <p className="text-xs text-muted-foreground">
                  En az 2 karakter giriniz
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setShowUsernameInput(false)}
                variant="outline"
                className="flex-1"
                data-testid="button-cancel"
              >
                İptal
              </Button>
              <Button
                onClick={handleContinue}
                disabled={username.trim().length < 2 || !!usernameError || isCheckingUsername}
                className="flex-1"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(124, 45, 18, 0.95), rgba(15, 23, 42, 0.95), rgba(23, 37, 84, 0.95))'
                }}
                data-testid="button-continue"
              >
                {isCheckingUsername ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Kontrol ediliyor...
                  </>
                ) : (
                  <>
                    Devam Et
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}