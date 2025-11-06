import { useState, useEffect } from "react";
import type { GameState, Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const [hoveredPlayer, setHoveredPlayer] = useState<string | null>(null);
  const [particles, setParticles] = useState<{id: number, x: number, y: number, type: 'like' | 'dislike'}[]>([]);
  const [dotCount, setDotCount] = useState(1);
  
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
    // Hide title after 2.5 seconds
    const timer = setTimeout(() => {
      setShowTitle(false);
    }, 2500);
    
    return () => clearTimeout(timer);
  }, []);

  // Animate dots for "kendini tanıtıyor..."
  useEffect(() => {
    if (currentIntroducingPlayer) {
      const interval = setInterval(() => {
        setDotCount(prev => prev >= 3 ? 1 : prev + 1);
      }, 500);
      return () => clearInterval(interval);
    }
  }, [currentIntroducingPlayer]);
  
  const handlePlayerClick = (player: Player) => {
    console.log("Player clicked:", player.id, "Controller:", isController, "Introduced:", player.introduced, "Current:", currentIntroducingPlayer);
    if (isController && !player.introduced && !currentIntroducingPlayer) {
      console.log("Selecting player for introduction:", player.id);
      onSelectPlayer(player.id);
    }
  };
  
  const handleFinishIntroduction = () => {
    if (isController && currentIntroducingPlayer) {
      onFinishIntroduction(currentIntroducingPlayer);
    }
  };
  
  const handleLikeDislike = (isLike: boolean, event: React.MouseEvent) => {
    if (currentIntroducingPlayer && playerId !== currentIntroducingPlayer && !hasVoted) {
      // Add particle effect
      const rect = event.currentTarget.getBoundingClientRect();
      const newParticle = {
        id: Date.now(),
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        type: isLike ? 'like' as const : 'dislike' as const
      };
      setParticles(prev => [...prev, newParticle]);
      
      // Remove particle after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 1000);
      
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
  
  // Show title animation first
  if (showTitle) {
    return (
      <div className="grid-area px-4 py-8 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ repeat: 1, duration: 0.5 }}
          >
            <h1 className="text-5xl lg:text-6xl font-black mb-4 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent drop-shadow-2xl">
              TANIŞMA ZAMANI!
            </h1>
            <p className="text-xl text-white/90 font-semibold">
              Oyuncular kendilerini tanıtacak
            </p>
            <Sparkles className="w-10 h-10 text-yellow-400 mx-auto mt-4 animate-pulse" />
          </motion.div>
        </motion.div>
      </div>
    );
  }
  
  return (
    <div className="grid-area px-4 py-2">
      {/* Skip Button for controller */}
      {isController && (
        <div className="flex justify-end mb-2">
          <Button
            onClick={onSkipIntroduction}
            variant="secondary"
            size="sm"
            data-testid="skip-introduction-button"
          >
            <SkipForward className="w-4 h-4 mr-1" />
            Atla ve Oyuna Başla
          </Button>
        </div>
      )}
      
      {!currentIntroducingPlayer ? (
        /* Player Selection View */
        <div className="space-y-3">
          {isController && (
            <div className="text-center mb-3">
              <div 
                className="inline-flex items-center text-sm px-4 py-1 rounded-md font-semibold"
                style={{ backgroundColor: '#dc2626', color: 'white' }}
              >
                <Crown className="w-4 h-4 mr-1" style={{ color: 'white' }} />
                <span>Bir oyuncu seçerek tanıtımını başlat</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {/* Light Team (Red) - Left Side */}
            <div>
              <div className="bg-red-600/20 backdrop-blur-sm rounded-lg px-3 py-1 mb-2 border border-red-500/30">
                <h3 className="text-sm font-bold text-red-400 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {gameState.lightTeamName}
                </h3>
              </div>
              
              <div className="space-y-2">
                {lightTeamPlayers.map((player) => {
                  const hasBeenIntroduced = player.introduced;
                  
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ x: -50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      whileHover={isController && !hasBeenIntroduced && !currentIntroducingPlayer ? { scale: 1.05 } : {}}
                    >
                      <Card
                        className={`
                          p-3 cursor-pointer transition-all duration-200
                          ${hasBeenIntroduced 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-red-900/40 hover:bg-red-900/60 border-red-600/50 hover:border-red-500/70'
                          }
                          ${isController && !hasBeenIntroduced && !currentIntroducingPlayer ? 'hover:shadow-lg hover:shadow-red-600/20' : ''}
                          ${hoveredPlayer === player.id ? 'ring-1 ring-red-400' : ''}
                          ${hasBeenIntroduced ? '' : 'backdrop-blur-sm'}
                        `}
                        onClick={() => handlePlayerClick(player)}
                        onMouseEnter={() => setHoveredPlayer(player.id)}
                        onMouseLeave={() => setHoveredPlayer(null)}
                        data-testid={`player-card-${player.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full bg-red-600/50 flex items-center justify-center ${!hasBeenIntroduced ? 'animate-pulse' : ''}`}>
                              <UserCircle className="w-5 h-5 text-red-300" />
                            </div>
                            <div>
                              <span className={`text-sm font-bold ${hasBeenIntroduced ? 'text-red-400/60' : 'text-red-300'}`}>
                                {player.username}
                              </span>
                              {player.role === "spymaster" && (
                                <span className="ml-1 inline-flex items-center px-1 text-xs rounded" 
                                      style={{ border: '1px solid #ef4444', color: '#ef4444' }}>
                                  <Crown className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                          {hasBeenIntroduced && (
                            <div className="flex items-center gap-1">
                              <div 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold" 
                                style={{ 
                                  backgroundColor: 'rgb(22, 163, 74)',
                                  color: 'rgb(255, 255, 255)',
                                  opacity: '1 !important',
                                  position: 'relative',
                                  zIndex: 10
                                }}
                              >
                                <ThumbsUp className="w-3 h-3 mr-0.5" style={{ color: 'rgb(255, 255, 255)' }} />
                                <span style={{ color: 'rgb(255, 255, 255)' }}>{Object.keys(player.introductionLikes || {}).length}</span>
                              </div>
                              <div 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold" 
                                style={{ 
                                  backgroundColor: 'rgb(220, 38, 38)',
                                  color: 'rgb(255, 255, 255)',
                                  opacity: '1 !important',
                                  position: 'relative',
                                  zIndex: 10
                                }}
                              >
                                <ThumbsDown className="w-3 h-3 mr-0.5" style={{ color: 'rgb(255, 255, 255)' }} />
                                <span style={{ color: 'rgb(255, 255, 255)' }}>{Object.keys(player.introductionDislikes || {}).length}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
            
            {/* Dark Team (Blue) - Right Side */}
            <div>
              <div className="bg-blue-600/20 backdrop-blur-sm rounded-lg px-3 py-1 mb-2 border border-blue-500/30">
                <h3 className="text-sm font-bold text-blue-400 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {gameState.darkTeamName}
                </h3>
              </div>
              
              <div className="space-y-2">
                {darkTeamPlayers.map((player) => {
                  const hasBeenIntroduced = player.introduced;
                  
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      whileHover={isController && !hasBeenIntroduced && !currentIntroducingPlayer ? { scale: 1.05 } : {}}
                    >
                      <Card
                        className={`
                          p-3 cursor-pointer transition-all duration-200
                          ${hasBeenIntroduced 
                            ? 'bg-gray-800 border-gray-700' 
                            : 'bg-blue-900/40 hover:bg-blue-900/60 border-blue-600/50 hover:border-blue-500/70'
                          }
                          ${isController && !hasBeenIntroduced && !currentIntroducingPlayer ? 'hover:shadow-lg hover:shadow-blue-600/20' : ''}
                          ${hoveredPlayer === player.id ? 'ring-1 ring-blue-400' : ''}
                          ${hasBeenIntroduced ? '' : 'backdrop-blur-sm'}
                        `}
                        onClick={() => handlePlayerClick(player)}
                        onMouseEnter={() => setHoveredPlayer(player.id)}
                        onMouseLeave={() => setHoveredPlayer(null)}
                        data-testid={`player-card-${player.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-8 h-8 rounded-full bg-blue-600/50 flex items-center justify-center ${!hasBeenIntroduced ? 'animate-pulse' : ''}`}>
                              <UserCircle className="w-5 h-5 text-blue-300" />
                            </div>
                            <div>
                              <span className={`text-sm font-bold ${hasBeenIntroduced ? 'text-blue-400/60' : 'text-blue-300'}`}>
                                {player.username}
                              </span>
                              {player.role === "spymaster" && (
                                <span className="ml-1 inline-flex items-center px-1 text-xs rounded" 
                                      style={{ border: '1px solid #3b82f6', color: '#3b82f6' }}>
                                  <Crown className="w-3 h-3" />
                                </span>
                              )}
                            </div>
                          </div>
                          {hasBeenIntroduced && (
                            <div className="flex items-center gap-1">
                              <div 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold" 
                                style={{ 
                                  backgroundColor: 'rgb(22, 163, 74)',
                                  color: 'rgb(255, 255, 255)',
                                  opacity: '1 !important',
                                  position: 'relative',
                                  zIndex: 10
                                }}
                              >
                                <ThumbsUp className="w-3 h-3 mr-0.5" style={{ color: 'rgb(255, 255, 255)' }} />
                                <span style={{ color: 'rgb(255, 255, 255)' }}>{Object.keys(player.introductionLikes || {}).length}</span>
                              </div>
                              <div 
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold" 
                                style={{ 
                                  backgroundColor: 'rgb(220, 38, 38)',
                                  color: 'rgb(255, 255, 255)',
                                  opacity: '1 !important',
                                  position: 'relative',
                                  zIndex: 10
                                }}
                              >
                                <ThumbsDown className="w-3 h-3 mr-0.5" style={{ color: 'rgb(255, 255, 255)' }} />
                                <span style={{ color: 'rgb(255, 255, 255)' }}>{Object.keys(player.introductionDislikes || {}).length}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Active Introduction View */
        <motion.div 
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="h-full flex flex-col relative"
        >
          {/* Particle Effects */}
          <AnimatePresence>
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  scale: 0,
                  x: 0,
                  y: 0
                }}
                animate={{ 
                  scale: [1, 1.5, 0],
                  x: particle.type === 'like' ? -50 : 50,
                  y: -100
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8 }}
                className="fixed pointer-events-none z-50"
                style={{ 
                  left: particle.x, 
                  top: particle.y,
                }}
              >
                {particle.type === 'like' ? (
                  <div className="flex items-center">
                    <Heart className="w-8 h-8 text-green-500 fill-green-500" />
                    <Sparkles className="w-6 h-6 text-yellow-400 ml-1 animate-pulse" />
                  </div>
                ) : (
                  <div className="flex items-center">
                    <ThumbsDown className="w-8 h-8 text-red-500 fill-red-500" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          
          <Card className="bg-slate-900/60 backdrop-blur-xl border-2 border-white/10 shadow-2xl flex-1">
            <div className="p-6 h-full flex flex-col">
              {/* Introducing Player Info */}
              <div className="text-center mb-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-block"
                >
                  <div className={`
                    w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center
                    ${introducingPlayer?.team === "dark" ? 'bg-blue-600/50' : 'bg-red-600/50'}
                  `}>
                    <UserCircle className="w-14 h-14 text-white/80" />
                  </div>
                </motion.div>
                
                <h2 className="text-3xl font-black mb-1">
                  <span className={`${introducingPlayer?.team === "dark" ? 'text-blue-400' : 'text-red-400'}`}>
                    {introducingPlayer?.username}
                  </span>
                </h2>
                
                <motion.div
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="text-lg text-white/70"
                >
                  kendini tanıtıyor{".".repeat(dotCount)}
                </motion.div>
                
                <div 
                  className="inline-flex items-center mt-2 text-sm px-3 py-1 rounded-md font-semibold"
                  style={{ 
                    backgroundColor: introducingPlayer?.team === "dark" ? '#1d4ed8' : '#b91c1c',
                    color: 'white'
                  }}
                >
                  {introducingPlayer?.team === "dark" ? gameState.darkTeamName : gameState.lightTeamName}
                  {introducingPlayer?.role === "spymaster" && " - İstihbarat Şefi"}
                </div>
              </div>
              
              {/* Voting Stats */}
              <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
                {/* Likes */}
                <div className="relative bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-2">
                    <ThumbsUp className="w-6 h-6 text-green-400 mr-2" />
                    <span className="text-2xl font-bold text-green-400">{likes.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24">
                    {likes.map((like, index) => (
                      <div
                        key={`like-${like.username}`}
                        className="inline-block"
                      >
                        <div 
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-bold"
                          style={{ 
                            backgroundColor: like.team === "dark" ? 'rgb(29, 78, 216)' : 'rgb(185, 28, 28)',
                            color: 'rgb(255, 255, 255)',
                            opacity: '1 !important'
                          }}
                        >
                          <Heart className="w-3 h-3 mr-1" style={{ color: 'rgb(255, 255, 255)' }} />
                          <span style={{ color: 'rgb(255, 255, 255)' }}>{like.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Dislikes */}
                <div className="relative bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                  <div className="flex items-center justify-center mb-2">
                    <ThumbsDown className="w-6 h-6 text-red-400 mr-2" />
                    <span className="text-2xl font-bold text-red-400">{dislikes.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 max-h-24">
                    {dislikes.map((dislike, index) => (
                      <div
                        key={`dislike-${dislike.username}`}
                        className="inline-block"
                      >
                        <div 
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-bold"
                          style={{ 
                            backgroundColor: dislike.team === "dark" ? 'rgb(29, 78, 216)' : 'rgb(185, 28, 28)',
                            color: 'rgb(255, 255, 255)',
                            opacity: '1 !important'
                          }}
                        >
                          <span style={{ color: 'rgb(255, 255, 255)' }}>{dislike.username}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                {/* Voting buttons for non-introducing players */}
                {playerId !== currentIntroducingPlayer && !hasVoted && (
                  <>
                    <Button
                      onClick={(e) => handleLikeDislike(true, e)}
                      size="icon"
                      className="w-12 h-12 bg-green-600 hover:bg-green-700 text-white transition-all transform hover:scale-110 active:scale-95 rounded-full shadow-lg"
                      data-testid="like-button"
                    >
                      <ThumbsUp className="w-6 h-6" />
                    </Button>
                    <Button
                      onClick={(e) => handleLikeDislike(false, e)}
                      size="icon"
                      className="w-12 h-12 bg-red-600 hover:bg-red-700 text-white transition-all transform hover:scale-110 active:scale-95 rounded-full shadow-lg"
                      data-testid="dislike-button"
                    >
                      <ThumbsDown className="w-6 h-6" />
                    </Button>
                  </>
                )}
                
                {/* Already voted indicator */}
                {hasVoted && playerId !== currentIntroducingPlayer && (
                  <div 
                    className="inline-flex items-center text-sm px-4 py-2 rounded-md font-semibold"
                    style={{ backgroundColor: '#475569', color: 'white' }}
                  >
                    Oyunu Kullandın ✓
                  </div>
                )}
                
                {/* Finish button for controller */}
                {isController && (
                  <Button
                    onClick={handleFinishIntroduction}
                    size="sm"
                    variant="outline"
                    className="bg-white/10 hover:bg-white/20 text-white border-white/30"
                    data-testid="finish-introduction-button"
                  >
                    Tanıtımı Bitir
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}