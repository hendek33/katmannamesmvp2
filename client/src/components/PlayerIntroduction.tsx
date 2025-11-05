import { useState, useEffect } from "react";
import type { GameState, Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, SkipForward } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlayerIntroductionProps {
  gameState: GameState;
  playerId: string;
  onSelectPlayer: (playerId: string) => void;
  onFinishIntroduction: (playerId: string) => void;
  onLikeDislike: (targetPlayerId: string, isLike: boolean) => void;
  onSkipIntroduction: () => void;
}

export function PlayerIntroduction({
  gameState,
  playerId,
  onSelectPlayer,
  onFinishIntroduction,
  onLikeDislike,
  onSkipIntroduction,
}: PlayerIntroductionProps) {
  const [showTitle, setShowTitle] = useState(true);
  const [playerBubbles, setPlayerBubbles] = useState<Player[]>([]);
  
  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const isController = currentPlayer?.team === "dark" && currentPlayer?.role === "spymaster";
  const currentIntroducingPlayer = gameState.introductionPhase?.currentIntroducingPlayer;
  const introducingPlayer = gameState.players.find(p => p.id === currentIntroducingPlayer);
  
  // Filter players by team
  const darkTeamPlayers = gameState.players.filter(p => p.team === "dark");
  const lightTeamPlayers = gameState.players.filter(p => p.team === "light");
  
  useEffect(() => {
    // Hide title after 2 seconds
    const timer = setTimeout(() => {
      setShowTitle(false);
    }, 2000);
    
    // Show player bubbles with random delay
    const allPlayers = [...darkTeamPlayers, ...lightTeamPlayers];
    const shuffled = [...allPlayers].sort(() => Math.random() - 0.5);
    
    shuffled.forEach((player, index) => {
      setTimeout(() => {
        setPlayerBubbles(prev => [...prev, player]);
      }, 2500 + index * 200); // Start after title disappears
    });
    
    return () => clearTimeout(timer);
  }, []);
  
  const handlePlayerClick = (player: Player) => {
    if (isController && !player.introduced && !currentIntroducingPlayer) {
      onSelectPlayer(player.id);
    }
  };
  
  const handleFinishIntroduction = () => {
    if (isController && currentIntroducingPlayer) {
      onFinishIntroduction(currentIntroducingPlayer);
    }
  };
  
  const handleLikeDislike = (isLike: boolean) => {
    if (currentIntroducingPlayer && playerId !== currentIntroducingPlayer) {
      onLikeDislike(currentIntroducingPlayer, isLike);
    }
  };
  
  // Get likes and dislikes for current introducing player
  const getLikesAndDislikes = () => {
    if (!introducingPlayer) return { likes: [], dislikes: [] };
    
    const likes = Object.entries(introducingPlayer.introductionLikes || {}).map(([voterId, team]) => {
      const voter = gameState.players.find(p => p.id === voterId);
      return { username: voter?.username || "Unknown", team };
    });
    
    const dislikes = Object.entries(introducingPlayer.introductionDislikes || {}).map(([voterId, team]) => {
      const voter = gameState.players.find(p => p.id === voterId);
      return { username: voter?.username || "Unknown", team };
    });
    
    return { likes, dislikes };
  };
  
  const { likes, dislikes } = getLikesAndDislikes();
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/90 z-50">
      <div className="relative w-full max-w-6xl h-[80vh] p-8">
        {/* Title Animation */}
        <AnimatePresence>
          {showTitle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center z-20"
            >
              <h1 className="text-6xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Şimdi oyuncular kendilerini tanıtacak!
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Player Bubbles */}
        {!showTitle && (
          <div className="relative h-full flex">
            {/* Dark Team (Left) */}
            <div className="w-1/2 pr-4">
              <h2 className="text-2xl font-bold mb-4 text-dark-team">{gameState.darkTeamName}</h2>
              <div className="space-y-3">
                {darkTeamPlayers.map(player => {
                  const isInBubbles = playerBubbles.some(p => p.id === player.id);
                  const isIntroducing = player.id === currentIntroducingPlayer;
                  const hasBeenIntroduced = player.introduced;
                  
                  return isInBubbles ? (
                    <motion.div
                      key={player.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: isIntroducing ? 1.2 : 1, 
                        opacity: hasBeenIntroduced ? 0.5 : 1 
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`
                        relative p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${isIntroducing ? 'border-primary shadow-2xl z-10' : 'border-dark-team/50'}
                        ${hasBeenIntroduced ? 'bg-dark-team/10' : 'bg-dark-team/30 hover:bg-dark-team/40'}
                      `}
                      onClick={() => handlePlayerClick(player)}
                      data-testid={`player-bubble-${player.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">{player.username}</span>
                        <span className="text-sm text-muted-foreground">
                          {player.role === "spymaster" ? "İstihbarat Şefi" : "Ajan"}
                        </span>
                      </div>
                    </motion.div>
                  ) : null;
                })}
              </div>
            </div>
            
            {/* Light Team (Right) */}
            <div className="w-1/2 pl-4">
              <h2 className="text-2xl font-bold mb-4 text-light-team">{gameState.lightTeamName}</h2>
              <div className="space-y-3">
                {lightTeamPlayers.map(player => {
                  const isInBubbles = playerBubbles.some(p => p.id === player.id);
                  const isIntroducing = player.id === currentIntroducingPlayer;
                  const hasBeenIntroduced = player.introduced;
                  
                  return isInBubbles ? (
                    <motion.div
                      key={player.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: isIntroducing ? 1.2 : 1, 
                        opacity: hasBeenIntroduced ? 0.5 : 1 
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className={`
                        relative p-4 rounded-xl border-2 cursor-pointer transition-all
                        ${isIntroducing ? 'border-primary shadow-2xl z-10' : 'border-light-team/50'}
                        ${hasBeenIntroduced ? 'bg-light-team/10' : 'bg-light-team/30 hover:bg-light-team/40'}
                      `}
                      onClick={() => handlePlayerClick(player)}
                      data-testid={`player-bubble-${player.id}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-semibold">{player.username}</span>
                        <span className="text-sm text-muted-foreground">
                          {player.role === "spymaster" ? "İstihbarat Şefi" : "Ajan"}
                        </span>
                      </div>
                    </motion.div>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        )}
        
        {/* Current Introduction Banner */}
        {currentIntroducingPlayer && introducingPlayer && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30"
          >
            <div className="bg-background/95 p-8 rounded-2xl shadow-2xl border-4 border-primary">
              <h2 className="text-4xl font-bold text-center mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {introducingPlayer.username} KENDİNİ TANITIYOR...
              </h2>
              
              {/* Like/Dislike Display */}
              <div className="flex justify-around mt-6">
                {/* Likes */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <ThumbsUp className="w-8 h-8 text-green-500 mr-2" />
                    <span className="text-2xl font-bold">{likes.length}</span>
                  </div>
                  <div className="space-y-1">
                    {likes.map((like, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`text-sm px-2 py-1 rounded ${
                          like.team === "dark" ? 'bg-dark-team/20 text-dark-team' : 'bg-light-team/20 text-light-team'
                        }`}
                      >
                        {like.username}
                      </motion.div>
                    ))}
                  </div>
                </div>
                
                {/* Dislikes */}
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <ThumbsDown className="w-8 h-8 text-red-500 mr-2" />
                    <span className="text-2xl font-bold">{dislikes.length}</span>
                  </div>
                  <div className="space-y-1">
                    {dislikes.map((dislike, index) => (
                      <motion.div
                        key={index}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className={`text-sm px-2 py-1 rounded ${
                          dislike.team === "dark" ? 'bg-dark-team/20 text-dark-team' : 'bg-light-team/20 text-light-team'
                        }`}
                      >
                        {dislike.username}
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Control Buttons */}
              {isController && (
                <div className="mt-6 flex justify-center">
                  <Button
                    onClick={handleFinishIntroduction}
                    className="bg-primary hover:bg-primary/90"
                    data-testid="finish-introduction-button"
                  >
                    Tanıtımı Bitir
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* Like/Dislike Buttons for Other Players */}
        {currentIntroducingPlayer && playerId !== currentIntroducingPlayer && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 z-40">
            <Button
              onClick={() => handleLikeDislike(true)}
              variant="outline"
              className="border-green-500 hover:bg-green-500/20"
              data-testid="like-button"
            >
              <ThumbsUp className="w-5 h-5 mr-2 text-green-500" />
              Beğen
            </Button>
            <Button
              onClick={() => handleLikeDislike(false)}
              variant="outline"
              className="border-red-500 hover:bg-red-500/20"
              data-testid="dislike-button"
            >
              <ThumbsDown className="w-5 h-5 mr-2 text-red-500" />
              Beğenme
            </Button>
          </div>
        )}
        
        {/* Skip Introduction Button */}
        {isController && (
          <div className="absolute top-4 right-4 z-40">
            <Button
              onClick={onSkipIntroduction}
              variant="secondary"
              data-testid="skip-introduction-button"
            >
              <SkipForward className="w-5 h-5 mr-2" />
              Tanıtımı Atla
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}