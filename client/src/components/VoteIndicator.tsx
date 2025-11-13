import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { ThumbsUp, ThumbsDown, Users } from 'lucide-react';

interface VoteIndicatorProps {
  isVisible: boolean;
  voteStats?: {
    likes: number;
    dislikes: number;
    boos?: number;
    cheers?: number;
  };
  className?: string;
}

export default function VoteIndicator({ 
  isVisible, 
  voteStats = { likes: 0, dislikes: 0 },
  className = ""
}: VoteIndicatorProps) {
  // Throttled state for vote updates (1 second delay)
  const [displayStats, setDisplayStats] = useState(voteStats);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Throttle updates to once per second
  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate;
    
    if (timeSinceLastUpdate >= 1000) {
      // Immediate update if more than 1 second has passed
      setDisplayStats(voteStats);
      setLastUpdate(now);
    } else {
      // Schedule update for the next second boundary
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
      
      const delay = 1000 - timeSinceLastUpdate;
      updateTimerRef.current = setTimeout(() => {
        setDisplayStats(voteStats);
        setLastUpdate(Date.now());
      }, delay);
    }

    return () => {
      if (updateTimerRef.current) {
        clearTimeout(updateTimerRef.current);
      }
    };
  }, [voteStats, lastUpdate]);

  const total = displayStats.likes + displayStats.dislikes;
  const likePercentage = total > 0 ? (displayStats.likes / total) * 100 : 50;
  const dislikePercentage = total > 0 ? (displayStats.dislikes / total) * 100 : 50;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className={`relative ${className}`}
      >
        {/* Glassmorphism Container */}
        <div className="relative overflow-hidden rounded-xl">
          {/* Background Blur Layer - Green Theme */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-900/40 via-green-800/30 to-emerald-900/40 backdrop-blur-xl" />
          <div className="absolute inset-0 bg-green-950/50 backdrop-blur-sm" />
          
          {/* Glass Border Effect */}
          <div className="absolute inset-0 rounded-xl border border-white/20" />
          
          {/* Content */}
          <div className="relative z-10 p-4">
            {/* Title */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <Users className="w-4 h-4 text-white/70" />
              <span className="text-sm font-semibold text-white/90">Kick Chat Oylaması</span>
              <Users className="w-4 h-4 text-white/70" />
            </div>

            {/* Vote Counts */}
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <motion.div 
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <ThumbsUp className="w-4 h-4 text-green-400" />
                  <motion.span 
                    key={displayStats.likes}
                    initial={{ scale: 1.2, color: "rgb(74 222 128)" }}
                    animate={{ scale: 1, color: "rgb(255 255 255 / 0.9)" }}
                    className="text-lg font-bold text-white/90 min-w-[2ch]"
                  >
                    {displayStats.likes}
                  </motion.span>
                </motion.div>
                <span className="text-xs text-white/50">Beğeni</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Beğenmeme</span>
                <motion.div 
                  className="flex items-center gap-1"
                  whileHover={{ scale: 1.05 }}
                >
                  <motion.span 
                    key={displayStats.dislikes}
                    initial={{ scale: 1.2, color: "rgb(248 113 113)" }}
                    animate={{ scale: 1, color: "rgb(255 255 255 / 0.9)" }}
                    className="text-lg font-bold text-white/90 min-w-[2ch]"
                  >
                    {displayStats.dislikes}
                  </motion.span>
                  <ThumbsDown className="w-4 h-4 text-red-400" />
                </motion.div>
              </div>
            </div>

            {/* Animated Progress Bar */}
            <div className="relative h-8 rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm border border-white/10">
              {/* Like Bar */}
              <motion.div
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-green-500/80 via-green-400/60 to-green-500/80"
                initial={{ width: "50%" }}
                animate={{ 
                  width: `${likePercentage}%`,
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{ 
                  width: { duration: 0.5, ease: "easeInOut" },
                  backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
                }}
                style={{
                  backgroundSize: "200% 100%",
                  boxShadow: "0 0 20px rgba(74, 222, 128, 0.5)"
                }}
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ width: "50%" }}
                />
              </motion.div>

              {/* Dislike Bar */}
              <motion.div
                className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500/80 via-red-400/60 to-red-500/80"
                initial={{ width: "50%" }}
                animate={{ 
                  width: `${dislikePercentage}%`,
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"]
                }}
                transition={{ 
                  width: { duration: 0.5, ease: "easeInOut" },
                  backgroundPosition: { duration: 3, repeat: Infinity, ease: "linear" }
                }}
                style={{
                  backgroundSize: "200% 100%",
                  boxShadow: "0 0 20px rgba(248, 113, 113, 0.5)"
                }}
              >
                {/* Shimmer Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-l from-transparent via-white/20 to-transparent"
                  animate={{ x: ["100%", "-200%"] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ width: "50%" }}
                />
              </motion.div>

              {/* Center Line */}
              <div className="absolute left-1/2 top-0 w-0.5 h-full bg-white/30 -translate-x-1/2 z-10" />
              
              {/* Percentage Labels */}
              {total > 0 && (
                <>
                  <motion.div
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-white font-bold text-sm drop-shadow-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: likePercentage > 15 ? 1 : 0 }}
                  >
                    {Math.round(likePercentage)}%
                  </motion.div>
                  <motion.div
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white font-bold text-sm drop-shadow-lg"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: dislikePercentage > 15 ? 1 : 0 }}
                  >
                    {Math.round(dislikePercentage)}%
                  </motion.div>
                </>
              )}
            </div>

            {/* Instructions */}
            <div className="mt-2 text-center">
              <motion.p 
                className="text-xs text-white/60"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                Chat'te <span className="text-green-400 font-bold">1</span> = Beğen, <span className="text-red-400 font-bold">2</span> = Beğenme
              </motion.p>
            </div>

            {/* Update Indicator */}
            <motion.div
              className="absolute top-2 right-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              <div className="w-2 h-2 rounded-full bg-green-400/60" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}