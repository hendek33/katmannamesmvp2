import { useState } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");

  const handleContinue = () => {
    if (username.trim().length >= 2) {
      localStorage.setItem("katmannames_username", username.trim());
      setLocation("/rooms");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Light Effects */}
      <div className="light-effect light-1" />
      <div className="light-effect light-2" />
      <div className="light-effect light-3" />
      <div className="light-effect light-4" />
      <div className="light-effect light-5" />
      
      {/* Particles */}
      {[...Array(70)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
      
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500 relative z-10">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <img 
              src="/logo.png" 
              alt="Katmannames Logo" 
              className="w-80 md:w-96 h-auto object-contain"
            />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Hoş Geldiniz
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-sm mx-auto">
              Takım arkadaşlarınla ipuçları verin, kartları tahmin edin ve rakip takımı geçin!
            </p>
          </div>
        </div>

        <Card className="p-6 md:p-8 space-y-6 shadow-xl border-4 bg-gradient-to-br from-orange-950/40 via-slate-900/95 to-blue-950/40 backdrop-blur-lg border-orange-600/50">
          <div className="space-y-3">
            <Label htmlFor="username" className="text-sm font-medium">
              Kullanıcı Adı
            </Label>
            <Input
              id="username"
              data-testid="input-username"
              placeholder="Adınızı girin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleContinue()}
              className="text-base"
              maxLength={20}
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              En az 2 karakter
            </p>
          </div>

          <Button
            onClick={handleContinue}
            disabled={username.trim().length < 2}
            className="w-full"
            size="lg"
            data-testid="button-continue"
          >
            Devam
          </Button>
        </Card>

        <p className="text-xs text-center text-muted-foreground italic">
          Bu oyun resmi Codenames değildir.
        </p>
      </div>
    </div>
  );
}
