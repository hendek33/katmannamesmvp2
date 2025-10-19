import { useState, useEffect } from "react";
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
import { useWebSocket } from "@/hooks/useWebSocket";
import { RotateCcw, Send, Copy, Check, Loader2 } from "lucide-react";

export default function Game() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isConnected, gameState, playerId, roomCode, error, send } = useWebSocket();
  const [clueWord, setClueWord] = useState("");
  const [clueCount, setClueCount] = useState("1");
  const [copied, setCopied] = useState(false);

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

  if (!isConnected || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-grid-pattern">
        <Card className="p-8 space-y-4 text-center" data-testid="loading-state">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">
            {!isConnected ? "Sunucuya bağlanılıyor..." : "Yükleniyor..."}
          </p>
        </Card>
      </div>
    );
  }

  if (gameState.phase !== "playing") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-grid-pattern">
        <Card className="p-8 space-y-4 text-center">
          <p className="text-muted-foreground">Oyun henüz başlamadı</p>
          <Button onClick={() => setLocation("/lobby")}>
            Lobiye Dön
          </Button>
        </Card>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  if (!currentPlayer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background bg-grid-pattern">
        <Card className="p-8 space-y-4 text-center">
          <p className="text-muted-foreground">Oyuncu bulunamadı</p>
          <Button onClick={() => setLocation("/")}>
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
    <div className="min-h-screen p-2 md:p-4 bg-[#8B4513] bg-gradient-to-br from-[#8B4513] to-[#654321] animate-in fade-in duration-500">
      <div className="max-w-[1600px] mx-auto space-y-2 md:space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/20 rounded-lg backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="text-sm text-amber-100/80">
              Oda: <span className="font-mono font-bold text-amber-100">{roomCode}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyRoomCode}
              data-testid="button-copy-code"
              className="bg-black/40 border-amber-700/50 text-amber-100 hover:bg-black/60"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </Button>
            {currentPlayer?.isRoomOwner && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRestart}
                data-testid="button-restart"
                className="bg-black/40 border-amber-700/50 text-amber-100 hover:bg-black/60"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => setLocation("/lobby")}
              className="bg-black/40 border-amber-700/50 text-amber-100 hover:bg-black/60"
            >
              Lobby
            </Button>
          </div>
        </div>

        {/* Status Message */}
        <div className="text-center py-3 bg-amber-50/90 rounded-lg shadow-lg">
          <p className="text-base font-semibold text-gray-800">
            {!isCurrentTurn 
              ? `${gameState.currentTeam === "dark" ? "Katman Koyu" : "Katman Açık"} takımının sırası...`
              : isSpymaster && !gameState.currentClue
              ? "İpucunu ver..."
              : !isSpymaster && gameState.currentClue
              ? "Tahmin et..."
              : "Bekleniyor..."}
          </p>
        </div>

        {/* Main Game Area */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-3">
          {/* Left Side - Dark Team */}
          <div className="space-y-3">
            <Card className="p-6 bg-gradient-to-br from-red-900/90 to-red-950/90 border-red-800/50 shadow-2xl">
              <div className="text-center space-y-2">
                <h3 className="text-sm font-semibold text-red-100 uppercase tracking-wide">Katman Koyu</h3>
                <div className="text-7xl font-bold text-red-100">{gameState.darkCardsRemaining}</div>
                <p className="text-xs text-red-200/70">Kalan Kart</p>
              </div>
            </Card>
            
            <Card className="p-4 bg-red-950/60 border-red-800/30 backdrop-blur-sm">
              <h4 className="text-xs font-semibold text-red-100 mb-3 uppercase">Oyuncular</h4>
              <div className="space-y-2">
                {darkPlayers.map(player => (
                  <div key={player.id} className="flex items-center gap-2 text-xs text-red-100/90">
                    <span className={player.id === playerId ? "font-bold" : ""}>{player.username}</span>
                    <span className="text-red-300/60">({player.role === "spymaster" ? "İpucu" : "Tahminci"})</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Center - Grid */}
          <div className="space-y-3">
            <div className="grid grid-cols-5 gap-2 md:gap-3" data-testid="game-grid">
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

            {/* Clue Display at Bottom */}
            <div className="flex justify-center">
              {canGiveClue ? (
                <Card className="p-4 bg-amber-50/95 border-2 border-amber-700/50 shadow-lg inline-block">
                  <div className="flex items-center gap-3">
                    <Input
                      data-testid="input-clue-word"
                      placeholder="İPUCU"
                      value={clueWord}
                      onChange={(e) => setClueWord(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleGiveClue()}
                      maxLength={20}
                      className="w-40 text-center font-bold text-lg uppercase bg-white"
                    />
                    <Input
                      data-testid="input-clue-count"
                      type="number"
                      min="0"
                      max="9"
                      value={clueCount}
                      onChange={(e) => setClueCount(e.target.value)}
                      className="w-16 text-center font-bold text-2xl bg-white"
                    />
                    <Button
                      onClick={handleGiveClue}
                      disabled={!clueWord.trim() || parseInt(clueCount) < 0}
                      data-testid="button-give-clue"
                      className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ) : gameState.currentClue ? (
                <Card className="px-8 py-4 bg-amber-50/95 border-2 border-amber-700/50 shadow-lg inline-block">
                  <div className="text-center">
                    <span className="text-2xl font-bold text-gray-900 uppercase tracking-wider">
                      {gameState.currentClue.word}
                    </span>
                    <span className="ml-4 text-4xl font-bold text-gray-900">
                      {gameState.currentClue.count}
                    </span>
                  </div>
                </Card>
              ) : null}
            </div>
          </div>

          {/* Right Side - Light Team */}
          <div className="space-y-3">
            <Card className="p-6 bg-gradient-to-br from-cyan-700/90 to-cyan-900/90 border-cyan-600/50 shadow-2xl">
              <div className="text-center space-y-2">
                <h3 className="text-sm font-semibold text-cyan-100 uppercase tracking-wide">Katman Açık</h3>
                <div className="text-7xl font-bold text-cyan-100">{gameState.lightCardsRemaining}</div>
                <p className="text-xs text-cyan-200/70">Kalan Kart</p>
              </div>
            </Card>
            
            <Card className="p-4 bg-cyan-950/60 border-cyan-800/30 backdrop-blur-sm">
              <h4 className="text-xs font-semibold text-cyan-100 mb-3 uppercase">Oyuncular</h4>
              <div className="space-y-2">
                {lightPlayers.map(player => (
                  <div key={player.id} className="flex items-center gap-2 text-xs text-cyan-100/90">
                    <span className={player.id === playerId ? "font-bold" : ""}>{player.username}</span>
                    <span className="text-cyan-300/60">({player.role === "spymaster" ? "İpucu" : "Tahminci"})</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 bg-amber-100/95 border-amber-700/30 backdrop-blur-sm max-h-64 overflow-y-auto">
              <h4 className="text-xs font-semibold text-gray-800 mb-3 uppercase">Oyun Durumu</h4>
              <div className="space-y-2 text-xs text-gray-700">
                {gameState.currentClue && (
                  <div className="p-2 bg-amber-200/50 rounded">
                    <span className="font-semibold">Aktif İpucu:</span>
                    <div className="font-bold text-sm">
                      {gameState.currentClue.word} {gameState.currentClue.count}
                    </div>
                  </div>
                )}
                <div className="p-2 bg-white/50 rounded">
                  <span className="font-semibold">Sıra:</span> {gameState.currentTeam === "dark" ? "Katman Koyu" : "Katman Açık"}
                </div>
                <div className="p-2 bg-white/50 rounded">
                  <span className="font-semibold">Açılan Kartlar:</span> {gameState.revealHistory.length}/25
                </div>
                {gameState.revealHistory.length > 0 && (
                  <div className="mt-3">
                    <div className="text-xs font-semibold text-gray-600 mb-1">Son Açılan Kartlar:</div>
                    <div className="space-y-1">
                      {gameState.revealHistory.slice(-5).reverse().map((entry, idx) => (
                        <div key={idx} className="text-xs p-1 bg-white/30 rounded flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            entry.type === "dark" ? "bg-red-600" :
                            entry.type === "light" ? "bg-cyan-600" :
                            entry.type === "neutral" ? "bg-gray-400" :
                            "bg-black"
                          }`}></span>
                          <span className="font-medium">{entry.word}</span>
                          <span className="text-gray-500 text-[10px]">({entry.team === "dark" ? "Koyu" : "Açık"})</span>
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
  );
}
