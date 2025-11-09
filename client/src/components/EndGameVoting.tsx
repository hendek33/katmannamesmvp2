import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Player, Team } from "@shared/schema";
import { motion } from "framer-motion";
import { Minimize2, Maximize2 } from "lucide-react";

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
  votingPhase?: "loser_voting" | "winner_voting" | "completed";
  endGameGuesses?: any; // Track each team's guess
  endGameFinalResult?: any; // Final result after both teams vote
  bothCorrectOutcome?: "winner_wins" | "draw";
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
  votingPhase = "loser_voting",
  endGameGuesses,
  endGameFinalResult,
  bothCorrectOutcome
}: EndGameVotingProps) {
  const [hasVoted, setHasVoted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Show with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Get current player
  const currentPlayer = players.find(p => p.id === currentPlayerId);
  const isRoomOwner = currentPlayer?.isRoomOwner || false;
  
  // Determine which team can vote based on phase
  const currentVotingTeam = votingPhase === "loser_voting" ? losingTeam : 
                            votingPhase === "winner_voting" ? winningTeam : null;
  const isOnVotingTeam = currentPlayer?.team === currentVotingTeam;
  
  // Check if prophet voting is disabled due to consecutive passes
  const isProphetVotingDisabled = consecutivePasses && consecutivePasses[losingTeam] >= 2;
  
  // Get team players
  const winningTeamPlayers = players.filter(p => p.team === winningTeam);
  const losingTeamPlayers = players.filter(p => p.team === losingTeam);
  const totalLosingPlayers = losingTeamPlayers.length;
  const totalWinningPlayers = winningTeamPlayers.length;
  
  // Determine which team's players to show for voting based on phase
  const targetTeamPlayers = votingPhase === "loser_voting" ? winningTeamPlayers : 
                            votingPhase === "winner_voting" ? losingTeamPlayers : 
                            [];
  
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
    if (!isOnVotingTeam) return;
    if (isProphetVotingDisabled && votingPhase === "loser_voting") return; // Prophet voting disabled for loser team
    if (currentPlayerVote === playerId) return; // Already voted for this player
    
    onVote(playerId);
    setHasVoted(true);
  };
  
  const handleSelectPlayer = (playerId: string) => {
    if (!isOnVotingTeam) return;
    if (isProphetVotingDisabled && votingPhase === "loser_voting") return; // Prophet voting disabled for loser team
    onConfirm(playerId);
  };
  
  if (!isVisible) return null;

  // Minimized View - Small bar at bottom
  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-4 left-4 z-[90]"
      >
        <Card 
          className="p-4 bg-slate-900/95 border-2 border-purple-500/50 cursor-pointer hover:border-purple-400 transition-all"
          onClick={() => setIsMinimized(false)}
        >
          <div className="flex items-center gap-3">
            <Maximize2 className="w-5 h-5 text-purple-400" />
            <div className="flex flex-col">
              <span className="text-purple-400 font-bold">Kahin Tahmini</span>
              <span className="text-xs text-slate-400">
                {totalVotes}/{totalLosingPlayers} oy - Büyütmek için tıkla
              </span>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Full View
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ 
          duration: 0.5,
          type: "spring",
          stiffness: 200,
          damping: 20
        }}
      >
        <Card className="max-w-4xl w-full p-6 bg-slate-900/95 border-2 border-purple-500/50 relative">
          {/* Minimize Button */}
          <Button
            onClick={() => setIsMinimized(true)}
            variant="outline"
            className="absolute top-2 right-2 bg-purple-600/20 hover:bg-purple-500/30 border-purple-500/50 text-purple-300 hover:text-purple-200 font-semibold"
            data-testid="button-minimize-voting"
          >
            <Minimize2 className="w-4 h-4 mr-2" />
            Küçült
          </Button>
          
          <div className="space-y-6">
            {/* Title */}
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-purple-400">
                Kahin Tahmini
              </h2>
              
              {/* Phase-specific subtitle */}
              {votingPhase === "loser_voting" && (
                <p className="text-xl text-slate-300">
                  {losingTeamName} takımı, {winningTeamName} takımındaki kahini tahmin ediyor!
                </p>
              )}
              
              {votingPhase === "winner_voting" && (
                <p className="text-xl text-slate-300">
                  {winningTeamName} takımı, {losingTeamName} takımındaki kahini tahmin ediyor!
                </p>
              )}
              
              {votingPhase === "completed" && (
                <p className="text-xl text-slate-300">
                  Tahmin sonuçları açıklanıyor...
                </p>
              )}
            
            {/* Voting Status - only show during active voting */}
            {(votingPhase === "loser_voting" || votingPhase === "winner_voting") && (
              <div className="flex justify-center items-center gap-4">
                <div className="text-lg text-amber-400">
                  {totalVotes}/{votingPhase === "loser_voting" ? totalLosingPlayers : totalWinningPlayers} oyuncu oy kullandı
                </div>
              </div>
            )}
            
            {/* Show when prophet voting is disabled */}
            {isProphetVotingDisabled && (
              <div className="mt-4 p-4 bg-red-900/20 rounded-lg border-2 border-red-500/50">
                <p className="text-red-400 text-lg font-bold">
                  ⚠️ Kahin Tahmini Devre Dışı
                </p>
                <p className="text-red-300 text-sm mt-2">
                  {losingTeamName} takımı art arda 2 tur pas geçtiği için kahin tahmini hakkını kaybetti!
                </p>
              </div>
            )}
            
            {!isOnVotingTeam && !isProphetVotingDisabled && votingPhase !== "completed" && (
              <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-amber-400 text-lg font-semibold">
                  👁️ İzleyici Modu
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {votingPhase === "loser_voting" && currentPlayer?.team === winningTeam && 
                    "Kazanan takım olarak kaybeden takımın tahminini bekliyorsunuz"}
                  {votingPhase === "winner_voting" && currentPlayer?.team === losingTeam && 
                    "Kaybeden takım olarak kazanan takımın tahminini bekliyorsunuz"}
                </p>
              </div>
            )}
          </div>
          
          {/* Show results for completed phase */}
          {votingPhase === "completed" && endGameFinalResult && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border-2 border-purple-500/50">
              <h3 className="text-2xl font-bold text-center mb-4">
                {endGameFinalResult.finalOutcome === "draw" ? 
                  "🤝 Berabere!" : 
                  `🏆 ${endGameFinalResult.finalOutcome === winningTeam ? winningTeamName : losingTeamName} Kazandı!`}
              </h3>
              <div className="space-y-2">
                <p className="text-lg">
                  {losingTeamName} takımının tahmini: {endGameGuesses?.loser?.correct ? "✅ Doğru" : "❌ Yanlış"}
                  {endGameGuesses?.loser?.targetPlayerId && ` (${players.find(p => p.id === endGameGuesses.loser.targetPlayerId)?.username})`}
                </p>
                <p className="text-lg">
                  {winningTeamName} takımının tahmini: {endGameGuesses?.winner?.correct ? "✅ Doğru" : "❌ Yanlış"}
                  {endGameGuesses?.winner?.targetPlayerId && ` (${players.find(p => p.id === endGameGuesses.winner.targetPlayerId)?.username})`}
                </p>
              </div>
            </div>
          )}
          
          {/* Players Grid - Only show during voting phases */}
          {(votingPhase === "loser_voting" || votingPhase === "winner_voting") && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {targetTeamPlayers.map(player => {
              const playerVotes = votes[player.id] || [];
              const isSelected = currentPlayerVote === player.id;
              const isMostVoted = player.id === mostVotedPlayer;
              
              return (
                <div
                  key={player.id}
                  className={cn(
                    "relative rounded-lg border-2 transition-all duration-300 flex flex-col",
                    "hover:scale-105 hover:shadow-xl",
                    isSelected && "border-purple-400 bg-purple-900/30",
                    !isSelected && isMostVoted && "border-amber-400/50 bg-amber-900/20",
                    !isSelected && !isMostVoted && "border-slate-600 bg-slate-800/50"
                  )}
                >
                  {/* Clickable Card Content - Only for voting team */}
                  <div
                    onClick={isOnVotingTeam ? () => handlePlayerClick(player.id) : undefined}
                    className={cn(
                      "flex-1 p-4 text-center",
                      isOnVotingTeam && "cursor-pointer",
                      !isOnVotingTeam && "cursor-default"
                    )}
                  >
                    {/* Player Avatar */}
                    <div className={cn(
                      "w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center text-2xl font-bold",
                      player.team === "dark" ? "bg-blue-600" : "bg-red-600"
                    )}>
                      {player.username.substring(0, 2).toUpperCase()}
                    </div>
                    
                    {/* Player Name */}
                    <p className="text-white font-semibold text-lg">
                      {player.username}
                    </p>
                    
                    {/* Role Badge */}
                    <div className={cn(
                      "mt-2 px-2 py-1 rounded text-xs font-medium inline-block",
                      player.role === "spymaster" 
                        ? "bg-purple-600/30 text-purple-300"
                        : "bg-slate-600/30 text-slate-300"
                    )}>
                      {player.role === "spymaster" ? "İpucu Veren" : "Ajan"}
                    </div>
                    
                    {/* Voters List */}
                    {playerVotes.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-600">
                        <div className="flex flex-wrap gap-1 justify-center">
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
                  </div>
                  
                  {/* Vote Count Badge */}
                  {playerVotes.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-purple-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold">
                      {playerVotes.length}
                    </div>
                  )}
                  
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-lg border-4 border-purple-400 animate-pulse pointer-events-none" />
                  )}
                  
                  {/* Select Button for all voting team members */}
                  {isOnVotingTeam && (
                    <div className="px-2 pb-2">
                      <Button
                        onClick={() => handleSelectPlayer(player.id)}
                        className="w-full h-8 text-xs bg-purple-600 hover:bg-purple-700"
                        data-testid={`button-select-${player.id}`}
                      >
                        Bu Oyuncuyu Seç
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          )}
          
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
      </motion.div>
    </motion.div>
  );
}