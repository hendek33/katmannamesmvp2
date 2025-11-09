import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Player } from "@shared/schema";
import { Minimize2, Maximize2 } from "lucide-react";

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
  consecutivePasses
}: EndGameVotingProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isOnLosingTeam = currentPlayer?.team === losingTeam;
  const isProphetVotingDisabled = consecutivePasses && consecutivePasses[losingTeam] >= 2;
  
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

  // Minimized View
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-4 z-[90] bg-slate-900/95 border border-purple-500/50 rounded-lg p-3 cursor-pointer hover:border-purple-400 transition-all"
           onClick={() => setIsMinimized(false)}>
        <div className="flex items-center gap-3">
          <Maximize2 className="w-4 h-4 text-purple-400" />
          <span className="text-purple-400 font-bold text-sm">Kahin Tahmini</span>
          <span className="text-xs text-slate-400">
            {totalVotes}/{totalLosingPlayers} oy
          </span>
        </div>
      </div>
    );
  }

  // Full View - Balanced Size
  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900/95 rounded-lg border border-purple-500/30 shadow-2xl w-full max-w-2xl">
        {/* Header with better spacing */}
        <div className="bg-slate-800/50 px-5 py-3 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-purple-400 font-bold text-lg">Son Şans: Kahin Tahmini</span>
            {isProphetVotingDisabled ? (
              <span className="text-sm bg-red-900/30 text-red-400 px-2.5 py-1 rounded-md">
                ⛔ Devre Dışı
              </span>
            ) : !isOnLosingTeam ? (
              <span className="text-sm bg-amber-900/30 text-amber-400 px-2.5 py-1 rounded-md">
                👁️ İzleyici Modu
              </span>
            ) : (
              <span className="text-sm bg-purple-600/20 text-purple-300 px-2.5 py-1 rounded-md font-medium">
                Oy: {totalVotes}/{totalLosingPlayers}
              </span>
            )}
            <div className={cn(
              "px-3 py-1 rounded-md text-sm font-semibold",
              winningTeam === "dark" 
                ? "bg-blue-600/30 text-blue-300 border border-blue-500/30" 
                : "bg-red-600/30 text-red-300 border border-red-500/30"
            )}>
              👑 {winningTeamName} Kazandı
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
        
        {/* Balanced Player Grid */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {winningTeamPlayers.map(player => {
              const playerVotes = votes[player.id] || [];
              const isSelected = currentPlayerVote === player.id;
              const isMostVoted = player.id === mostVotedPlayer;
              
              return (
                <div
                  key={player.id}
                  onClick={() => handlePlayerClick(player.id)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-all",
                    isOnLosingTeam && !isProphetVotingDisabled && "cursor-pointer hover:bg-slate-800/50 hover:scale-[1.02]",
                    isSelected ? "border-purple-400 bg-purple-900/30 shadow-lg shadow-purple-500/20" : "border-slate-700 bg-slate-800/30",
                    isMostVoted && "border-amber-400/50 bg-amber-900/20 ring-2 ring-amber-500/30"
                  )}
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
                  
                  {/* Vote Count Badge */}
                  {playerVotes.length > 0 && (
                    <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white text-sm rounded-full px-3 py-1.5 font-bold shadow-lg">
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
                      className="h-8 px-3 text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium"
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
  );
}