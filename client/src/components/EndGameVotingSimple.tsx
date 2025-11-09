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

  // Full View - Ultra Compact
  return (
    <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900/95 rounded-lg border border-purple-500/30 shadow-2xl w-full max-w-xl">
        {/* Single Line Header */}
        <div className="bg-slate-800/50 px-4 py-2 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-purple-400 font-bold">Kahin Tahmini</span>
            {isProphetVotingDisabled ? (
              <span className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">
                ⛔ Devre Dışı
              </span>
            ) : !isOnLosingTeam ? (
              <span className="text-xs bg-amber-900/30 text-amber-400 px-2 py-0.5 rounded">
                👁️ İzleyici
              </span>
            ) : (
              <span className="text-xs bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded">
                {totalVotes}/{totalLosingPlayers} oy
              </span>
            )}
            <div className={cn(
              "px-2 py-0.5 rounded text-xs font-medium",
              winningTeam === "dark" 
                ? "bg-blue-600/30 text-blue-300" 
                : "bg-red-600/30 text-red-300"
            )}>
              👑 {winningTeamName}
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
        
        {/* Ultra Compact Player Grid */}
        <div className="p-3">
          <div className="grid grid-cols-2 gap-2">
            {winningTeamPlayers.map(player => {
              const playerVotes = votes[player.id] || [];
              const isSelected = currentPlayerVote === player.id;
              const isMostVoted = player.id === mostVotedPlayer;
              
              return (
                <div
                  key={player.id}
                  onClick={() => handlePlayerClick(player.id)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-lg border transition-all",
                    isOnLosingTeam && !isProphetVotingDisabled && "cursor-pointer hover:bg-slate-800/50",
                    isSelected ? "border-purple-400 bg-purple-900/30" : "border-slate-700 bg-slate-800/30",
                    isMostVoted && "border-amber-400/50 bg-amber-900/20"
                  )}
                >
                  {/* Mini Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                    winningTeam === "dark" 
                      ? "bg-blue-600/40 text-blue-300" 
                      : "bg-red-600/40 text-red-300"
                  )}>
                    {player.username.charAt(0).toUpperCase()}
                  </div>
                  
                  {/* Name and Role */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {player.username}
                      {isMostVoted && " 👑"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {player.role === "spymaster" ? "İpucu" : "Ajan"}
                    </p>
                  </div>
                  
                  {/* Vote Count or Button */}
                  {playerVotes.length > 0 && (
                    <div className="bg-purple-600 text-white text-xs rounded px-2 py-1 font-bold">
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
                      className="h-6 px-2 text-xs bg-purple-600 hover:bg-purple-700"
                      disabled={isSelected}
                    >
                      {isSelected ? "✓" : "Seç"}
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