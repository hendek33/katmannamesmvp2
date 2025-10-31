import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Play, ChevronRight, ChevronUp, ChevronDown, ChevronLeft, Shield, Users, Trophy, Eye, Timer, Bot, Loader2, AlertCircle } from "lucide-react";
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
    "ali mavi.png",
    "alik kırmızı.png",
    "arda siyah.png",
    "begüm kırmızı.png",
    "blush beyaz.png",
    "blush mavi.png",
    "dobby kırmızı.png",
    "hasan beyaz.png",
    "hasan mavi.png",
    "karaman kırmızı.png",
    "kasım mavi.png",
    "mami beyaz.png",
    "mami mavi.png",
    "neswin kırmızı.png",
    "noeldayı kırmızı.png",
    "noeldayı mavi.png",
    "nuriben mavi.png",
    "perver beyaz.png",
    "çağrı mavi.png",
    "çağrı normal beyaz.png",
    "çağrı sigara beyaz.png"
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

  // Check username availability when user types
  useEffect(() => {
    if (username.trim().length < 2) {
      setUsernameError("");
      return;
    }

    const checkTimer = setTimeout(() => {
      if (isConnected) {
        setIsCheckingUsername(true);
        send("check_username", { username: username.trim() });
      }
    }, 500);

    return () => clearTimeout(checkTimer);
  }, [username, send, isConnected]);

  // Listen for username availability response
  useEffect(() => {
    const handleUsernameAvailability = (event: any) => {
      setIsCheckingUsername(false);
      if (!event.detail.available && event.detail.username === username.trim()) {
        setUsernameError("Bu kullanıcı adı zaten kullanımda!");
      } else if (event.detail.available && event.detail.username === username.trim()) {
        setUsernameError("");
      }
    };

    window.addEventListener("username_availability", handleUsernameAvailability);
    return () => window.removeEventListener("username_availability", handleUsernameAvailability);
  }, [username]);

  const handleContinue = () => {
    if (username.trim().length >= 2 && !usernameError) {
      localStorage.setItem("katmannames_username", username.trim());
      navigate("/rooms");
    }
  };

  return (
    <div className="h-screen bg-slate-900 relative overflow-hidden" 
         style={{ 
           backgroundImage: 'url(/arkaplan.png)', 
           backgroundSize: 'cover', 
           backgroundPosition: 'center', 
           backgroundRepeat: 'no-repeat',
           backgroundAttachment: 'fixed'
         }}>
      {/* Light Effects */}
      <div className="light-effect light-1" />
      <div className="light-effect light-2" />
      <div className="light-effect light-3" />
      <div className="light-effect light-4" />
      <div className="light-effect light-5" />
      
      {/* Particles */}
      {[...Array(30)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}

      {/* Hero Section */}
      <section className="relative overflow-hidden w-full h-full">
        {/* Physics Cards Background */}
        <HeroPhysicsCards 
          imageNames={cardImageNames}
          height={canvasHeight}
          countMobile={24}
        />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center space-y-12">
            {/* Logo */}
            <div className="flex justify-center animate-in fade-in slide-in-from-top-4 duration-700 pointer-events-auto">
              <img 
                src="/logo.png" 
                alt="Katmannames Logo" 
                className="w-80 md:w-96 lg:w-[28rem] h-auto object-contain transition-all duration-300 drop-shadow-[0_10px_30px_rgba(255,255,255,0.4)] hover:drop-shadow-[0_15px_50px_rgba(255,255,255,0.6)] hover:scale-110 cursor-pointer"
              />
            </div>

            {/* Start Button */}
            <div className="relative flex justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400 ml-6">
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
                  "group relative w-32 h-32 md:w-36 md:h-36 rounded-full transform transition-all duration-500 pointer-events-auto flex items-center justify-center overflow-hidden",
                  cardsLoaded ? "hover:scale-125 hover:rotate-12 active:scale-110" : "opacity-75 cursor-not-allowed"
                )}
                style={{
                  borderColor: 'rgba(67, 23, 9, 1)',
                  backgroundColor: 'rgba(0, 116, 176, 1)',
                  borderWidth: '12px',
                  borderStyle: 'solid',
                  filter: 'drop-shadow(0 10px 25px rgba(0, 116, 176, 0.6)) drop-shadow(0 5px 15px rgba(67, 23, 9, 0.5))',
                  transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                }}
                onMouseEnter={(e) => {
                  if (cardsLoaded) {
                    e.currentTarget.style.filter = 'drop-shadow(0 20px 50px rgba(0, 116, 176, 1)) drop-shadow(0 10px 30px rgba(67, 23, 9, 0.8))';
                    e.currentTarget.style.backgroundColor = 'rgba(0, 150, 200, 1)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (cardsLoaded) {
                    e.currentTarget.style.filter = 'drop-shadow(0 10px 25px rgba(0, 116, 176, 0.6)) drop-shadow(0 5px 15px rgba(67, 23, 9, 0.5))';
                    e.currentTarget.style.backgroundColor = 'rgba(0, 116, 176, 1)';
                  }
                }}
              >
                {/* Inner pulse effect */}
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:animate-pulse" />
                
                {/* Rotating border effect */}
                <div className="absolute inset-[-2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                     style={{
                       background: 'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.4), transparent)',
                       animation: 'spin 2s linear infinite',
                     }} />
                
                {/* Play Icon or Loading Spinner with hover animation */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  {cardsLoaded ? (
                    <Play className="w-16 h-16 md:w-20 md:h-20 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-12" 
                          style={{ 
                            color: 'rgba(67, 23, 9, 1)',
                            fill: 'rgba(67, 23, 9, 1)',
                            filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))',
                          }} />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-12 h-12 md:w-16 md:h-16 animate-spin" 
                               style={{ 
                                 color: 'rgba(67, 23, 9, 1)',
                                 filter: 'drop-shadow(2px 2px 4px rgba(0, 0, 0, 0.3))',
                               }} />
                      <span className="text-xs font-medium"
                            style={{ 
                              color: 'rgba(67, 23, 9, 1)',
                              textShadow: '1px 1px 2px rgba(0, 0, 0, 0.5)',
                            }}>
                        Yükleniyor...
                      </span>
                    </div>
                  )}
                </div>
              </button>
            </div>
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
              <div className="relative">
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
                  className={cn(
                    "text-base pr-10",
                    usernameError && "border-red-500 focus-visible:ring-red-500"
                  )}
                  maxLength={20}
                  autoFocus
                  autoComplete="off"
                />
                {isCheckingUsername && (
                  <Loader2 className="w-4 h-4 absolute right-3 top-3 animate-spin text-muted-foreground" />
                )}
              </div>
              {usernameError && (
                <div className="flex items-center gap-2 text-red-500 text-sm animate-in fade-in slide-in-from-top-1 duration-200">
                  <AlertCircle className="w-4 h-4" />
                  <span>{usernameError}</span>
                </div>
              )}
              {!usernameError && (
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
                    Kontrol Ediliyor...
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