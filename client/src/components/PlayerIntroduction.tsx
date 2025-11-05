import { useState, useEffect } from "react";
import type { GameState, Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, SkipForward, Crown, Users, Sparkles, Heart, UserCircle, ChevronRight } from "lucide-react";
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
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  
  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const isController = currentPlayer?.team === "light" && currentPlayer?.role === "spymaster"; // Red team (light) spymaster controls
  const currentIntroducingPlayer = gameState.introductionPhase?.currentIntroducingPlayer;
  const introducingPlayer = gameState.players.find(p => p.id === currentIntroducingPlayer);
  
  // Filter players by team
  const darkTeamPlayers = gameState.players.filter(p => p.team === "dark");
  const lightTeamPlayers = gameState.players.filter(p => p.team === "light");
  
  // Check if current player already voted
  const hasVoted = introducingPlayer && (
    (introducingPlayer.introductionLikes && playerId in introducingPlayer.introductionLikes) ||
    (introducingPlayer.introductionDislikes && playerId in introducingPlayer.introductionDislikes)
  );
  
  useEffect(() => {
    // Hide title after 3 seconds
    const timer = setTimeout(() => {
      setShowTitle(false);
    }, 3000);
    
    // Show player bubbles with staggered animation
    const allPlayers = [...darkTeamPlayers, ...lightTeamPlayers];
    allPlayers.forEach((player, index) => {
      setTimeout(() => {
        setPlayerBubbles(prev => [...prev, player]);
      }, 3500 + index * 150); // Start after title disappears
    });
    
    return () => clearTimeout(timer);
  }, [darkTeamPlayers.length, lightTeamPlayers.length]);
  
  const handlePlayerClick = (player: Player) => {
    console.log('🔍 Player clicked:', {
      playerName: player.username,
      playerId: player.id,
      isController,
      playerIntroduced: player.introduced,
      currentIntroducingPlayer,
      currentPlayerTeam: currentPlayer?.team,
      currentPlayerRole: currentPlayer?.role
    });
    
    if (isController && !player.introduced && !currentIntroducingPlayer) {
      console.log('✅ Sending select_player_for_introduction for:', player.username);
      onSelectPlayer(player.id);
    } else {
      console.log('❌ Click ignored - conditions not met:', {
        isController,
        playerIntroduced: player.introduced,
        hasCurrentIntroducingPlayer: !!currentIntroducingPlayer
      });
    }
  };
  
  const handleFinishIntroduction = () => {
    if (isController && currentIntroducingPlayer) {
      onFinishIntroduction(currentIntroducingPlayer);
    }
  };
  
  const handleLikeDislike = (isLike: boolean) => {
    if (currentIntroducingPlayer && playerId !== currentIntroducingPlayer && !hasVoted) {
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
    <div className="relative w-full max-w-6xl mx-auto">
      <div className="relative flex flex-col">
        {/* Title Animation */}
        <AnimatePresence>
          {showTitle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center py-12"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                  className="text-center"
                >
                  <h1 className="text-5xl md:text-6xl font-black mb-4 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent drop-shadow-2xl">
                    TANIŞMA ZAMANI!
                  </h1>
                  <p className="text-xl text-white/90 font-semibold">
                    Oyuncular kendilerini tanıtacak
                  </p>
                  <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mt-4 animate-pulse" />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Skip Button - Always visible for controller */}
        {isController && !showTitle && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-end mb-4"
          >
            <Button
              onClick={onSkipIntroduction}
              variant="outline"
              className="bg-slate-900/80 hover:bg-slate-900/90 border-white/20 text-white backdrop-blur-md"
              data-testid="skip-introduction-button"
            >
              <SkipForward className="w-4 h-4 mr-2" />
              Tanıtımı Atla ve Oyuna Başla
            </Button>
          </motion.div>
        )}
        
        {/* Main Content Area */}
        {!showTitle && (
          <div className="flex items-center justify-center">
            {!currentIntroducingPlayer ? (
              /* Player Selection Grid */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-7xl"
              >
                {isController && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                  >
                    <Badge className="text-lg px-6 py-2 bg-red-600 text-white border-0">
                      <Crown className="w-5 h-5 mr-2" />
                      Bir oyuncu seçerek tanıtımını başlat
                    </Badge>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-2 gap-8">
                  {/* Dark Team (Blue) */}
                  <div>
                    <div className="flex items-center justify-center mb-6">
                      <div className="bg-blue-600/20 backdrop-blur-md rounded-xl px-6 py-3 border border-blue-500/30">
                        <h2 className="text-2xl font-bold text-blue-400 flex items-center">
                          <Users className="w-6 h-6 mr-2" />
                          {gameState.darkTeamName}
                        </h2>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {darkTeamPlayers.map((player, index) => {
                        const isInBubbles = playerBubbles.some(p => p.id === player.id);
                        const hasBeenIntroduced = player.introduced;
                        
                        return isInBubbles ? (
                          <motion.div
                            key={player.id}
                            initial={{ x: -100, opacity: 0 }}
                            animate={{ x: 0, opacity: hasBeenIntroduced ? 0.5 : 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card
                              className={`
                                relative p-4 cursor-pointer transition-all duration-300
                                ${hasBeenIntroduced 
                                  ? 'bg-blue-900/20 border-blue-800/30' 
                                  : 'bg-blue-900/40 hover:bg-blue-900/60 border-blue-600/50 hover:border-blue-500/70'
                                }
                                ${isController && !hasBeenIntroduced && !currentIntroducingPlayer ? 'hover:scale-105 hover:shadow-2xl hover:shadow-blue-600/20' : ''}
                                ${hoveredPlayer === player.id ? 'ring-2 ring-blue-400' : ''}
                                backdrop-blur-md
                              `}
                              onClick={() => handlePlayerClick(player)}
                              onMouseEnter={() => setHoveredPlayer(player.id)}
                              onMouseLeave={() => setHoveredPlayer(null)}
                              data-testid={`player-card-${player.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 rounded-full bg-blue-600/50 flex items-center justify-center ${!hasBeenIntroduced ? 'animate-pulse' : ''}`}>
                                    <UserCircle className="w-6 h-6 text-blue-300" />
                                  </div>
                                  <div>
                                    <span className={`text-lg font-bold ${hasBeenIntroduced ? 'text-blue-400/60' : 'text-blue-300'}`}>
                                      {player.username}
                                    </span>
                                    {player.role === "spymaster" && (
                                      <Badge variant="outline" className="ml-2 text-xs border-blue-500/50 text-blue-400">
                                        <Crown className="w-3 h-3 mr-1" />
                                        İstihbarat Şefi
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {hasBeenIntroduced && (
                                  <Badge className="bg-green-600/30 text-green-400 border-green-500/50">
                                    Tanıtıldı
                                  </Badge>
                                )}
                              </div>
                            </Card>
                          </motion.div>
                        ) : null;
                      })}
                    </div>
                  </div>
                  
                  {/* Light Team (Red) */}
                  <div>
                    <div className="flex items-center justify-center mb-6">
                      <div className="bg-red-600/20 backdrop-blur-md rounded-xl px-6 py-3 border border-red-500/30">
                        <h2 className="text-2xl font-bold text-red-400 flex items-center">
                          <Users className="w-6 h-6 mr-2" />
                          {gameState.lightTeamName}
                        </h2>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {lightTeamPlayers.map((player, index) => {
                        const isInBubbles = playerBubbles.some(p => p.id === player.id);
                        const hasBeenIntroduced = player.introduced;
                        
                        return isInBubbles ? (
                          <motion.div
                            key={player.id}
                            initial={{ x: 100, opacity: 0 }}
                            animate={{ x: 0, opacity: hasBeenIntroduced ? 0.5 : 1 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card
                              className={`
                                relative p-4 cursor-pointer transition-all duration-300
                                ${hasBeenIntroduced 
                                  ? 'bg-red-900/20 border-red-800/30' 
                                  : 'bg-red-900/40 hover:bg-red-900/60 border-red-600/50 hover:border-red-500/70'
                                }
                                ${isController && !hasBeenIntroduced && !currentIntroducingPlayer ? 'hover:scale-105 hover:shadow-2xl hover:shadow-red-600/20' : ''}
                                ${hoveredPlayer === player.id ? 'ring-2 ring-red-400' : ''}
                                backdrop-blur-md
                              `}
                              onClick={() => handlePlayerClick(player)}
                              onMouseEnter={() => setHoveredPlayer(player.id)}
                              onMouseLeave={() => setHoveredPlayer(null)}
                              data-testid={`player-card-${player.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-10 h-10 rounded-full bg-red-600/50 flex items-center justify-center ${!hasBeenIntroduced ? 'animate-pulse' : ''}`}>
                                    <UserCircle className="w-6 h-6 text-red-300" />
                                  </div>
                                  <div>
                                    <span className={`text-lg font-bold ${hasBeenIntroduced ? 'text-red-400/60' : 'text-red-300'}`}>
                                      {player.username}
                                    </span>
                                    {player.role === "spymaster" && (
                                      <Badge variant="outline" className="ml-2 text-xs border-red-500/50 text-red-400">
                                        <Crown className="w-3 h-3 mr-1" />
                                        İstihbarat Şefi
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {hasBeenIntroduced && (
                                  <Badge className="bg-green-600/30 text-green-400 border-green-500/50">
                                    Tanıtıldı
                                  </Badge>
                                )}
                              </div>
                            </Card>
                          </motion.div>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Active Introduction View */
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-4xl"
              >
                <Card className="bg-slate-900/60 backdrop-blur-xl border-2 border-white/10 shadow-2xl">
                  <div className="p-12">
                    {/* Introducing Player Info */}
                    <div className="text-center mb-8">
                      <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="inline-block"
                      >
                        <div className={`
                          w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center
                          ${introducingPlayer?.team === "dark" ? 'bg-blue-600/50' : 'bg-red-600/50'}
                        `}>
                          <UserCircle className="w-16 h-16 text-white/80" />
                        </div>
                      </motion.div>
                      
                      <h2 className="text-5xl font-black mb-2">
                        <span className={`${introducingPlayer?.team === "dark" ? 'text-blue-400' : 'text-red-400'}`}>
                          {introducingPlayer?.username}
                        </span>
                      </h2>
                      
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-xl text-white/70"
                      >
                        kendini tanıtıyor...
                      </motion.div>
                      
                      <Badge className={`mt-4 text-lg px-4 py-2 ${
                        introducingPlayer?.team === "dark" 
                          ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' 
                          : 'bg-red-600/30 text-red-300 border-red-500/50'
                      }`}>
                        {introducingPlayer?.team === "dark" ? gameState.darkTeamName : gameState.lightTeamName}
                        {introducingPlayer?.role === "spymaster" && " - İstihbarat Şefi"}
                      </Badge>
                    </div>
                    
                    {/* Voting Stats */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                      {/* Likes */}
                      <Card className="bg-green-600/10 border-green-500/30 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-center mb-4">
                          <ThumbsUp className="w-10 h-10 text-green-400 mr-3" />
                          <span className="text-4xl font-bold text-green-400">{likes.length}</span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {likes.map((like, index) => (
                            <motion.div
                              key={index}
                              initial={{ x: -20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-center"
                            >
                              <Badge className={`${
                                like.team === "dark" 
                                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' 
                                  : 'bg-red-600/30 text-red-300 border-red-500/50'
                              }`}>
                                <Heart className="w-3 h-3 mr-1" />
                                {like.username}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </Card>
                      
                      {/* Dislikes */}
                      <Card className="bg-red-600/10 border-red-500/30 backdrop-blur-sm p-6">
                        <div className="flex items-center justify-center mb-4">
                          <ThumbsDown className="w-10 h-10 text-red-400 mr-3" />
                          <span className="text-4xl font-bold text-red-400">{dislikes.length}</span>
                        </div>
                        <div className="space-y-2 max-h-32 overflow-y-auto">
                          {dislikes.map((dislike, index) => (
                            <motion.div
                              key={index}
                              initial={{ x: 20, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-center justify-center"
                            >
                              <Badge className={`${
                                dislike.team === "dark" 
                                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' 
                                  : 'bg-red-600/30 text-red-300 border-red-500/50'
                              }`}>
                                {dislike.username}
                              </Badge>
                            </motion.div>
                          ))}
                        </div>
                      </Card>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4">
                      {/* Voting buttons for non-introducing players */}
                      {playerId !== currentIntroducingPlayer && !hasVoted && (
                        <>
                          <Button
                            onClick={() => handleLikeDislike(true)}
                            size="lg"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            data-testid="like-button"
                          >
                            <ThumbsUp className="w-5 h-5 mr-2" />
                            Beğendim
                          </Button>
                          <Button
                            onClick={() => handleLikeDislike(false)}
                            size="lg"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            data-testid="dislike-button"
                          >
                            <ThumbsDown className="w-5 h-5 mr-2" />
                            Beğenmedim
                          </Button>
                        </>
                      )}
                      
                      {/* Already voted indicator */}
                      {hasVoted && playerId !== currentIntroducingPlayer && (
                        <Badge className="text-lg px-6 py-3 bg-slate-700/50 text-white/70">
                          Oyunu Kullandın ✓
                        </Badge>
                      )}
                      
                      {/* Finish button for controller */}
                      {isController && (
                        <Button
                          onClick={handleFinishIntroduction}
                          size="lg"
                          variant="outline"
                          className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                          data-testid="finish-introduction-button"
                        >
                          Tanıtımı Bitir
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}