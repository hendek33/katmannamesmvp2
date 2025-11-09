import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { Player } from "@shared/schema";
import { X, AlertCircle, Eye, Users, Trophy, Crown, Sparkles, Info } from "lucide-react";

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
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Get current player
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isOnLosingTeam = currentPlayer?.team === losingTeam;
  const isRoomOwner = currentPlayer?.isRoomOwner || false;
  
  // Check if prophet voting is disabled due to consecutive passes
  const isProphetVotingDisabled = consecutivePasses && consecutivePasses[losingTeam] >= 2;
  
  // Get winning team players to vote on
  const winningTeamPlayers = players.filter(p => p.team === winningTeam);
  
  // Get losing team players to see who has voted
  const losingTeamPlayers = players.filter(p => p.team === losingTeam);
  const totalLosingPlayers = losingTeamPlayers.length;
  
  // Get vote counts and most voted player
  let mostVotedPlayer: string | null = null;
  let maxVotes = 0;
  let totalVotes = 0;
  const voteCounts: Record<string, number> = {};
  
  Object.entries(votes).forEach(([playerId, voters]) => {
    voteCounts[playerId] = voters.length;
    totalVotes += voters.length;
    if (voters.length > maxVotes) {
      maxVotes = voters.length;
      mostVotedPlayer = playerId;
    }
  });
  
  // Check if current player has already voted
  const hasPlayerVoted = Object.values(votes).some(voters => 
    voters.includes(currentPlayerId)
  );

  useEffect(() => {
    setHasVoted(hasPlayerVoted);
  }, [hasPlayerVoted]);

  // Check if current player voted for a specific player
  const getVotedPlayer = () => {
    for (const [playerId, voters] of Object.entries(votes)) {
      if (voters.includes(currentPlayerId)) {
        return playerId;
      }
    }
    return null;
  };

  const votedPlayer = getVotedPlayer();

  useEffect(() => {
    if (votedPlayer) {
      setSelectedPlayer(votedPlayer);
    }
  }, [votedPlayer]);

  const handlePlayerSelect = (playerId: string) => {
    if (hasVoted || !isOnLosingTeam || isProphetVotingDisabled) return;
    setSelectedPlayer(playerId);
  };

  const handleConfirmVote = () => {
    if (selectedPlayer && !hasVoted && isOnLosingTeam && !isProphetVotingDisabled) {
      onVote(selectedPlayer);
      setHasVoted(true);
    }
  };

  const handleClose = () => {
    setIsMinimized(true);
  };

  // Sort players to show most voted first
  const sortedPlayers = [...winningTeamPlayers].sort((a, b) => {
    const votesA = voteCounts[a.id] || 0;
    const votesB = voteCounts[b.id] || 0;
    return votesB - votesA;
  });

  const winnerColor = winningTeam === "dark" ? "from-blue-600 to-blue-700" : "from-red-500 to-red-600";
  const borderColor = winningTeam === "dark" ? "border-blue-500/30" : "border-red-500/30";

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 left-4 z-50 bg-gray-900/95 border border-gray-700 rounded-lg px-4 py-2 flex items-center gap-2 hover:bg-gray-800 transition-all"
      >
        <Sparkles className="w-4 h-4 text-yellow-500" />
        <span className="text-sm text-white">Kahin Tahmini</span>
        {totalVotes > 0 && (
          <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
            {totalVotes} oy
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className={cn(
        "bg-gray-900/95 border-2 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto",
        borderColor
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-gradient-to-r", winnerColor)}>
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Kahin Tahmini</h2>
              <p className="text-xs text-gray-400">
                {winningTeamName} kazandı • {totalVotes}/{totalLosingPlayers} oy
              </p>
            </div>
          </div>
          <Button
            onClick={handleClose}
            variant="ghost"
            size="icon"
            className="text-gray-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Detailed Explanation Section */}
        <div className="bg-gradient-to-br from-yellow-900/20 to-orange-900/20 rounded-lg p-4 mb-4 border border-yellow-600/30">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="font-bold text-yellow-400 text-lg mb-1">Kahin Tahmini Seansı</h3>
                <p className="text-sm text-gray-200 leading-relaxed">
                  <span className="font-semibold text-white">{losingTeamName}</span> takımı, 
                  rakip takımdaki <span className="text-yellow-400 font-semibold">gizli kahini</span> bulmaya çalışıyor!
                </p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5"></div>
                  <p className="text-gray-300">
                    <span className="font-medium text-yellow-400">Kahin kimdir?</span> Oyun başında rastgele 3 kartın rengini görebilen gizli bir oyuncu
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5"></div>
                  <p className="text-gray-300">
                    <span className="font-medium text-green-400">Doğru tahmin = Bonus puan!</span> Eğer kahini bulursanız ekstra puan kazanırsınız
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5"></div>
                  <p className="text-gray-300">
                    <span className="font-medium text-blue-400">İpucu:</span> Kahin genellikle takımına yardımcı olacak ipuçları verir
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Messages */}
        {isProphetVotingDisabled && (
          <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-red-400">
                Takımınız 2 veya daha fazla pas yaptığı için kahin tahmini devre dışı!
              </p>
            </div>
          </div>
        )}

        {!isOnLosingTeam && (
          <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              <p className="text-sm text-blue-400">
                {winningTeamName} takımının oyuncularını izliyorsunuz
              </p>
            </div>
          </div>
        )}

        {/* Players Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {sortedPlayers.map((player) => {
            const voteCount = voteCounts[player.id] || 0;
            const isSelected = selectedPlayer === player.id;
            const isTopVoted = voteCount > 0 && voteCount === maxVotes;
            
            return (
              <button
                key={player.id}
                onClick={() => handlePlayerSelect(player.id)}
                disabled={!isOnLosingTeam || hasVoted || isProphetVotingDisabled}
                className={cn(
                  "relative flex items-center gap-3 p-3 rounded-lg transition-all",
                  "bg-gray-800/50 border",
                  isSelected ? "border-yellow-500 bg-yellow-900/20" : "border-gray-700/50 hover:bg-gray-800/70",
                  (!isOnLosingTeam || hasVoted || isProphetVotingDisabled) && "cursor-not-allowed opacity-60"
                )}
              >
                {isTopVoted && voteCount > 0 && (
                  <Crown className="absolute -top-2 -right-2 w-4 h-4 text-yellow-500" />
                )}
                
                <Avatar className={cn(
                  "w-10 h-10 border-2",
                  player.team === "dark" ? "border-blue-500" : "border-red-500"
                )}>
                  <AvatarFallback className={cn(
                    "text-white font-bold",
                    player.team === "dark" ? "bg-blue-600" : "bg-red-500"
                  )}>
                    {player.username.substring(0, 1).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 text-left">
                  <div className="font-medium text-white text-sm">{player.username}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded",
                      player.team === "dark" 
                        ? "bg-blue-900/50 text-blue-400" 
                        : "bg-red-900/50 text-red-400"
                    )}>
                      {player.team === "dark" ? "Koyu" : "Açık"}
                    </span>
                    <span className="text-gray-500">
                      {player.role === "spymaster" ? "Usta" : "Ajan"}
                    </span>
                  </div>
                </div>

                {voteCount > 0 && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-yellow-900/30 rounded-full">
                    <Users className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs font-bold text-yellow-400">{voteCount}</span>
                  </div>
                )}

                {isSelected && (
                  <div className="absolute inset-0 border-2 border-yellow-500 rounded-lg pointer-events-none" />
                )}
              </button>
            );
          })}
        </div>

        {/* Voted Players List */}
        {totalVotes > 0 && (
          <div className="bg-gray-800/30 rounded-lg p-3 mb-4">
            <h4 className="text-xs font-semibold text-gray-400 mb-2">Oy Kullanan Oyuncular:</h4>
            <div className="flex flex-wrap gap-2">
              {losingTeamPlayers.filter(p => {
                return Object.values(votes).some(voters => voters.includes(p.id));
              }).map(player => (
                <div key={player.id} className="flex items-center gap-1 px-2 py-1 bg-gray-700/50 rounded text-xs">
                  <div className="w-2 h-2 bg-green-400 rounded-full" />
                  <span className="text-gray-300">{player.username}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end">
          {isOnLosingTeam && !isProphetVotingDisabled ? (
            !hasVoted ? (
              <Button
                onClick={handleConfirmVote}
                disabled={!selectedPlayer}
                className={cn(
                  "min-w-[120px]",
                  selectedPlayer 
                    ? "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700" 
                    : ""
                )}
              >
                {selectedPlayer ? "Tahminini Oyla" : "Oyuncu Seç"}
              </Button>
            ) : (
              <div className="text-sm text-green-400 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Oyunuz kaydedildi
              </div>
            )
          ) : null}
        </div>
      </Card>
    </div>
  );
}