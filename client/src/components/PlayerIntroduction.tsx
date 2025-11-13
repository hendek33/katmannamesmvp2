import { useState, useEffect } from "react";
import type { GameState, Player } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThumbsUp, ThumbsDown, SkipForward, Crown, Users, Sparkles, Heart, UserCircle, ChevronRight, Star, Zap, Volume2, Megaphone, Play } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VoteIndicator from './VoteIndicator';
import { useWebSocketContext } from "@/contexts/WebSocketContext";

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
  const [showChatOverlay, setShowChatOverlay] = useState(true);
  
  // Get Kick chat data from context
  const { kickChatMessages, kickChatVotes, kickChatConfig } = useWebSocketContext();
  
  const currentPlayer = gameState.players.find((p) => p.id === playerId);
  const isController = currentPlayer?.team === "light" && currentPlayer?.role === "spymaster"; // Red team spymaster controls
  // Only the controller can select players for introduction (since there's no losing team yet in introduction phase)
  const canSelectPlayer = isController;
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
    if (canSelectPlayer && !player.introduced && !currentIntroducingPlayer) {
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
      // Add single particle effect for cleaner animation
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
      }, 800);
      
      onLikeDislike(currentIntroducingPlayer, isLike);
    }
  };
  
  
  // Get likes and dislikes for current introducing player
  const getReactions = () => {
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
  
  const { likes, dislikes } = getReactions();
  
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
      {!currentIntroducingPlayer ? (
        /* Player Selection View */
        <div className="space-y-3">
          {canSelectPlayer && (
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
                      whileHover={canSelectPlayer && !hasBeenIntroduced && !currentIntroducingPlayer ? { 
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
                          ${canSelectPlayer && !hasBeenIntroduced && !currentIntroducingPlayer ? 'hover:shadow-2xl hover:shadow-red-500/30' : ''}
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
                              <span className={`text-lg font-bold ${hasBeenIntroduced ? 'text-red-400/60' : 'text-red-300'}`}>
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
                      whileHover={canSelectPlayer && !hasBeenIntroduced && !currentIntroducingPlayer ? { 
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
                          ${canSelectPlayer && !hasBeenIntroduced && !currentIntroducingPlayer ? 'hover:shadow-2xl hover:shadow-blue-500/30' : ''}
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
                              <span className={`text-lg font-bold ${hasBeenIntroduced ? 'text-blue-400/60' : 'text-blue-300'}`}>
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
          
          {/* Skip Button for controller - Centered at bottom */}
          {isController && (
            <div className="flex justify-center mt-20 mb-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 25,
                  delay: 0.5 
                }}
                whileHover={{ 
                  scale: 1.05,
                  y: -2,
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 15
                  }
                }}
                whileTap={{ 
                  scale: 0.95,
                  y: 2,
                  transition: {
                    type: "spring",
                    stiffness: 500,
                    damping: 30
                  }
                }}
                className="relative"
              >
                {/* Outer glow ring */}
                <motion.div
                  className="absolute -inset-2 rounded-xl bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 opacity-30 blur-lg"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 2.5,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                <Button
                  onClick={onSkipIntroduction}
                  className="relative px-5 py-3 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 hover:from-amber-500 hover:via-orange-500 hover:to-red-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-amber-600/30 border border-amber-400/40 backdrop-blur-sm transition-all duration-200 overflow-hidden transform-gpu"
                  data-testid="skip-introduction-button"
                >
                  {/* Animated background shimmer */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
                    animate={{
                      x: [-300, 300, -300]
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                  
                  {/* Hover glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl"
                    initial={{ opacity: 0 }}
                    whileHover={{ 
                      opacity: 1,
                      boxShadow: "inset 0 0 25px rgba(251, 191, 36, 0.3)"
                    }}
                    transition={{ duration: 0.2 }}
                  />
                  
                  {/* Click flash effect */}
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    initial={{ opacity: 0 }}
                    whileTap={{
                      opacity: [0, 0.8, 0],
                      background: [
                        "radial-gradient(circle, transparent 0%, transparent 100%)",
                        "radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)",
                        "radial-gradient(circle, transparent 0%, transparent 100%)"
                      ]
                    }}
                    transition={{ 
                      duration: 0.4,
                      times: [0, 0.5, 1]
                    }}
                  />
                  
                  <div className="relative flex items-center justify-center gap-2 z-10">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                      }}
                      transition={{ 
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </motion.div>
                    
                    <span className="tracking-wide">
                      Oyuna Başla
                    </span>
                    
                    <motion.div
                      animate={{ 
                        rotate: 360
                      }}
                      transition={{ 
                        duration: 3,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    >
                      <Sparkles className="w-4 h-4 text-yellow-300" />
                    </motion.div>
                  </div>
                </Button>
              </motion.div>
            </div>
          )}
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
                  y: 0,
                  opacity: 0
                }}
                animate={{ 
                  scale: [0.5, 1.5, 0],
                  y: -80,
                  x: 0,
                  opacity: [0, 1, 0],
                  rotate: 0
                }}
                exit={{ opacity: 0 }}
                transition={{ 
                  duration: 0.8,
                  ease: "easeOut"
                }}
                className="fixed pointer-events-none z-50"
                style={{ 
                  left: particle.x, 
                  top: particle.y,
                }}
              >
                {particle.type === 'like' && (
                  <Heart className="w-8 h-8 text-green-400 fill-green-400" />
                )}
                {particle.type === 'dislike' && (
                  <ThumbsDown className="w-8 h-8 text-red-400 fill-red-400" />
                )}
              </motion.div>
            ))}
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
              
              {/* Voting Stats Container with Chat */}
              <div className="flex flex-col items-center gap-4 w-full">
                {/* Voting Stats - Clickable Cards */}
                <div className="grid grid-cols-2 gap-4 w-full">
                {/* Likes - Clickable Card */}
                <motion.div
                  className={`relative bg-green-900/30 border-2 rounded-lg p-4 
                    ${hasVotedLike ? 'border-green-400 bg-green-800/50' : 'border-green-500/50'}
                    ${playerId !== currentIntroducingPlayer ? 'cursor-pointer hover:bg-green-900/50 hover:border-green-400/70' : ''}`}
                  onClick={(e) => {
                    if (playerId !== currentIntroducingPlayer) {
                      handleLikeDislike(true, e);
                    }
                  }}
                  whileHover={playerId !== currentIntroducingPlayer ? { 
                    scale: 1.02,
                    y: -2,
                    transition: { duration: 0.2 }
                  } : {}}
                  whileTap={playerId !== currentIntroducingPlayer ? { 
                    scale: 0.98,
                    transition: { duration: 0.1 }
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
                  className={`relative bg-red-900/30 border-2 rounded-lg p-4 
                    ${hasVotedDislike ? 'border-red-400 bg-red-800/50' : 'border-red-500/50'}
                    ${playerId !== currentIntroducingPlayer ? 'cursor-pointer hover:bg-red-900/50 hover:border-red-400/70' : ''}`}
                  onClick={(e) => {
                    if (playerId !== currentIntroducingPlayer) {
                      handleLikeDislike(false, e);
                    }
                  }}
                  whileHover={playerId !== currentIntroducingPlayer ? { 
                    scale: 1.02,
                    y: -2,
                    transition: { duration: 0.2 }
                  } : {}}
                  whileTap={playerId !== currentIntroducingPlayer ? { 
                    scale: 0.98,
                    transition: { duration: 0.1 }
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
                
                {/* Kick Chat Vote Indicator - Below Voting Cards */}
                {showChatOverlay && kickChatConfig?.enabled && (
                  <VoteIndicator
                    isVisible={true}
                    voteStats={kickChatVotes}
                    className="w-full"
                  />
                )}
              </div>
            </div>
          </Card>
          
          {/* Finish Button - Outside Card */}
          {isController && (
            <motion.div 
              className="mt-6 flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <motion.button
                onClick={handleFinishIntroduction}
                className="relative group px-8 py-4 rounded-xl font-bold text-lg overflow-hidden shadow-2xl"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                data-testid="finish-introduction-button"
              >
                {/* Animated gradient background */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  style={{
                    backgroundSize: "200% 100%"
                  }}
                />
                
                {/* Glowing border effect */}
                <motion.div
                  className="absolute inset-0 rounded-xl"
                  animate={{
                    boxShadow: [
                      "0 0 20px rgba(168, 85, 247, 0.5)",
                      "0 0 40px rgba(236, 72, 153, 0.7)",
                      "0 0 20px rgba(168, 85, 247, 0.5)"
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                
                {/* Button content */}
                <div className="relative z-10 flex items-center gap-2 text-white">
                  <span>Tanıtımı Bitir</span>
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </motion.div>
                </div>
                
                {/* Shimmer effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 1,
                    ease: "easeInOut"
                  }}
                />
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      )}
      
    </div>
  );
}