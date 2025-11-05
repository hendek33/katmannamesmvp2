import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { VideoLoadProgress, enhancedVideoCache } from "@/services/EnhancedVideoCache";

interface VideoLoadingIndicatorProps {
  videoSrc: string;
  onReady?: () => void;
  showOverlay?: boolean;
}

export function VideoLoadingIndicator({ 
  videoSrc, 
  onReady,
  showOverlay = true 
}: VideoLoadingIndicatorProps) {
  const [progress, setProgress] = useState<VideoLoadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
    buffered: 0,
    canPlay: false,
    isStalled: false
  });

  useEffect(() => {
    // Register progress callback
    enhancedVideoCache.onProgress(videoSrc, (newProgress) => {
      setProgress(newProgress);
      
      if (newProgress.canPlay && onReady) {
        onReady();
      }
    });
    
    // Check current progress
    const currentProgress = enhancedVideoCache.getProgress(videoSrc);
    if (currentProgress) {
      setProgress(currentProgress);
      if (currentProgress.canPlay && onReady) {
        onReady();
      }
    }
  }, [videoSrc, onReady]);

  if (!showOverlay || progress.canPlay) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center"
    >
      <div className="bg-slate-900/90 p-8 rounded-2xl border border-slate-700 shadow-2xl">
        <div className="space-y-4">
          {/* Title */}
          <h3 className="text-xl font-bold text-white text-center">
            {progress.isStalled ? "Video Yükleme Yavaşladı..." : "Video Yükleniyor..."}
          </h3>
          
          {/* Progress Bar */}
          <div className="w-64 h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${progress.isStalled ? 'bg-orange-500' : 'bg-blue-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${progress.percentage}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* Progress Text */}
          <div className="text-center space-y-1">
            <p className="text-white font-medium">
              {progress.percentage.toFixed(0)}%
            </p>
            <p className="text-slate-400 text-sm">
              {progress.buffered.toFixed(1)}s / {progress.total.toFixed(1)}s
            </p>
            {progress.isStalled && (
              <p className="text-orange-400 text-xs animate-pulse">
                Bağlantı kontrol ediliyor...
              </p>
            )}
          </div>
          
          {/* Loading Animation */}
          <div className="flex justify-center space-x-2">
            <motion.div
              className="w-3 h-3 bg-blue-500 rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
            />
            <motion.div
              className="w-3 h-3 bg-purple-500 rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
            />
            <motion.div
              className="w-3 h-3 bg-red-500 rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}