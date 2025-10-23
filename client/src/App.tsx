import { useEffect, useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { videoPreloadManager } from "@/services/VideoPreloadManager";
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
  const [videosReady, setVideosReady] = useState(false);
  
  useEffect(() => {
    // İlk yüklemede tüm videoları cache'e al
    videoPreloadManager.ensureAllVideosLoaded().then(() => {
      setVideosReady(true);
      console.log('App: Videolar hazır');
    });
    
    // Cleanup on unmount
    return () => {
      videoPreloadManager.dispose();
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <TooltipProvider>
          <Toaster />
          {/* Videolar tam yüklenene kadar loading gösterebiliriz ama şimdilik direkt render edelim */}
          <Router />
        </TooltipProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
