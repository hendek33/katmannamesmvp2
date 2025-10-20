import { useEffect } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trophy, RotateCcw, Home, Loader2 } from "lucide-react";
import { useWebSocketContext } from "@/contexts/WebSocketContext";

export default function GameEnd() {
  const [, setLocation] = useLocation();
  const { gameState, playerId, send, isConnected } = useWebSocketContext();

  useEffect(() => {
    if (gameState?.phase === "playing") {
      setLocation("/game");
    }
  }, [gameState, setLocation]);

  if (!isConnected || !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: '75%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <Card className="p-8 space-y-4 text-center" data-testid="loading-state">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </Card>
      </div>
    );
  }

  if (!gameState.winner) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: '75%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <Card className="p-8 space-y-4 text-center">
          <p className="text-muted-foreground">Oyun henüz bitmedi</p>
          <Button onClick={() => setLocation("/game")}>
            Oyuna Dön
          </Button>
        </Card>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  const winnerText = gameState.winner === "dark" ? "Katman Koyu" : "Katman Açık";
  const winnerGradient = gameState.winner === "dark"
    ? "from-blue-600 to-blue-400"
    : "from-red-600 to-red-400";

  const handlePlayAgain = () => {
    if (currentPlayer?.isRoomOwner) {
      send("restart_game", {});
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: '75%', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="w-full max-w-md space-y-8 animate-in zoom-in duration-500">
        <Logo className="justify-center" />

        <Card className="p-8 md:p-12 space-y-8 text-center shadow-2xl border-2">
          <div className="space-y-4">
            <div className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-r ${winnerGradient} flex items-center justify-center animate-glow-pulse`}>
              <Trophy className="w-10 h-10 text-white" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-bold">
                Tebrikler!
              </h1>
              <div className="text-xl md:text-2xl font-semibold">
                <span className={`bg-gradient-to-r ${winnerGradient} bg-clip-text text-transparent`} data-testid="winner-team">
                  {winnerText}
                </span>
                <span className="text-muted-foreground"> Kazandı!</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          <div className="space-y-3">
            {currentPlayer?.isRoomOwner ? (
              <Button
                onClick={handlePlayAgain}
                className="w-full"
                size="lg"
                data-testid="button-play-again"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Tekrar Oyna
              </Button>
            ) : (
              <Card className="p-4 border-dashed" data-testid="waiting-for-owner">
                <p className="text-sm text-muted-foreground">
                  Oda sahibi yeni oyun başlatabilir
                </p>
              </Card>
            )}

            <Button
              onClick={() => {
                send("return_to_lobby", {});
                setLocation("/lobby");
              }}
              variant="outline"
              className="w-full"
              size="lg"
              data-testid="button-back-to-lobby"
            >
              <Home className="w-4 h-4 mr-2" />
              Lobiye Dön
            </Button>
          </div>
        </Card>

        <p className="text-xs text-center text-muted-foreground">
          Oda kodu hâlâ aktif. Arkadaşların katılmaya devam edebilir.
        </p>
      </div>
    </div>
  );
}
