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
      setLocation("/lobby");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500">
        <div className="text-center space-y-4">
          <Logo className="justify-center" />
          
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-semibold text-foreground">
              Hoş Geldiniz
            </h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-sm mx-auto">
              Takım arkadaşlarınla ipuçları verin, kartları tahmin edin ve rakip takımı geçin!
            </p>
          </div>
        </div>

        <Card className="p-6 md:p-8 space-y-6 shadow-xl border-2">
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
          
          <Button
            variant="ghost"
            onClick={() => {
              localStorage.clear();
              window.location.reload();
            }}
            className="w-full text-xs"
            data-testid="button-clear-storage"
          >
            Yeni Başlat
          </Button>
        </Card>

        <p className="text-xs text-center text-muted-foreground italic">
          Bu oyun resmi Codenames değildir.
        </p>
      </div>
    </div>
  );
}
