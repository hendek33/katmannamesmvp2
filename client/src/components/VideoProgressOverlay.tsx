import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { videoBufferManager } from '@/services/VideoBufferManager';
import { Loader2, Activity, AlertCircle, CheckCircle } from 'lucide-react';

interface VideoProgressOverlayProps {
  videoSrc: string;
  isVisible: boolean;
  onReady?: () => void;
}

interface DetailedProgress {
  percentage: number;
  bufferHealth: number;
  currentBuffer: number;
  targetBuffer: number;
  isHealthy: boolean;
  needsOptimization: boolean;
  memoryUsage: number;
  status: 'loading' | 'buffering' | 'ready' | 'optimizing' | 'error';
  message: string;
}

export function VideoProgressOverlay({ 
  videoSrc, 
  isVisible,
  onReady 
}: VideoProgressOverlayProps) {
  const [progress, setProgress] = useState<DetailedProgress>({
    percentage: 0,
    bufferHealth: 0,
    currentBuffer: 0,
    targetBuffer: 5,
    isHealthy: false,
    needsOptimization: false,
    memoryUsage: 0,
    status: 'loading',
    message: 'Video hazırlanıyor...'
  });
  
  useEffect(() => {
    if (!videoSrc) return;
    
    // Register video for buffer management
    videoBufferManager.registerVideo(videoSrc, 'high', 'aggressive');
    
    const updateProgress = () => {
      const metrics = videoBufferManager.getBufferMetrics(videoSrc);
      
      if (metrics) {
        let status: DetailedProgress['status'] = 'loading';
        let message = 'Video hazırlanıyor...';
        
        if (metrics.bufferHealth >= 80) {
          status = 'ready';
          message = 'Video hazır!';
        } else if (metrics.needsOptimization) {
          status = 'optimizing';
          message = 'Bağlantı optimize ediliyor...';
        } else if (metrics.currentBuffer < 1) {
          status = 'buffering';
          message = 'Video yükleniyor...';
        } else {
          status = 'loading';
          message = `Yükleniyor... %${Math.round(metrics.bufferHealth)}`;
        }
        
        setProgress({
          percentage: metrics.bufferHealth,
          bufferHealth: metrics.bufferHealth,
          currentBuffer: metrics.currentBuffer,
          targetBuffer: metrics.targetBuffer,
          isHealthy: metrics.isHealthy,
          needsOptimization: metrics.needsOptimization,
          memoryUsage: metrics.memoryUsage,
          status,
          message
        });
        
        if (metrics.isHealthy && onReady) {
          onReady();
        }
      }
    };
    
    // Start monitoring
    const interval = setInterval(updateProgress, 100);
    updateProgress();
    
    return () => clearInterval(interval);
  }, [videoSrc, onReady]);
  
  const getStatusIcon = () => {
    switch (progress.status) {
      case 'ready':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'optimizing':
        return <Activity className="w-6 h-6 text-yellow-500 animate-pulse" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />;
    }
  };
  
  const getProgressColor = () => {
    if (progress.bufferHealth >= 80) return 'bg-green-500';
    if (progress.bufferHealth >= 50) return 'bg-yellow-500';
    if (progress.bufferHealth >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };
  
  return (
    <AnimatePresence>
      {isVisible && progress.status !== 'ready' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          data-testid="video-progress-overlay"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 shadow-2xl max-w-md w-full mx-4 border border-gray-700"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              {getStatusIcon()}
              <h3 className="text-lg font-semibold text-white">
                {progress.message}
              </h3>
            </div>
            
            {/* Main Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Yükleme Durumu</span>
                <span>%{Math.round(progress.percentage)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                <motion.div
                  className={`h-full ${getProgressColor()} rounded-full transition-all duration-300`}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress.percentage}%` }}
                />
              </div>
            </div>
            
            {/* Buffer Health Indicator */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Buffer Sağlığı</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        progress.bufferHealth >= 70 ? 'bg-green-500' :
                        progress.bufferHealth >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${progress.bufferHealth}%` }}
                    />
                  </div>
                  <span className="text-xs text-white">
                    {Math.round(progress.bufferHealth)}%
                  </span>
                </div>
              </div>
              
              <div className="bg-gray-800/50 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">Buffer Süresi</div>
                <div className="text-sm text-white font-medium">
                  {progress.currentBuffer.toFixed(1)}s / {progress.targetBuffer}s
                </div>
              </div>
            </div>
            
            {/* Detailed Stats */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-gray-800/30 rounded p-2 text-center">
                <div className="text-gray-400">Durum</div>
                <div className={`font-medium ${
                  progress.isHealthy ? 'text-green-400' : 'text-yellow-400'
                }`}>
                  {progress.isHealthy ? 'Sağlıklı' : 'Yükleniyor'}
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded p-2 text-center">
                <div className="text-gray-400">Optimizasyon</div>
                <div className={`font-medium ${
                  progress.needsOptimization ? 'text-yellow-400' : 'text-green-400'
                }`}>
                  {progress.needsOptimization ? 'Gerekli' : 'Optimal'}
                </div>
              </div>
              
              <div className="bg-gray-800/30 rounded p-2 text-center">
                <div className="text-gray-400">Bellek</div>
                <div className="text-white font-medium">
                  {progress.memoryUsage.toFixed(1)} MB
                </div>
              </div>
            </div>
            
            {/* Tips or warnings */}
            {progress.needsOptimization && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg"
              >
                <p className="text-xs text-yellow-400">
                  💡 Video kalitesi bağlantı hızınıza göre optimize ediliyor...
                </p>
              </motion.div>
            )}
            
            {/* Loading animation dots */}
            {progress.status === 'loading' && (
              <div className="flex justify-center mt-4 gap-1">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 bg-blue-500 rounded-full"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}