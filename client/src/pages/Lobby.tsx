import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { PlayerList } from "@/components/PlayerList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { Copy, Check, Plus, LogIn, Loader2, Bot, Sparkles, Users, Play, ArrowLeft } from "lucide-react";
import type { Team } from "@shared/schema";

export default function Lobby() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isConnected, gameState, playerId, roomCode, error, send } = useWebSocketContext();
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

  const handleRemoveBot = (botId: string) => {
    send("remove_bot", { botId });
  };

  const handleTeamNameChange = (team: Team, name: string) => {
    if (team === "dark" || team === "light") {
      send("update_team_name", { team, name });
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        {/* Light Effects */}
        <div className="light-effect light-1" />
        <div className="light-effect light-2" />
        <div className="light-effect light-3" />
        <div className="light-effect light-4" />
        <div className="light-effect light-5" />
        
        {[...Array(70)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
        <Card className="p-12 space-y-6 text-center border-2 shadow-2xl bg-slate-900/90 backdrop-blur-md border-orange-900/30 animate-pulse-slow">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">Bağlanıyor</p>
            <p className="text-sm text-muted-foreground">Sunucuya bağlanılıyor...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!roomCode && mode === "select") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        {/* Light Effects */}
        <div className="light-effect light-1" />
        <div className="light-effect light-2" />
        <div className="light-effect light-3" />
        <div className="light-effect light-4" />
        <div className="light-effect light-5" />
        
        {[...Array(70)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
        <div className="w-full max-w-lg space-y-8 animate-in fade-in duration-500">
          <div className="space-y-4">
            <Card 
              className="group p-8 space-y-4 hover-elevate cursor-pointer transition-all border-2 bg-slate-900/85 backdrop-blur-md border-orange-900/30 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/20 relative overflow-hidden" 
              onClick={handleCreateRoom}
              data-testid="button-create-room"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 shadow-lg group-hover:scale-110 transition-transform">
                  <Plus className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-2xl">Oda Oluştur</h3>
                    <Sparkles className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-muted-foreground mt-1">Yeni bir oyun başlat ve arkadaşlarını bekle</p>
                </div>
              </div>
            </Card>

            <Card 
              className="group p-8 space-y-4 hover-elevate cursor-pointer transition-all border-2 bg-slate-900/85 backdrop-blur-md border-orange-900/30 hover:border-red-600/50 hover:shadow-2xl hover:shadow-red-600/20 relative overflow-hidden" 
              onClick={() => setMode("join")}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative flex items-center gap-6">
                <div className="p-4 rounded-xl bg-gradient-to-br from-red-700 to-red-500 shadow-lg group-hover:scale-110 transition-transform">
                  <LogIn className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-2xl">Odaya Katıl</h3>
                    <Users className="w-5 h-5 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-muted-foreground mt-1">Oda kodu ile arkadaşının oyununa gir</p>
                </div>
              </div>
            </Card>
          </div>

          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="w-full group"
            data-testid="button-back"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Geri Dön
          </Button>
        </div>
      </div>
    );
  }

  if (!roomCode && mode === "join") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        {/* Light Effects */}
        <div className="light-effect light-1" />
        <div className="light-effect light-2" />
        <div className="light-effect light-3" />
        <div className="light-effect light-4" />
        <div className="light-effect light-5" />
        
        {[...Array(70)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
        <div className="w-full max-w-md space-y-8 animate-in fade-in duration-500">
          <Card className="p-8 space-y-6 shadow-2xl border-2 bg-slate-900/90 backdrop-blur-md border-orange-900/30 hover:shadow-red-600/20 transition-shadow">
            <div className="space-y-3 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-red-700 to-red-500 flex items-center justify-center shadow-lg">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Odaya Katıl</h2>
              <p className="text-sm text-muted-foreground">
                Arkadaşının sana verdiği oda kodunu gir
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomCode" className="text-sm font-semibold">Oda Kodu</Label>
                <Input
                  id="roomCode"
                  data-testid="input-room-code"
                  placeholder="ABCD12"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  maxLength={6}
                  className="text-center text-2xl font-mono tracking-widest h-14 border-2 focus:border-red-600 transition-colors"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setMode("select")}
                className="flex-1"
                data-testid="button-back"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Geri
              </Button>
              <Button
                onClick={handleJoinRoom}
                disabled={joinCode.length < 4}
                className="flex-1 bg-gradient-to-r from-red-700 to-red-500 hover:from-red-800 hover:to-red-600"
                data-testid="button-join-room"
              >
                Katıl
                <LogIn className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 relative overflow-hidden" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        {/* Light Effects */}
        <div className="light-effect light-1" />
        <div className="light-effect light-2" />
        <div className="light-effect light-3" />
        <div className="light-effect light-4" />
        <div className="light-effect light-5" />
        
        {[...Array(70)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1}`} />
        ))}
        <Card className="p-12 space-y-6 text-center border-2 shadow-2xl bg-slate-900/90 backdrop-blur-md border-orange-900/30">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <p className="text-lg font-semibold text-muted-foreground">Yükleniyor...</p>
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

  const playerCount = gameState.players.length;

  return (
    <div className="h-screen p-2 sm:p-4 bg-slate-900 animate-in fade-in duration-500 relative overflow-hidden flex flex-col" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Light Effects - Reduced for performance */}
      <div className="light-effect light-1" />
      <div className="light-effect light-2" />
      
      {/* Fewer particles for better performance */}
      {[...Array(15)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col h-full">
        {/* Room Code Card - Compact Design */}
        <Card className="p-3 sm:p-4 border-2 shadow-xl bg-slate-900/85 backdrop-blur-md border-orange-900/30 mb-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <h2 className="text-lg sm:text-xl font-bold">Oyun Lobisi</h2>
              <span className="text-xs sm:text-sm text-muted-foreground">
                ({playerCount} oyuncu)
              </span>
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right">
                <div className="text-[10px] sm:text-xs font-semibold text-muted-foreground">ODA KODU</div>
                <div className="text-xl sm:text-2xl font-mono font-black tracking-wider bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent" data-testid="room-code">
                  {roomCode}
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyRoomCode}
                className="h-10 w-10 border-2 hover:border-primary hover:bg-primary/10 transition-all"
                data-testid="button-copy-code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Content Area - Flex Layout */}
        <div className="flex flex-col lg:flex-row gap-3 flex-1 min-h-0">
          {/* Main Player Area */}
          <div className="flex-1 lg:max-w-[60%] flex flex-col">
            <PlayerList
              players={gameState.players}
              currentPlayerId={playerId}
              onTeamSelect={handleTeamSelect}
              onRoleToggle={handleRoleToggle}
              isLobby={true}
              darkTeamName={gameState.darkTeamName}
              lightTeamName={gameState.lightTeamName}
              onTeamNameChange={handleTeamNameChange}
              onRemoveBot={handleRemoveBot}
            />
          </div>

          {/* Sidebar */}
          <div className="lg:w-[40%] flex flex-col gap-3 pt-[26px]">

            {/* Start Game and Controls */}
            <Card className="p-3 sm:p-4 border-2 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
              <Button
                onClick={handleStartGame}
                disabled={!canStartGame}
                className="w-full h-12 text-base font-bold bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-700 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group mb-3"
                size="lg"
                data-testid="button-start-game"
              >
                <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Oyunu Başlat
              </Button>
              
              {!canStartGame && currentPlayer?.isRoomOwner && (
                <div className="text-xs text-center text-amber-600 font-medium mb-3">
                  ⚠️ Her takımda en az bir İstihbarat Şefi olmalı
                </div>
              )}

              {/* Compact How to Play */}
              <div className="border-t pt-3 space-y-2">
                <h3 className="text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  Nasıl Oynanır?
                </h3>
                <ul className="text-[10px] sm:text-xs space-y-1 text-muted-foreground">
                  <li>1. Takım seçin</li>
                  <li>2. Rol seçin (İstihbarat Şefi / Ajan)</li>
                  <li>3. Her takımda en az bir İstihbarat Şefi olmalı</li>
                  <li>4. Oyunu başlatın!</li>
                </ul>
              </div>
            </Card>

            {/* Bot Controls - Compact */}
            {currentPlayer?.isRoomOwner && (
              <Card className="p-3 sm:p-4 space-y-2 border-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-amber-600" />
                  <h3 className="text-sm font-bold">Test Botları</h3>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[10px] font-semibold flex items-center gap-1 mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      {gameState.darkTeamName}
                    </Label>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleAddBot("dark", "spymaster")}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] px-1 h-7"
                        data-testid="button-add-bot-dark-spymaster"
                      >
                        +Şef
                      </Button>
                      <Button
                        onClick={() => handleAddBot("dark", "guesser")}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] px-1 h-7"
                        data-testid="button-add-bot-dark-guesser"
                      >
                        +Ajan
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-[10px] font-semibold flex items-center gap-1 mb-1">
                      <div className="w-2 h-2 rounded-full bg-red-600" />
                      {gameState.lightTeamName}
                    </Label>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => handleAddBot("light", "spymaster")}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] px-1 h-7"
                        data-testid="button-add-bot-light-spymaster"
                      >
                        +Şef
                      </Button>
                      <Button
                        onClick={() => handleAddBot("light", "guesser")}
                        variant="outline"
                        size="sm"
                        className="flex-1 text-[10px] px-1 h-7"
                        data-testid="button-add-bot-light-guesser"
                      >
                        +Ajan
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
