import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Logo } from "@/components/Logo";
import { GameCard } from "@/components/GameCard";
import { GameStatus } from "@/components/GameStatus";
import { ClueDisplay } from "@/components/ClueDisplay";
import PlayerList from "@/components/PlayerList";
import { TurnVideo } from "@/components/TurnVideo";
import { AssassinVideo } from "@/components/AssassinVideo";
import { NormalWinVideo } from "@/components/NormalWinVideo";
import { GameTimer } from "@/components/GameTimer";
import { TauntBubble } from "@/components/TauntBubble";
import { InsultBubble } from "@/components/InsultBubble";
import { BubbleManagerProvider } from "@/contexts/BubbleManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { Send, Copy, Check, Loader2, Users, Clock, Target, ArrowLeft, Lightbulb, Eye, EyeOff, RotateCcw, Settings, Sparkles, Zap, Timer, MessageSquare, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Lobby from "./Lobby";

export default function Game() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isConnected, gameState, playerId, roomCode, error, send, cardVotes, cardImages } = useWebSocketContext();
  const [clueWord, setClueWord] = useState("");
  const [clueCount, setClueCount] = useState("1");
  const [showNumberSelector, setShowNumberSelector] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showRoomCode, setShowRoomCode] = useState(false);
  const [taunts, setTaunts] = useState<any[]>([]);
  const [tauntCooldown, setTauntCooldown] = useState<number>(0);
  const [insultCooldown, setInsultCooldown] = useState<number>(0);
  const [insults, setInsults] = useState<any[]>([]);
  const [tauntEnabled, setTauntEnabled] = useState(true);
  const [insultEnabled, setInsultEnabled] = useState(true);
  const [showInsultTargetDialog, setShowInsultTargetDialog] = useState(false);
  const [showInsultV2Dialog, setShowInsultV2Dialog] = useState(false);
  const [insultV2Cooldown, setInsultV2Cooldown] = useState(0);
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.number-selector-container')) {
        setShowNumberSelector(false);
      }
      if (!target.closest('.insult-button-container')) {
        setShowInsultTargetDialog(false);
      }
    };
    
    if (showNumberSelector || showInsultTargetDialog || showInsultV2Dialog) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showNumberSelector, showInsultTargetDialog, showInsultV2Dialog]);
  const [showTurnVideo, setShowTurnVideo] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<"dark" | "light" | null>(null);
  const [isGameStart, setIsGameStart] = useState(false);
  const [showAssassinVideo, setShowAssassinVideo] = useState<{ show: boolean; x?: number; y?: number }>({ show: false });
  const [showNormalWinVideo, setShowNormalWinVideo] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const previousTurnRef = useRef<string | null>(null);
  const previousClueRef = useRef<string | null>(null);
  const assassinShownRef = useRef<boolean>(false);

  useEffect(() => {
    if (error) {
      toast({
        title: "Hata",
        description: error,
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Removed redirect on game end - will handle it in the same page

  // Auto-scroll to bottom when new log entries are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gameState?.revealHistory, gameState?.currentClue]);

  // Detect clue changes
  useEffect(() => {
    if (!gameState?.currentClue) {
      previousClueRef.current = null;
      return;
    }

    const clueKey = `${gameState.currentClue.word}-${gameState.currentClue.count}`;
    previousClueRef.current = clueKey;
  }, [gameState?.currentClue]);

  // Removed auto refresh logic - no longer needed with improved video handling

  // Detect turn changes and show video
  useEffect(() => {
    if (!gameState) return;

    // Detect if game was just restarted (revealHistory is empty and we had a previous turn)
    if (gameState.phase === "playing" && gameState.revealHistory.length === 0 && previousTurnRef.current) {
      // Game was restarted, reset refs
      previousTurnRef.current = null;
      assassinShownRef.current = false;
    }

    // Show turn video when game starts or restarts
    if (gameState.phase === "playing" && !previousTurnRef.current) {
      // Store current team for turn video with special flag for game start
      setCurrentTurn(gameState.currentTeam);
      setIsGameStart(true);
      setShowTurnVideo(true);
      // Set the initial turn reference
      previousTurnRef.current = `${gameState.currentTeam}-${gameState.revealHistory.length}`;
      return; // Exit early to prevent turn video logic from running
    }

    if (gameState.phase !== "playing") {
      previousTurnRef.current = null;
      return;
    }

    // Use currentTeam and revealHistory length as unique turn identifier
    const turnKey = `${gameState.currentTeam}-${gameState.revealHistory.length}`;
    
    // Check if turn has changed (team switch detected)
    if (previousTurnRef.current && previousTurnRef.current !== turnKey) {
      const prevTeam = previousTurnRef.current.split('-')[0];
      if (prevTeam !== gameState.currentTeam) {
        setCurrentTurn(gameState.currentTeam);
        setIsGameStart(false);  // Not game start, it's a turn change
        setShowTurnVideo(true);
      }
    }
    
    previousTurnRef.current = turnKey;
  }, [gameState?.currentTeam, gameState?.revealHistory?.length, gameState?.phase]);

  // Detect assassin card reveal and show video
  useEffect(() => {
    if (!gameState || gameState.phase !== "ended" || assassinShownRef.current) return;
    
    const lastReveal = gameState.revealHistory.length > 0 
      ? gameState.revealHistory[gameState.revealHistory.length - 1] as any
      : null;
    
    if (lastReveal?.type === "assassin") {
      // Find the assassin card position
      const assassinCardIndex = gameState.cards.findIndex(c => c.type === "assassin");
      if (assassinCardIndex !== -1) {
        const cardElement = document.querySelector(`[data-testid="card-${gameState.cards[assassinCardIndex].id}"]`);
        if (cardElement) {
          const rect = cardElement.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          
          assassinShownRef.current = true;
          setShowAssassinVideo({ show: true, x: centerX, y: centerY });
        }
      }
    }
  }, [gameState?.revealHistory, gameState?.phase]);

  // Detect normal win and show video
  useEffect(() => {
    if (!gameState || gameState.phase !== "ended" || !gameState.winner) return;
    
    const lastReveal = gameState.revealHistory.length > 0 
      ? gameState.revealHistory[gameState.revealHistory.length - 1] as any
      : null;
    
    // If last revealed card is NOT assassin, show normal win video immediately
    if (lastReveal && lastReveal.type !== "assassin") {
      // Show video immediately to prevent duplicate win text
      setShowNormalWinVideo(true);
    }
  }, [gameState?.phase, gameState?.winner]);

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
    assassinShownRef.current = false;
    previousTurnRef.current = null; // Reset turn tracking for new game
    setShowNormalWinVideo(false); // Reset normal win video
  };

  // Memoize the onComplete callbacks to prevent re-renders
  const handleTurnVideoComplete = useCallback(() => {
    setShowTurnVideo(false);
    setIsGameStart(false);
  }, []);

  const handleAssassinVideoComplete = useCallback(() => {
    setShowAssassinVideo({ show: false });
  }, []);

  const handleNormalWinVideoComplete = useCallback(() => {
    setShowNormalWinVideo(false);
  }, []);

  const handleTriggerTaunt = () => {
    if (tauntCooldown > 0 || !playerId || !tauntEnabled) return;
    
    send("trigger_taunt", {});
    
    // Set 5 second cooldown
    setTauntCooldown(5);
  };

  const handleInsultClick = () => {
    if (insultCooldown > 0 || !playerId || !insultEnabled) return;
    setShowInsultTargetDialog(!showInsultTargetDialog);
  };

  const handleSendInsultToPlayer = (targetPlayerId: string) => {
    console.log("[CLIENT] Sending insult to target:", targetPlayerId);
    setShowInsultTargetDialog(false);
    const payload = { targetId: targetPlayerId };
    console.log("[CLIENT] Payload:", payload);
    send("send_insult", payload);
    
    // Set 5 second cooldown
    setInsultCooldown(5);
  };
  
  // V2 System handlers
  const handleInsultV2Click = () => {
    if (insultV2Cooldown > 0 || !playerId || !insultEnabled) return;
    setShowInsultV2Dialog(!showInsultV2Dialog);
  };
  
  const handleSendInsultV2ToPlayer = (targetPlayerId: string) => {
    console.log("[V2 CLIENT] Sending insult to target:", targetPlayerId);
    setShowInsultV2Dialog(false);
    send("send_insult_v2", { targetId: targetPlayerId });
    
    // Set 5 second cooldown
    setInsultV2Cooldown(5);
  };

  // Countdown for taunt cooldown
  useEffect(() => {
    if (tauntCooldown > 0) {
      const timer = setTimeout(() => {
        setTauntCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [tauntCooldown]);

  // Clean up expired taunts
  useEffect(() => {
    const interval = setInterval(() => {
      setTaunts(prev => prev.filter(taunt => {
        const now = Date.now();
        return taunt.expiresAt > now;
      }));
    }, 100); // Check every 100ms for smoother removal

    return () => clearInterval(interval);
  }, []);

  // Countdown for insult cooldown
  useEffect(() => {
    if (insultCooldown > 0) {
      const timer = setTimeout(() => {
        setInsultCooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [insultCooldown]);
  
  // Countdown for insult V2 cooldown
  useEffect(() => {
    if (insultV2Cooldown > 0) {
      const timer = setTimeout(() => {
        setInsultV2Cooldown(prev => Math.max(0, prev - 1));
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [insultV2Cooldown]);

  // Listen for taunt and insult events via WebSocket
  useEffect(() => {
    // Access WebSocket directly to listen for events
    const ws = (window as any).wsRef?.current;
    if (!ws) return;
    
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'taunt_fired') {
          console.log('Taunt received:', message.payload);
          setTaunts(prev => [...prev, message.payload]);
        } else if (message.type === 'insult_sent' || message.type === 'insult_v2_sent') {
          console.log('Insult received:', message.payload);
          setInsults(prev => [...prev, message.payload]);
          // Remove insult after 3 seconds
          setTimeout(() => {
            setInsults(prev => prev.filter(i => i.timestamp !== message.payload.timestamp));
          }, 3000);
        } else if (message.type === 'taunt_toggled') {
          setTauntEnabled(message.payload.tauntEnabled);
          toast({
            title: "Hareket Çekme",
            description: message.payload.tauntEnabled ? "Aktif" : "Devre dışı",
          });
        } else if (message.type === 'insult_toggled') {
          setInsultEnabled(message.payload.insultEnabled);
          toast({
            title: "Laf Sokma",
            description: message.payload.insultEnabled ? "Aktif" : "Devre dışı",
          });
        } else if (message.type === 'room_features') {
          setTauntEnabled(message.payload.tauntEnabled);
          setInsultEnabled(message.payload.insultEnabled);
        }
      } catch (err) {
        console.error('Error handling message:', err);
      }
    };
    
    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [toast]);
  
  // Get room features on mount
  useEffect(() => {
    if (isConnected && gameState) {
      send("get_room_features", {});
    }
  }, [isConnected, gameState, send]);

  useEffect(() => {
    // Check if we should redirect to rooms
    if (!isConnected) return; // Don't redirect if not connected yet
    
    // If gameState exists, we're good, don't redirect
    if (gameState) return;
    
    // Check if we have saved room info in localStorage
    const savedRoomCode = localStorage.getItem("katmannames_room_code");
    const savedPlayerId = localStorage.getItem("katmannames_player_id");
    
    // If we have saved info, wait a bit for reconnection
    if (savedRoomCode && savedPlayerId) {
      const timeoutId = setTimeout(() => {
        // After waiting, if still no gameState, redirect to rooms
        if (!gameState) {
          setLocation("/rooms");
        }
      }, 3000); // Wait 3 seconds for reconnection
      
      return () => clearTimeout(timeoutId);
    } else {
      // No saved info, immediately redirect to rooms
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
  const canGiveClue = isSpymaster && isCurrentTurn && !gameState.currentClue && gameState.phase !== "ended";
  
  // In Chaos Mode, Double Agents can only vote, not reveal cards
  const canRevealCardBase = !isSpymaster && isCurrentTurn && gameState?.currentClue !== null && gameState.phase !== "ended";
  const canRevealCard = canRevealCardBase && (!gameState.chaosMode || 
    currentPlayer.secretRole !== "double_agent");

  const darkPlayers = gameState.players.filter(p => p.team === "dark");
  const lightPlayers = gameState.players.filter(p => p.team === "light");

  // Find last revealed card for animation
  const lastRevealedCard = gameState.revealHistory.length > 0 
    ? gameState.revealHistory[gameState.revealHistory.length - 1] as any
    : null;
  const wasAssassinRevealed = lastRevealedCard?.type === "assassin";
  const lastCardId = lastRevealedCard?.cardId;

  return (
    <BubbleManagerProvider>
      <div className="h-screen overflow-hidden bg-slate-900 relative" style={{ backgroundImage: 'url(/arkaplan.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Light Effects - reduced for performance */}
      <div className="light-effect light-1" />
      <div className="light-effect light-2" />
      
      {/* Very few particles for better performance */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1}`} />
      ))}
      
      {/* Turn Change Video */}
      {showTurnVideo && currentTurn && gameState && (
        <TurnVideo
          team={currentTurn}
          teamName={currentTurn === "dark" ? gameState.darkTeamName : gameState.lightTeamName}
          isGameStart={isGameStart}
          onComplete={handleTurnVideoComplete}
        />
      )}

      {/* Assassin Video for black card */}
      {showAssassinVideo.show && gameState && gameState.winner && (
        <AssassinVideo
          winnerTeam={gameState.winner}
          winnerTeamName={gameState.winner === "dark" ? gameState.darkTeamName : gameState.lightTeamName}
          loserTeamName={gameState.winner === "dark" ? gameState.lightTeamName : gameState.darkTeamName}
          startX={showAssassinVideo.x}
          startY={showAssassinVideo.y}
          onComplete={handleAssassinVideoComplete}
        />
      )}
      
      {/* Taunt Bubbles - Show as speech bubbles */}
      {taunts.map((taunt, index) => (
        <TauntBubble
          key={`${taunt.playerId}-${taunt.expiresAt}-${index}`}
          senderUsername={taunt.username}
          senderTeam={taunt.team}
          videoSrc={taunt.videoSrc}
          timestamp={taunt.expiresAt - 3000} // Use expiresAt - duration as timestamp
        />
      ))}
      
      {/* Insult Bubbles */}
      {insults.map((insult, index) => (
        <InsultBubble
          key={`${insult.timestamp}-${index}`}
          senderUsername={insult.senderUsername}
          senderTeam={insult.senderTeam}
          targetUsername={insult.targetUsername}
          targetTeam={insult.targetTeam}
          message={insult.message}
          timestamp={insult.timestamp}
        />
      ))}


      {/* Normal Win Video */}
      {showNormalWinVideo && gameState && gameState.winner && (
        <NormalWinVideo
          winnerTeam={gameState.winner}
          winnerTeamName={gameState.winner === "dark" ? gameState.darkTeamName : gameState.lightTeamName}
          onComplete={handleNormalWinVideoComplete}
        />
      )}

      {/* Game End Notification - Auto disappears (only for non-assassin wins, if video is not showing) */}
      {gameState.phase === "ended" && gameState.winner && !wasAssassinRevealed && !showNormalWinVideo && (
        <div 
          className="fixed inset-x-0 top-32 z-50 flex justify-center px-4 pointer-events-none"
          style={{
            animation: 'slideInBounce 1s ease-out forwards, slideOutFade 1s ease-in 4s forwards'
          }}
        >
          {/* Winner text without card wrapper */}
          <div className="relative">
            {/* Subtle glow backdrop */}
            <div className="absolute -inset-4 blur-2xl opacity-30"
              style={{
                background: gameState.winner === "dark" 
                  ? 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 60%)'
                  : 'radial-gradient(circle, rgba(239,68,68,0.6) 0%, transparent 60%)'
              }}
            />
            
            {/* Main text content */}
            <div className="relative text-center space-y-2">
              {/* Winner team name */}
              <div className={cn(
                "text-5xl md:text-7xl font-bold tracking-wide",
                gameState.winner === "dark" ? "text-blue-300" : "text-red-300"
              )}
              style={{
                textShadow: gameState.winner === "dark" 
                  ? '0 2px 10px rgba(59,130,246,0.4)' 
                  : '0 2px 10px rgba(239,68,68,0.4)'
              }}
              >
                {gameState.winner === "dark" ? gameState.darkTeamName : gameState.lightTeamName}
              </div>
              
              {/* KAZANDI text */}
              <div className="text-3xl md:text-5xl font-semibold text-white/90"
                style={{
                  textShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}
              >
                KAZANDI!
              </div>
            </div>
            
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-2 opacity-70 animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    background: gameState.winner === "dark" 
                      ? 'linear-gradient(to bottom, #60a5fa, #3b82f6)'
                      : 'linear-gradient(to bottom, #f87171, #ef4444)',
                    animationDelay: `${Math.random() * 0.8}s`,
                    animationDuration: `${3 + Math.random()}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}
      
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
              {/* Moderator Controls for Taunt/Insult */}
              {currentPlayer?.isRoomOwner && gameState.phase === "playing" && (
                <>
                  <Button
                    onClick={() => {
                      send("toggle_taunt", { enabled: !tauntEnabled });
                    }}
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-6 px-3 text-xs font-medium transition-all",
                      tauntEnabled 
                        ? "border-amber-500 bg-amber-500/10 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20" 
                        : "border hover:border-amber-500 hover:bg-amber-500/10"
                    )}
                    title="Hareket çekme özelliğini aç/kapat"
                  >
                    <Zap className={cn("w-3 h-3 mr-1.5", tauntEnabled && "animate-pulse")} />
                    <span>{tauntEnabled ? "Hareket Aktif" : "Hareket Pasif"}</span>
                  </Button>
                  <div className="w-px h-5 bg-amber-900/40" />
                  <Button
                    onClick={() => {
                      send("toggle_insult", { enabled: !insultEnabled });
                    }}
                    size="sm"
                    variant="outline"
                    className={cn(
                      "h-6 px-3 text-xs font-medium transition-all",
                      insultEnabled 
                        ? "border-amber-500 bg-amber-500/10 text-amber-400 hover:border-amber-400 hover:bg-amber-500/20" 
                        : "border hover:border-amber-500 hover:bg-amber-500/10"
                    )}
                    title="Laf sokma özelliğini aç/kapat"
                  >
                    <MessageCircle className={cn("w-3 h-3 mr-1.5", insultEnabled && "animate-pulse")} />
                    <span>{insultEnabled ? "Laf Aktif" : "Laf Pasif"}</span>
                  </Button>
                </>
              )}
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
                            <span className="text-xs text-blue-300">{player.role === "spymaster" ? "İstihbarat Şefi" : "Ajan"}</span>
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
                            <span className="text-xs text-red-300">{player.role === "spymaster" ? "İstihbarat Şefi" : "Ajan"}</span>
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
              {/* Game End Controls */}
              {gameState.phase === "ended" ? (
                <div className="flex items-center gap-2">
                  {currentPlayer?.isRoomOwner && (
                    <Button
                      onClick={handleRestart}
                      size="sm"
                      className="h-7 bg-green-600 hover:bg-green-700 text-white font-bold"
                    >
                      <RotateCcw className="w-3 h-3 mr-1" />
                      <span className="text-xs">Tekrar Oyna</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => send("return_to_lobby", {})}
                    size="sm"
                    variant="outline"
                    className="h-7 border-2"
                  >
                    <ArrowLeft className="w-3 h-3 mr-1" />
                    <span className="text-xs">Lobiye Dön</span>
                  </Button>
                  <Button
                    onClick={() => toast({
                      title: "Yakında Gelecek",
                      description: "Oyun düzenleme özelliği yakında eklenecek.",
                    })}
                    size="sm"
                    variant="secondary"
                    className="h-7"
                  >
                    <Settings className="w-3 h-3 mr-1" />
                    <span className="text-xs">Oyunu Düzenle</span>
                  </Button>
                </div>
              ) : gameState.currentClue ? (
                <div className="relative z-[46] flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-amber-600/20 to-orange-600/20 rounded-lg border border-amber-500/30 animate-clue-appear">
                  <Lightbulb className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span className="text-xs font-medium text-amber-300">İpucu:</span>
                  <span className="text-xs font-black text-amber-100">{gameState.currentClue.word}</span>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
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
                      Sıradaki takım: <span className={gameState.currentTeam === "dark" ? "text-blue-400 font-bold" : "text-red-400 font-bold"}>
                        {gameState.currentTeam === "dark" ? gameState.darkTeamName : gameState.lightTeamName}
                      </span>
                    </span>
                  </div>
                  <div className="w-px h-4 bg-slate-600" />
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-400">Açılan:</span>
                    <span className="text-xs font-bold text-slate-200">{gameState.revealHistory.filter((e: any) => e.word).length}/25</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
            </div>
          </div>
          
          {/* Right Section - Actions */}
          <div className="lg:w-[250px] xl:w-[280px] 2xl:w-[320px]">
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
                                description: "Ajan rolünü aldınız",
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
                            Ajan
                          </Button>
                          <Button
                            onClick={() => {
                              send("select_role", { role: "spymaster" });
                              toast({
                                title: "Rol Değiştirildi",
                                description: "İstihbarat Şefi rolünü aldınız",
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
                            İstihbarat Şefi
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
                          {currentPlayer?.role === "spymaster" ? "İstihbarat Şefi" :
                           currentPlayer?.role === "guesser" ? "Ajan" : "Seçilmedi"}
                        </span></div>
                        {gameState.chaosMode && currentPlayer.secretRole && (
                          <div className="mt-2 pt-2 border-t border-slate-700/50">
                            <div className="text-purple-400 font-bold">
                              Gizli Rol: {
                                currentPlayer.secretRole === "prophet" ? "🔮 Kahin" :
                                currentPlayer.secretRole === "double_agent" ? "🎭 Çift Ajan" : ""
                              }
                            </div>
                            <div className="text-[10px] mt-1 text-slate-500">
                              {currentPlayer.secretRole === "prophet" && "3 takım kartını biliyorsun"}
                              {currentPlayer.secretRole === "double_agent" && "Karşı takım için çalış (sadece oy)"}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Prophet Guess Button - Only show in Chaos Mode during play */}
              {gameState.chaosMode && gameState.phase === "playing" && 
               currentPlayer.role === "guesser" && 
               currentPlayer.team === gameState.currentTeam &&
               (!gameState.prophetGuessUsed || !gameState.prophetGuessUsed[currentPlayer.team as "dark" | "light"]) && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid="button-guess-prophet"
                      className="h-6 px-2 border-2 border-red-600 hover:border-red-500 hover:bg-red-600/20 text-red-400"
                    >
                      <Sparkles className="w-2.5 h-2.5 mr-0.5 text-red-500" />
                      <span className="text-[10px] font-bold">⚠️ Kahin Tahmini (RİSKLİ)</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900/95 border-2 border-purple-900/30 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        Kahin Tahmini
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-3 bg-red-950/30 rounded-lg border-2 border-red-700/50">
                        <p className="text-xs font-bold text-red-400">
                          ⚠️ ÇOK ÖNEMLİ UYARI ⚠️
                        </p>
                        <p className="text-xs text-red-300 mt-1">
                          • Doğru tahmin = ANINDA KAZANIRSINIZ! ✅<br/>
                          • Yanlış tahmin = ANINDA KAYBEDERSİNİZ! ❌<br/>
                          <span className="font-bold text-red-400">Bu çok riskli bir hamle! Emin değilseniz kullanmayın!</span>
                        </p>
                      </div>
                      
                      {/* Opponent Team Players */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-300">
                          {currentPlayer.team === "dark" ? gameState.lightTeamName : gameState.darkTeamName} Takımı Oyuncuları
                        </Label>
                        <div className="space-y-2">
                          {(currentPlayer.team === "dark" ? lightPlayers : darkPlayers)
                            .filter(p => p.role === "guesser")
                            .map(player => (
                              <Button
                                key={player.id}
                                onClick={() => {
                                  send("guess_prophet", { targetPlayerId: player.id });
                                  toast({
                                    title: "Kahin Tahmini Gönderildi",
                                    description: `${player.username} oyuncusunun Kahin olduğunu tahmin ettiniz. Doğruysa kazanırsınız, yanlışsa kaybedersiniz!`,
                                    variant: "destructive"
                                  });
                                }}
                                variant="outline"
                                className="w-full border-2 hover:border-purple-500 hover:bg-purple-500/10 justify-start"
                              >
                                <Target className="w-4 h-4 mr-2 text-purple-400" />
                                {player.username}
                              </Button>
                            ))}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-red-800/50 rounded-lg border-2 border-red-700/50">
                        <p className="text-xs font-bold text-red-400 animate-pulse">
                          ☠️ YÜKSEK RİSK: Yanlış tahmin = ANINDA KAYBEDERSINIZ!
                        </p>
                        <p className="text-xs text-amber-400 mt-1">
                          Bu tahmin sadece bir kez yapılabilir. Çok dikkatli olun!
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
              
              {/* Double Agent Guess Button - Only show after game ends for losing team */}
              {gameState.chaosMode && gameState.phase === "ended" && gameState.winner &&
               currentPlayer.team !== gameState.winner && !gameState.doubleAgentGuessUsed && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid="button-guess-double-agent"
                      className="h-6 px-2 border border-red-500 hover:border-red-400 hover:bg-red-500/20 animate-pulse"
                    >
                      <Sparkles className="w-2.5 h-2.5 mr-0.5 text-red-500" />
                      <span className="text-[10px] text-red-400 font-bold">Son Şans: Çift Ajan Tahmini</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-900/95 border-2 border-red-900/30 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold bg-gradient-to-r from-red-600 to-purple-600 bg-clip-text text-transparent">
                        🎭 Son Şans - Çift Ajan Tahmini
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="p-3 bg-red-950/30 rounded-lg border border-red-700/50">
                        <p className="text-xs text-red-300">
                          Kaybettiniz ama oyunu tersine çevirebilirsiniz! 
                          Kazanan takımın Çift Ajanını doğru tahmin ederseniz, oyunu kazanırsınız!
                        </p>
                      </div>
                      
                      {/* Winning Team Players */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-300">
                          {gameState.winner === "dark" ? gameState.darkTeamName : gameState.lightTeamName} Takımı Oyuncuları
                        </Label>
                        <div className="space-y-2">
                          {(gameState.winner === "dark" ? darkPlayers : lightPlayers)
                            .filter(p => p.role === "guesser")
                            .map(player => (
                              <Button
                                key={player.id}
                                onClick={() => {
                                  send("guess_double_agent", { targetPlayerId: player.id });
                                  toast({
                                    title: "Tahmin Gönderildi",
                                    description: `${player.username} oyuncusunun Çift Ajan olduğunu tahmin ettiniz`,
                                  });
                                }}
                                variant="outline"
                                className="w-full border-2 hover:border-red-500 hover:bg-red-500/10 justify-start"
                              >
                                <Target className="w-4 h-4 mr-2 text-red-400" />
                                {player.username}
                              </Button>
                            ))}
                        </div>
                      </div>
                      
                      <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <p className="text-xs text-amber-400">
                          ⚠️ Dikkat: Bu tahmin sadece bir kez yapılabilir! Doğru tahmin oyunu kazandırır.
                        </p>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
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
              className="p-1 lg:p-2 xl:p-3 border-2 shadow-2xl border-blue-700/50 hover:shadow-blue-500/30 transition-all group relative overflow-visible cursor-pointer transform hover:scale-105 hover:rotate-1"
              style={{
                backgroundImage: `linear-gradient(to bottom right, rgba(23, 37, 84, 0.7), rgba(30, 58, 138, 0.7)), url('/mavi takım.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transformStyle: 'preserve-3d',
                transition: 'all 0.3s ease'
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
                    <div className="flex flex-wrap justify-center gap-1">
                      {darkPlayers.filter(p => p.role === "spymaster").map(player => (
                        <div key={player.id} className="bg-black/60 backdrop-blur-sm rounded px-1 py-0.5 text-[9px] lg:text-[10px] xl:text-xs text-amber-300 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-amber-400" />
                          <span className={player.id === playerId ? "font-bold text-amber-200" : "text-amber-300"}>
                            {player.username}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Guessers */}
                  {darkPlayers.filter(p => p.role === "guesser").length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {darkPlayers.filter(p => p.role === "guesser").map(player => (
                        <div key={player.id} className="bg-blue-950/80 backdrop-blur-sm rounded px-1 py-0.5 text-[9px] lg:text-[10px] xl:text-xs">
                          <span className={player.id === playerId ? "font-bold text-blue-100" : "text-blue-200"}>
                            {player.username}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
            
            {/* Timer Display - In Left Sidebar */}
            {gameState.phase === "playing" && gameState.timedMode && (
              <GameTimer
                isActive={gameState.phase === "playing" && !!gameState.currentTurnStartTime}
                startTime={gameState.currentTurnStartTime}
                duration={
                  !gameState.currentClue
                    ? gameState.spymasterTime  // Time for Intelligence Chief to give clue
                    : gameState.guesserTime     // Time for Agents to guess
                }
                label={!gameState.currentClue ? "İstihbarat Şefi Süresi" : "Ajan Süresi"}
              />
            )}
            
            {/* Action Buttons - Below Blue Team Panel */}
            {currentPlayer && gameState.phase === "playing" && (
              <div className="mt-4 space-y-2">
                {/* Action Buttons Container */}
                <div className="flex gap-2">
                  {/* Taunt Button */}
                  <div className="relative flex-1">
                    <div className={`absolute inset-0 rounded-lg blur-md transition-all ${
                      currentPlayer.team === "dark" 
                        ? "bg-blue-600/40" 
                        : "bg-red-600/40"
                    }`} />
                    <button
                      onClick={handleTriggerTaunt}
                      disabled={tauntCooldown > 0 || !tauntEnabled}
                      className={`
                        relative w-full px-4 py-3 rounded-lg font-bold text-sm transition-all
                        backdrop-blur-md border shadow-lg
                        ${currentPlayer.team === "dark" 
                          ? "bg-blue-900/60 border-blue-600/50 text-blue-100 hover:bg-blue-900/80 hover:border-blue-500/60" 
                          : "bg-red-900/60 border-red-600/50 text-red-100 hover:bg-red-900/80 hover:border-red-500/60"}
                        ${tauntCooldown > 0 || !tauntEnabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
                      `}
                      data-testid="button-trigger-taunt"
                    >
                      {!tauntEnabled ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <EyeOff className="w-4 h-4" />
                          Devre Dışı
                        </span>
                      ) : tauntCooldown > 0 ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Timer className="w-4 h-4" />
                          {tauntCooldown}s
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <Zap className="w-4 h-4" />
                          Hareket Çek
                        </span>
                      )}
                    </button>
                  </div>

                  
                  {/* Insult Button */}
                  <div className="relative">
                    <button
                      onClick={handleInsultV2Click}
                      disabled={insultV2Cooldown > 0 || !insultEnabled}
                      className={cn(
                        "w-full px-3 py-3 rounded-lg text-sm font-bold transition-all",
                        "flex items-center justify-center text-center",
                        "shadow-2xl border-2",
                        !insultEnabled
                          ? "bg-gray-800/70 text-gray-500 border-gray-700/30 cursor-not-allowed"
                          : insultV2Cooldown > 0
                          ? "bg-amber-900/50 text-amber-300 border-amber-700/30 cursor-not-allowed"
                          : "bg-gradient-to-r from-amber-600/80 to-amber-700/80 text-amber-100 border-amber-500/30",
                        "hover:shadow-amber-500/20 hover:scale-105",
                        "disabled:hover:scale-100"
                      )}
                      data-testid="button-send-insult-v2"
                    >
                      {!insultEnabled ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <EyeOff className="w-4 h-4" />
                          Devre Dışı
                        </span>
                      ) : insultV2Cooldown > 0 ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <Timer className="w-4 h-4" />
                          {insultV2Cooldown}s
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-1.5">
                          <MessageCircle className="w-4 h-4" />
                          Laf Sok
                        </span>
                      )}
                    </button>
                    
                    {/* Player Selection List */}
                    {showInsultV2Dialog && insultEnabled && insultV2Cooldown === 0 && (
                      <div className="absolute top-full mt-2 left-0 right-0 z-50">
                        <div className="bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/30 rounded-lg p-2 space-y-1 shadow-2xl">
                          {gameState.players
                            .filter(p => p.team && p.team !== currentPlayer.team)
                            .map(player => (
                              <button
                                key={player.id}
                                onClick={() => handleSendInsultV2ToPlayer(player.id)}
                                className={cn(
                                  "w-full px-3 py-2 rounded text-xs font-medium transition-all text-left",
                                  "hover:scale-105",
                                  player.team === "dark"
                                    ? "bg-blue-900/50 text-blue-100 hover:bg-blue-800/60 border border-blue-700/30"
                                    : "bg-red-900/50 text-red-100 hover:bg-red-800/60 border border-red-700/30"
                                )}
                              >
                                {player.username}
                              </button>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Center - Grid */}
          <div className="flex flex-col min-h-0 flex-1 gap-1 items-center justify-start p-1 lg:p-2 pb-0 relative pt-4">
            {/* Mobile Score Display */}
            <div className="lg:hidden w-full flex-shrink-0">
              {/* Timer Display - Mobile */}
              {gameState.phase === "playing" && gameState.timedMode && (
                <div className="mb-2">
                  <GameTimer
                    isActive={gameState.phase === "playing" && !!gameState.currentTurnStartTime}
                    startTime={gameState.currentTurnStartTime}
                    duration={
                      !gameState.currentClue
                        ? gameState.spymasterTime  // Time for Intelligence Chief to give clue
                        : gameState.guesserTime     // Time for Agents to guess
                    }
                    label={!gameState.currentClue ? "İstihbarat Şefi Süresi" : "Ajan Süresi"}
                  />
                </div>
              )}
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
                      <div className="text-[9px] font-bold">
                        <span className="text-blue-300">Sıradaki takım: </span>
                        <span className="text-blue-100">{gameState.darkTeamName}</span>
                      </div>
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
                      <div className="text-[9px] font-bold">
                        <span className="text-red-300">Sıradaki takım: </span>
                        <span className="text-red-100">{gameState.lightTeamName}</span>
                      </div>
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
                    rowIndex={Math.floor(index / 5)}
                    isLastCard={card.id === lastCardId && gameState.phase === "ended"}
                    isAssassinCard={card.type === "assassin" && card.revealed && gameState.phase === "ended"}
                    gameEnded={gameState.phase === "ended"}
                    isKnownCard={currentPlayer.secretRole === "prophet" && currentPlayer.knownCards?.includes(card.id)}
                  />
                </div>
              ))}
            </div>

            {/* Clue Display - Show current clue above the grid */}
            {gameState.currentClue && gameState.phase === "playing" && (
              <div className="absolute bottom-[100px] left-1/2 transform -translate-x-1/2 animate-fadeIn z-50">
                <div className="animate-pulse-slow">
                  <ClueDisplay clue={gameState.currentClue} />
                </div>
              </div>
            )}

            {/* Clue Input/Display - Overlay at Bottom */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center p-0" style={{ zIndex: 50 }}>
              {/* End Turn Button for Guessers - Positioned to the left */}
              {!canGiveClue && gameState.currentClue && currentPlayer?.team === gameState.currentTeam && currentPlayer?.role === "guesser" && gameState.phase !== "ended" && (
                <div className="absolute bottom-2 left-4 sm:left-8">
                  <Button
                    onClick={() => {
                      send("end_turn", {});
                      toast({
                        title: "Tahmin Tamamlandı",
                        description: "Sıra diğer takıma geçti",
                      });
                    }}
                    className="h-10 sm:h-12 px-6 sm:px-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white font-black shadow-2xl text-sm sm:text-base rounded-xl border-2 border-orange-400/60 transform transition-all hover:scale-105"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    TAHMİNİ BİTİR
                  </Button>
                </div>
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
                    <div className="relative number-selector-container">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => setClueCount(String(Math.max(0, parseInt(clueCount) - 1)))}
                          className="h-6 sm:h-7 w-6 sm:w-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded border border-slate-700"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowNumberSelector(!showNumberSelector)}
                          className="h-6 sm:h-7 w-8 sm:w-10 flex items-center justify-center bg-slate-900/70 hover:bg-slate-800/80 border border-amber-500/60 rounded text-sm font-black text-amber-400 cursor-pointer transition-all"
                        >
                          {clueCount}
                        </button>
                        <button
                          type="button"
                          onClick={() => setClueCount(String(Math.min(9, parseInt(clueCount) + 1)))}
                          className="h-6 sm:h-7 w-6 sm:w-7 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded border border-slate-700"
                        >
                          +
                        </button>
                      </div>
                      
                      {/* Number Selector Dropdown */}
                      {showNumberSelector && (
                        <>
                          <style>{`
                            @keyframes slideUp {
                              from {
                                opacity: 0;
                                transform: translateY(10px);
                              }
                              to {
                                opacity: 1;
                                transform: translateY(0);
                              }
                            }
                            @keyframes fadeInScale {
                              from {
                                opacity: 0;
                                transform: scale(0.8);
                              }
                              to {
                                opacity: 1;
                                transform: scale(1);
                              }
                            }
                          `}</style>
                          <div className="absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 z-50">
                            <div 
                              className="flex items-center gap-0.5 p-1 bg-slate-900/95 backdrop-blur-md border border-amber-500/60 rounded-lg shadow-2xl"
                              style={{
                                animation: 'slideUp 0.2s ease-out'
                              }}
                            >
                              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                                <button
                                  key={num}
                                  type="button"
                                  onClick={() => {
                                    setClueCount(String(num));
                                    setShowNumberSelector(false);
                                  }}
                                  className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded font-bold text-xs transition-all ${
                                    String(num) === clueCount
                                      ? 'bg-amber-600 text-white'
                                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400'
                                  }`}
                                  style={{
                                    animation: `fadeInScale 0.3s ease-out ${num * 0.03}s backwards`
                                  }}
                                >
                                  {num}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
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
              ) : null}
            </div>

          </div>

          {/* Right Side - Light Team */}
          <div className="hidden lg:flex lg:flex-col lg:gap-2 h-full min-h-0">
            {/* Score & Players Card Combined */}
            <Card 
              className="p-1 lg:p-2 xl:p-3 border-2 shadow-2xl border-red-800/50 hover:shadow-red-600/30 transition-all group relative overflow-visible cursor-pointer transform hover:scale-105 hover:-rotate-1"
              style={{
                backgroundImage: `linear-gradient(to bottom right, rgba(127, 29, 29, 0.7), rgba(127, 29, 29, 0.7)), url('/kırmızı takım.png')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transformStyle: 'preserve-3d',
                transition: 'all 0.3s ease'
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
                    <div className="flex flex-wrap justify-center gap-1">
                      {lightPlayers.filter(p => p.role === "spymaster").map(player => (
                        <div key={player.id} className="bg-black/60 backdrop-blur-sm rounded px-1 py-0.5 text-[9px] lg:text-[10px] xl:text-xs text-amber-300 flex items-center gap-1">
                          <Eye className="w-2.5 h-2.5 lg:w-3 lg:h-3 text-amber-400" />
                          <span className={player.id === playerId ? "font-bold text-amber-200" : "text-amber-300"}>
                            {player.username}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Guessers */}
                  {lightPlayers.filter(p => p.role === "guesser").length > 0 && (
                    <div className="flex flex-wrap justify-center gap-1">
                      {lightPlayers.filter(p => p.role === "guesser").map(player => (
                        <div key={player.id} className="bg-red-950/80 backdrop-blur-sm rounded px-1 py-0.5 text-[9px] lg:text-[10px] xl:text-xs">
                          <span className={player.id === playerId ? "font-bold text-red-100" : "text-red-200"}>
                            {player.username}
                          </span>
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
                  <span className="font-bold text-gray-300">{gameState.revealHistory.filter((e: any) => e.word).length}/25</span>
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
    </BubbleManagerProvider>
  );
}
