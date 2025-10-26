import { createContext, useContext, ReactNode } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { GameState, RoomListItem } from "@shared/schema";

interface GameConfig {
  cardImages: {
    normalCardOffset: number;
    assassinCardOffset: number;
  };
  fonts: {
    clueInputSize: number;
  };
}

interface WebSocketContextType {
  isConnected: boolean;
  gameState: GameState | null;
  playerId: string;
  roomCode: string;
  error: string;
  roomsList: RoomListItem[];
  cardVotes: Record<number, string[]>;
  cardImages: Record<number, string>;
  gameConfig: GameConfig;
  send: (type: string, payload: any) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const websocket = useWebSocket();
  
  return (
    <WebSocketContext.Provider value={websocket}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error("useWebSocketContext must be used within WebSocketProvider");
  }
  return context;
}
