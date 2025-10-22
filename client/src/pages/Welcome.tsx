import { useState } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import HeroPhysicsCards from "@/components/HeroPhysicsCards";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Users, Clock, Bot, Zap, Target, Eye, Shield, Sparkles, Play, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [showUsernameInput, setShowUsernameInput] = useState(false);

  const handleContinue = () => {
    if (username.trim().length >= 2) {
      localStorage.setItem("katmannames_username", username.trim());
      setLocation("/rooms");
    }
  };

  const cardTypes = [
    {
      title: "Katman Koyu",
      color: "blue",
      gradient: "from-blue-600 to-blue-800",
      borderColor: "border-blue-500",
      glowColor: "shadow-blue-500/50",
      count: "9",
      description: "Başlangıç takımı",
      icon: <Shield className="w-6 h-6" />
    },
    {
      title: "Katman Açık",
      color: "red",
      gradient: "from-red-600 to-red-800",
      borderColor: "border-red-500",
      glowColor: "shadow-red-500/50",
      count: "8",
      description: "İkinci takım",
      icon: <Target className="w-6 h-6" />
    },
    {
      title: "Tarafsız",
      color: "gray",
      gradient: "from-gray-500 to-gray-700",
      borderColor: "border-gray-400",
      glowColor: "shadow-gray-400/50",
      count: "7",
      description: "Nötr kartlar",
      icon: <Sparkles className="w-6 h-6" />
    },
    {
      title: "Suikastçı",
      color: "black",
      gradient: "from-purple-900 to-black",
      borderColor: "border-purple-600",
      glowColor: "shadow-purple-600/50",
      count: "1",
      description: "Oyunu bitirir!",
      icon: <Zap className="w-6 h-6" />
    }
  ];

  const features = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Çok Oyunculu",
      description: "2-20 kişiyle oyna"
    },
    {
      icon: <Clock className="w-8 h-8" />,
      title: "Zamanlayıcı",
      description: "Opsiyonel süre limiti"
    },
    {
      icon: <Bot className="w-8 h-8" />,
      title: "Bot Desteği",
      description: "Eksik oyuncular için"
    },
    {
      icon: <Eye className="w-8 h-8" />,
      title: "İki Rol",
      description: "İstihbarat Şefi & Ajan"
    }
  ];

  const gameSteps = [
    {
      number: "1",
      title: "Takım Seç",
      description: "Mavi veya kırmızı takıma katıl"
    },
    {
      number: "2",
      title: "Rol Al",
      description: "İstihbarat Şefi ipucu verir, Ajanlar tahmin eder"
    },
    {
      number: "3",
      title: "İpucu Ver",
      description: "Tek kelime ve sayı ile yönlendir"
    },
    {
      number: "4",
      title: "Kazan",
      description: "Tüm takım kartlarını bul"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-x-hidden" 
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
      <section className="relative overflow-hidden w-full" style={{ minHeight: '640px' }}>
        {/* Physics Cards Background */}
        <HeroPhysicsCards 
          imageNames={[
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
          ]}
          height={640}
          countMobile={24}
        />
        
        {/* Content Overlay */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="text-center px-4 space-y-8">
            <div className="flex justify-center">
              <img 
                src="/logo.png" 
                alt="Katmannames Logo" 
                className="w-80 md:w-96 lg:w-[32rem] h-auto object-contain animate-in fade-in slide-in-from-top-4 duration-700"
              />
            </div>
            
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-blue-400 via-purple-400 to-red-400 bg-clip-text text-transparent">
                Türkçe Kelime Tahmin Oyunu
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                İki takım, gizli kelimeler, stratejik ipuçları. Takım arkadaşlarınla birlikte 
                25 kartlık grid'de kendi takımının kartlarını bul!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
              <Button
                onClick={() => setShowUsernameInput(true)}
                size="lg"
                className="group relative px-8 py-6 text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all pointer-events-auto"
              >
                <Play className="w-5 h-5 mr-2" />
                Hemen Başla
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                onClick={() => document.getElementById('how-to-play')?.scrollIntoView({ behavior: 'smooth' })}
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg font-semibold border-2 pointer-events-auto"
              >
                Nasıl Oynanır?
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Card Showcase Section */}
      <section className="relative z-10 py-20 px-4 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent w-full overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Özel Tasarım Kartlar
            </h2>
            <p className="text-muted-foreground text-lg">
              Her kart tipinin benzersiz görünümü ve katmanlı tasarımı
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {cardTypes.map((card, index) => (
              <div
                key={index}
                className="group relative"
                onMouseEnter={() => setHoveredCard(index)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div className={cn(
                  "absolute inset-0 rounded-xl blur-xl opacity-50 transition-all duration-500",
                  `bg-gradient-to-br ${card.gradient}`,
                  hoveredCard === index && "opacity-80 blur-2xl"
                )} />
                
                <Card className={cn(
                  "relative p-6 border-2 backdrop-blur-sm transition-all duration-500",
                  card.borderColor,
                  "bg-gradient-to-br from-slate-900/90 to-slate-800/90",
                  "hover:scale-105 hover:shadow-2xl",
                  hoveredCard === index && card.glowColor
                )}>
                  <div className="aspect-[3/2] rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 p-4 mb-4 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className={cn(
                        "p-2 rounded-lg",
                        `bg-gradient-to-br ${card.gradient}`
                      )}>
                        {card.icon}
                      </div>
                      <div className={cn(
                        "text-3xl font-black",
                        card.color === "blue" && "text-blue-400",
                        card.color === "red" && "text-red-400",
                        card.color === "gray" && "text-gray-400",
                        card.color === "black" && "text-purple-400"
                      )}>
                        {card.count}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className={cn(
                        "h-2 rounded-full",
                        `bg-gradient-to-r ${card.gradient}`
                      )} />
                      <div className={cn(
                        "h-1 rounded-full w-3/4",
                        `bg-gradient-to-r ${card.gradient}`,
                        "opacity-50"
                      )} />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-1">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to Play Section */}
      <section id="how-to-play" className="relative z-10 py-20 px-4 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Nasıl Oynanır?
            </h2>
            <p className="text-muted-foreground text-lg">
              4 basit adımda oyuna başla
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {gameSteps.map((step, index) => (
              <Card key={index} className="p-6 border-2 bg-slate-900/80 backdrop-blur-sm hover:bg-slate-900/90 transition-all">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center text-2xl font-black">
                    {step.number}
                  </div>
                  {index < gameSteps.length - 1 && (
                    <div className="hidden lg:block absolute right-0 top-12 w-full">
                      <ChevronRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-blue-900/30 via-purple-900/30 to-red-900/30 rounded-xl p-8 border border-purple-500/30">
            <h3 className="text-2xl font-bold mb-4 text-center">Oyunun Amacı</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-3xl font-black text-blue-400 mb-2">25</div>
                <p className="text-muted-foreground">Toplam Kart</p>
              </div>
              <div>
                <div className="text-3xl font-black text-purple-400 mb-2">2</div>
                <p className="text-muted-foreground">Takım</p>
              </div>
              <div>
                <div className="text-3xl font-black text-red-400 mb-2">1</div>
                <p className="text-muted-foreground">Kazanan</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 bg-gradient-to-t from-transparent via-slate-900/50 to-transparent w-full overflow-hidden">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Oyun Özellikleri
            </h2>
            <p className="text-muted-foreground text-lg">
              Gelişmiş özelliklerle daha eğlenceli deneyim
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="p-6 text-center border-2 bg-slate-900/80 backdrop-blur-sm hover:bg-slate-900/90 hover:scale-105 transition-all">
                <div className="flex justify-center mb-4 text-purple-400">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </Card>
            ))}
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
              >
                İptal
              </Button>
              <Button
                onClick={handleContinue}
                disabled={username.trim().length < 2}
                className="flex-1"
                data-testid="button-continue"
              >
                Oyuna Başla
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-8 px-4 text-center border-t border-slate-800">
        <div className="max-w-7xl mx-auto space-y-4">
          <p className="text-sm text-muted-foreground">
            250+ Türkçe kelime • Gerçek zamanlı çok oyunculu • WebSocket bağlantısı
          </p>
          <p className="text-xs text-muted-foreground italic">
            Bu oyun resmi Codenames değildir. Hype ve topluluğu için özel olarak hazırlanmıştır.
          </p>
        </div>
      </footer>
    </div>
  );
}