import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, Settings, Users, FileText, Shield, Trash2, UserX, Plus, X } from "lucide-react";
import { Link } from "wouter";
import type { GameState } from "@shared/schema";

interface Room {
  roomCode: string;
  gameState: GameState;
  playerCount: number;
  created: Date;
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [authToken, setAuthToken] = useState("");
  const [newWord, setNewWord] = useState("");
  const { toast } = useToast();

  // Check if already authenticated
  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Login failed");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      setIsAuthenticated(true);
      localStorage.setItem("adminToken", data.token);
      toast({
        title: "Giriş Başarılı",
        description: "Admin paneline hoş geldiniz",
      });
    },
    onError: () => {
      toast({
        title: "Hata",
        description: "Geçersiz şifre",
        variant: "destructive",
      });
    },
  });

  // Fetch rooms
  const { data: rooms, isLoading: roomsLoading } = useQuery<Room[]>({
    queryKey: ["/api/admin/rooms"],
    queryFn: async () => {
      const response = await fetch("/api/admin/rooms", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }
      return response.json();
    },
    enabled: isAuthenticated && !!authToken,
  });

  // Fetch words
  const { data: words, isLoading: wordsLoading } = useQuery<string[]>({
    queryKey: ["/api/admin/words"],
    queryFn: async () => {
      const response = await fetch("/api/admin/words", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch words");
      }
      return response.json();
    },
    enabled: isAuthenticated && !!authToken,
  });

  // Close room mutation
  const closeRoomMutation = useMutation({
    mutationFn: async (roomCode: string) => {
      const response = await fetch(`/api/admin/rooms/${roomCode}/close`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to close room");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rooms"] });
      toast({
        title: "Başarılı",
        description: "Oda kapatıldı",
      });
    },
  });

  // Kick player mutation
  const kickPlayerMutation = useMutation({
    mutationFn: async ({ roomCode, playerId }: { roomCode: string; playerId: string }) => {
      const response = await fetch(`/api/admin/rooms/${roomCode}/kick/${playerId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to kick player");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rooms"] });
      toast({
        title: "Başarılı",
        description: "Oyuncu atıldı",
      });
    },
  });

  // Add word mutation
  const addWordMutation = useMutation({
    mutationFn: async (word: string) => {
      const response = await fetch("/api/admin/words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ word }),
      });
      if (!response.ok) {
        throw new Error("Failed to add word");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/words"] });
      setNewWord("");
      toast({
        title: "Başarılı",
        description: "Kelime eklendi",
      });
    },
  });

  // Remove word mutation
  const removeWordMutation = useMutation({
    mutationFn: async (word: string) => {
      const response = await fetch(`/api/admin/words/${encodeURIComponent(word)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to remove word");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/words"] });
      toast({
        title: "Başarılı",
        description: "Kelime silindi",
      });
    },
  });

  // Login form
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[url('/bg-1.png')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" />
        
        <Card className="relative w-full max-w-md p-8 bg-background/70 backdrop-blur-md border-border/50">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold">Admin Paneli</h1>
          </div>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            loginMutation.mutate(password);
          }}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Şifre</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Admin şifresini girin"
                  className="mt-1"
                  data-testid="input-admin-password"
                />
              </div>
              
              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
                data-testid="button-admin-login"
              >
                {loginMutation.isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
              </Button>
              
              <Link href="/">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  data-testid="button-back-home"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Ana Sayfaya Dön
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    );
  }

  // Admin dashboard
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[url('/bg-1.png')] bg-cover bg-center opacity-10" />
      
      <div className="relative container mx-auto p-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold">Katmannames Admin Paneli</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" data-testid="button-back-home">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Ana Sayfa
              </Button>
            </Link>
            
            <Button
              variant="destructive"
              onClick={() => {
                localStorage.removeItem("adminToken");
                setIsAuthenticated(false);
                setAuthToken("");
                setPassword("");
              }}
              data-testid="button-logout"
            >
              Çıkış Yap
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="rooms" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="rooms" data-testid="tab-rooms">
              <Users className="w-4 h-4 mr-2" />
              Odalar
            </TabsTrigger>
            <TabsTrigger value="words" data-testid="tab-words">
              <FileText className="w-4 h-4 mr-2" />
              Kelimeler
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="tab-settings">
              <Settings className="w-4 h-4 mr-2" />
              Ayarlar
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="rooms">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Aktif Odalar</h2>
              
              {roomsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
              ) : rooms && rooms.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <Card key={room.roomCode} className="p-4 bg-muted/30">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="font-bold text-lg">Oda: {room.roomCode}</span>
                            <span className="ml-3 text-sm text-muted-foreground">
                              {room.playerCount} Oyuncu
                            </span>
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => closeRoomMutation.mutate(room.roomCode)}
                            disabled={closeRoomMutation.isPending}
                            data-testid={`button-close-room-${room.roomCode}`}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Odayı Kapat
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Durum: </span>
                            <span className="font-medium">
                              {room.gameState.phase === "lobby" ? "Lobide" :
                               room.gameState.phase === "playing" ? "Oyunda" : "Bitti"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Sıra: </span>
                            <span className="font-medium">
                              {room.gameState.currentTeam === "dark" ? "Katman Koyu" : "Katman Açık"}
                            </span>
                          </div>
                        </div>
                        
                        {room.gameState.players.length > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="text-sm font-medium mb-2">Oyuncular:</div>
                            <div className="flex flex-wrap gap-2">
                              {room.gameState.players.map((player) => (
                                <div
                                  key={player.id}
                                  className="flex items-center gap-1 px-2 py-1 bg-background rounded text-xs"
                                >
                                  <span>{player.username}</span>
                                  {!player.isBot && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0"
                                      onClick={() => kickPlayerMutation.mutate({
                                        roomCode: room.roomCode,
                                        playerId: player.id
                                      })}
                                      data-testid={`button-kick-${player.id}`}
                                    >
                                      <UserX className="w-3 h-3" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aktif oda bulunmuyor
                </div>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="words">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Kelime Listesi</h2>
                
                <div className="flex gap-2">
                  <Input
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Yeni kelime"
                    className="w-40"
                    data-testid="input-new-word"
                  />
                  <Button
                    onClick={() => {
                      if (newWord.trim()) {
                        addWordMutation.mutate(newWord.trim());
                      }
                    }}
                    disabled={addWordMutation.isPending || !newWord.trim()}
                    data-testid="button-add-word"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ekle
                  </Button>
                </div>
              </div>
              
              {wordsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Yükleniyor...</div>
              ) : words && words.length > 0 ? (
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                    {words.map((word) => (
                      <div
                        key={word}
                        className="flex items-center justify-between px-3 py-2 bg-muted/30 rounded group"
                      >
                        <span className="text-sm">{word}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeWordMutation.mutate(word)}
                          data-testid={`button-remove-word-${word}`}
                        >
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Kelime listesi boş
                </div>
              )}
              
              <div className="mt-4 text-sm text-muted-foreground">
                Toplam {words?.length || 0} kelime
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="settings">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Oyun Ayarları</h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded">
                  <h3 className="font-medium mb-2">Sunucu Ayarları</h3>
                  <p className="text-sm text-muted-foreground">
                    WebSocket bağlantı zaman aşımı, maksimum oda sayısı gibi ayarlar yakında eklenecek.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/30 rounded">
                  <h3 className="font-medium mb-2">Oyun Limitleri</h3>
                  <p className="text-sm text-muted-foreground">
                    Maksimum oyuncu sayısı, minimum oyuncu sayısı, tur süre limitleri yakında eklenecek.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/30 rounded">
                  <h3 className="font-medium mb-2">Güvenlik</h3>
                  <p className="text-sm text-muted-foreground">
                    Admin şifresini değiştirme, IP ban listesi yönetimi yakında eklenecek.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}