import { useState, useEffect } from "react";
import type { GameState, Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, SkipForward, Crown, Users, Sparkles, Heart, UserCircle, ChevronRight, Star, Zap } from "lucide-react";
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
  const [particles, setParticles] = useState<{id: number, x: number, y: number, type: 'like' | 'dislike', delay?: number}[]>([]);
  const [dotCount, setDotCount] = useState(1);
  
  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const isController = currentPlayer?.team === "light" && currentPlayer?.role === "spymaster"; // Red team (light) spymaster controls
  const currentIntroducingPlayer = gameState.introductionPhase?.currentIntroducingPlayer;
  const introducingPlayer = gameState.players.find(p => p.id === currentIntroducingPlayer);
  
  // Filter players by team
  const darkTeamPlayers = gameState.players.filter(p => p.team === "dark");
  const lightTeamPlayers = gameState.players.filter(p => p.team === "light");
  
  // Check if current player already voted and which option
  const hasVotedLike = introducingPlayer?.introductionLikes && playerId in introducingPlayer.introductionLikes;
  const hasVotedDislike = introducingPlayer?.introductionDislikes && playerId in introducingPlayer.introductionDislikes;
  const hasVoted = hasVotedLike || hasVotedDislike;
  
  useEffect(() => {
    // Hide title after 3.5 seconds
    const timer = setTimeout(() => {
      setShowTitle(false);
    }, 3500);
    
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
    if (currentIntroducingPlayer && playerId !== currentIntroducingPlayer) {
      // Add multiple particle effects for more impact
      const rect = event.currentTarget.getBoundingClientRect();
      const particleCount = 5;
      const newParticles: Array<{ id: number; x: number; y: number; type: 'like' | 'dislike'; delay?: number }> = [];
      
      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: Date.now() + i,
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          type: isLike ? 'like' : 'dislike',
          delay: i * 50
        });
      }
      
      setParticles(prev => [...prev, ...newParticles]);
      
      // Remove particles after animation
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
      }, 1500);
      
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
      <div className="grid-area px-4 py-8 flex items-center justify-center relative overflow-hidden">
        <motion.div
          initial={{ scale: 0, opacity: 0, rotateX: -90 }}
          animate={{ 
            scale: 1, 
            opacity: 1, 
            rotateX: 0,
          }}
          exit={{ opacity: 0, scale: 0.8, rotateX: 90 }}
          transition={{ 
            type: "spring",
            stiffness: 100,
            damping: 15,
            duration: 1
          }}
          className="text-center relative z-10"
        >
          {/* Main title with staggered letter animation */}
          <motion.div className="mb-4 relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 blur-3xl opacity-30"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 180, 360]
              }}
              transition={{ 
                duration: 10,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <h1 className="text-5xl lg:text-7xl font-black relative">
              {"TANIŞMA ZAMANI!".split("").map((letter, index) => {
                // Alternate colors between red and blue
                const isEven = index % 2 === 0;
                const colorClass = isEven ? 'text-red-500' : 'text-blue-500';
                return (
                <motion.span
                  key={index}
                  className={`inline-block ${colorClass} font-black`}
                  initial={{ 
                    y: -100, 
                    opacity: 0,
                    rotateZ: Math.random() * 360 - 180
                  }}
                  animate={{ 
                    y: 0, 
                    opacity: 1,
                    rotateZ: 0
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 20,
                    delay: index * 0.05
                  }}
                  style={{
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))'
                  }}
                >
                  {letter === " " ? "\u00A0" : letter}
                </motion.span>
              );})}
            </h1>
          </motion.div>

          {/* Subtitle with slide-in animation */}
          <motion.div className="mb-4">
            {"Oyuncular kendilerini tanıtacak".split(" ").map((word, index) => (
              <motion.span
                key={index}
                className="inline-block text-xl text-white/90 font-bold mr-2"
                initial={{ 
                  y: 50, 
                  opacity: 0,
                  scale: 0
                }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  scale: 1
                }}
                transition={{
                  delay: 0.8 + index * 0.15,
                  type: "spring",
                  stiffness: 200,
                  damping: 15
                }}
                whileHover={{ 
                  scale: 1.1,
                  color: "#fbbf24"
                }}
              >
                {word}
              </motion.span>
            ))}
          </motion.div>

          {/* Central sparkle with rotation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: 360
            }}
            transition={{ 
              scale: { 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              },
              rotate: {
                delay: 1.2,
                duration: 0.8,
                type: "spring"
              }
            }}
            className="inline-block"
          >
            <Sparkles className="w-12 h-12 text-yellow-400 drop-shadow-lg" />
          </motion.div>

          {/* Orbiting stars */}
          <div className="absolute -inset-20 pointer-events-none">
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`star-${i}`}
                className="absolute top-1/2 left-1/2"
                animate={{ 
                  rotate: 360
                }}
                transition={{ 
                  duration: 5 + i * 2,
                  repeat: Infinity,
                  ease: "linear",
                  delay: i * 0.7
                }}
              >
                <Star 
                  className={`
                    w-6 h-6 absolute
                    ${i === 0 ? 'text-red-400' : i === 1 ? 'text-yellow-400' : 'text-blue-400'}
                  `}
                  style={{
                    transform: `translateX(${80 + i * 25}px)`,
                    filter: 'drop-shadow(0 0 8px currentColor)'
                  }}
                />
              </motion.div>
            ))}
          </div>
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
            <motion.div 
              className="text-center mb-4"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <motion.div 
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-red-600 to-red-700 shadow-xl border-2 border-red-500/50"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(220, 38, 38, 0.3)",
                    "0 0 30px rgba(220, 38, 38, 0.5)",
                    "0 0 20px rgba(220, 38, 38, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="w-5 h-5 text-yellow-400" />
                </motion.div>
                <span className="text-white font-bold text-base">
                  Bir Oyuncu Seç ve Tanıtımı Başlat
                </span>
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </motion.div>
            </motion.div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            {/* Light Team (Red) - Left Side */}
            <div>
              <motion.div 
                className="relative bg-gradient-to-r from-red-900/60 to-red-800/60 backdrop-blur-sm rounded-xl px-4 py-3 mb-3 border-2 border-red-500/50 shadow-lg overflow-hidden"
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 150 }}
              >
                {/* Animated background gradient */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-transparent to-red-600/20"
                  animate={{ 
                    x: [-200, 200, -200]
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <h3 className="relative text-base font-black text-red-300 flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Users className="w-5 h-5 text-red-400" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-red-300 to-red-100 bg-clip-text text-transparent">
                    {gameState.lightTeamName}
                  </span>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Star className="w-4 h-4 text-red-400" />
                  </motion.div>
                </h3>
              </motion.div>
              
              <div className="space-y-2">
                {lightTeamPlayers.map((player) => {
                  const hasBeenIntroduced = player.introduced;
                  
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ x: -100, opacity: 0, rotate: -10 }}
                      animate={{ 
                        x: 0, 
                        opacity: 1, 
                        rotate: 0,
                        transition: { 
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                          delay: lightTeamPlayers.indexOf(player) * 0.1
                        }
                      }}
                      whileHover={isController && !hasBeenIntroduced && !currentIntroducingPlayer ? { 
                        scale: 1.02,
                        y: -2,
                        transition: { 
                          type: "spring",
                          stiffness: 400,
                          damping: 20
                        }
                      } : {}}
                    >
                      <Card
                        className={`
                          p-3 cursor-pointer transition-all duration-200
                          ${hasBeenIntroduced 
                            ? 'bg-red-900/40 border-red-600/50' 
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-gray-600'
                          }
                          ${isController && !hasBeenIntroduced && !currentIntroducingPlayer ? 'hover:shadow-2xl hover:shadow-red-500/30' : ''}
                          ${hoveredPlayer === player.id ? 'ring-2 ring-red-400/60' : ''}
                          ${!hasBeenIntroduced ? '' : 'backdrop-blur-sm'}
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
              <motion.div 
                className="relative bg-gradient-to-r from-blue-900/60 to-blue-800/60 backdrop-blur-sm rounded-xl px-4 py-3 mb-3 border-2 border-blue-500/50 shadow-lg overflow-hidden"
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 150 }}
              >
                {/* Animated background gradient */}
                <motion.div 
                  className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-transparent to-blue-600/20"
                  animate={{ 
                    x: [200, -200, 200]
                  }}
                  transition={{ 
                    duration: 8,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
                <h3 className="relative text-base font-black text-blue-300 flex items-center justify-center gap-2">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                  >
                    <Users className="w-5 h-5 text-blue-400" />
                  </motion.div>
                  <span className="bg-gradient-to-r from-blue-300 to-blue-100 bg-clip-text text-transparent">
                    {gameState.darkTeamName}
                  </span>
                  <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  >
                    <Star className="w-4 h-4 text-blue-400" />
                  </motion.div>
                </h3>
              </motion.div>
              
              <div className="space-y-2">
                {darkTeamPlayers.map((player) => {
                  const hasBeenIntroduced = player.introduced;
                  
                  return (
                    <motion.div
                      key={player.id}
                      initial={{ x: 100, opacity: 0, rotate: 10 }}
                      animate={{ 
                        x: 0, 
                        opacity: 1, 
                        rotate: 0,
                        transition: { 
                          type: "spring",
                          stiffness: 200,
                          damping: 20,
                          delay: darkTeamPlayers.indexOf(player) * 0.1
                        }
                      }}
                      whileHover={isController && !hasBeenIntroduced && !currentIntroducingPlayer ? { 
                        scale: 1.02,
                        y: -2,
                        transition: { 
                          type: "spring",
                          stiffness: 400,
                          damping: 20
                        }
                      } : {}}
                    >
                      <Card
                        className={`
                          p-3 cursor-pointer transition-all duration-200
                          ${hasBeenIntroduced 
                            ? 'bg-blue-900/40 border-blue-600/50' 
                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700 hover:border-gray-600'
                          }
                          ${isController && !hasBeenIntroduced && !currentIntroducingPlayer ? 'hover:shadow-2xl hover:shadow-blue-500/30' : ''}
                          ${hoveredPlayer === player.id ? 'ring-2 ring-blue-400/60' : ''}
                          ${!hasBeenIntroduced ? '' : 'backdrop-blur-sm'}
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
            {particles.map((particle, index) => {
              const angle = (index * 72) * (Math.PI / 180); // Spread particles in a circle
              const distance = 120;
              const finalX = Math.cos(angle) * distance + (Math.random() - 0.5) * 30;
              const finalY = Math.sin(angle) * distance - 50;
              
              return (
                <motion.div
                  key={particle.id}
                  initial={{ 
                    scale: 0,
                    x: 0,
                    y: 0,
                    opacity: 0,
                    rotate: 0
                  }}
                  animate={{ 
                    scale: [0, 1.2, 0.8, 0],
                    x: [0, finalX * 0.5, finalX],
                    y: [0, finalY * 0.3, finalY],
                    opacity: [0, 1, 1, 0],
                    rotate: particle.type === 'like' ? 360 : -360
                  }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 1.2,
                    delay: particle.delay ? particle.delay / 1000 : 0,
                    ease: [0.45, 0, 0.55, 1]
                  }}
                  className="fixed pointer-events-none z-50"
                  style={{ 
                    left: particle.x, 
                    top: particle.y,
                  }}
                >
                  {particle.type === 'like' ? (
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          rotate: [0, 180, 360]
                        }}
                        transition={{ 
                          duration: 0.8,
                          repeat: 1
                        }}
                      >
                        <Heart className="w-10 h-10 text-green-400 fill-green-400 drop-shadow-lg" />
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 2, 0] }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-8 h-8 bg-green-400/30 rounded-full blur-xl" />
                      </motion.div>
                    </div>
                  ) : (
                    <div className="relative">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.3, 1],
                          rotate: [0, -180, -360]
                        }}
                        transition={{ 
                          duration: 0.8,
                          repeat: 1
                        }}
                      >
                        <ThumbsDown className="w-10 h-10 text-red-400 fill-red-400 drop-shadow-lg" />
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: [0, 2, 0] }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="w-8 h-8 bg-red-400/30 rounded-full blur-xl" />
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          <Card className="bg-slate-900/60 backdrop-blur-xl border-2 border-white/10 shadow-2xl flex-1">
            <div className="p-6 h-full flex flex-col">
              {/* Introducing Player Info */}
              <div className="text-center mb-4 relative">
                
                {/* Player avatar with glow effect */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ 
                    scale: [1, 1.05, 1],
                    rotate: 0
                  }}
                  transition={{ 
                    scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
                    rotate: { type: "spring", stiffness: 200 }
                  }}
                  className="inline-block relative"
                >
                  {/* Animated glow ring */}
                  <motion.div
                    className={`absolute -inset-2 rounded-full ${introducingPlayer?.team === "dark" ? 'bg-blue-400' : 'bg-red-400'}`}
                    animate={{ 
                      opacity: [0.3, 0.6, 0.3],
                      scale: [0.95, 1.05, 0.95]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{ filter: 'blur(8px)' }}
                  />
                  
                  <div className={`
                    relative w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center shadow-2xl
                    ${introducingPlayer?.team === "dark" ? 'bg-gradient-to-br from-blue-600 to-blue-800' : 'bg-gradient-to-br from-red-600 to-red-800'}
                  `}>
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <UserCircle className="w-14 h-14 text-white" />
                    </motion.div>
                  </div>
                </motion.div>
                
                {/* Player name with gradient animation */}
                <motion.h2 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3, type: "spring" }}
                  className="text-3xl font-black mb-1 relative"
                >
                  <motion.span 
                    className={`inline-block ${introducingPlayer?.team === "dark" ? 'text-blue-400' : 'text-red-400'}`}
                    animate={{ 
                      filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
                      scale: [1, 1.02, 1]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {introducingPlayer?.username}
                  </motion.span>
                </motion.h2>
                
                {/* Animated introduction text */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-lg text-white/80 font-medium"
                >
                  <motion.span
                    animate={{ 
                      opacity: [0.5, 1, 0.5],
                      scale: [0.98, 1.02, 0.98]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    kendini tanıtıyor
                  </motion.span>
                  <motion.span 
                    className="inline-block ml-1"
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    {".".repeat(dotCount)}
                  </motion.span>
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
              
              {/* Voting Stats - Clickable Cards */}
              <div className="grid grid-cols-2 gap-4 mb-4 flex-1">
                {/* Likes - Clickable Card */}
                <motion.div
                  className={`relative bg-green-900/30 border-2 rounded-lg p-4 overflow-hidden
                    ${hasVotedLike ? 'border-green-400 bg-green-800/50 shadow-lg shadow-green-500/30' : 'border-green-500/50'}
                    ${playerId !== currentIntroducingPlayer ? 'cursor-pointer hover:bg-green-900/40 hover:border-green-500/70' : ''}`}
                  onClick={(e) => {
                    if (playerId !== currentIntroducingPlayer) {
                      handleLikeDislike(true, e);
                    }
                  }}
                  whileHover={playerId !== currentIntroducingPlayer ? { 
                    scale: 1.03,
                    transition: { type: "spring", stiffness: 300 }
                  } : {}}
                  whileTap={playerId !== currentIntroducingPlayer ? { 
                    scale: 0.95,
                    rotate: hasVotedLike ? [0, -2, 2, 0] : 0,
                    transition: { type: "spring", stiffness: 500, damping: 15 }
                  } : {}}
                  animate={hasVotedLike ? {
                    scale: [1, 1.05, 1],
                    transition: { duration: 0.5, ease: "easeOut" }
                  } : {}}
                  data-testid="like-card"
                >
                  <div className="flex items-center justify-center mb-2">
                    <ThumbsUp className="w-6 h-6 text-green-400 mr-2" />
                    <span className="text-2xl font-bold text-green-400">{likes.length}</span>
                  </div>
                  {playerId !== currentIntroducingPlayer && (
                    <motion.div 
                      className="text-center text-sm text-green-400 font-medium mb-2"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {hasVotedLike ? 'Seçildi ✓' : 'Beğenmek için tıkla'}
                    </motion.div>
                  )}
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-hidden">
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
                </motion.div>
                
                {/* Dislikes - Clickable Card */}
                <motion.div
                  className={`relative bg-red-900/30 border-2 rounded-lg p-4 overflow-hidden
                    ${hasVotedDislike ? 'border-red-400 bg-red-800/50 shadow-lg shadow-red-500/30' : 'border-red-500/50'}
                    ${playerId !== currentIntroducingPlayer ? 'cursor-pointer hover:bg-red-900/40 hover:border-red-500/70' : ''}`}
                  onClick={(e) => {
                    if (playerId !== currentIntroducingPlayer) {
                      handleLikeDislike(false, e);
                    }
                  }}
                  whileHover={playerId !== currentIntroducingPlayer ? { 
                    scale: 1.03,
                    transition: { type: "spring", stiffness: 300 }
                  } : {}}
                  whileTap={playerId !== currentIntroducingPlayer ? { 
                    scale: 0.95,
                    rotate: hasVotedDislike ? [0, 2, -2, 0] : 0,
                    transition: { type: "spring", stiffness: 500, damping: 15 }
                  } : {}}
                  animate={hasVotedDislike ? {
                    scale: [1, 1.05, 1],
                    transition: { duration: 0.5, ease: "easeOut" }
                  } : {}}
                  data-testid="dislike-card"
                >
                  <div className="flex items-center justify-center mb-2">
                    <ThumbsDown className="w-6 h-6 text-red-400 mr-2" />
                    <span className="text-2xl font-bold text-red-400">{dislikes.length}</span>
                  </div>
                  {playerId !== currentIntroducingPlayer && (
                    <motion.div 
                      className="text-center text-sm text-red-400 font-medium mb-2"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {hasVotedDislike ? 'Seçildi ✓' : 'Beğenmemek için tıkla'}
                    </motion.div>
                  )}
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-hidden">
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
                </motion.div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
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