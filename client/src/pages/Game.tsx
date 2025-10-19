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

  return (
    <div className="min-h-screen p-3 md:p-4 bg-background bg-grid-pattern animate-in fade-in duration-500">
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Logo />
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex-1 sm:flex-initial text-right">
              <div className="text-xs text-muted-foreground">Oda Kodu</div>
              <div className="text-base md:text-lg font-mono font-bold" data-testid="room-code">
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
            {currentPlayer?.isRoomOwner && (
              <Button
                size="icon"
                variant="outline"
                onClick={handleRestart}
                data-testid="button-restart"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        <GameStatus
          currentTeam={gameState.currentTeam}
          darkCardsRemaining={gameState.darkCardsRemaining}
          lightCardsRemaining={gameState.lightCardsRemaining}
        />

        <div className="grid lg:grid-cols-4 gap-4 md:gap-6">
          <div className="lg:col-span-3 space-y-4">
            {canGiveClue && (
              <Card className="p-4 space-y-4 border-2 border-primary/30">
                <h3 className="font-semibold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  İpucu Ver
                </h3>
                <div className="grid sm:grid-cols-[1fr_auto_auto] gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="clue-word" className="text-xs">Kelime</Label>
                    <Input
                      id="clue-word"
                      data-testid="input-clue-word"
                      placeholder="İpucu kelimesi"
                      value={clueWord}
                      onChange={(e) => setClueWord(e.target.value.toUpperCase())}
                      onKeyDown={(e) => e.key === "Enter" && handleGiveClue()}
                      maxLength={20}
                      className="font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="clue-count" className="text-xs">Sayı</Label>
                    <Input
                      id="clue-count"
                      data-testid="input-clue-count"
                      type="number"
                      min="0"
                      max="9"
                      value={clueCount}
                      onChange={(e) => setClueCount(e.target.value)}
                      className="w-20 text-center font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs invisible">Gönder</Label>
                    <Button
                      onClick={handleGiveClue}
                      disabled={!clueWord.trim() || parseInt(clueCount) < 0}
                      data-testid="button-give-clue"
                      className="w-full sm:w-auto"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Gönder
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {!isSpymaster && (
              <ClueDisplay clue={gameState.currentClue} />
            )}

            {!isCurrentTurn && (
              <Card className="p-4 border-dashed">
                <p className="text-sm text-muted-foreground text-center">
                  {gameState.currentTeam === "dark" ? "Katman Koyu" : "Katman Açık"} takımının sırası
                </p>
              </Card>
            )}

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
          </div>

          <div className="space-y-4">
            <PlayerList
              players={gameState.players}
              currentPlayerId={playerId}
            />

            <Card className="p-4 space-y-2">
              <h3 className="font-semibold text-sm">Oyun Kuralları</h3>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>İpucu Veren kelime ve sayı verir</li>
                <li>Tahminciler kartları açar</li>
                <li>Doğru kart = Devam</li>
                <li>Yanlış/Tarafsız = Sıra değişir</li>
                <li>Yasak kart = Oyun biter!</li>
              </ul>
            </Card>

            <Button
              variant="outline"
              onClick={() => setLocation("/lobby")}
              className="w-full"
              data-testid="button-back-to-lobby"
            >
              Lobiye Dön
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
