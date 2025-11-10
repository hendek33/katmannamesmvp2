import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Copy, Check, EyeOff, Eye, Users, Timer, User, Sparkles, LogOut, Play, Shield, Bot, Zap, Lock, LockOpen, Edit2, Loader2, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebSocketContext } from "@/contexts/WebSocketContext";
import { PlayerList } from "@/components/PlayerList";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type Team } from "@shared/schema";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel
} from "@/components/ui/alert-dialog";

export default function Lobby() {
  const [, setLocation] = useLocation();
  const { isConnected, send, gameState, error, usernameChangeStatus, clearUsernameChangeStatus } = useWebSocketContext();
  const [showRoomCode, setShowRoomCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [timedMode, setTimedMode] = useState(false);
  const [spymasterTime, setSpymasterTime] = useState(120);
  const [guesserTime, setGuesserTime] = useState(60);
  const [chaosMode, setChaosMode] = useState(false);
  const [prophetVisibility, setProphetVisibility] = useState<"own_team" | "both_teams" | "all_cards">("own_team");
  const [showChaosDetails, setShowChaosDetails] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showChangeNameDialog, setShowChangeNameDialog] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [isChangingName, setIsChangingName] = useState(false);
  const { toast } = useToast();
  
  const playerId = localStorage.getItem("katmannames_player_id");
  const roomCode = gameState?.roomCode || localStorage.getItem("katmannames_room_code") || "";

  useEffect(() => {
    const username = localStorage.getItem("katmannames_username");
    if (!username || !roomCode) {
      setLocation("/");
      return;
    }
  }, [roomCode, setLocation]);

  useEffect(() => {
    if (gameState?.phase === "playing") {
      setLocation("/game");
    }
  }, [gameState?.phase, setLocation]);

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
    const savedRoomCode = localStorage.getItem("katmannames_room_code");
    const savedPlayerId = localStorage.getItem("katmannames_player_id");
    const savedUsername = localStorage.getItem("katmannames_username");
    
    if (savedRoomCode && savedUsername && !gameState) {
      send("join_room", {
        roomCode: savedRoomCode,
        username: savedUsername,
        playerId: savedPlayerId || undefined,
      });
    }
  }, [send, gameState]);

  useEffect(() => {
    if (gameState) {
      setTimedMode(gameState.timedMode);
      setSpymasterTime(gameState.spymasterTime);
      setGuesserTime(gameState.guesserTime);
      setChaosMode(gameState.chaosMode || false);
      setProphetVisibility(gameState.prophetVisibility || "own_team");
    }
  }, [gameState]);

  // Handle username change response
  useEffect(() => {
    if (usernameChangeStatus) {
      if (usernameChangeStatus.success) {
        // Success - close dialog and reset
        setShowChangeNameDialog(false);
        setNewUsername("");
        setIsChangingName(false);
        toast({
          title: "İsim değiştirildi",
          description: "Yeni isminiz başarıyla kaydedildi",
          duration: 3000,
        });
      } else {
        // Error - show message and keep dialog open
        setIsChangingName(false);
        toast({
          title: "Hata",
          description: usernameChangeStatus.message || "İsim değiştirilemedi",
          variant: "destructive",
          duration: 4000,
        });
      }
      // Clear the status after handling
      clearUsernameChangeStatus();
    }
  }, [usernameChangeStatus, clearUsernameChangeStatus, toast]);

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

  const handleChangeName = () => {
    if (!newUsername.trim() || isChangingName) return;
    
    if (newUsername.length < 2 || newUsername.length > 20) {
      toast({
        title: "Geçersiz isim",
        description: "İsim 2-20 karakter arasında olmalıdır",
        duration: 3000,
      });
      return;
    }
    
    setIsChangingName(true);
    send("change_username", { newUsername: newUsername.trim() });
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

  const [showTeamNameWarning, setShowTeamNameWarning] = useState(false);

  const handleStartGame = () => {
    // Check if team names are still default
    if (gameState?.darkTeamName === "Mavi Takım" || gameState?.lightTeamName === "Kırmızı Takım") {
      setShowTeamNameWarning(true);
    } else {
      send("start_game", {});
    }
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

  const handleTimerSettingsUpdate = (mode: boolean, spyTime: number, guessTime: number) => {
    send("update_timer_settings", { 
      timedMode: mode,
      spymasterTime: spyTime,
      guesserTime: guessTime 
    });
  };

  const handleChaosModeUpdate = (enabled: boolean) => {
    send("update_chaos_mode", { chaosMode: enabled });
    // When enabling chaos mode, automatically set type to prophet
    if (enabled) {
      send("update_chaos_mode_type", { type: "prophet" });
    }
  };

  const handleProphetVisibilityUpdate = (visibility: "own_team" | "both_teams" | "all_cards") => {
    send("update_prophet_visibility", { visibility });
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/arkaplan.webp')] bg-cover bg-center opacity-30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1} opacity-50`} />
        ))}
        
        <div className="relative backdrop-blur-xl bg-slate-900/50 p-8 rounded-2xl border border-slate-800/50">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="mt-4 text-lg font-medium text-slate-300">Bağlanıyor...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/arkaplan.webp')] bg-cover bg-center opacity-30" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        
        {[...Array(8)].map((_, i) => (
          <div key={i} className={`particle particle-${i + 1} opacity-50`} />
        ))}
        
        <div className="relative backdrop-blur-xl bg-slate-900/50 p-8 rounded-2xl border border-slate-800/50">
          <div className="flex items-center justify-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          </div>
          <p className="mt-4 text-lg font-medium text-slate-300">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players.find(p => p.id === playerId);
  
  // Team filtering
  const darkTeam = gameState.players.filter(p => p.team === "dark");
  const lightTeam = gameState.players.filter(p => p.team === "light");
  const noTeam = gameState.players.filter(p => p.team === null);
  
  // Check for spymasters
  const darkHasSpymaster = darkTeam.some(p => p.role === "spymaster");
  const lightHasSpymaster = lightTeam.some(p => p.role === "spymaster");
  
  const canStartGame = currentPlayer?.isRoomOwner && 
    darkHasSpymaster &&
    lightHasSpymaster &&
    darkTeam.length >= 2 &&
    lightTeam.length >= 2 &&
    noTeam.length === 0 &&
    (!gameState?.chaosMode || gameState?.chaosModeType); // If chaos mode is on, type must be selected

  const playerCount = gameState.players.length;

  return (
    <div className="h-screen bg-slate-900 relative overflow-hidden flex flex-col">
      {/* Animated Background - Full visibility */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/arkaplan.webp')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
      </div>
      
      {/* Codenames Theme - Corner Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-900/30 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-900/30 to-transparent rounded-full blur-3xl" />
      
      {/* Minimal Particles */}
      {[...Array(8)].map((_, i) => (
        <div key={i} className={`particle particle-${i + 1} opacity-50`} />
      ))}
      
      {/* Codenames Header Bar */}
      <header className="relative z-20 backdrop-blur-lg bg-black/50 border-b border-red-900/30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Left Section - Status */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 blur-md opacity-40" />
                  <div className="relative px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-full">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                      <span className="text-sm font-semibold text-emerald-300">Lobide</span>
                    </div>
                  </div>
                </div>
                <div className="text-sm font-medium">
                  <Users className="inline w-4 h-4 mr-1.5 text-slate-400" />
                  <span className="text-slate-200">{playerCount}</span> Oyuncu
                </div>
              </div>
            </div>
            
            {/* Center Section - Room Code */}
            <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-blue-700 rounded-xl blur opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative flex items-center gap-3 px-6 py-2.5 backdrop-blur-lg bg-black/60 rounded-xl border border-red-800/50 shadow-xl">
                  <span className="text-sm text-slate-300 font-medium">Oda:</span>
                  <span className="text-xl font-bold font-mono tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-blue-400" data-testid="room-code">
                    {showRoomCode ? roomCode : "••••••"}
                  </span>
                  <div className="flex items-center gap-1 ml-2 border-l border-slate-600 pl-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowRoomCode(!showRoomCode)}
                      className="h-7 w-7 p-0 hover:bg-white/10 text-slate-300"
                    >
                      {showRoomCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCopyRoomCode}
                      className="h-7 w-7 p-0 hover:bg-white/10 text-slate-300"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Mobile Room Code */}
            <div className="md:hidden flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Oda:</span>
              <span className="text-sm font-mono font-bold text-slate-200" data-testid="room-code-mobile">
                {showRoomCode ? roomCode : "••••"}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowRoomCode(!showRoomCode)}
                  className="h-6 w-6 p-0 text-slate-300 hover:bg-white/10"
                >
                  {showRoomCode ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyRoomCode}
                  className="h-6 w-6 p-0 text-slate-300 hover:bg-white/10"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                </Button>
              </div>
            </div>
            
            {/* Right Section - Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowChangeNameDialog(true)}
                className="text-green-400 hover:text-green-300 hover:bg-green-900/20 border border-green-800/50"
                title="İsim Değiştir"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">İsim</span>
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  send("leave_room", {});
                  localStorage.removeItem("katmannames_room_code");
                  localStorage.removeItem("katmannames_player_id");
                  setLocation("/rooms");
                }}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border border-red-800/50"
                data-testid="button-leave-room"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Ayrıl</span>
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content Grid */}
      <div className="flex-1 overflow-hidden relative z-10">
        <div className="h-full max-w-6xl mx-auto px-4 py-6">
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Panel - Team Operations (7 cols on lg) */}
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 overflow-hidden">
              {/* Developer Note Card */}
              {currentPlayer && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-yellow-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                  <div className="relative backdrop-blur-xl bg-black/40 rounded-xl border border-white/10 shadow-2xl p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-yellow-600 blur-md opacity-50" />
                        <div className="relative w-10 h-10 rounded-lg bg-gradient-to-r from-amber-700 to-yellow-700 flex items-center justify-center shadow-lg">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-amber-400/80 space-y-0.5">
                          <div className="font-medium flex items-center gap-1">
                            Geliştiriciden not:
                          </div>
                          <div className="italic text-amber-400/60">
                            Gerizekalılar takımı kırmızı takım olabilirler, iyi oyunlar!  
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Team Dashboard */}
              <div className="flex-1 overflow-hidden">
                <PlayerList
                  players={gameState.players}
                  currentPlayerId={playerId || undefined}
                  onTeamSelect={handleTeamSelect}
                  onRoleToggle={handleRoleToggle}
                  isLobby={true}
                  darkTeamName={gameState.darkTeamName}
                  lightTeamName={gameState.lightTeamName}
                  onTeamNameChange={handleTeamNameChange}
                  onRemoveBot={handleRemoveBot}
                  onKickPlayer={(targetPlayerId) => {
                    send("kick_player", { targetPlayerId });
                  }}
                />
              </div>
            </div>
            
            {/* Right Panel - Control Console (5 cols on lg) */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {/* Game Start Panel - Enhanced Glassmorphism */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 to-blue-600/20 rounded-xl blur-xl group-hover:blur-2xl transition-all" />
                <div className="relative backdrop-blur-xl bg-black/40 rounded-xl border border-white/10 shadow-2xl p-6">
                  <div className="space-y-4">
                  {/* Status Indicator */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-100">Oyun Durumu</h3>
                    {canStartGame ? (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="text-sm font-semibold">Hazır</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-400">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-semibold">Bekliyor</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Requirements Checklist */}
                  <div className="space-y-2">
                    <div className={`flex items-center gap-2 text-sm font-medium ${darkHasSpymaster ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {darkHasSpymaster ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                      <span>{gameState.darkTeamName} İstihbarat Şefi</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm font-medium ${lightHasSpymaster ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {lightHasSpymaster ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                      <span>{gameState.lightTeamName} İstihbarat Şefi</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm font-medium ${darkTeam.length >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {darkTeam.length >= 2 ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                      <span>{gameState.darkTeamName}: {darkTeam.length}/2+ Oyuncu</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm font-medium ${lightTeam.length >= 2 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {lightTeam.length >= 2 ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                      <span>{gameState.lightTeamName}: {lightTeam.length}/2+ Oyuncu</span>
                    </div>
                    <div className={`flex items-center gap-2 text-sm font-medium ${noTeam.length === 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {noTeam.length === 0 ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-600" />}
                      <span>Tüm oyuncular takım seçti</span>
                    </div>
                  </div>
                  
                  {/* Start Button - Codenames Style */}
                  {currentPlayer?.isRoomOwner && (
                    <Button
                      onClick={handleStartGame}
                      disabled={!canStartGame}
                      className={`w-full py-5 text-base font-semibold transition-all backdrop-blur-xl border ${
                        canStartGame 
                          ? 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-600/40 hover:border-emerald-500/60 shadow-lg'
                          : 'bg-slate-800/30 text-slate-600 border-slate-700/30 cursor-not-allowed'
                      }`}
                      data-testid="button-start-game"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Oyunu Başlat
                    </Button>
                  )}
                </div>
                </div>
              </div>
              
              {/* Game Settings - Codenames Style */}
              <div className="space-y-4">
                {/* Chaos Mode - Codenames Style */}
                <div className={`rounded-xl border p-4 transition-all duration-500 ${
                  chaosMode 
                    ? 'bg-gradient-to-br from-violet-950/30 to-fuchsia-950/30 border-violet-600/30 shadow-xl backdrop-blur-sm' 
                    : 'bg-slate-900/40 border-slate-700/30 backdrop-blur-sm'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {/* Minimalist Chaos Mode Badge */}
                      <div className={`px-3 py-1.5 rounded-full transition-all duration-500 ${
                        chaosMode 
                          ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-lg' 
                          : 'bg-slate-700/50'
                      }`}>
                        <span className={`text-sm font-semibold ${chaosMode ? 'text-white' : 'text-slate-400'}`}>
                          {chaosMode ? '✨' : '○'} KAOS
                        </span>
                      </div>
                      <h3 className={`text-sm font-medium transition-colors ${chaosMode ? 'text-violet-200' : 'text-slate-400'}`}>
                        {chaosMode ? "🔮 Kahin Modu Aktif" : "Kahin Modu"}
                      </h3>
                      <button
                        onClick={() => setShowChaosDetails(!showChaosDetails)}
                        className={`px-2 py-0.5 text-sm rounded transition-all ${
                          chaosMode 
                            ? 'text-purple-300 hover:text-purple-200 bg-purple-900/30 hover:bg-purple-900/50 border border-purple-600/50' 
                            : 'text-amber-400 hover:text-amber-300 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-700/50'
                        }`}
                      >
                        ?
                      </button>
                    </div>
                    <Switch
                      checked={chaosMode}
                      disabled={!currentPlayer?.isRoomOwner}
                      onCheckedChange={(checked) => {
                        if (currentPlayer?.isRoomOwner) {
                          setChaosMode(checked);
                          handleChaosModeUpdate(checked);
                        }
                      }}
                      data-testid="switch-chaos-mode"
                    />
                  </div>
                  {/* Chaos Mode Info when enabled */}
                  {chaosMode && (
                    <div className="mt-4 space-y-3">
                      <div className="p-2 rounded-lg text-[10px] leading-relaxed bg-cyan-900/20 text-cyan-200/80 border border-cyan-600/20">
                        Her takıma gizli bir Kahin atanacak • Kahinler oyundaki kartların yerlerini bilir.
                      </div>
                      
                      {/* Prophet Visibility Settings */}
                      <div className="space-y-2">
                        <Label htmlFor="prophet-visibility" className="text-xs text-violet-300">
                          Kahin Görüş Ayarı
                        </Label>
                        <Select
                          value={prophetVisibility}
                          disabled={!currentPlayer?.isRoomOwner}
                          onValueChange={(value: "own_team" | "both_teams" | "all_cards") => {
                            if (currentPlayer?.isRoomOwner) {
                              setProphetVisibility(value);
                              handleProphetVisibilityUpdate(value);
                            }
                          }}
                        >
                          <SelectTrigger id="prophet-visibility" className="w-full bg-slate-800/50 border-violet-600/30 text-violet-100">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="own_team">
                              Sadece Kendi Takımı
                            </SelectItem>
                            <SelectItem value="both_teams">
                              Her İki Takım
                            </SelectItem>
                            <SelectItem value="all_cards">
                              Tüm Kartlar (beyaz ve siyah dahil)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="text-[9px] text-violet-400/70">
                          {prophetVisibility === "own_team" && "Kahinler kendi takımlarının tüm kartlarını görebilir"}
                          {prophetVisibility === "both_teams" && "Kahinler her iki takımın tüm kartlarını görebilir (beyaz ve siyah hariç)"}
                          {prophetVisibility === "all_cards" && "Kahinler beyaz ve siyah kartlar dahil tüm kartları görebilir"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Timer Settings - Enhanced Glassmorphism */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-purple-600/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                  <div className="relative backdrop-blur-xl bg-black/40 rounded-xl border border-white/10 shadow-2xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Timer className="w-5 h-5 text-purple-400" />
                      <h3 className="text-base font-bold text-slate-100">Zamanlayıcı</h3>
                    </div>
                    <Switch
                      checked={timedMode}
                      disabled={!currentPlayer?.isRoomOwner}
                      onCheckedChange={(checked) => {
                        if (currentPlayer?.isRoomOwner) {
                          setTimedMode(checked);
                          handleTimerSettingsUpdate(checked, spymasterTime, guesserTime);
                        }
                      }}
                      data-testid="switch-timed-mode"
                    />
                  </div>
                  
                  {timedMode && (
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Label className="text-xs text-slate-400">Şef Süresi</Label>
                          <span className="text-xs font-mono text-purple-300">
                            {Math.floor(spymasterTime / 60)}:{(spymasterTime % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <Slider
                          value={[spymasterTime]}
                          disabled={!currentPlayer?.isRoomOwner}
                          onValueChange={([value]) => {
                            if (currentPlayer?.isRoomOwner) {
                              setSpymasterTime(value);
                            }
                          }}
                          onValueCommit={([value]) => {
                            if (currentPlayer?.isRoomOwner) {
                              handleTimerSettingsUpdate(timedMode, value, guesserTime);
                            }
                          }}
                          min={30}
                          max={300}
                          step={30}
                          className="w-full"
                          data-testid="slider-spymaster-time"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <Label className="text-xs text-slate-400">Ajan Süresi</Label>
                          <span className="text-xs font-mono text-purple-300">
                            {Math.floor(guesserTime / 60)}:{(guesserTime % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <Slider
                          value={[guesserTime]}
                          disabled={!currentPlayer?.isRoomOwner}
                          onValueChange={([value]) => {
                            if (currentPlayer?.isRoomOwner) {
                              setGuesserTime(value);
                            }
                          }}
                          onValueCommit={([value]) => {
                            if (currentPlayer?.isRoomOwner) {
                              handleTimerSettingsUpdate(timedMode, spymasterTime, value);
                            }
                          }}
                          min={30}
                          max={300}
                          step={30}
                          className="w-full"
                          data-testid="slider-guesser-time"
                        />
                      </div>
                    </div>
                  )}
                  </div>
                </div>
                
                {/* Password Settings - Enhanced Glassmorphism */}
                {currentPlayer?.isRoomOwner && (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-emerald-600/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                    <div className="relative backdrop-blur-xl bg-black/40 rounded-xl border border-white/10 shadow-2xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {gameState.hasPassword ? (
                            <Lock className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <LockOpen className="w-5 h-5 text-slate-400" />
                          )}
                          <h3 className="text-base font-bold text-slate-100">Oda Şifresi</h3>
                        </div>
                        <Button
                          onClick={() => setShowPasswordModal(true)}
                          size="sm"
                          variant="outline"
                          className={`text-xs ${
                            gameState.hasPassword 
                              ? 'border-emerald-600/50 text-emerald-400 hover:bg-emerald-900/20' 
                              : 'border-slate-600/50 text-slate-400 hover:bg-slate-800/20'
                          }`}
                        >
                          {gameState.hasPassword ? 'Şifreyi Değiştir' : 'Şifre Koy'}
                        </Button>
                      </div>
                      <p className="text-xs text-slate-400">
                        {gameState.hasPassword 
                          ? 'Bu oda şifre korumalı. Sadece şifreyi bilen kişiler katılabilir.'
                          : 'Bu oda herkese açık. İsterseniz şifre koyabilirsiniz.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bot Controls - Enhanced Glassmorphism */}
              {currentPlayer?.isRoomOwner && (
                <div className="relative group">
                  <div className="absolute inset-0 bg-purple-600/20 rounded-xl blur-lg group-hover:blur-xl transition-all" />
                  <div className="relative backdrop-blur-xl bg-black/40 rounded-xl border border-white/10 shadow-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Bot className="w-5 h-5 text-purple-400" />
                    <h3 className="text-lg font-bold text-slate-100">Bot Yönetimi</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => handleAddBot("dark", "spymaster")}
                      size="sm"
                      variant="outline"
                      className="text-xs border-blue-700/50 text-blue-300 hover:bg-blue-900/20"
                      disabled={darkHasSpymaster}
                      data-testid="button-add-bot-dark-spymaster"
                    >
                      {gameState.darkTeamName} Şef
                    </Button>
                    <Button
                      onClick={() => handleAddBot("dark", "guesser")}
                      size="sm"
                      variant="outline"
                      className="text-xs border-blue-700/50 text-blue-300 hover:bg-blue-900/20"
                      data-testid="button-add-bot-dark-guesser"
                    >
                      {gameState.darkTeamName} Ajan
                    </Button>
                    <Button
                      onClick={() => handleAddBot("light", "spymaster")}
                      size="sm"
                      variant="outline"
                      className="text-xs border-red-700/50 text-red-300 hover:bg-red-900/20"
                      disabled={lightHasSpymaster}
                      data-testid="button-add-bot-light-spymaster"
                    >
                      {gameState.lightTeamName} Şef
                    </Button>
                    <Button
                      onClick={() => handleAddBot("light", "guesser")}
                      size="sm"
                      variant="outline"
                      className="text-xs border-red-700/50 text-red-300 hover:bg-red-900/20"
                      data-testid="button-add-bot-light-guesser"
                    >
                      {gameState.lightTeamName} Ajan
                    </Button>
                  </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Team Name Warning Dialog */}
      <AlertDialog open={showTeamNameWarning} onOpenChange={setShowTeamNameWarning}>
        <AlertDialogContent className="max-w-md backdrop-blur-xl bg-slate-900/95 border-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-500">⚠️ Takım İsimleri Değiştirilmeli!</AlertDialogTitle>
            <AlertDialogDescription>
              Oyunu başlatmak için her iki takımın da ismini değiştirmelisiniz.<br /><br />
              <span className="font-semibold">Mevcut isimler:</span><br />
              • {gameState?.darkTeamName === "Mavi Takım" && <span className="text-red-400">Mavi Takım (varsayılan - değiştirilmeli)</span>}
              {gameState?.darkTeamName !== "Mavi Takım" && <span className="text-green-400">{gameState?.darkTeamName} ✓</span>}<br />
              • {gameState?.lightTeamName === "Kırmızı Takım" && <span className="text-red-400">Kırmızı Takım (varsayılan - değiştirilmeli)</span>}
              {gameState?.lightTeamName !== "Kırmızı Takım" && <span className="text-green-400">{gameState?.lightTeamName} ✓</span>}<br /><br />
              Lütfen takım isimlerini değiştirin ve tekrar deneyin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowTeamNameWarning(false)}>
              Tamam
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Chaos Mode Details Dialog */}
      <AlertDialog open={showChaosDetails} onOpenChange={setShowChaosDetails}>
        <AlertDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto backdrop-blur-xl bg-slate-900/95 border-slate-800 
          [&::-webkit-scrollbar]:w-2
          [&::-webkit-scrollbar-track]:bg-slate-800/20
          [&::-webkit-scrollbar-track]:rounded-full
          [&::-webkit-scrollbar-track]:backdrop-blur-sm
          [&::-webkit-scrollbar-thumb]:bg-gradient-to-b
          [&::-webkit-scrollbar-thumb]:from-cyan-500/40
          [&::-webkit-scrollbar-thumb]:to-blue-500/40
          [&::-webkit-scrollbar-thumb]:rounded-full
          [&::-webkit-scrollbar-thumb]:border
          [&::-webkit-scrollbar-thumb]:border-cyan-400/20
          [&::-webkit-scrollbar-thumb]:shadow-lg
          hover:[&::-webkit-scrollbar-thumb]:from-cyan-500/60
          hover:[&::-webkit-scrollbar-thumb]:to-blue-500/60
          hover:[&::-webkit-scrollbar-thumb]:shadow-cyan-400/30
          [&::-webkit-scrollbar-thumb]:transition-all
          [&::-webkit-scrollbar-thumb]:duration-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              🔮 KAHİN MODU NEDİR?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-5 pt-4">
                <p className="text-base">
                  Kahin Modu, klasik Katmannames oyununa gizli bir rol ekleyerek oyunu daha stratejik ve heyecanlı hale getirir. 
                  Her takıma atanan gizli Kahin, oyunun dinamiğini tamamen değiştirir!
                </p>
                
                <div className="space-y-4">
                  <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">🔮</span>
                      <h4 className="font-bold text-lg text-cyan-500">Kahin Rolü</h4>
                    </div>
                    <p className="text-sm leading-relaxed">
                      Her takımda 1 tane gizli Kahin bulunur. Oyun başında moderatörün ayarlayacağı kurallardaki kartların yerini bilir. 
                      Bu bilgiyi akıllıca ipuçları vererek takımına aktarmalıdır.
                      <span className="text-amber-400 font-bold"> Oyun sonunda kaybeden takım karşı takımın Kahin'ini tahmin edebilir - Ama tahmin yapabilmenin bazı koşulları vardır.</span>
                    </p>
                  </div>
                </div>
                
                <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                  <h4 className="font-semibold text-amber-400 text-base mb-3">⚡ Oyun Kuralları</h4>
                  <ul className="text-sm space-y-2 leading-relaxed">
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>Kahinler lobide oyun ayarında ayarlanmış kartların yerlerini bilir</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1">•</span>
                      <span>Oyun sonunda <span className="text-cyan-400 font-semibold">kaybeden takımın</span> karşı takımın Kahinini tahmin etme hakkı bulunur, ama bu hak bazı kurallara tabiidir</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1 text-red-500">•</span>
                      <span><span className="text-red-500 font-bold">Siyah kelime bulunursa</span> kahin tahmininde bulunulamaz, <span className="text-red-400 font-semibold">hükmen kaybedilir</span></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1 text-red-500">•</span>
                      <span><span className="text-red-500 font-bold">Karşı takımın son kalan kelimesi bulunursa</span> kahin tahmininde bulunulamaz, <span className="text-red-400 font-semibold">hükmen kaybedilir</span></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1 text-orange-500">•</span>
                      <span><span className="text-orange-400 font-semibold">Üst üste iki tur kelime açmadan</span> tahmini bitiren takım oyun sonunda <span className="text-orange-300">kahin tahmininde bulunamaz</span></span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-1 text-yellow-500">•</span>
                      <span>Kahin tahminini doğru yaparak kazanmak <span className="text-yellow-400 font-bold">yarım puan</span> sayılır</span>
                    </li>
                  </ul>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowChaosDetails(false)}>
              Anladım
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Password Modal */}
      {showPasswordModal && currentPlayer?.isRoomOwner && (
        <PasswordModal 
          hasPassword={gameState.hasPassword}
          onClose={() => setShowPasswordModal(false)}
          send={send}
          roomCode={roomCode}
        />
      )}

      {/* Change Username Dialog */}
      <Dialog open={showChangeNameDialog} onOpenChange={setShowChangeNameDialog}>
        <DialogContent className="bg-slate-900/95 border-2 border-green-900/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              İsim Değiştir
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Mevcut İsim</Label>
              <div className="px-3 py-2 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <span className="text-sm text-slate-200">{currentPlayer?.username || ""}</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Yeni İsim</Label>
              <Input
                type="text"
                placeholder="Yeni kullanıcı adınız"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                maxLength={20}
                disabled={isChangingName}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleChangeName();
                  }
                }}
                className="bg-slate-800/50 border-slate-700 focus:border-green-500 text-white"
              />
              <p className="text-xs text-slate-500">2-20 karakter arasında olmalıdır</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleChangeName}
                disabled={isChangingName || !newUsername.trim() || newUsername.trim() === currentPlayer?.username}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {isChangingName ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Değiştiriliyor...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Değiştir
                  </>
                )}
              </Button>
              <Button
                onClick={() => {
                  setShowChangeNameDialog(false);
                  setNewUsername("");
                }}
                variant="outline"
                className="flex-1 border-slate-700 hover:border-slate-600"
              >
                <X className="w-4 h-4 mr-2" />
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PasswordModal({ hasPassword, onClose, send, roomCode }: { 
  hasPassword: boolean;
  onClose: () => void;
  send: (type: string, payload: any) => void;
  roomCode: string;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = () => {
    if (password.length < 1) {
      toast({
        title: "Hata",
        description: "Lütfen bir şifre girin",
        variant: "destructive",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast({
        title: "Hata", 
        description: "Şifreler eşleşmiyor",
        variant: "destructive",
      });
      return;
    }

    send("update_password", {
      roomCode,
      password: password || null
    });
    
    toast({
      title: hasPassword ? "Şifre Güncellendi" : "Şifre Eklendi",
      description: password ? "Oda artık şifre korumalı" : "Şifre kaldırıldı",
    });
    
    onClose();
  };

  const handleRemovePassword = () => {
    send("update_password", {
      roomCode,
      password: null
    });
    
    toast({
      title: "Şifre Kaldırıldı",
      description: "Oda artık herkese açık",
    });
    
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-md bg-slate-900/95 border-emerald-900/30">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-4">
            {hasPassword ? 'Oda Şifresini Değiştir' : 'Oda Şifresi Belirle'}
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Yeni Şifre
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifre girin"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Şifre Tekrar
              </label>
              <input 
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Şifreyi tekrar girin"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {hasPassword && (
              <div className="pt-2 border-t border-slate-700">
                <button
                  onClick={handleRemovePassword}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Şifreyi Kaldır
                </button>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <Button 
                onClick={onClose}
                variant="outline"
                className="flex-1"
              >
                İptal
              </Button>
              <Button 
                onClick={handleSubmit}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                disabled={!password || password !== confirmPassword}
              >
                {hasPassword ? 'Güncelle' : 'Şifre Koy'}
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}