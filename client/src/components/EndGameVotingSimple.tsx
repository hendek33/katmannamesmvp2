import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Player } from "@shared/schema";
import { Minimize2, Maximize2 } from "lucide-react";
import { useInlineVideo } from "@/hooks/useInlineVideo";

interface EndGameVotingProps {
  winningTeam: "dark" | "light";
  losingTeam: "dark" | "light";
  winningTeamName: string;
  losingTeamName: string;
  players: Player[];
  currentPlayerId: string;
  votes: Record<string, string[]>;
  onVote: (targetPlayerId: string) => void;
  onConfirm: (targetPlayerId: string) => void;
  chaosType: "prophet" | "double_agent";
  consecutivePasses?: { dark: number; light: number };
  disableReason?: "assassin" | "opponent_last_card" | "consecutive_passes" | null;
}

export function EndGameVoting({
  winningTeam,
  losingTeam,
  winningTeamName,
  losingTeamName,
  players,
  currentPlayerId,
  votes,
  onVote,
  onConfirm,
  chaosType,
  consecutivePasses,
  disableReason
}: EndGameVotingProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Prophet selection window video
  const videoSrc = "/kahin seçim penceresi.webm";
  const { videoRef, base64Url } = useInlineVideo(videoSrc, {
    autoPlay: true
  });
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
      setIsAnimating(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);
  
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isOnLosingTeam = currentPlayer?.team === losingTeam;
  
  // Check if prophet voting is disabled (either by explicit disable reason or consecutive passes)
  const hasConsecutivePasses = consecutivePasses && consecutivePasses[losingTeam] >= 2;
  const isProphetVotingDisabled = (disableReason !== null && disableReason !== undefined) || hasConsecutivePasses;
  
  // Get the disable reason text - check both explicit reason and consecutive passes
  const getDisableReasonText = () => {
    if (disableReason === "assassin") {
      return "Suikastçı kartı bulunduğu için kahin tahmini devre dışı!";
    } else if (disableReason === "opponent_last_card") {
      return "Karşı takımın son kartı bulunduğu için kahin tahmini devre dışı!";
    } else if (disableReason === "consecutive_passes" || hasConsecutivePasses) {
      return "2 kez üst üste pas geçildiği için kahin tahmini devre dışı!";
    }
    return null;
  };
  
  const winningTeamPlayers = players.filter(p => p.team === winningTeam);
  const losingTeamPlayers = players.filter(p => p.team === losingTeam);
  const totalLosingPlayers = losingTeamPlayers.length;
  
  let mostVotedPlayer: string | null = null;
  let maxVotes = 0;
  let totalVotes = 0;
  Object.entries(votes).forEach(([playerId, voters]) => {
    totalVotes += voters.length;
    if (voters.length > maxVotes) {
      maxVotes = voters.length;
      mostVotedPlayer = playerId;
    }
  });
  
  const currentPlayerVote = Object.entries(votes).find(([_, voters]) => 
    voters.includes(currentPlayerId)
  )?.[0];
  
  const handlePlayerClick = (playerId: string) => {
    if (!isOnLosingTeam || isProphetVotingDisabled) return;
    if (currentPlayerVote === playerId) return;
    onVote(playerId);
    setHasVoted(true);
  };
  
  const handleSelectPlayer = (playerId: string) => {
    if (!isOnLosingTeam || isProphetVotingDisabled) return;
    onConfirm(playerId);
  };
  
  if (!isVisible) return null;

  // Minimized View with glassmorphism
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-[90] bg-slate-900/60 backdrop-blur-lg border border-purple-500/30 rounded-lg p-3 cursor-pointer hover:border-purple-400 transition-all shadow-lg shadow-purple-500/20"
           onClick={() => setIsMinimized(false)}>
        <div className="flex items-center gap-3">
          <Maximize2 className="w-4 h-4 text-purple-400 animate-pulse" />
          <span className="text-purple-400 font-bold text-sm">Kahin Tahmini</span>
          <span className="text-xs text-purple-300/80">
            {totalVotes}/{totalLosingPlayers} oy
          </span>
        </div>
      </div>
    );
  }

  // Full View with Glassmorphism and Animation
  return (
    <>
      <div className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
        <div 
          className={cn(
            "bg-gradient-to-br from-slate-900/40 via-purple-900/20 to-slate-900/40 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl w-full max-w-2xl",
            "before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-r before:from-purple-500/20 before:via-transparent before:to-purple-500/20 before:opacity-50",
            isAnimating && "animate-in fade-in-0 zoom-in-95 duration-500"
          )}
          style={{
            boxShadow: '0 20px 70px -10px rgba(168,85,247,0.4), 0 10px 40px -10px rgba(168,85,247,0.3)',
          }}
        >
        {/* Glassmorphic Header */}
        <div className="relative bg-gradient-to-r from-purple-900/30 via-purple-800/20 to-purple-900/30 backdrop-blur-md px-5 py-3 border-b border-purple-500/20 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-purple-400 font-bold text-lg">Son Şans: Kahin Tahmini</span>
            {isProphetVotingDisabled ? (
              <span className="text-sm bg-red-900/40 backdrop-blur-sm text-red-300 px-2.5 py-1 rounded-lg border border-red-500/30">
                ⛔ Devre Dışı
              </span>
            ) : !isOnLosingTeam ? (
              <span className="text-sm bg-amber-900/40 backdrop-blur-sm text-amber-300 px-2.5 py-1 rounded-lg border border-amber-500/30">
                👁️ İzleyici Modu
              </span>
            ) : (
              <span className="text-sm bg-purple-600/30 backdrop-blur-sm text-purple-300 px-2.5 py-1 rounded-lg font-medium border border-purple-500/30">
                Oy: {totalVotes}/{totalLosingPlayers}
              </span>
            )}
            <div className={cn(
              "px-3 py-1 rounded-lg text-sm font-semibold backdrop-blur-sm",
              winningTeam === "dark" 
                ? "bg-gradient-to-r from-blue-600/30 to-blue-500/20 text-blue-300 border border-blue-400/30" 
                : "bg-gradient-to-r from-red-600/30 to-red-500/20 text-red-300 border border-red-400/30"
            )}>
              <span className="animate-pulse">👑</span> {winningTeamName} Kazandı
            </div>
          </div>
          <Button
            onClick={() => setIsMinimized(true)}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-purple-400 hover:text-purple-300"
          >
            <Minimize2 className="w-3 h-3" />
          </Button>
        </div>
        
        {/* Disable Reason Display */}
        {isProphetVotingDisabled && getDisableReasonText() && (
          <div className="px-5 py-3 bg-red-900/20 border-b border-red-500/20">
            <p className="text-red-300 text-sm font-medium text-center">
              {getDisableReasonText()}
            </p>
          </div>
        )}
        
        {/* Glassmorphic Player Grid */}
        <div className="relative p-4">
          <div className="grid grid-cols-2 gap-3">
            {winningTeamPlayers.map((player, index) => {
              const playerVotes = votes[player.id] || [];
              const isSelected = currentPlayerVote === player.id;
              const isMostVoted = player.id === mostVotedPlayer;
              
              return (
                <div
                  key={player.id}
                  onClick={() => handlePlayerClick(player.id)}
                  className={cn(
                    "relative flex items-center gap-3 p-3 rounded-xl border backdrop-blur-sm transition-all duration-300",
                    "bg-gradient-to-br from-slate-800/30 via-slate-900/20 to-slate-800/30",
                    isOnLosingTeam && !isProphetVotingDisabled && "cursor-pointer hover:from-purple-800/30 hover:via-purple-900/20 hover:to-purple-800/30 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20",
                    isSelected ? "border-purple-400/60 from-purple-900/40 via-purple-800/30 to-purple-900/40 shadow-lg shadow-purple-500/30" : "border-slate-600/30",
                    isMostVoted && "border-amber-400/60 from-amber-900/30 via-amber-800/20 to-amber-900/30 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/20"
                  )}
                  style={{
                    animation: isAnimating ? `slideIn ${0.3 + index * 0.05}s ease-out` : undefined,
                  }}
                >
                  {/* Larger Avatar */}
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shadow-md",
                    winningTeam === "dark" 
                      ? "bg-gradient-to-br from-blue-600 to-blue-700 text-white" 
                      : "bg-gradient-to-br from-red-600 to-red-700 text-white"
                  )}>
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Name and Role */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-base font-semibold truncate flex items-center gap-1">
                      {player.username}
                      {isMostVoted && <span className="text-amber-400">👑</span>}
                    </p>
                    <p className="text-sm text-slate-400">
                      {player.role === "spymaster" ? "🎯 İpucu Veren" : "🕵️ Ajan"}
                    </p>
                  </div>
                  
                  {/* Glassmorphic Vote Count Badge */}
                  {playerVotes.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-600/60 to-purple-700/60 backdrop-blur-md text-white text-sm rounded-full px-3 py-1.5 font-bold shadow-lg shadow-purple-500/30 border border-purple-400/30">
                      {playerVotes.length}
                    </div>
                  )}
                  
                  {isOnLosingTeam && !isProphetVotingDisabled && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlayer(player.id);
                      }}
                      size="sm"
                      className="h-8 px-3 text-sm bg-gradient-to-r from-purple-600/70 to-purple-700/70 backdrop-blur-sm hover:from-purple-500/80 hover:to-purple-600/80 text-white font-medium border border-purple-400/30 shadow-md shadow-purple-500/20 transition-all duration-300"
                      disabled={isSelected}
                    >
                      {isSelected ? "Seçildi ✓" : "Seç"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
      
    {/* Prophet Selection Video - Outside the modal, at bottom center */}
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[91]">
        <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-purple-500/50 shadow-2xl bg-slate-900">
          <video
            ref={videoRef}
            src={base64Url || videoSrc}
            className="w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
          />
          {/* Purple gradient overlay for better blending */}
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/30 to-transparent pointer-events-none" />
        </div>
      </div>
      
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-in {
          animation-fill-mode: both;
        }
        
        .fade-in-0 {
          opacity: 0;
          animation: fadeIn 0.5s ease-out forwards;
        }
        
        .zoom-in-95 {
          transform: scale(0.95);
          animation: zoomIn 0.5s ease-out forwards;
        }
        
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
        
        @keyframes zoomIn {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(30px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </>
  );
}