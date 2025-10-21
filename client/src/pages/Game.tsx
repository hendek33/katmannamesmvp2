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
import { Send, Copy, Check, Loader2, Users, Clock, Target, ArrowLeft, Lightbulb, Eye, EyeOff, RotateCcw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Lobby from "./Lobby";

export default function Game() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isConnected, gameState, playerId, roomCode, error, send } = useWebSocketContext();
  const [clueWord, setClueWord] = useState("");
  const [clueCount, setClueCount] = useState("1");
  const [copied, setCopied] = useState(false);
  const [showRoomCode, setShowRoomCode] = useState(false);

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
  const canRevealCard = !isSpymaster && isCurrentTurn;

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
        {/* Modern Header */}
        <Card className="p-1 md:p-1.5 border-2 shadow-2xl bg-slate-900/85 backdrop-blur-md border-orange-900/30 hover:shadow-primary/20 transition-all flex-shrink-0">
          <div className="grid grid-cols-3 items-center gap-2">
            {/* Left Side - Room Code & Players */}
            <div className="flex items-center gap-1">
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
              
              {/* Players Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 border-2 hover:border-blue-500 hover:bg-blue-500/10"
                  >
                    <Users className="w-3 h-3 mr-1" />
                    Oyuncular ({gameState.players.length})
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-900/95 border-2 border-orange-900/30 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                      Oyuncular & İzleyiciler
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
            </div>
            
            {/* Center - Game Status */}
            <div className="flex justify-center">
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
            
            {/* Right Side - Actions */}
            <div className="flex items-center gap-1 justify-end">
              {currentPlayer?.isRoomOwner && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRestart}
                  data-testid="button-restart"
                  className="h-7 border-2 hover:border-amber-500 hover:bg-amber-500/10"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Yenile
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  send("leave_room", {});
                  localStorage.removeItem("katmannames_room_code");
                  localStorage.removeItem("katmannames_player_id");
                  setLocation("/rooms");
                }}
                className="h-7 border-2 hover:border-red-600 hover:bg-red-600/10"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Oyundan Çık
              </Button>
            </div>
          </div>
        </Card>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(150px,15vw)_1fr_minmax(200px,18vw)] xl:grid-cols-[minmax(180px,14vw)_1fr_minmax(220px,16vw)] 2xl:grid-cols-[minmax(200px,12vw)_1fr_minmax(250px,15vw)] gap-2 flex-1 min-h-0">
          {/* Left Side - Dark Team */}
          <div className="hidden lg:flex lg:flex-col lg:gap-2 h-full min-h-0">
            {/* Score Card */}
            <Card className="p-1 lg:p-2 xl:p-3 border-2 shadow-2xl bg-gradient-to-br from-blue-950/95 to-blue-900/95 border-blue-700/50 hover:shadow-blue-500/30 transition-all group flex-shrink-0">
              <div className="text-center space-y-0.5 lg:space-y-1">
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
              </div>
            </Card>
            
            {/* Players Card */}
            <Card className="p-2 lg:p-3 xl:p-4 border-2 bg-blue-950/80 border-blue-800/30 backdrop-blur-sm shadow-xl flex-shrink-0">
              <div className="flex items-center gap-1 lg:gap-2 mb-2 lg:mb-3 xl:mb-4">
                <Users className="w-3 h-3 lg:w-4 lg:h-4 text-blue-400" />
                <h4 className="text-[10px] lg:text-xs xl:text-sm font-bold text-blue-100 uppercase tracking-wide">Oyuncular</h4>
              </div>
              <div className="space-y-1 lg:space-y-1.5 xl:space-y-2">
                {darkPlayers.map(player => (
                  <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-1 lg:p-1.5 xl:p-2 rounded-lg transition-all ${
                      player.id === playerId 
                        ? "bg-blue-600/30 border border-blue-500/50" 
                        : "bg-blue-900/20 hover:bg-blue-900/40"
                    }`}
                  >
                    <span className={`text-[9px] lg:text-[11px] xl:text-sm ${player.id === playerId ? "font-bold text-blue-100" : "text-blue-200/90"}`}>
                      {player.username}
                    </span>
                    <span className={`text-[8px] lg:text-[10px] xl:text-xs px-1 lg:px-1.5 xl:px-2 py-0.5 lg:py-1 rounded ${
                      player.role === "spymaster" 
                        ? "bg-amber-500/20 text-amber-300 font-semibold" 
                        : "bg-blue-500/20 text-blue-300"
                    }`}>
                      {player.role === "spymaster" ? (
                        <span className="flex items-center gap-0.5 lg:gap-1">
                          <Eye className="w-2 h-2 lg:w-3 lg:h-3" />
                          İpucu
                        </span>
                      ) : (
                        "Tahminci"
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Center - Grid */}
          <div className="flex flex-col min-h-0 flex-1 gap-1 items-center justify-start p-1 lg:p-2 pb-0 relative pt-4">
            {/* Mobile Score Display */}
            <div className="lg:hidden w-full flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <Card className="p-1.5 border-2 bg-gradient-to-br from-blue-950/90 to-blue-900/90 border-blue-700/50">
                  <div className="text-center">
                    <div className="text-[10px] font-bold text-blue-100">{gameState.darkTeamName}</div>
                    <div className="text-xl font-black text-blue-100">{gameState.darkCardsRemaining}</div>
                    {gameState.currentTeam === "dark" && (
                      <div className="text-[9px] text-blue-100 font-bold">● SIRA</div>
                    )}
                  </div>
                </Card>
                <Card className="p-1.5 border-2 bg-gradient-to-br from-red-950/90 to-red-900/90 border-red-800/50">
                  <div className="text-center">
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
                <GameCard
                  key={`pos-${index}`}
                  card={card}
                  onReveal={() => handleRevealCard(card.id)}
                  isSpymaster={isSpymaster}
                  disabled={!canRevealCard}
                />
              ))}
            </div>

            {/* Clue Input/Display - Overlay at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center p-0 z-10">
              {canGiveClue ? (
                <Card className="px-2 py-2 sm:px-4 sm:py-3 border-2 bg-slate-950/95 border-amber-500/60 shadow-2xl backdrop-blur-lg">
                  <div className="space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                      <Lightbulb className="w-3 h-3 sm:w-4 sm:h-4 text-amber-400" />
                      <span className="text-[10px] sm:text-xs font-bold uppercase text-amber-400 tracking-wider">İpucu Ver</span>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <Input
                        data-testid="input-clue-word"
                        placeholder="İpucu kelimesi..."
                        value={clueWord}
                        onChange={(e) => setClueWord(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleGiveClue()}
                        maxLength={20}
                        className="w-full sm:w-40 text-center font-bold text-xs sm:text-sm uppercase bg-slate-900/70 border-2 border-slate-700 focus:border-amber-500 h-8 sm:h-10 text-slate-100 placeholder:text-slate-500"
                      />
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          onClick={() => setClueCount(String(Math.max(0, parseInt(clueCount) - 1)))}
                          className="h-8 sm:h-10 w-8 sm:w-10 p-0 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold"
                        >
                          -
                        </Button>
                        <div className="h-8 sm:h-10 w-12 sm:w-16 flex items-center justify-center bg-slate-900/70 border-2 border-amber-500/60 rounded-md">
                          <span className="text-lg sm:text-xl font-black text-amber-400">{clueCount}</span>
                        </div>
                        <Button
                          type="button"
                          onClick={() => setClueCount(String(Math.min(9, parseInt(clueCount) + 1)))}
                          className="h-8 sm:h-10 w-8 sm:w-10 p-0 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold"
                        >
                          +
                        </Button>
                      </div>
                      <Button
                        onClick={handleGiveClue}
                        disabled={!clueWord.trim() || parseInt(clueCount) < 0}
                        data-testid="button-give-clue"
                        size="sm"
                        className="h-8 sm:h-10 px-3 sm:px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg text-xs sm:text-sm"
                      >
                        <Send className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                        Gönder
                      </Button>
                    </div>
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
            {/* Score Card */}
            <Card className="p-1 lg:p-2 xl:p-3 border-2 shadow-2xl bg-gradient-to-br from-red-950/95 to-red-950/95 border-red-800/50 hover:shadow-red-600/30 transition-all group flex-shrink-0">
              <div className="text-center space-y-0.5 lg:space-y-1">
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
              </div>
            </Card>
            
            {/* Players Card */}
            <Card className="p-2 lg:p-3 xl:p-4 border-2 bg-red-950/80 border-red-900/30 backdrop-blur-sm shadow-xl flex-shrink-0">
              <div className="flex items-center gap-1 lg:gap-2 mb-2 lg:mb-3 xl:mb-4">
                <Users className="w-3 h-3 lg:w-4 lg:h-4 text-red-500" />
                <h4 className="text-[10px] lg:text-xs xl:text-sm font-bold text-red-100 uppercase tracking-wide">Oyuncular</h4>
              </div>
              <div className="space-y-1 lg:space-y-1.5 xl:space-y-2">
                {lightPlayers.map(player => (
                  <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-1 lg:p-1.5 xl:p-2 rounded-lg transition-all ${
                      player.id === playerId 
                        ? "bg-red-700/30 border border-red-600/50" 
                        : "bg-red-950/20 hover:bg-red-950/40"
                    }`}
                  >
                    <span className={`text-[9px] lg:text-[11px] xl:text-sm ${player.id === playerId ? "font-bold text-red-100" : "text-red-200/90"}`}>
                      {player.username}
                    </span>
                    <span className={`text-[8px] lg:text-[10px] xl:text-xs px-1 lg:px-1.5 xl:px-2 py-0.5 lg:py-1 rounded ${
                      player.role === "spymaster" 
                        ? "bg-amber-500/20 text-amber-300 font-semibold" 
                        : "bg-red-600/20 text-red-400"
                    }`}>
                      {player.role === "spymaster" ? (
                        <span className="flex items-center gap-0.5 lg:gap-1">
                          <Eye className="w-2 h-2 lg:w-3 lg:h-3" />
                          İpucu
                        </span>
                      ) : (
                        "Tahminci"
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Game Log Card */}
            <Card className="p-2 lg:p-3 xl:p-4 2xl:p-5 border-2 bg-gradient-to-br from-slate-900/95 to-slate-800/95 border-amber-700/50 backdrop-blur-md shadow-xl flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center gap-1 lg:gap-2 mb-2 lg:mb-3 xl:mb-4">
                <Clock className="w-3 h-3 lg:w-4 lg:h-4 text-amber-400" />
                <h4 className="text-[10px] lg:text-xs xl:text-sm font-bold text-amber-300 uppercase tracking-wide">Oyun Günlüğü</h4>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0 space-y-1 lg:space-y-1.5">
                {/* Show game events in chronological order */}
                {gameState.revealHistory.length === 0 && !gameState.currentClue ? (
                  <div className="text-[9px] lg:text-[10px] xl:text-xs text-gray-500 italic p-2">
                    Henüz hamle yapılmadı...
                  </div>
                ) : (
                  <>
                    {/* Current clue if exists */}
                    {gameState.currentClue && (
                      <div className="p-1.5 lg:p-2 bg-amber-600/20 rounded border border-amber-500/30">
                        <div className="flex items-start gap-1 lg:gap-2">
                          <Lightbulb className="w-3 h-3 text-amber-400 mt-0.5" />
                          <div className="flex-1">
                            <div className="text-[8px] lg:text-[9px] xl:text-[10px] text-amber-300">
                              {gameState.currentTeam === "dark" ? 
                                `${gameState.darkTeamName} İpucu Verdi` : 
                                `${gameState.lightTeamName} İpucu Verdi`}
                            </div>
                            <div className="text-[10px] lg:text-xs xl:text-sm font-bold text-amber-100">
                              "{gameState.currentClue.word}" - {gameState.currentClue.count} kelime
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Reveal history with better formatting */}
                    {gameState.revealHistory.slice().reverse().map((entry: any, idx) => {
                      const isCorrect = entry.type === entry.team || 
                                      (entry.type === "dark" && entry.team === "dark") ||
                                      (entry.type === "light" && entry.team === "light");
                      const isNeutral = entry.type === "neutral";
                      const isAssassin = entry.type === "assassin";
                      
                      // Get player name from entry if available, fallback to team name
                      const playerName = entry.playerUsername || 
                        (entry.team === "dark" ? gameState.darkTeamName : gameState.lightTeamName);
                      
                      return (
                        <div 
                          key={idx} 
                          className={`p-1.5 lg:p-2 rounded border ${
                            isAssassin ? "bg-red-900/30 border-red-700/50" :
                            isNeutral ? "bg-gray-800/30 border-gray-700/30" :
                            isCorrect ? "bg-green-900/20 border-green-700/30" :
                            "bg-orange-900/20 border-orange-700/30"
                          }`}
                        >
                          <div className="flex items-start gap-1 lg:gap-2">
                            <div className={`w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-full mt-0.5 ${
                              entry.type === "dark" ? "bg-blue-500" :
                              entry.type === "light" ? "bg-red-500" :
                              entry.type === "neutral" ? "bg-gray-400" :
                              "bg-red-700"
                            }`} />
                            <div className="flex-1">
                              <div className="text-[8px] lg:text-[9px] xl:text-[10px] text-gray-400">
                                <span className="font-semibold text-gray-300">{playerName}</span> tahmin etti
                              </div>
                              <div className="text-[10px] lg:text-xs xl:text-sm font-semibold text-gray-200">
                                "{entry.word}" kelimesine bastı
                              </div>
                              <div className="text-[8px] lg:text-[9px] xl:text-[10px] mt-0.5">
                                {isAssassin ? (
                                  <span className="text-red-400 font-bold">❌ Suikastçı! Oyun bitti!</span>
                                ) : isNeutral ? (
                                  <span className="text-gray-400">➖ Tarafsız kart, tur sona erdi</span>
                                ) : isCorrect ? (
                                  <span className="text-green-400">✓ Doğru tahmin!</span>
                                ) : (
                                  <span className="text-orange-400">✗ Yanlış tahmin, tur değişti</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
              
              {/* Quick stats at bottom */}
              <div className="mt-2 lg:mt-3 pt-2 lg:pt-3 border-t border-slate-700/50">
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-[8px] lg:text-[9px] text-gray-500">Açılan</div>
                    <div className="text-[10px] lg:text-xs font-bold text-gray-300">{gameState.revealHistory.length}/25</div>
                  </div>
                  <div>
                    <div className="text-[8px] lg:text-[9px] text-gray-500">Koyu</div>
                    <div className="text-[10px] lg:text-xs font-bold text-blue-400">{gameState.darkCardsRemaining}</div>
                  </div>
                  <div>
                    <div className="text-[8px] lg:text-[9px] text-gray-500">Açık</div>
                    <div className="text-[10px] lg:text-xs font-bold text-red-400">{gameState.lightCardsRemaining}</div>
                  </div>
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
