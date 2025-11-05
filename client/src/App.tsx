import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { videoCache } from "@/services/VideoCache";
import { enhancedVideoCache } from "@/services/EnhancedVideoCache";
import { VideoPreloader } from "@/components/VideoPreloader";
import Welcome from "@/pages/Welcome";
import RoomList from "@/pages/RoomList";
import Lobby from "@/pages/Lobby";
import Game from "@/pages/Game";
import GameEnd from "@/pages/GameEnd";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Welcome} />
      <Route path="/rooms" component={RoomList} />
      <Route path="/lobby" component={Lobby} />
      <Route path="/game" component={Game} />
      <Route path="/end" component={GameEnd} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Preload all videos when app starts
    videoCache.preloadAllVideos();
    
    // TEMPORARILY DISABLED: Enhanced video cache is causing loading issues
    // enhancedVideoCache.preloadAllVideos().catch(err => {
    //   console.error('Enhanced video preloading failed:', err);
    // });
    
    // Cleanup on unmount
    return () => {
      videoCache.dispose();
      // enhancedVideoCache.dispose();
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <TooltipProvider>
          <VideoPreloader />
          <Toaster />
          <Router />
        </TooltipProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
