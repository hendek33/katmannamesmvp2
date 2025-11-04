import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Player, Team } from "@shared/schema";

interface EndGameVotingProps {
  winningTeam: "dark" | "light";
  losingTeam: "dark" | "light";
  winningTeamName: string;
  losingTeamName: string;
  players: Player[];
  currentPlayerId: string;
  votes: Record<string, string[]>; // targetPlayerId -> voters
  onVote: (targetPlayerId: string) => void;
  onConfirm: (targetPlayerId: string) => void;
  chaosType: "prophet" | "double_agent";
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
  chaosType
}: EndGameVotingProps) {
  const [hasVoted, setHasVoted] = useState(false);
  
  // Get current player
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isOnLosingTeam = currentPlayer?.team === losingTeam;
  const isRoomOwner = currentPlayer?.isRoomOwner || false;
  
  // Get winning team players to vote on
  const winningTeamPlayers = players.filter(p => p.team === winningTeam);
  
  // Get losing team players to see who has voted
  const losingTeamPlayers = players.filter(p => p.team === losingTeam);
  const totalLosingPlayers = losingTeamPlayers.length;
  
  // Get most voted player and vote counts
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
  
  // Check if current player has already voted
  const currentPlayerVote = Object.entries(votes).find(([_, voters]) => 
    voters.includes(currentPlayerId)
  )?.[0];
  
  const handlePlayerClick = (playerId: string) => {
    if (!isOnLosingTeam) return;
    if (currentPlayerVote === playerId) return; // Already voted for this player
    
    onVote(playerId);
    setHasVoted(true);
  };
  
  const handleSelectPlayer = (playerId: string) => {
    if (!isRoomOwner) return;
    onConfirm(playerId);
  };
  
  return (
    <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full p-6 bg-slate-900/95 border-2 border-purple-500/50">
        <div className="space-y-6">
          {/* Title */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold text-purple-400">
              Kahin Tahmini
            </h2>
            <p className="text-xl text-slate-300">
              {losingTeamName} takımı, {winningTeamName} takımındaki kahini tahmin ediyor!
            </p>
            
            {/* Voting Status */}
            <div className="flex justify-center items-center gap-4">
              <div className="text-lg text-amber-400">
                {totalVotes}/{totalLosingPlayers} oyuncu oy kullandı
              </div>
            </div>
            
            {!isOnLosingTeam && (
              <p className="text-amber-400 mt-2">
                Sadece kaybeden takım oy kullanabilir
              </p>
            )}
          </div>
          
          {/* Players Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {winningTeamPlayers.map(player => {
              const playerVotes = votes[player.id] || [];
              const isSelected = currentPlayerVote === player.id;
              const isMostVoted = player.id === mostVotedPlayer;
              
              return (
                <button
                  key={player.id}
                  onClick={() => handlePlayerClick(player.id)}
                  disabled={!isOnLosingTeam}
                  className={cn(
                    "relative p-4 rounded-lg border-2 transition-all duration-300",
                    "hover:scale-105 hover:shadow-xl",
                    isOnLosingTeam && "cursor-pointer",
                    !isOnLosingTeam && !isRoomOwner && "cursor-not-allowed opacity-75",
                    isSelected && "border-purple-400 bg-purple-900/30",
                    !isSelected && isMostVoted && "border-amber-400/50 bg-amber-900/20",
                    !isSelected && !isMostVoted && "border-slate-600 bg-slate-800/50",
                    isRoomOwner && "pb-14" // Extra padding for select button
                  )}
                >
                  {/* Player Avatar */}
                  <div className={cn(
                    "w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold",
                    winningTeam === "dark" ? "bg-blue-600" : "bg-red-600"
                  )}>
                    {player.username.substring(0, 2).toUpperCase()}
                  </div>
                  
                  {/* Player Name */}
                  <p className="text-white font-semibold text-lg">
                    {player.username}
                  </p>
                  
                  {/* Role Badge */}
                  <div className={cn(
                    "mt-2 px-2 py-1 rounded text-xs font-medium",
                    player.role === "spymaster" 
                      ? "bg-purple-600/30 text-purple-300"
                      : "bg-slate-600/30 text-slate-300"
                  )}>
                    {player.role === "spymaster" ? "İpucu Veren" : "Ajan"}
                  </div>
                  
                  {/* Vote Count */}
                  {playerVotes.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {playerVotes.length}
                    </div>
                  )}
                  
                  {/* Voters List */}
                  {playerVotes.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-600">
                      <div className="flex flex-wrap gap-1">
                        {playerVotes.map(voter => (
                          <span
                            key={voter}
                            className="text-xs bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded"
                          >
                            {voter}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-lg border-4 border-purple-400 animate-pulse pointer-events-none" />
                  )}
                  
                  {/* Select Button for Room Owner */}
                  {isRoomOwner && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPlayer(player.id);
                      }}
                      className="absolute bottom-2 left-2 right-2 h-8 text-xs bg-purple-600 hover:bg-purple-700"
                      data-testid={`button-select-${player.id}`}
                    >
                      Bu Oyuncuyu Seç
                    </Button>
                  )}
                </button>
              );
            })}
          </div>
          
          {/* Vote Status */}
          <div className="space-y-2">
            {/* Current Vote Display */}
            {currentPlayerVote && (
              <div className="text-center text-sm text-purple-300">
                Oyunuz: <span className="font-bold">{players.find(p => p.id === currentPlayerVote)?.username}</span>
              </div>
            )}
            
            {/* Most voted player */}
            {mostVotedPlayer && (
              <div className="text-center text-sm text-slate-400">
                En çok oy alan: <span className="font-bold text-purple-300">{players.find(p => p.id === mostVotedPlayer)?.username}</span> ({maxVotes} oy)
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}