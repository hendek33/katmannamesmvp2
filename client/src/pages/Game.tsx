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
import { RotateCcw, Send, Copy, Check, Loader2, Users, Clock, Target, ArrowLeft, Lightbulb, Eye } from "lucide-react";
import Lobby from "./Lobby";

export default function Game() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isConnected, gameState, playerId, roomCode, error, send } = useWebSocketContext();
  const [clueWord, setClueWord] = useState("");
  const [clueCount, setClueCount] = useState("1");
  const [copied, setCopied] = useState(false);
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Dynamic scaling disabled - using CSS flexbox
  useEffect(() => {
    const calculateScale = () => {
      setScale(1); // Always scale 1
    };

    calculateScale();
    window.addEventListener('resize', calculateScale);
    
    return () => window.removeEventListener('resize', calculateScale);
  }, []);

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <Card className="p-12 space-y-6 text-center border-2 shadow-2xl bg-slate-900/90 backdrop-blur-md border-orange-900/30 animate-pulse-slow">
          <div className="relative">
            <Loader2 className="w-12 h-12 animate-spin mx-auto text-primary" />
            <div className="absolute inset-0 blur-xl bg-primary/20 animate-pulse" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold">
              {!isConnected ? "Bağlanıyor" : "Yükleniyor"}
            </p>
            <p className="text-sm text-muted-foreground">
              {!isConnected ? "Sunucuya bağlanılıyor..." : "Oyun hazırlanıyor..."}
            </p>
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
      {/* Light Effects */}
      <div className="light-effect light-1" />
      <div className="light-effect light-2" />
      <div className="light-effect light-3" />
      <div className="light-effect light-4" />
      <div className="light-effect light-5" />
      
      {[...Array(70)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
      <div 
        ref={containerRef}
        style={{ 
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          width: scale < 1 ? `${100 / scale}%` : '100%',
          marginLeft: scale < 1 ? `${-(100 / scale - 100) / 2}%` : '0',
          height: scale < 1 ? `${100 / scale}%` : '100%',
        }}
        className="relative z-10 p-2 md:p-3 animate-in fade-in duration-500 transition-transform"
      >
        <div className="w-full h-full flex flex-col gap-2 overflow-hidden">
        {/* Modern Header */}
        <Card className="p-1.5 md:p-2 border-2 shadow-2xl bg-slate-900/85 backdrop-blur-md border-orange-900/30 hover:shadow-primary/20 transition-all flex-shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Oda Kodu</div>
                  <div className="text-sm font-mono font-bold bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
                    {roomCode}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopyRoomCode}
                data-testid="button-copy-code"
                className="border-2 hover:border-primary hover:bg-primary/10"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
              {currentPlayer?.isRoomOwner && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRestart}
                  data-testid="button-restart"
                  className="border-2 hover:border-amber-500 hover:bg-amber-500/10"
                >
                  <RotateCcw className="w-4 h-4 mr-1" />
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
                className="border-2 hover:border-red-600 hover:bg-red-600/10"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Oyundan Çık
              </Button>
            </div>
          </div>
        </Card>

        {/* Status Banner */}
        <div className="relative overflow-hidden flex-shrink-0">
          <div className={`p-2 rounded-xl border-2 shadow-2xl text-center transition-all ${
            gameState.currentTeam === "dark"
              ? "bg-gradient-to-r from-blue-900/90 to-blue-800/90 border-blue-700/50"
              : "bg-gradient-to-r from-red-950/90 to-red-900/90 border-red-800/50"
          }`}>
            <div className="relative z-10">
              {!isCurrentTurn ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 animate-pulse" />
                    <p className="text-lg font-bold text-white">
                      {gameState.currentTeam === "dark" ? gameState.darkTeamName : gameState.lightTeamName} Oynuyor
                    </p>
                  </div>
                  <p className="text-sm text-white/70">Sıranızı bekleyin...</p>
                </div>
              ) : isSpymaster && !gameState.currentClue ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <Lightbulb className="w-5 h-5 animate-pulse" />
                    <p className="text-lg font-bold text-white">İpucunu Verin</p>
                  </div>
                  <p className="text-sm text-white/70">Takımınıza yardımcı olun</p>
                </div>
              ) : !isSpymaster && gameState.currentClue ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <Target className="w-5 h-5 animate-pulse" />
                    <p className="text-lg font-bold text-white">Tahmin Edin</p>
                  </div>
                  <p className="text-sm text-white/70">Doğru kartı seçin</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <Clock className="w-5 h-5 animate-pulse" />
                    <p className="text-lg font-bold text-white">Bekleniyor</p>
                  </div>
                  <p className="text-sm text-white/70">İpucu bekleniyor...</p>
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(260px,20vw)_1fr_minmax(260px,20vw)] gap-2 md:gap-3 flex-1 min-h-0 overflow-hidden">
          {/* Left Side - Dark Team */}
          <div className="space-y-2 md:space-y-3 overflow-y-auto">
            {/* Score Card */}
            <Card className="p-3 md:p-4 border-2 shadow-2xl bg-gradient-to-br from-blue-950/95 to-blue-900/95 border-blue-700/50 hover:shadow-blue-500/30 transition-all group">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                  <h3 className="text-xs font-bold text-blue-100 uppercase tracking-wider">{gameState.darkTeamName}</h3>
                </div>
                <div className="relative">
                  <div className="text-6xl md:text-7xl font-black text-blue-100 group-hover:scale-110 transition-transform">
                    {gameState.darkCardsRemaining}
                  </div>
                  <div className="absolute inset-0 blur-2xl bg-blue-500/20 group-hover:bg-blue-500/40 transition-all" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-blue-200/80 font-semibold uppercase">Kalan Kart</p>
                  {gameState.currentTeam === "dark" && (
                    <div className="inline-block px-3 py-1 bg-blue-600/30 rounded-full">
                      <p className="text-xs text-blue-100 font-bold">● SIRA SIZDE</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Players Card */}
            <Card className="p-3 md:p-4 border-2 bg-blue-950/80 border-blue-800/30 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-bold text-blue-100 uppercase tracking-wide">Oyuncular</h4>
              </div>
              <div className="space-y-2">
                {darkPlayers.map(player => (
                  <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      player.id === playerId 
                        ? "bg-blue-600/30 border border-blue-500/50" 
                        : "bg-blue-900/20 hover:bg-blue-900/40"
                    }`}
                  >
                    <span className={`text-sm ${player.id === playerId ? "font-bold text-blue-100" : "text-blue-200/90"}`}>
                      {player.username}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      player.role === "spymaster" 
                        ? "bg-amber-500/20 text-amber-300 font-semibold" 
                        : "bg-blue-500/20 text-blue-300"
                    }`}>
                      {player.role === "spymaster" ? (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
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
          <div className="space-y-2 md:space-y-3 flex flex-col min-h-0 flex-1 overflow-visible">
            <div 
              className="grid grid-cols-5 gap-2 md:gap-3 w-full flex-shrink-0" 
              style={{ 
                transform: 'scale(0.84)',
                transformOrigin: 'top center'
              }} 
              data-testid="game-grid">
              {gameState.cards.map((card) => (
                <GameCard
                  key={card.id}
                  card={card}
                  onReveal={() => handleRevealCard(card.id)}
                  isSpymaster={isSpymaster}
                  disabled={!canRevealCard}
                />
              ))}
            </div>

            {/* Clue Input/Display at Bottom */}
            <div className="flex justify-center flex-shrink-0">
              {canGiveClue ? (
                <Card className="p-2 border-2 bg-gradient-to-br from-amber-50 to-orange-50 border-amber-500/50 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-1.5 text-amber-900">
                      <Lightbulb className="w-4 h-4" />
                      <Label className="text-xs font-bold uppercase">İpucu Ver</Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        data-testid="input-clue-word"
                        placeholder="KELİME"
                        value={clueWord}
                        onChange={(e) => setClueWord(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === "Enter" && handleGiveClue()}
                        maxLength={20}
                        className="w-40 text-center font-bold text-lg uppercase bg-white border-2 border-amber-500/30 focus:border-amber-500 h-10"
                      />
                      <Input
                        data-testid="input-clue-count"
                        type="number"
                        min="0"
                        max="9"
                        value={clueCount}
                        onChange={(e) => setClueCount(e.target.value)}
                        className="w-16 text-center font-bold text-2xl text-black bg-white border-2 border-amber-500/30 focus:border-amber-500 h-10"
                      />
                      <Button
                        onClick={handleGiveClue}
                        disabled={!clueWord.trim() || parseInt(clueCount) < 0}
                        data-testid="button-give-clue"
                        size="sm"
                        className="h-10 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-lg hover:shadow-xl hover:shadow-amber-500/50 group"
                      >
                        <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : gameState.currentClue ? (
                <Card className="px-4 py-2 border-2 shadow-2xl bg-gradient-to-br from-amber-100 to-orange-100 border-amber-600/50 hover:shadow-amber-500/50 transition-all relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent group-hover:animate-shimmer" />
                  <div className="relative text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-amber-900/60">
                      <Lightbulb className="w-3 h-3" />
                      <span className="text-xs font-semibold uppercase">İpucu</span>
                    </div>
                    <div className="flex items-baseline justify-center gap-3">
                      <span className="text-xl font-black text-amber-900 uppercase tracking-wider">
                        {gameState.currentClue.word}
                      </span>
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center shadow-lg">
                        <span className="text-lg font-black text-white">
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
          <div className="space-y-2 md:space-y-3 overflow-y-auto">
            {/* Score Card */}
            <Card className="p-3 md:p-4 border-2 shadow-2xl bg-gradient-to-br from-red-950/95 to-red-950/95 border-red-800/50 hover:shadow-red-600/30 transition-all group">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
                  <h3 className="text-xs font-bold text-red-100 uppercase tracking-wider">{gameState.lightTeamName}</h3>
                </div>
                <div className="relative">
                  <div className="text-6xl md:text-7xl font-black text-red-100 group-hover:scale-110 transition-transform">
                    {gameState.lightCardsRemaining}
                  </div>
                  <div className="absolute inset-0 blur-2xl bg-red-600/20 group-hover:bg-red-600/40 transition-all" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-xs text-red-200/80 font-semibold uppercase">Kalan Kart</p>
                  {gameState.currentTeam === "light" && (
                    <div className="inline-block px-3 py-1 bg-red-700/30 rounded-full">
                      <p className="text-xs text-red-100 font-bold">● SIRA SIZDE</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Players Card */}
            <Card className="p-3 md:p-4 border-2 bg-red-950/80 border-red-900/30 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-bold text-red-100 uppercase tracking-wide">Oyuncular</h4>
              </div>
              <div className="space-y-2">
                {lightPlayers.map(player => (
                  <div 
                    key={player.id} 
                    className={`flex items-center justify-between p-2 rounded-lg transition-all ${
                      player.id === playerId 
                        ? "bg-red-700/30 border border-red-600/50" 
                        : "bg-red-950/20 hover:bg-red-950/40"
                    }`}
                  >
                    <span className={`text-sm ${player.id === playerId ? "font-bold text-red-100" : "text-red-200/90"}`}>
                      {player.username}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      player.role === "spymaster" 
                        ? "bg-amber-500/20 text-amber-300 font-semibold" 
                        : "bg-red-600/20 text-red-400"
                    }`}>
                      {player.role === "spymaster" ? (
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
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

            {/* Game Status Card */}
            <Card className="p-5 border-2 bg-gradient-to-br from-slate-800/90 to-slate-900/90 border-slate-700/50 backdrop-blur-sm shadow-xl max-h-80 overflow-y-auto">
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold text-white uppercase tracking-wide">Oyun Durumu</h4>
              </div>
              <div className="space-y-3">
                {gameState.currentClue && (
                  <div className="p-3 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-lg border border-amber-500/30">
                    <div className="text-xs text-amber-300 font-semibold mb-1">Aktif İpucu</div>
                    <div className="text-lg font-black text-amber-100">
                      {gameState.currentClue.word} <span className="text-2xl">{gameState.currentClue.count}</span>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-muted-foreground mb-1">Sıra</div>
                    <div className={`text-sm font-bold ${
                      gameState.currentTeam === "dark" ? "text-blue-400" : "text-red-500"
                    }`}>
                      {gameState.currentTeam === "dark" ? "Koyu" : "Açık"}
                    </div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="text-xs text-muted-foreground mb-1">Açılan</div>
                    <div className="text-sm font-bold text-white">
                      {gameState.revealHistory.length}/25
                    </div>
                  </div>
                </div>
                {gameState.revealHistory.length > 0 && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Son Açılan Kartlar
                    </div>
                    <div className="space-y-2">
                      {gameState.revealHistory.slice(-5).reverse().map((entry, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-3 p-2 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
                        >
                          <div className={`w-3 h-3 rounded-full shadow-lg ${
                            entry.type === "dark" ? "bg-blue-600 shadow-blue-500/50" :
                            entry.type === "light" ? "bg-red-700 shadow-red-600/50" :
                            entry.type === "neutral" ? "bg-gray-400" :
                            "bg-red-600 shadow-red-500/50"
                          }`} />
                          <span className="text-sm font-semibold text-white flex-1">{entry.word}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            entry.team === "dark" ? "bg-blue-600/20 text-blue-300" : "bg-red-700/20 text-red-400"
                          }`}>
                            {entry.team === "dark" ? "Koyu" : "Açık"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
