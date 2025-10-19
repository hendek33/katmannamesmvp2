import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { PlayerList } from "@/components/PlayerList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Copy, Check, Plus, LogIn, Loader2, Bot } from "lucide-react";
import type { Team } from "@shared/schema";

export default function Lobby() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isConnected, gameState, playerId, roomCode, error, send } = useWebSocket();
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [joinCode, setJoinCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    const savedUsername = localStorage.getItem("katmannames_username");
    if (!savedUsername) {
      setLocation("/");
    } else {
      setUsername(savedUsername);
    }
  }, [setLocation]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Hata",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  useEffect(() => {
    if (gameState?.phase === "playing") {
      setLocation("/game");
    }
  }, [gameState, setLocation]);

  const handleCreateRoom = () => {
    if (username) {
      send("create_room", { username });
    }
  };

  const handleJoinRoom = () => {
    if (username && joinCode.trim().length >= 4) {
      send("join_room", { roomCode: joinCode.toUpperCase(), username });
    }
  };

  const handleCopyRoomCode = () => {
    if (roomCode) {
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      toast({
        title: "Kopyalandı!",
        description: "Oda kodu panoya kopyalandı",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTeamSelect = (team: Team) => {
    send("select_team", { team });
  };

  const handleRoleToggle = () => {
    const currentPlayer = gameState?.players.find(p => p.id === playerId);
    if (currentPlayer) {
      const newRole = currentPlayer.role === "spymaster" ? "guesser" : "spymaster";
      send("select_role", { role: newRole });
    }
  };

  const handleStartGame = () => {
    send("start_game", {});
  };

  const handleAddBot = (team: "dark" | "light", role: "spymaster" | "guesser") => {
    send("add_bot", { team, role });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-grid-pattern">
        <Card className="p-8 space-y-4 text-center" data-testid="loading-state">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Sunucuya bağlanılıyor...</p>
        </Card>
      </div>
    );
  }

  if (!roomCode && mode === "select") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-grid-pattern">
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500">
          <Logo className="justify-center" />
          
          <div className="space-y-4">
            <Card 
              className="p-6 space-y-4 hover-elevate cursor-pointer transition-all" 
              onClick={handleCreateRoom}
              data-testid="button-create-room"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-primary/10">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Oda Oluştur</h3>
                  <p className="text-sm text-muted-foreground">Yeni bir oyun başlat</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4 hover-elevate cursor-pointer transition-all" onClick={() => setMode("join")}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-md bg-accent/10">
                  <LogIn className="w-6 h-6 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Odaya Katıl</h3>
                  <p className="text-sm text-muted-foreground">Oda kodu ile gir</p>
                </div>
              </div>
            </Card>
          </div>

          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="w-full"
            data-testid="button-back"
          >
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  if (!roomCode && mode === "join") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-grid-pattern">
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500">
          <Logo className="justify-center" />
          
          <Card className="p-6 md:p-8 space-y-6 shadow-xl border-2">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold">Odaya Katıl</h2>
              <p className="text-sm text-muted-foreground">
                Arkadaşının oda kodunu gir
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="roomCode">Oda Kodu</Label>
              <Input
                id="roomCode"
                data-testid="input-room-code"
                placeholder="ABCD12"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                maxLength={6}
                className="text-center text-lg font-mono tracking-wider"
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setMode("select")}
                className="flex-1"
                data-testid="button-back"
              >
                Geri
              </Button>
              <Button
                onClick={handleJoinRoom}
                disabled={joinCode.length < 4}
                className="flex-1"
                data-testid="button-join-room"
              >
                Katıl
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-grid-pattern">
        <Card className="p-8 space-y-4 text-center" data-testid="loading-state">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </Card>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const canStartGame = currentPlayer?.isRoomOwner && 
    gameState.players.filter(p => p.team === "dark").some(p => p.role === "spymaster") &&
    gameState.players.filter(p => p.team === "light").some(p => p.role === "spymaster") &&
    gameState.players.filter(p => p.team === "dark").length > 0 &&
    gameState.players.filter(p => p.team === "light").length > 0;

  return (
    <div className="min-h-screen p-4 bg-background bg-grid-pattern animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto space-y-6">
        <Logo />
        
        <Card className="p-6 space-y-4 border-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">Oyun Lobisi</h2>
              <p className="text-sm text-muted-foreground">
                Oyuncular takımlarını seçiyor
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Oda Kodu</div>
                <div className="text-lg font-mono font-bold" data-testid="room-code">
                  {roomCode}
                </div>
              </div>
              <Button
                size="icon"
                variant="outline"
                onClick={handleCopyRoomCode}
                data-testid="button-copy-code"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <PlayerList
              players={gameState.players}
              currentPlayerId={playerId}
              onTeamSelect={handleTeamSelect}
              onRoleToggle={handleRoleToggle}
              isLobby={true}
            />
          </div>

          <div className="space-y-4">
            <Card className="p-6 space-y-4">
              <h3 className="font-semibold">Nasıl Oynanır?</h3>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Bir takım seçin</li>
                <li>İpucu Veren veya Tahminci olun</li>
                <li>En az 4 oyuncu gerekli</li>
                <li>Her takımda bir İpucu Veren olmalı</li>
              </ul>
            </Card>

            {currentPlayer?.isRoomOwner && (
              <Card className="p-6 space-y-4 bg-accent/5">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Test Botları</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Test için işlevsiz botlar ekle
                </p>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-xs">Katman Koyu</Label>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddBot("dark", "spymaster")}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        data-testid="button-add-bot-dark-spymaster"
                      >
                        İpucu Veren
                      </Button>
                      <Button
                        onClick={() => handleAddBot("dark", "guesser")}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        data-testid="button-add-bot-dark-guesser"
                      >
                        Tahminci
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Katman Açık</Label>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddBot("light", "spymaster")}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        data-testid="button-add-bot-light-spymaster"
                      >
                        İpucu Veren
                      </Button>
                      <Button
                        onClick={() => handleAddBot("light", "guesser")}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        data-testid="button-add-bot-light-guesser"
                      >
                        Tahminci
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Button
              onClick={handleStartGame}
              disabled={!canStartGame}
              className="w-full"
              size="lg"
              data-testid="button-start-game"
            >
              Oyunu Başlat
            </Button>
            
            {!canStartGame && currentPlayer?.isRoomOwner && (
              <p className="text-xs text-center text-muted-foreground">
                Her takımda en az bir İpucu Veren olmalı
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
