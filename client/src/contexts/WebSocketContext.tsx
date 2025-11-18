import { createContext, useContext, ReactNode } from "react";
import { useWebSocket } from "@/hooks/useWebSocket";
import type { GameState, RoomListItem } from "@shared/schema";

interface WebSocketContextType {
  isConnected: boolean;
  gameState: GameState | null;
  playerId: string;
  roomCode: string;
  error: string;
  roomsList: RoomListItem[];
  cardVotes: Record<number, string[]>;
  cardImages: Record<number, string>;
  endGameGuessVotes: Record<string, string[]>;
  serverTimer: { timeRemaining: number; isExpired: boolean } | null;
  usernameChangeStatus: { success: boolean; message?: string } | null;
  clearUsernameChangeStatus: () => void;
  taunts: any[];
  insults: any[];
  setInsults: (value: any[] | ((prev: any[]) => any[])) => void;
  tomatoes: any[];
  setTomatoes: (value: any[] | ((prev: any[]) => any[])) => void;
  tauntEnabled: boolean;
  insultEnabled: boolean;
  tomatoThrowEnabled: boolean;
  globalTauntCooldown: number;
  globalInsultCooldown: number;
  globalTomatoCooldown: number;
  setGlobalTauntCooldown: (value: number | ((prev: number) => number)) => void;
  setGlobalInsultCooldown: (value: number | ((prev: number) => number)) => void;
  setGlobalTomatoCooldown: (value: number | ((prev: number) => number)) => void;
  kickChatMessages: any[];
  kickChatVotes: { likes: number; dislikes: number };
  kickChatConfig: any;
  setKickChatMessages: (value: any[] | ((prev: any[]) => any[])) => void;
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
