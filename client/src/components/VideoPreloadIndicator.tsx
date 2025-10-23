import { useVideoContext } from "@/contexts/VideoContext";
import { Loader2 } from "lucide-react";

export function VideoPreloadIndicator() {
  const { isLoading, videosReady } = useVideoContext();
  
  if (videosReady) return null;
  
  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-slate-800/90 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      <span>Videolar hazırlanıyor...</span>
    </div>
  );
}