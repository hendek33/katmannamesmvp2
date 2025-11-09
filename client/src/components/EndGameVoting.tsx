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
  
  // Show with delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
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
    if (isProphetVotingDisabled) return; // Prophet voting disabled due to consecutive passes
    if (currentPlayerVote === playerId) return; // Already voted for this player
    
    onVote(playerId);
    setHasVoted(true);
  };
  
  const handleSelectPlayer = (playerId: string) => {
    if (!isOnLosingTeam) return;
    if (isProphetVotingDisabled) return; // Prophet voting disabled due to consecutive passes
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
      className="fixed inset-0 z-[90] bg-black/70 backdrop-blur-md flex items-center justify-center p-4"
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
        className="relative max-w-4xl w-full"
      >
        {/* Glow effect behind card */}
        <div 
          className="absolute -inset-8 blur-3xl opacity-20"
          style={{
            background: `radial-gradient(circle, ${
              winningTeam === "dark" 
                ? 'rgba(59,130,246,0.5)' 
                : 'rgba(239,68,68,0.5)'
            } 0%, transparent 70%)`
          }}
        />
        
        <div className="relative bg-gradient-to-br from-slate-900/95 via-slate-800/95 to-slate-900/95 rounded-2xl border border-purple-500/30 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Top gradient strip */}
          <div 
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r"
            style={{
              background: `linear-gradient(90deg, ${
                losingTeam === "dark" 
                  ? '#3B82F6' 
                  : '#EF4444'
              } 0%, #A855F7 50%, ${
                winningTeam === "dark" 
                  ? '#3B82F6' 
                  : '#EF4444'
              } 100%)`
            }}
          />
          
          {/* Minimize Button */}
          <Button
            onClick={() => setIsMinimized(true)}
            variant="outline"
            className="absolute top-4 right-4 bg-purple-600/20 hover:bg-purple-500/30 border-purple-500/50 text-purple-300 hover:text-purple-200 font-semibold z-10"
            data-testid="button-minimize-voting"
          >
            <Minimize2 className="w-4 h-4 mr-2" />
            Küçült
          </Button>
          
          <div className="p-8 space-y-6">
            {/* Title Section with Team Colors */}
            <div className="text-center space-y-4">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-purple-500 to-purple-400 bg-clip-text text-transparent">
                  ⚡ Kahin Tahmini ⚡
                </h2>
              </motion.div>
              
              {/* Team Battle Visual */}
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-4 py-2"
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "px-4 py-2 rounded-lg font-bold text-lg shadow-lg",
                    losingTeam === "dark" 
                      ? "bg-gradient-to-r from-blue-600/80 to-blue-500/80 text-blue-100 border border-blue-400/50" 
                      : "bg-gradient-to-r from-red-600/80 to-red-500/80 text-red-100 border border-red-400/50"
                  )}>
                    {losingTeamName}
                  </div>
                  <span className="text-2xl animate-pulse">⚔️</span>
                </div>
                <span className="text-slate-400 text-xl">vs</span>
                <div className={cn(
                  "px-4 py-2 rounded-lg font-bold text-lg shadow-lg",
                  winningTeam === "dark" 
                    ? "bg-gradient-to-r from-blue-600/80 to-blue-500/80 text-blue-100 border border-blue-400/50" 
                    : "bg-gradient-to-r from-red-600/80 to-red-500/80 text-red-100 border border-red-400/50"
                )}>
                  {winningTeamName} 👑
                </div>
              </motion.div>
              
              <p className="text-lg text-slate-300">
                {losingTeamName} takımı, {winningTeamName} takımındaki <span className="text-purple-400 font-semibold">Kahini</span> tahmin ediyor!
              </p>
            </div>
            
            {/* Voting Progress Bar */}
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="relative"
            >
              <div className="bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(totalVotes / totalLosingPlayers) * 100}%` }}
                  transition={{ delay: 0.6, duration: 0.8 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-sm">
                <span className="text-slate-400">Oy Durumu</span>
                <span className="text-purple-400 font-semibold">
                  {totalVotes}/{totalLosingPlayers} Oyuncu
                </span>
              </div>
            </motion.div>
            
            {/* Show when prophet voting is disabled */}
            {isProphetVotingDisabled && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-red-900/20 to-red-800/20 rounded-xl border border-red-500/50 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="text-3xl animate-pulse">⛔</div>
                  <div>
                    <p className="text-red-400 text-lg font-bold">
                      Kahin Tahmini Devre Dışı
                    </p>
                    <p className="text-red-300 text-sm mt-1">
                      {losingTeamName} takımı art arda 2 tur pas geçtiği için tahmin hakkını kaybetti!
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
            
            {!isOnLosingTeam && !isProphetVotingDisabled && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="p-4 bg-gradient-to-r from-amber-900/20 to-amber-800/20 rounded-xl border border-amber-500/30 backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">👁️</div>
                  <div>
                    <p className="text-amber-400 text-lg font-semibold">
                      İzleyici Modu
                    </p>
                    <p className="text-amber-200/80 text-sm">
                      Kazanan takım olarak sadece izleyebilirsiniz
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Players Grid Section */}
          <div className="px-8 pb-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="space-y-4"
            >
              <h3 className="text-xl font-semibold text-center">
                <span className="text-purple-400">Kahini Seçin</span>
              </h3>
              
              {/* Players Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {winningTeamPlayers.map((player, index) => {
              const playerVotes = votes[player.id] || [];
              const isSelected = currentPlayerVote === player.id;
              const isMostVoted = player.id === mostVotedPlayer;
              
              return (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className={cn(
                    "relative rounded-xl border-2 transition-all duration-300 flex flex-col",
                    "hover:scale-105 hover:shadow-2xl transform-gpu",
                    "bg-gradient-to-br from-slate-800/80 via-slate-800/60 to-slate-900/80 backdrop-blur-sm",
                    isSelected && "border-purple-400 bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 shadow-purple-500/30 shadow-xl",
                    !isSelected && isMostVoted && "border-amber-400/70 bg-gradient-to-br from-amber-900/30 via-amber-800/20 to-amber-900/30 shadow-amber-500/30 shadow-xl",
                    !isSelected && !isMostVoted && "border-slate-600/50 hover:border-purple-500/50"
                  )}
                >
                  {/* Clickable Card Content - Only for losing team */}
                  <div
                    onClick={isOnLosingTeam ? () => handlePlayerClick(player.id) : undefined}
                    className={cn(
                      "flex-1 p-4 text-center",
                      isOnLosingTeam && "cursor-pointer",
                      !isOnLosingTeam && "cursor-default"
                    )}
                  >
                    {/* Player Avatar with gradient */}
                    <div className="relative mb-3">
                      <div className={cn(
                        "w-20 h-20 mx-auto rounded-full flex items-center justify-center text-2xl font-bold shadow-lg",
                        "bg-gradient-to-br border-2",
                        winningTeam === "dark" 
                          ? "from-blue-500/30 to-blue-700/30 border-blue-400/50 text-blue-200" 
                          : "from-red-500/30 to-red-700/30 border-red-400/50 text-red-200"
                      )}>
                        {player.username.charAt(0).toUpperCase()}
                      </div>
                      {/* Glow effect for most voted */}
                      {isMostVoted && (
                        <div className="absolute inset-0 rounded-full animate-pulse">
                          <div className="w-20 h-20 mx-auto rounded-full bg-amber-400/20 blur-md" />
                        </div>
                      )}
                    </div>
                    
                    {/* Player Name with gradient text */}
                    <p className="text-white font-bold text-lg tracking-wide">
                      {player.username}
                    </p>
                    
                    {/* Role Badge with better styling */}
                    <div className={cn(
                      "mt-2 px-3 py-1 rounded-lg text-xs font-semibold inline-block",
                      "bg-gradient-to-r shadow-md",
                      player.role === "spymaster" 
                        ? "from-purple-600/40 to-purple-500/40 text-purple-200 border border-purple-400/30"
                        : "from-slate-600/40 to-slate-500/40 text-slate-200 border border-slate-400/30"
                    )}>
                      {player.role === "spymaster" ? "👑 İSTİHBARAT ŞEFİ" : "🎯 AJAN"}
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
                  
                  {/* Vote Count Badge - Improved */}
                  {playerVotes.length > 0 && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 15 }}
                      className="absolute -top-3 -right-3 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center font-bold shadow-lg border-2 border-purple-400"
                    >
                      {playerVotes.length}
                    </motion.div>
                  )}
                  
                  {/* Selection Indicator - Improved */}
                  {isSelected && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 rounded-xl pointer-events-none"
                    >
                      <div className="absolute inset-0 rounded-xl border-2 border-purple-400 animate-pulse" />
                      <div className="absolute inset-0 rounded-xl border-4 border-purple-400/30" />
                    </motion.div>
                  )}
                  
                  {/* Most Voted Crown */}
                  {isMostVoted && (
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                    >
                      <div className="text-3xl animate-bounce">👑</div>
                    </motion.div>
                  )}
                  
                  {/* Select Button for all losing team members - Improved */}
                  {isOnLosingTeam && !isProphetVotingDisabled && (
                    <div className="px-3 pb-3">
                      <Button
                        onClick={() => handleSelectPlayer(player.id)}
                        className="w-full h-9 text-sm bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold shadow-lg transition-all duration-200"
                        data-testid={`button-select-${player.id}`}
                      >
                        Bu Oyuncuyu Seç
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}