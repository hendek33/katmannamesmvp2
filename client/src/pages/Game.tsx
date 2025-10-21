import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { GameCard } from "@/components/GameCard";
import { GameStatus } from "@/components/GameStatus";
import { ClueDisplay } from "@/components/ClueDisplay";
import { PlayerList } from "@/components/PlayerList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { Send, Copy, Check, Loader2, Users, Clock, Target, ArrowLeft, Lightbulb, Eye, EyeOff, RotateCcw, Settings } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Lobby from "./Lobby";

export default function Game() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isConnected, gameState, playerId, roomCode, error, send, cardVotes, cardImages } = useWebSocketContext();
  const [clueWord, setClueWord] = useState("");
  const [clueCount, setClueCount] = useState("1");
  const [copied, setCopied] = useState(false);
  const [showRoomCode, setShowRoomCode] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

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
    if (gameState?.phase === "ended") {
      setLocation("/end");
    }
  }, [gameState, setLocation]);

  // Auto-scroll to bottom when new log entries are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gameState?.revealHistory, gameState?.currentClue]);

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

  const handleGiveClue = () => {
    const count = parseInt(clueCount);
    if (clueWord.trim() && count >= 0 && count <= 9) {
      send("give_clue", { word: clueWord.trim(), count });
      setClueWord("");
      setClueCount("1");
    }
  };

  const handleRevealCard = (cardId: number) => {
    send("reveal_card", { cardId });
  };

  const handleVoteCard = (cardId: number) => {
    send("vote_card", { cardId });
  };

  const handleRestart = () => {
    send("restart_game", {});
  };

  useEffect(() => {
    if (!gameState && isConnected) {
      setLocation("/rooms");
    }
  }, [gameState, isConnected, setLocation]);

  if (!isConnected || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900">
        <Card className="p-8 space-y-4 text-center border-2 shadow-2xl bg-slate-900/90 backdrop-blur-sm border-orange-900/30">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <p className="text-lg font-semibold text-white">
              {!isConnected ? "Bağlanıyor" : "Yükleniyor"}
            </p>
            <p className="text-sm text-muted-foreground">
              {!isConnected ? "Sunucuya bağlanılıyor..." : "Oyun hazırlanıyor..."}
            </p>
            {error && (
              <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (gameState.phase === "lobby") {
    return <Lobby />;
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-grid-pattern">
        <Card className="p-12 space-y-6 text-center border-2 shadow-2xl">
          <p className="text-lg font-semibold text-muted-foreground">Oyuncu bulunamadı</p>
          <Button onClick={() => setLocation("/")} variant="outline">
            Ana Sayfaya Dön
          </Button>
        </Card>
      </div>
    );
  }

  const isSpymaster = currentPlayer.role === "spymaster";
  const isCurrentTurn = currentPlayer.team === gameState.currentTeam;
  const canGiveClue = isSpymaster && isCurrentTurn && !gameState.currentClue;
  const canRevealCard = !isSpymaster && isCurrentTurn && gameState?.currentClue !== null;

  const darkPlayers = gameState.players.filter(p => p.team === "dark");
  const lightPlayers = gameState.players.filter(p => p.team === "light");

  return (
    <div className="h-screen overflow-hidden bg-slate-900 relative" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Light Effects - reduced for performance */}
      <div className="light-effect light-1" />
      <div className="light-effect light-2" />
      
      {/* Very few particles for better performance */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
      <div className="relative z-10 h-full flex flex-col p-2">
        <div className="w-full flex-1 flex flex-col gap-2 min-h-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex justify-between gap-2 flex-shrink-0 mb-2">
          <Card className="flex-1 px-2 py-1 border-2 shadow-2xl bg-slate-900/85 backdrop-blur-md border-blue-900/30">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <div className="text-[10px] text-muted-foreground">Oda:</div>
                <div className="text-xs font-mono font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                  {showRoomCode ? roomCode : "••••"}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRoomCode(!showRoomCode)}
                  className="h-5 w-5 p-0"
                >
                  {showRoomCode ? (
                    <EyeOff className="w-2.5 h-2.5" />
                  ) : (
                    <Eye className="w-2.5 h-2.5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs">{gameState.players.length}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Desktop Header - Aligned with panels below */}
        <div className="hidden lg:flex lg:justify-between gap-2 flex-shrink-0">
          {/* Left Section - Room Code */}
          <div className="lg:w-[250px] xl:w-[280px] 2xl:w-[320px]">
            <Card className="px-2 py-1 border-2 shadow-2xl bg-slate-900/85 backdrop-blur-md border-blue-900/30 hover:shadow-blue-500/20 transition-all">
            <div className="flex items-center justify-start gap-1 h-full">
              <div className="flex items-center gap-2">
                <div className="text-xs text-muted-foreground">Oda Kodu:</div>
                <div className="text-sm font-mono font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                  {showRoomCode ? roomCode : "••••••"}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRoomCode(!showRoomCode)}
                  className="h-6 w-6 p-0 hover:bg-primary/10"
                >
                  {showRoomCode ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyRoomCode}
                  data-testid="button-copy-code"
                  className="h-7 border-2 hover:border-primary hover:bg-primary/10"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-500" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
          </Card>
          </div>
          
          {/* Center Section - Game Status and Players */}
          <div className="flex-1 flex justify-center">
            <div className="w-[calc(min(70vw,70vh*1.5))] min-[1200px]:w-[calc(min(65vw,72vh*1.5))] min-[1400px]:w-[calc(min(60vw,74vh*1.5))] min-[1600px]:w-[calc(min(55vw,75vh*1.5))] max-w-[1000px]">
              <Card className="w-full px-2 py-1 border-2 shadow-2xl bg-slate-900/85 backdrop-blur-md border-amber-900/30 hover:shadow-amber-500/20 transition-all">
            <div className="flex justify-center items-center gap-1 h-full">
              {/* Players Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2 border hover:border-blue-500 hover:bg-blue-500/10"
                  >
                    <Users className="w-2.5 h-2.5 mr-0.5" />
                    <span className="text-[10px]">{gameState.players.length}</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 border-2 border-orange-900/30 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                      Oyuncular
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {/* Dark Team */}
                    <div>
                      <h3 className="text-sm font-bold text-blue-400 mb-2">{gameState.darkTeamName}</h3>
                      <div className="space-y-1">
                        {darkPlayers.map(player => (
                          <div key={player.id} className="flex items-center justify-between p-2 rounded bg-blue-950/50 border border-blue-800/30">
                            <span className="text-sm text-blue-100">{player.username}</span>
                            <span className="text-xs text-blue-300">{player.role === "spymaster" ? "İpucu Veren" : "Tahminci"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Light Team */}
                    <div>
                      <h3 className="text-sm font-bold text-red-400 mb-2">{gameState.lightTeamName}</h3>
                      <div className="space-y-1">
                        {lightPlayers.map(player => (
                          <div key={player.id} className="flex items-center justify-between p-2 rounded bg-red-950/50 border border-red-800/30">
                            <span className="text-sm text-red-100">{player.username}</span>
                            <span className="text-xs text-red-300">{player.role === "spymaster" ? "İpucu Veren" : "Tahminci"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Spectators */}
                    {gameState.players.filter(p => !p.team).length > 0 && (
                      <div>
                        <h3 className="text-sm font-bold text-gray-400 mb-2">İzleyiciler</h3>
                        <div className="space-y-1">
                          {gameState.players.filter(p => !p.team).map(player => (
                            <div key={player.id} className="flex items-center p-2 rounded bg-slate-800/50 border border-slate-700/30">
                              <span className="text-sm text-gray-300">{player.username}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              {gameState.currentClue ? (
                <div className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-lg border border-amber-500/30">
                  <Lightbulb className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span className="text-xs font-medium text-amber-300">İpucu:</span>
                  <span className="text-xs font-black text-amber-100">{gameState.currentClue.word}</span>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <span className="text-xs font-black text-white">{gameState.currentClue.count}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-3 py-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      gameState.currentTeam === "dark" ? "bg-blue-500" : "bg-red-500"
                    )} />
                    <span className="text-xs font-medium text-slate-300">
                      Sıra: <span className={gameState.currentTeam === "dark" ? "text-blue-400" : "text-red-400"}>
                        {gameState.currentTeam === "dark" ? gameState.darkTeamName : gameState.lightTeamName}
                      </span>
                    </span>
                  </div>
                  <div className="w-px h-4 bg-slate-600" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">Açılan:</span>
                    <span className="text-xs font-bold text-slate-200">{gameState.revealHistory.length}/25</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
          
          {/* Right Section - Actions */}
          <Card className="px-2 py-1 border-2 shadow-2xl bg-slate-900/85 backdrop-blur-md border-red-900/30 hover:shadow-red-500/20 transition-all">
            <div className="flex items-center gap-1 justify-end h-full">
              {currentPlayer?.isRoomOwner && (
                <>
                  {/* Game Settings Dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid="button-settings"
                        className="h-6 px-2 border hover:border-purple-500 hover:bg-purple-500/10"
                      >
                        <Settings className="w-2.5 h-2.5 mr-0.5" />
                        <span className="text-[10px]">Düzenle</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-slate-900/95 border-2 border-orange-900/30 max-w-md">
                      <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          Oyun Ayarları
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Return to Lobby */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-300">Oyun Kontrolü</Label>
                          <Button
                            onClick={() => {
                              send("return_to_lobby", {});
                              toast({
                                title: "Lobiye Dönülüyor",
                                description: "Tüm oyuncular lobiye yönlendiriliyor...",
                              });
                            }}
                            variant="outline"
                            className="w-full border-2 hover:border-orange-500 hover:bg-orange-500/10"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Lobiye Dön
                          </Button>
                        </div>
                        
                        {/* Add Bot */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-300">Bot Ekle</Label>
                          <Button
                            onClick={() => {
                              send("add_bot", {});
                              toast({
                                title: "Bot Eklendi",
                                description: "Yapay zeka oyuncu oyuna katıldı",
                              });
                            }}
                            variant="outline"
                            className="w-full border-2 hover:border-cyan-500 hover:bg-cyan-500/10"
                          >
                            <Users className="w-4 h-4 mr-2" />
                            Bot Oyuncu Ekle
                          </Button>
                        </div>
                        
                        {/* Change Team Names */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-300">Takım İsimleri</Label>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Input
                                id="dark-team-name"
                                placeholder={gameState.darkTeamName}
                                className="flex-1 h-8 text-xs bg-slate-800/50 border-blue-700/50 focus:border-blue-500"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const input = e.target as HTMLInputElement;
                                    if (input.value.trim()) {
                                      send("update_team_name", { team: "dark", name: input.value.trim() });
                                      toast({
                                        title: "İsim Değiştirildi",
                                        description: `Koyu takım ismi: ${input.value.trim()}`,
                                      });
                                      input.value = "";
                                    }
                                  }
                                }}
                              />
                              <Button
                                onClick={() => {
                                  const input = document.getElementById("dark-team-name") as HTMLInputElement;
                                  if (input?.value.trim()) {
                                    send("update_team_name", { team: "dark", name: input.value.trim() });
                                    toast({
                                      title: "İsim Değiştirildi",
                                      description: `Koyu takım ismi: ${input.value.trim()}`,
                                    });
                                    input.value = "";
                                  }
                                }}
                                size="sm"
                                className="h-8 px-3 bg-blue-600 hover:bg-blue-700"
                              >
                                Değiştir
                              </Button>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                id="light-team-name"
                                placeholder={gameState.lightTeamName}
                                className="flex-1 h-8 text-xs bg-slate-800/50 border-red-700/50 focus:border-red-500"
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    const input = e.target as HTMLInputElement;
                                    if (input.value.trim()) {
                                      send("update_team_name", { team: "light", name: input.value.trim() });
                                      toast({
                                        title: "İsim Değiştirildi",
                                        description: `Açık takım ismi: ${input.value.trim()}`,
                                      });
                                      input.value = "";
                                    }
                                  }
                                }}
                              />
                              <Button
                                onClick={() => {
                                  const input = document.getElementById("light-team-name") as HTMLInputElement;
                                  if (input?.value.trim()) {
                                    send("update_team_name", { team: "light", name: input.value.trim() });
                                    toast({
                                      title: "İsim Değiştirildi",
                                      description: `Açık takım ismi: ${input.value.trim()}`,
                                    });
                                    input.value = "";
                                  }
                                }}
                                size="sm"
                                className="h-8 px-3 bg-red-600 hover:bg-red-700"
                              >
                                Değiştir
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Info */}
                        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                          <p className="text-xs text-slate-400">
                            Sadece oda sahibi bu ayarları değiştirebilir. Değişiklikler anında tüm oyunculara yansıtılır.
                          </p>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRestart}
                    data-testid="button-restart"
                    className="h-6 px-2 border hover:border-amber-500 hover:bg-amber-500/10"
                  >
                    <RotateCcw className="w-2.5 h-2.5 mr-0.5" />
                    <span className="text-[10px]">Yenile</span>
                  </Button>
                </>
              )}
              {/* Team/Role Change Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid="button-change-team"
                    className="h-6 px-2 border hover:border-green-500 hover:bg-green-500/10"
                  >
                    <Users className="w-2.5 h-2.5 mr-0.5" />
                    <span className="text-[10px]">Takım</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 border-2 border-orange-900/30 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                      Takım ve Rol Değiştir
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Team Selection */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-300">Takım Seç</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => {
                            send("select_team", { team: "dark" });
                            toast({
                              title: "Takım Değiştirildi",
                              description: `${gameState.darkTeamName} takımına katıldınız`,
                            });
                          }}
                          variant={currentPlayer?.team === "dark" ? "default" : "outline"}
                          className={cn(
                            "border-2",
                            currentPlayer?.team === "dark"
                              ? "bg-blue-600 hover:bg-blue-700 border-blue-500"
                              : "hover:border-blue-500 hover:bg-blue-500/10"
                          )}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold">{gameState.darkTeamName}</span>
                            <span className="text-xs opacity-80">({darkPlayers.length} oyuncu)</span>
                          </div>
                        </Button>
                        <Button
                          onClick={() => {
                            send("select_team", { team: "light" });
                            toast({
                              title: "Takım Değiştirildi",
                              description: `${gameState.lightTeamName} takımına katıldınız`,
                            });
                          }}
                          variant={currentPlayer?.team === "light" ? "default" : "outline"}
                          className={cn(
                            "border-2",
                            currentPlayer?.team === "light"
                              ? "bg-red-600 hover:bg-red-700 border-red-500"
                              : "hover:border-red-500 hover:bg-red-500/10"
                          )}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold">{gameState.lightTeamName}</span>
                            <span className="text-xs opacity-80">({lightPlayers.length} oyuncu)</span>
                          </div>
                        </Button>
                      </div>
                    </div>
                    
                    {/* Role Selection */}
                    {currentPlayer?.team && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-300">Rol Seç</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            onClick={() => {
                              send("select_role", { role: "guesser" });
                              toast({
                                title: "Rol Değiştirildi",
                                description: "Tahminci rolünü aldınız",
                              });
                            }}
                            variant={currentPlayer?.role === "guesser" ? "default" : "outline"}
                            className={cn(
                              "border-2",
                              currentPlayer?.role === "guesser"
                                ? "bg-green-600 hover:bg-green-700 border-green-500"
                                : "hover:border-green-500 hover:bg-green-500/10"
                            )}
                          >
                            <Target className="w-4 h-4 mr-2" />
                            Tahminci
                          </Button>
                          <Button
                            onClick={() => {
                              send("select_role", { role: "spymaster" });
                              toast({
                                title: "Rol Değiştirildi",
                                description: "İpucu veren rolünü aldınız",
                              });
                            }}
                            variant={currentPlayer?.role === "spymaster" ? "default" : "outline"}
                            className={cn(
                              "border-2",
                              currentPlayer?.role === "spymaster"
                                ? "bg-amber-600 hover:bg-amber-700 border-amber-500"
                                : "hover:border-amber-500 hover:bg-amber-500/10"
                            )}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            İpucu Veren
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {/* Current Status */}
                    <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <div className="text-xs text-slate-400 space-y-1">
                        <div>Mevcut Takım: <span className={cn(
                          "font-bold",
                          currentPlayer?.team === "dark" ? "text-blue-400" : currentPlayer?.team === "light" ? "text-red-400" : "text-gray-400"
                        )}>
                          {currentPlayer?.team === "dark" ? gameState.darkTeamName :
                           currentPlayer?.team === "light" ? gameState.lightTeamName : "Seçilmedi"}
                        </span></div>
                        <div>Mevcut Rol: <span className="font-bold text-green-400">
                          {currentPlayer?.role === "spymaster" ? "İpucu Veren" :
                           currentPlayer?.role === "guesser" ? "Tahminci" : "Seçilmedi"}
                        </span></div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  send("leave_room", {});
                  localStorage.removeItem("katmannames_room_code");
                  localStorage.removeItem("katmannames_player_id");
                  setLocation("/rooms");
                }}
                className="h-6 px-2 border hover:border-red-600 hover:bg-red-600/10"
              >
                <ArrowLeft className="w-2.5 h-2.5 mr-0.5" />
                <span className="text-[10px]">Çık</span>
              </Button>
            </div>
          </Card>
            </div>
          </div>

          {/* Right Section - Controls */}
          <div className="lg:w-[250px] xl:w-[280px] 2xl:w-[320px]">
            <Card className="px-2 py-1 border-2 shadow-2xl bg-slate-900/85 backdrop-blur-md border-red-900/30 hover:shadow-red-500/20 transition-all">
              <div className="flex items-center justify-end gap-1 h-full">
                {currentPlayer?.isRoomOwner && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        send("restart_game", {});
                        toast({
                          title: "Oyun Yenilendi",
                          description: "Yeni kelimeler atandı",
                        });
                      }}
                      data-testid="button-restart"
                      className="h-6 px-2 border hover:border-amber-500 hover:bg-amber-500/10"
                    >
                      <RotateCcw className="w-2.5 h-2.5 mr-0.5" />
                      <span className="text-[10px]">Yenile</span>
                    </Button>
                  </>
                )}
                {/* Team/Role Change Dialog - duplicate from center for consistency */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid="button-change-team"
                      className="h-6 px-2 border hover:border-green-500 hover:bg-green-500/10"
                    >
                      <Users className="w-2.5 h-2.5 mr-0.5" />
                      <span className="text-[10px]">Takım</span>
                    </Button>
                  </DialogTrigger>
                </Dialog>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    send("leave_room", {});
                    localStorage.removeItem("katmannames_room_code");
                    localStorage.removeItem("katmannames_player_id");
                    setLocation("/rooms");
                  }}
                  className="h-6 px-2 border hover:border-red-600 hover:bg-red-600/10"
                >
                  <ArrowLeft className="w-2.5 h-2.5 mr-0.5" />
                  <span className="text-[10px]">Çık</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(250px,20vw)_1fr_minmax(250px,20vw)] xl:grid-cols-[minmax(280px,18vw)_1fr_minmax(280px,18vw)] 2xl:grid-cols-[minmax(320px,16vw)_1fr_minmax(320px,16vw)] gap-2 flex-1 min-h-0">
          {/* Left Side - Dark Team */}
          <div className="hidden lg:flex lg:flex-col lg:gap-2 h-full min-h-0">
            {/* Score & Players Card Combined */}
            <Card 
              className="p-1 lg:p-2 xl:p-3 border-2 shadow-2xl border-blue-700/50 hover:shadow-blue-500/30 transition-all group relative overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(to bottom right, rgba(23, 37, 84, 0.7), rgba(30, 58, 138, 0.7)), url('/mavi takım.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="text-center space-y-0.5 lg:space-y-1 relative z-10">
                <div className="flex items-center justify-center gap-0.5 lg:gap-1">
                  <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-blue-600 animate-pulse" />
                  <h3 className="text-[8px] lg:text-[10px] xl:text-xs font-bold text-blue-100 uppercase tracking-wider">{gameState.darkTeamName}</h3>
                </div>
                <div className="relative">
                  <div className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black text-blue-100 group-hover:scale-110 transition-transform">
                    {gameState.darkCardsRemaining}
                  </div>
                  <div className="absolute inset-0 blur-2xl bg-blue-500/20 group-hover:bg-blue-500/40 transition-all" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] lg:text-[10px] xl:text-xs text-blue-200/80 font-semibold uppercase">Kalan Kart</p>
                </div>
                {/* Player List - Separated by Role */}
                <div className="mt-2 pt-2 border-t border-blue-700/30 space-y-1">
                  {/* Spymaster */}
                  {darkPlayers.filter(p => p.role === "spymaster").length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {darkPlayers.filter(p => p.role === "spymaster").map(player => (
                        <div key={player.id} className="text-[9px] lg:text-[10px] xl:text-xs text-amber-300 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-amber-400" />
                          <span className={player.id === playerId ? "font-bold" : ""}>
                            {player.username}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Guessers */}
                  {darkPlayers.filter(p => p.role === "guesser").length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {darkPlayers.filter(p => p.role === "guesser").map((player, idx, arr) => (
                        <div key={player.id} className="text-[9px] lg:text-[10px] xl:text-xs text-blue-200/80 flex items-center">
                          <span className={player.id === playerId ? "font-bold text-blue-100" : ""}>
                            {player.username}
                          </span>
                          {idx < arr.length - 1 && <span className="text-blue-500/50 ml-2">•</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Center - Grid */}
          <div className="flex flex-col min-h-0 flex-1 gap-1 items-center justify-start p-1 lg:p-2 pb-0 relative pt-4">
            {/* Mobile Score Display */}
            <div className="lg:hidden w-full flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <Card 
                  className="p-1.5 border-2 border-blue-700/50 relative overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, rgba(23, 37, 84, 0.6), rgba(30, 58, 138, 0.6)), url('/mavi takım.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="text-center relative z-10">
                    <div className="text-[10px] font-bold text-blue-100">{gameState.darkTeamName}</div>
                    <div className="text-xl font-black text-blue-100">{gameState.darkCardsRemaining}</div>
                    {gameState.currentTeam === "dark" && (
                      <div className="text-[9px] text-blue-100 font-bold">● SIRA</div>
                    )}
                  </div>
                </Card>
                <Card 
                  className="p-1.5 border-2 border-red-800/50 relative overflow-hidden"
                  style={{
                    backgroundImage: `linear-gradient(to bottom right, rgba(127, 29, 29, 0.6), rgba(127, 29, 29, 0.6)), url('/kırmızı takım.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="text-center relative z-10">
                    <div className="text-[10px] font-bold text-red-100">{gameState.lightTeamName}</div>
                    <div className="text-xl font-black text-red-100">{gameState.lightCardsRemaining}</div>
                    {gameState.currentTeam === "light" && (
                      <div className="text-[9px] text-red-100 font-bold">● SIRA</div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
            
            <div className="grid grid-cols-5 gap-[1px] min-[400px]:gap-[2px] min-[600px]:gap-[3px] min-[900px]:gap-1 min-[1200px]:gap-1.5 min-[1600px]:gap-2 
                 overflow-visible
                 w-[calc(min(90vw,55vh*1.5))] 
                 min-[360px]:w-[calc(min(85vw,58vh*1.5))]
                 min-[400px]:w-[calc(min(85vw,60vh*1.5))]
                 min-[500px]:w-[calc(min(80vw,62vh*1.5))]
                 min-[600px]:w-[calc(min(80vw,64vh*1.5))]
                 min-[700px]:w-[calc(min(75vw,66vh*1.5))]
                 min-[800px]:w-[calc(min(75vw,68vh*1.5))]
                 min-[900px]:w-[calc(min(70vw,70vh*1.5))]
                 min-[1024px]:w-[calc(min(70vw,70vh*1.5))]
                 min-[1200px]:w-[calc(min(65vw,72vh*1.5))]
                 min-[1400px]:w-[calc(min(60vw,74vh*1.5))]
                 min-[1600px]:w-[calc(min(55vw,75vh*1.5))]
                 max-w-[1000px]
                 mb-14" 
                 data-testid="game-grid">
              {gameState.cards.map((card, index) => (
                <div 
                  key={`wrapper-${index}`}
                  className="animate-card-drop overflow-visible"
                  style={{
                    animationDelay: `${index * 0.05}s`,
                    animationFillMode: 'backwards',
                    overflow: 'visible'
                  }}
                >
                  <GameCard
                    key={`pos-${index}`}
                    card={card}
                    onReveal={() => handleRevealCard(card.id)}
                    onVote={() => handleVoteCard(card.id)}
                    isSpymaster={isSpymaster}
                    disabled={!canRevealCard}
                    voters={cardVotes[card.id] || []}
                    hasVoted={cardVotes[card.id]?.includes(gameState.players.find(p => p.id === playerId)?.username || '')}
                    revealedImage={cardImages[card.id]}
                  />
                </div>
              ))}
            </div>

            {/* Clue Input/Display - Overlay at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center p-0 z-10">
              {/* End Turn Button for Guessers */}
              {!canGiveClue && gameState.currentClue && currentPlayer?.team === gameState.currentTeam && currentPlayer?.role === "guesser" && (
                <Button
                  onClick={() => {
                    send("end_turn", {});
                    toast({
                      title: "Tahmin Tamamlandı",
                      description: "Sıra diğer takıma geçti",
                    });
                  }}
                  className="h-8 sm:h-10 px-4 sm:px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xl text-xs sm:text-sm rounded-lg border-2 border-orange-500"
                >
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
                  Tahmini Bitir
                </Button>
              )}
              {canGiveClue ? (
                <Card className="px-2 py-1 sm:px-3 sm:py-1.5 border-2 bg-slate-950/95 border-amber-500/60 shadow-2xl backdrop-blur-lg">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Lightbulb className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-400" />
                      <span className="text-[9px] sm:text-[10px] font-bold uppercase text-amber-400 tracking-wider">İpucu</span>
                    </div>
                    <Input
                      data-testid="input-clue-word"
                      placeholder="İpucu..."
                      value={clueWord}
                      onChange={(e) => setClueWord(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleGiveClue()}
                      maxLength={20}
                      className="w-20 sm:w-28 text-center font-bold text-[10px] sm:text-xs uppercase bg-slate-900/70 border border-slate-700 focus:border-amber-500 h-6 sm:h-7 text-slate-100 placeholder:text-slate-500"
                    />
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => setClueCount(String(Math.max(0, parseInt(clueCount) - 1)))}
                        className="h-6 sm:h-7 w-6 sm:w-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded border border-slate-700"
                      >
                        -
                      </button>
                      <div className="h-6 sm:h-7 w-8 sm:w-10 flex items-center justify-center bg-slate-900/70 border border-amber-500/60 rounded text-sm font-black text-amber-400">
                        {clueCount}
                      </div>
                      <button
                        type="button"
                        onClick={() => setClueCount(String(Math.min(9, parseInt(clueCount) + 1)))}
                        className="h-6 sm:h-7 w-6 sm:w-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded border border-slate-700"
                      >
                        +
                      </button>
                    </div>
                    <Button
                      onClick={handleGiveClue}
                      disabled={!clueWord.trim() || parseInt(clueCount) < 0}
                      data-testid="button-give-clue"
                      size="sm"
                      className="h-6 sm:h-7 px-2 sm:px-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg text-[10px] sm:text-xs"
                    >
                      <Send className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5" />
                      Gönder
                    </Button>
                  </div>
                </Card>
              ) : gameState.currentClue ? (
                <Card className="px-3 py-1.5 sm:px-4 sm:py-2 border-2 shadow-2xl bg-slate-950/95 border-amber-500/60 backdrop-blur-lg">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-0.5 sm:mb-1">
                      <Lightbulb className="w-3 h-3 text-amber-400" />
                      <span className="text-[9px] sm:text-[10px] font-semibold uppercase text-amber-400 tracking-wider">Aktif İpucu</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg sm:text-xl font-black text-amber-400 uppercase tracking-wider">
                        {gameState.currentClue.word}
                      </span>
                      <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-amber-500 flex items-center justify-center shadow-xl">
                        <span className="text-base sm:text-lg font-black text-white">
                          {gameState.currentClue.count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              ) : null}
            </div>

          </div>

          {/* Right Side - Light Team */}
          <div className="hidden lg:flex lg:flex-col lg:gap-2 h-full min-h-0">
            {/* Score & Players Card Combined */}
            <Card 
              className="p-1 lg:p-2 xl:p-3 border-2 shadow-2xl border-red-800/50 hover:shadow-red-600/30 transition-all group relative overflow-hidden"
              style={{
                backgroundImage: `linear-gradient(to bottom right, rgba(127, 29, 29, 0.7), rgba(127, 29, 29, 0.7)), url('/kırmızı takım.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="text-center space-y-0.5 lg:space-y-1 relative z-10">
                <div className="flex items-center justify-center gap-0.5 lg:gap-1">
                  <div className="w-1 h-1 lg:w-1.5 lg:h-1.5 rounded-full bg-red-600 animate-pulse" />
                  <h3 className="text-[8px] lg:text-[10px] xl:text-xs font-bold text-red-100 uppercase tracking-wider">{gameState.lightTeamName}</h3>
                </div>
                <div className="relative">
                  <div className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black text-red-100 group-hover:scale-110 transition-transform">
                    {gameState.lightCardsRemaining}
                  </div>
                  <div className="absolute inset-0 blur-2xl bg-red-600/20 group-hover:bg-red-600/40 transition-all" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[8px] lg:text-[10px] xl:text-xs text-red-200/80 font-semibold uppercase">Kalan Kart</p>
                </div>
                {/* Player List - Separated by Role */}
                <div className="mt-2 pt-2 border-t border-red-700/30 space-y-1">
                  {/* Spymaster */}
                  {lightPlayers.filter(p => p.role === "spymaster").length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {lightPlayers.filter(p => p.role === "spymaster").map(player => (
                        <div key={player.id} className="text-[9px] lg:text-[10px] xl:text-xs text-amber-300 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-amber-400" />
                          <span className={player.id === playerId ? "font-bold" : ""}>
                            {player.username}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Guessers */}
                  {lightPlayers.filter(p => p.role === "guesser").length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2">
                      {lightPlayers.filter(p => p.role === "guesser").map((player, idx, arr) => (
                        <div key={player.id} className="text-[9px] lg:text-[10px] xl:text-xs text-red-200/80 flex items-center">
                          <span className={player.id === playerId ? "font-bold text-red-100" : ""}>
                            {player.username}
                          </span>
                          {idx < arr.length - 1 && <span className="text-red-500/50 ml-2">•</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Game Log Card */}
            <Card className="p-1.5 lg:p-2 border-2 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-slate-700/70 backdrop-blur-md shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5 xl:w-4 xl:h-4 text-slate-400" />
                <h4 className="text-xs lg:text-sm xl:text-base font-bold text-slate-300 uppercase tracking-wide">Günlük</h4>
              </div>
              <div ref={logContainerRef} className="flex-1 overflow-y-auto min-h-0 space-y-0.5 scroll-smooth">
                {/* Show game events in chronological order */}
                {gameState.revealHistory.length === 0 && !gameState.currentClue ? (
                  <div className="text-[9px] lg:text-[10px] xl:text-xs text-gray-500 italic p-2">
                    Henüz hamle yapılmadı...
                  </div>
                ) : (
                  <>
                    {/* Reveal history grouped by turns with clues */}
                    {(() => {
                      let currentClueKey: string | null = null;
                      const groupedEntries: JSX.Element[] = [];
                      
                      gameState.revealHistory.forEach((entry: any, idx: number) => {
                        // Handle special log types
                        if (entry.type === "end_turn") {
                          // End turn log
                          groupedEntries.push(
                            <div key={`end-turn-${idx}`} className="p-1 rounded text-[10px] bg-gray-800/30 border border-gray-600/50 mb-1 italic">
                              <div className="flex items-center gap-1">
                                <Clock className="w-2.5 h-2.5 text-gray-400" />
                                <span className="text-gray-300">
                                  {entry.playerUsername} turu sonlandırdı
                                </span>
                              </div>
                            </div>
                          );
                          // Add separator after end turn
                          groupedEntries.push(
                            <div key={`sep-after-end-${idx}`} className="my-2 border-t-2 border-amber-600/50"></div>
                          );
                          currentClueKey = null; // Reset for next turn
                          return;
                        }
                        
                        if (entry.type === "team_change") {
                          // Team change log
                          groupedEntries.push(
                            <div key={`team-change-${idx}`} className="p-1 rounded text-[10px] bg-purple-800/20 border border-purple-600/30 mb-1 italic">
                              <div className="flex items-center gap-1">
                                <Users className="w-2.5 h-2.5 text-purple-400" />
                                <span className="text-purple-300">
                                  {entry.playerUsername} takım değiştirdi: 
                                  <span className={entry.fromTeam === "dark" ? "text-blue-400" : "text-red-400"}> {entry.fromTeam === "dark" ? gameState.darkTeamName : gameState.lightTeamName}</span>
                                  <span className="text-gray-400"> → </span>
                                  <span className={entry.toTeam === "dark" ? "text-blue-400" : "text-red-400"}>{entry.toTeam === "dark" ? gameState.darkTeamName : gameState.lightTeamName}</span>
                                </span>
                              </div>
                            </div>
                          );
                          return;
                        }
                        
                        if (entry.type === "role_change") {
                          // Role change log
                          groupedEntries.push(
                            <div key={`role-change-${idx}`} className="p-1 rounded text-[10px] bg-green-800/20 border border-green-600/30 mb-1 italic">
                              <div className="flex items-center gap-1">
                                <Eye className="w-2.5 h-2.5 text-green-400" />
                                <span className="text-green-300">
                                  {entry.playerUsername} rol değiştirdi: 
                                  <span className="text-gray-300"> {entry.fromRole === "spymaster" ? "İpucu Veren" : "Tahminci"}</span>
                                  <span className="text-gray-400"> → </span>
                                  <span className="text-gray-100">{entry.toRole === "spymaster" ? "İpucu Veren" : "Tahminci"}</span>
                                </span>
                              </div>
                            </div>
                          );
                          return;
                        }
                        
                        // Regular card reveal entries
                        const isCorrect = entry.type === entry.team;
                        const isNeutral = entry.type === "neutral";
                        const isAssassin = entry.type === "assassin";
                        
                        // Get player name from entry if available, fallback to team name
                        const playerName = entry.playerUsername || 
                          (entry.team === "dark" ? gameState.darkTeamName : gameState.lightTeamName);
                        
                        // Check if this is a new clue/turn
                        const clueKey = entry.clue ? `${entry.clue.word}-${entry.clue.count}` : 'no-clue';
                        const isNewClue = clueKey !== currentClueKey;
                        
                        if (isNewClue && entry.clue) {
                          currentClueKey = clueKey;
                          
                          // Add turn separator
                          if (idx > 0) {
                            groupedEntries.push(
                              <div key={`sep-${idx}`} className="my-2 border-t-2 border-amber-600/50"></div>
                            );
                          }
                          
                          // Add clue header
                          groupedEntries.push(
                            <div key={`clue-${idx}`} className={`p-1.5 rounded text-[11px] border flex items-center gap-1.5 mb-1 ${
                              entry.team === "dark" ? 
                                "bg-blue-800/40 border-blue-600/50" : 
                                "bg-red-800/40 border-red-600/50"
                            }`}>
                              <Lightbulb className="w-3 h-3 text-amber-400" />
                              <span className="font-bold text-amber-100">
                                {entry.team === "dark" ? gameState.darkTeamName : gameState.lightTeamName} İpucu:
                              </span>
                              <span className="font-bold text-white">
                                {entry.clue.word} ({entry.clue.count})
                              </span>
                            </div>
                          );
                        }
                        
                        // Only add guess entry if it has a word (not special entry types)
                        if (entry.word) {
                          groupedEntries.push(
                            <div key={`entry-${idx}`} className={`p-1.5 rounded text-[11px] border mb-1 ml-2 ${
                              entry.team === "dark" ? 
                                "bg-blue-900/30 border-blue-600/50" : 
                                "bg-red-900/30 border-red-600/50"
                            }`}>
                              <div className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${
                                  entry.team === "dark" ? "bg-blue-500" : "bg-red-500"
                                }`} />
                                <span className="font-semibold text-gray-200">{playerName}</span>
                                <span className="text-gray-400">→</span>
                                <span className={`font-bold ${
                                  entry.type === "dark" ? "text-blue-400" :
                                  entry.type === "light" ? "text-red-400" :
                                  entry.type === "neutral" ? "text-gray-100" :
                                  "text-red-950"
                                }`}>{entry.word}</span>
                                {isAssassin ? (
                                  <span className="text-red-400 ml-auto font-bold">❌ Suikastçı!</span>
                                ) : isNeutral ? (
                                  <span className="text-gray-400 ml-auto">➖ Tarafsız</span>
                                ) : isCorrect ? (
                                  <span className="text-green-400 ml-auto">✓ Doğru</span>
                                ) : (
                                  <span className="text-orange-400 ml-auto">✗ Yanlış</span>
                                )}
                              </div>
                            </div>
                          );
                        }
                      });
                      
                      // Add current clue if exists and no moves yet for this clue
                      const lastEntry = gameState.revealHistory[gameState.revealHistory.length - 1] as any;
                      if (gameState.currentClue && (
                        gameState.revealHistory.length === 0 || 
                        !lastEntry?.clue ||
                        lastEntry.clue.word !== gameState.currentClue.word
                      )) {
                        if (gameState.revealHistory.length > 0) {
                          groupedEntries.push(
                            <div key="sep-current" className="my-2 border-t-2 border-amber-600/50"></div>
                          );
                        }
                        groupedEntries.push(
                          <div key="clue-current" className={`p-1.5 rounded text-[11px] border flex items-center gap-1.5 mb-1 ${
                            gameState.currentTeam === "dark" ? 
                              "bg-blue-800/40 border-blue-600/50" : 
                              "bg-red-800/40 border-red-600/50"
                          }`}>
                            <Lightbulb className="w-3 h-3 text-amber-400" />
                            <span className="font-bold text-amber-100">
                              {gameState.currentTeam === "dark" ? gameState.darkTeamName : gameState.lightTeamName} İpucu:
                            </span>
                            <span className="font-bold text-white">
                              {gameState.currentClue.word} ({gameState.currentClue.count})
                            </span>
                          </div>
                        );
                      }
                      
                      return groupedEntries;
                    })()}
                  </>
                )}
              </div>
              
              {/* Quick stats at bottom */}
              <div className="mt-1 pt-1 border-t border-slate-700/50 flex justify-around text-[9px]">
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Açılan:</span>
                  <span className="font-bold text-gray-300">{gameState.revealHistory.length}/25</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Koyu:</span>
                  <span className="font-bold text-blue-400">{gameState.darkCardsRemaining}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Açık:</span>
                  <span className="font-bold text-red-400">{gameState.lightCardsRemaining}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
