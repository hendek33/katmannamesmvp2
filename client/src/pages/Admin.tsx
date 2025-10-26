import { useState, useEffect } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Lock, Image, Type } from "lucide-react";
import { useLocation } from "wouter";

interface GameConfig {
  cardImages: {
    normalCardOffset: number;
    assassinCardOffset: number;
  };
  fonts: {
    clueInputSize: number;
  };
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState<string>("");
  const [config, setConfig] = useState<GameConfig>({
    cardImages: {
      normalCardOffset: -6,
      assassinCardOffset: 0
    },
    fonts: {
      clueInputSize: 21
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already authenticated (token in sessionStorage)
    const token = sessionStorage.getItem("adminToken");
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
      loadConfig(token);
    }
  }, []);

  const loadConfig = async (token: string) => {
    try {
      const response = await fetch("/api/admin/config", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else if (response.status === 401) {
        // Token expired or invalid
        sessionStorage.removeItem("adminToken");
        setIsAuthenticated(false);
        toast({
          title: "Hata",
          description: "Oturum süresi doldu, lütfen tekrar giriş yapın",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Failed to load config:", error);
      toast({
        title: "Hata",
        description: "Ayarlar yüklenemedi",
        variant: "destructive"
      });
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        const token = data.token;
        setAuthToken(token);
        setIsAuthenticated(true);
        sessionStorage.setItem("adminToken", token);
        toast({
          title: "Başarılı",
          description: "Admin paneline hoş geldiniz"
        });
        loadConfig(token);
      } else {
        toast({
          title: "Hata",
          description: "Geçersiz şifre",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Giriş yapılamadı",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setLoading(true);
    
    try {
      const response = await fetch("/api/admin/config", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ config })
      });

      if (response.ok) {
        toast({
          title: "Başarılı",
          description: "Ayarlar kaydedildi ve tüm oyunculara uygulandı"
        });
      } else if (response.status === 401) {
        // Token expired or invalid
        sessionStorage.removeItem("adminToken");
        setIsAuthenticated(false);
        toast({
          title: "Hata",
          description: "Oturum süresi doldu, lütfen tekrar giriş yapın",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Hata",
          description: "Ayarlar kaydedilemedi",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Hata",
        description: "Bağlantı hatası",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
        <Card className="w-full max-w-md bg-slate-950/90 border-amber-500/30">
          <CardHeader>
            <div className="flex items-center gap-2 justify-center">
              <Lock className="w-6 h-6 text-amber-400" />
              <h1 className="text-2xl font-bold text-amber-100">Admin Paneli</h1>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password" className="text-slate-200">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Admin şifresini girin"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="bg-slate-900/50 border-slate-700 text-slate-100"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleLogin}
                className="w-full bg-amber-600 hover:bg-amber-700"
                disabled={loading || !password}
              >
                {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-slate-950/90 border-amber-500/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-6 h-6 text-amber-400" />
                <h1 className="text-2xl font-bold text-amber-100">Oyun Ayarları</h1>
              </div>
              <Button
                onClick={() => setLocation("/")}
                variant="outline"
                className="text-slate-200 border-slate-700 hover:bg-slate-800"
              >
                Ana Menüye Dön
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Kart Görselleri Ayarları */}
        <Card className="bg-slate-950/90 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Image className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-blue-100">Kart Görselleri</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-200">
                Normal Kart Görsel Boyutu
              </Label>
              <div className="flex gap-3 items-center">
                <Slider
                  value={[config.cardImages.normalCardOffset]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    cardImages: { ...config.cardImages, normalCardOffset: value }
                  })}
                  min={-10}
                  max={0}
                  step={1}
                  className="flex-1"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={config.cardImages.normalCardOffset}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= -10 && value <= 0) {
                        setConfig({
                          ...config,
                          cardImages: { ...config.cardImages, normalCardOffset: value }
                        });
                      }
                    }}
                    className="w-20 bg-slate-900/50 border-slate-700 text-slate-100 text-center"
                    min={-10}
                    max={0}
                  />
                  <span className="text-slate-400 text-sm">px</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Kart açıldığında görselin kenarlardan ne kadar taşacağını belirler (-10: çok büyük, 0: tam sığdır)
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">
                Suikastçı Kartı Görsel Boyutu
              </Label>
              <div className="flex gap-3 items-center">
                <Slider
                  value={[config.cardImages.assassinCardOffset]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    cardImages: { ...config.cardImages, assassinCardOffset: value }
                  })}
                  min={-10}
                  max={0}
                  step={1}
                  className="flex-1"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={config.cardImages.assassinCardOffset}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= -10 && value <= 0) {
                        setConfig({
                          ...config,
                          cardImages: { ...config.cardImages, assassinCardOffset: value }
                        });
                      }
                    }}
                    className="w-20 bg-slate-900/50 border-slate-700 text-slate-100 text-center"
                    min={-10}
                    max={0}
                  />
                  <span className="text-slate-400 text-sm">px</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Suikastçı kartı açıldığında görselin boyutu (genelde 0 olmalı)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Font Ayarları */}
        <Card className="bg-slate-950/90 border-slate-700">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-semibold text-green-100">Yazı Boyutları</h2>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-slate-200">
                İpucu Kutusu Yazı Boyutu
              </Label>
              <div className="flex gap-3 items-center">
                <Slider
                  value={[config.fonts.clueInputSize]}
                  onValueChange={([value]) => setConfig({
                    ...config,
                    fonts: { ...config.fonts, clueInputSize: value }
                  })}
                  min={14}
                  max={36}
                  step={1}
                  className="flex-1"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    value={config.fonts.clueInputSize}
                    onChange={(e) => {
                      const value = parseInt(e.target.value);
                      if (!isNaN(value) && value >= 14 && value <= 36) {
                        setConfig({
                          ...config,
                          fonts: { ...config.fonts, clueInputSize: value }
                        });
                      }
                    }}
                    className="w-20 bg-slate-900/50 border-slate-700 text-slate-100 text-center"
                    min={14}
                    max={36}
                  />
                  <span className="text-slate-400 text-sm">px</span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                İstihbarat şefinin ipucu yazarken göreceği yazı boyutu
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Kaydet Butonu */}
        <Card className="bg-slate-950/90 border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Değişiklikler anında tüm aktif oyunlara uygulanacaktır
              </p>
              <Button
                onClick={handleSaveConfig}
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? "Kaydediliyor..." : "Ayarları Kaydet ve Yayınla"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}