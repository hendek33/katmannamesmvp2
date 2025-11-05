import { useState, useEffect, useCallback } from "react";
import type { GameState, Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, SkipForward, Crown, Users, Sparkles, Heart, UserCircle, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  velocity: { x: number; y: number };
}

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
  const [dots, setDots] = useState(1);
  const [particles, setParticles] = useState<Particle[]>([]);
  
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
    // Animate dots for "kendini tanıtıyor..."
    const dotsInterval = setInterval(() => {
      setDots(prev => (prev >= 3 ? 1 : prev + 1));
    }, 500);
    
    return () => clearInterval(dotsInterval);
  }, []);
  
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
  
  const createParticles = useCallback((isLike: boolean, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const colors = isLike 
      ? ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#86efac']
      : ['#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fb923c'];
    
    const newParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const velocity = 3 + Math.random() * 4;
      newParticles.push({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
        velocity: {
          x: Math.cos(angle) * velocity,
          y: Math.sin(angle) * velocity - 2,
        },
      });
    }
    
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 1000);
  }, []);

  const handleLikeDislike = (isLike: boolean, event: React.MouseEvent) => {
    if (currentIntroducingPlayer && playerId !== currentIntroducingPlayer && !hasVoted) {
      createParticles(isLike, event);
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
    <Card className="relative w-full max-w-6xl mx-auto bg-slate-900/95 backdrop-blur-lg border-2 border-purple-500/30 shadow-2xl overflow-hidden">
      {/* Particle System */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 9999 }}>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{ x: particle.x, y: particle.y, opacity: 1, scale: 1 }}
            animate={{ 
              x: particle.x + particle.velocity.x * 100, 
              y: particle.y + particle.velocity.y * 100 + 200,
              opacity: 0,
              scale: 0
            }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              position: 'fixed',
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              borderRadius: '50%',
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}
      </div>
      <div className="relative flex flex-col p-4">
        {/* Title Animation */}
        <AnimatePresence>
          {showTitle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-center py-6"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ repeat: 2, duration: 0.5 }}
                  className="text-center"
                >
                  <h1 className="text-4xl md:text-5xl font-black mb-2 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 bg-clip-text text-transparent drop-shadow-2xl">
                    TANIŞMA ZAMANI!
                  </h1>
                  <p className="text-lg text-white/90 font-semibold">
                    Oyuncular kendilerini tanıtacak
                  </p>
                  <Sparkles className="w-8 h-8 text-yellow-400 mx-auto mt-2 animate-pulse" />
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
            className="flex justify-end mb-2"
          >
            <Button
              onClick={onSkipIntroduction}
              variant="outline"
              size="sm"
              className="bg-slate-900/80 hover:bg-slate-900/90 border-white/20 text-white backdrop-blur-md"
              data-testid="skip-introduction-button"
            >
              <SkipForward className="w-3 h-3 mr-2" />
              Tanıtımı Atla ve Oyuna Başla
            </Button>
          </motion.div>
        )}
        
        {/* Main Content Area */}
        {!showTitle && (
          <div className="flex items-start justify-center">
            {!currentIntroducingPlayer ? (
              /* Player Selection Grid */
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full"
              >
                {isController && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-3"
                  >
                    <Badge className="text-sm px-4 py-1.5 bg-red-600 text-white border-0">
                      <Crown className="w-4 h-4 mr-2" />
                      Bir oyuncu seçerek tanıtımını başlat
                    </Badge>
                  </motion.div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                  {/* Dark Team (Blue) */}
                  <div>
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-blue-600/20 backdrop-blur-md rounded-lg px-3 py-1.5 border border-blue-500/30">
                        <h2 className="text-lg font-bold text-blue-400 flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {gameState.darkTeamName}
                        </h2>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
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
                                relative p-2 cursor-pointer transition-all duration-300
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
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <div className={`w-7 h-7 rounded-full bg-blue-600/50 flex items-center justify-center flex-shrink-0 ${!hasBeenIntroduced ? 'animate-pulse' : ''}`}>
                                    <UserCircle className="w-4 h-4 text-blue-300" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className={`text-sm font-bold truncate ${hasBeenIntroduced ? 'text-blue-400/60' : 'text-blue-300'}`}>
                                        {player.username}
                                      </span>
                                      {player.role === "spymaster" && (
                                        <Badge variant="outline" className="text-[10px] border-blue-500/50 text-blue-400 flex-shrink-0 px-1 py-0">
                                          <Crown className="w-2.5 h-2.5 mr-0.5" />
                                          İstihbarat Şefi
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {hasBeenIntroduced && (
                                  <Badge className="bg-green-600/30 text-green-400 border-green-500/50 text-[10px] flex-shrink-0 px-1.5 py-0">
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
                    <div className="flex items-center justify-center mb-2">
                      <div className="bg-red-600/20 backdrop-blur-md rounded-lg px-3 py-1.5 border border-red-500/30">
                        <h2 className="text-lg font-bold text-red-400 flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          {gameState.lightTeamName}
                        </h2>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
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
                                relative p-2 cursor-pointer transition-all duration-300
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
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center space-x-2 min-w-0 flex-1">
                                  <div className={`w-7 h-7 rounded-full bg-red-600/50 flex items-center justify-center flex-shrink-0 ${!hasBeenIntroduced ? 'animate-pulse' : ''}`}>
                                    <UserCircle className="w-4 h-4 text-red-300" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1 flex-wrap">
                                      <span className={`text-sm font-bold truncate ${hasBeenIntroduced ? 'text-red-400/60' : 'text-red-300'}`}>
                                        {player.username}
                                      </span>
                                      {player.role === "spymaster" && (
                                        <Badge variant="outline" className="text-[10px] border-red-500/50 text-red-400 flex-shrink-0 px-1 py-0">
                                          <Crown className="w-2.5 h-2.5 mr-0.5" />
                                          İstihbarat Şefi
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                {hasBeenIntroduced && (
                                  <Badge className="bg-green-600/30 text-green-400 border-green-500/50 text-[10px] flex-shrink-0 px-1.5 py-0">
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
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="w-full"
              >
                <Card className="bg-slate-900/60 backdrop-blur-xl border-2 border-white/10 shadow-2xl">
                  <div className="p-8">
                    {/* Introducing Player Info */}
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
                      >
                        <motion.div
                          animate={{ scale: [1, 1.05, 1] }}
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
                      </motion.div>
                      
                      <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl font-black mb-2"
                      >
                        <span className={`${introducingPlayer?.team === "dark" ? 'text-blue-400' : 'text-red-400'}`}>
                          {introducingPlayer?.username}
                        </span>
                      </motion.h2>
                      
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg text-white/70"
                      >
                        kendini tanıtıyor{'.'.repeat(dots)}
                      </motion.div>
                      
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        <Badge className={`mt-3 text-base px-3 py-1.5 ${
                          introducingPlayer?.team === "dark" 
                            ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' 
                            : 'bg-red-600/30 text-red-300 border-red-500/50'
                        }`}>
                          {introducingPlayer?.team === "dark" ? gameState.darkTeamName : gameState.lightTeamName}
                          {introducingPlayer?.role === "spymaster" && " - İstihbarat Şefi"}
                        </Badge>
                      </motion.div>
                    </div>
                    
                    {/* Voting Stats */}
                    <div className="grid grid-cols-2 gap-6 mb-6">
                      {/* Likes */}
                      <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Card className="bg-green-600/10 border-green-500/30 backdrop-blur-sm p-4">
                          <div className="flex items-center justify-center mb-3">
                            <ThumbsUp className="w-8 h-8 text-green-400 mr-2" />
                            <span className="text-3xl font-bold text-green-400">{likes.length}</span>
                          </div>
                          <div className="flex flex-wrap justify-center gap-1.5 min-h-[40px]">
                            {likes.map((like, index) => (
                              <motion.div
                                key={`like-${like.username}-${index}`}
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ 
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 15,
                                  delay: index * 0.05
                                }}
                              >
                                <Badge className={`text-xs ${
                                  like.team === "dark" 
                                    ? 'bg-blue-600/30 text-blue-300 border-blue-500/50' 
                                    : 'bg-red-600/30 text-red-300 border-red-500/50'
                                }`}>
                                  <Heart className="w-2.5 h-2.5 mr-1" />
                                  {like.username}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        </Card>
                      </motion.div>
                      
                      {/* Dislikes */}
                      <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <Card className="bg-red-600/10 border-red-500/30 backdrop-blur-sm p-4">
                          <div className="flex items-center justify-center mb-3">
                            <ThumbsDown className="w-8 h-8 text-red-400 mr-2" />
                            <span className="text-3xl font-bold text-red-400">{dislikes.length}</span>
                          </div>
                          <div className="flex flex-wrap justify-center gap-1.5 min-h-[40px]">
                            {dislikes.map((dislike, index) => (
                              <motion.div
                                key={`dislike-${dislike.username}-${index}`}
                                initial={{ scale: 0, rotate: 180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ 
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 15,
                                  delay: index * 0.05
                                }}
                              >
                                <Badge className={`text-xs ${
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
                      </motion.div>
                    </div>
                    
                    {/* Action Buttons */}
                    <motion.div 
                      initial={{ y: 30, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.7 }}
                      className="flex justify-center gap-4"
                    >
                      {/* Voting buttons for non-introducing players */}
                      {playerId !== currentIntroducingPlayer && !hasVoted && (
                        <>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={(e) => handleLikeDislike(true, e)}
                              size="lg"
                              className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-green-500/50 transition-all duration-200"
                              data-testid="like-button"
                            >
                              <motion.div
                                animate={{ rotate: [0, -10, 10, -10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                              >
                                <ThumbsUp className="w-5 h-5 mr-2" />
                              </motion.div>
                              Beğendim
                            </Button>
                          </motion.div>
                          <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Button
                              onClick={(e) => handleLikeDislike(false, e)}
                              size="lg"
                              className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-red-500/50 transition-all duration-200"
                              data-testid="dislike-button"
                            >
                              <motion.div
                                animate={{ rotate: [0, 10, -10, 10, 0] }}
                                transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                              >
                                <ThumbsDown className="w-5 h-5 mr-2" />
                              </motion.div>
                              Beğenmedim
                            </Button>
                          </motion.div>
                        </>
                      )}
                      
                      {/* Already voted indicator */}
                      {hasVoted && playerId !== currentIntroducingPlayer && (
                        <Badge className="text-base px-4 py-2 bg-slate-700/50 text-white/70">
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
                    </motion.div>
                  </div>
                </Card>
              </motion.div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}