import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WebSocketProvider } from "@/contexts/WebSocketContext";
import { VideoBase64Converter } from "@/services/VideoBase64Converter";
import { GameProtection } from "@/utils/protection";
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
    // Initialize game protection system
    GameProtection.initializeProtection();
    
    // SADECE TEK BİR VİDEO YÜKLEME SERVİSİ - ÇOKLU YÜKLEME SORUNU ÇÖZÜLDÜ
    // VideoBase64Converter videolar bir kere yüklenir, base64'e çevrilir ve cache'lenir
    VideoBase64Converter.preloadAllAsBase64()
      .catch(err => {
        // Base64 conversion failed, falling back to normal loading
      });
    
    // DİĞER VIDEO SERVİSLERİ KAPATILDI - ARTIK ÇOKLU YÜKLEME YOK
    // videoCache.preloadAllVideos() - KALDIRILDI
    // videoOptimizer.preloadAllVideos() - KALDIRILDI
    // VideoPreloader komponenti - KALDIRILDI
    
    // Cleanup on unmount
    return () => {
      VideoBase64Converter.clearCache();
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  );
}

export default App;
