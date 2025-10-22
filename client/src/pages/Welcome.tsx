import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Play, ChevronRight, ChevronUp, ChevronDown, ChevronLeft, Shield, Users, Trophy, Eye, Timer, Bot } from "lucide-react";
import HeroPhysicsCards from "@/components/HeroPhysicsCards";
import { cn } from "@/lib/utils";

export default function Welcome() {
  const [, navigate] = useLocation();
  const [showUsernameInput, setShowUsernameInput] = useState(false);
  const [username, setUsername] = useState("");
  
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
    "perver kırmızı.png",
    "triel kırmızı.png",
    "triel2 mavi.png",
    "çağrı mavi.png",
    "çağrı normal beyaz.png",
    "çağrı sigara beyaz.png",
    "şinasi kırmızı.png",
    "şinasi su beyaz.png"
  ], []);
  
  const canvasHeight = useMemo(() => window.innerHeight || 720, []);

  const handleContinue = () => {
    if (username.trim().length >= 2) {
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
              <button
                onClick={() => setShowUsernameInput(true)}
                className="group relative w-32 h-32 md:w-36 md:h-36 rounded-full transform hover:scale-110 transition-all pointer-events-auto flex items-center justify-center overflow-hidden animate-pulse-glow hover:filter-none"
                style={{
                  borderColor: 'rgba(67, 23, 9, 1)',
                  backgroundColor: 'rgba(0, 116, 176, 1)',
                  borderWidth: '12px',
                  borderStyle: 'solid',
                  filter: 'drop-shadow(0 10px 25px rgba(0, 116, 176, 0.6)) drop-shadow(0 5px 15px rgba(67, 23, 9, 0.5))',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'drop-shadow(0 15px 40px rgba(0, 116, 176, 0.8)) drop-shadow(0 8px 25px rgba(67, 23, 9, 0.6))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'drop-shadow(0 10px 25px rgba(0, 116, 176, 0.6)) drop-shadow(0 5px 15px rgba(67, 23, 9, 0.5))';
                }}
              >
                <div className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                     style={{ 
                       backgroundColor: 'rgba(0, 116, 176, 0.8)'
                     }} />
                {/* Opaque Play Icon */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Play className="w-16 h-16 md:w-20 md:h-20" 
                        style={{ 
                          color: 'rgba(67, 23, 9, 1)',
                          fill: 'rgba(67, 23, 9, 1)' 
                        }} />
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
              <Input
                id="username"
                data-testid="input-username"
                placeholder="Adınızı girin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleContinue();
                  if (e.key === "Escape") setShowUsernameInput(false);
                }}
                className="text-base"
                maxLength={20}
                autoFocus
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                En az 2 karakter giriniz
              </p>
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
                disabled={username.trim().length < 2}
                className="flex-1"
                style={{
                  background: 'linear-gradient(to bottom right, rgba(124, 45, 18, 0.95), rgba(15, 23, 42, 0.95), rgba(23, 37, 84, 0.95))'
                }}
                data-testid="button-continue"
              >
                Devam Et
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}