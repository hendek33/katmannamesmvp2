import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState } from "@shared/schema";

type WSMessage = {
  type: string;
  payload: any;
};

export function useWebSocket() {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [error, setError] = useState<string>("");
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    try {
      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        setIsConnected(true);
        setError("");
        
        const savedRoomCode = localStorage.getItem("katmannames_room_code");
        const savedPlayerId = localStorage.getItem("katmannames_player_id");
        const savedUsername = localStorage.getItem("katmannames_username");
        
        if (savedRoomCode && savedUsername && ws.current) {
          ws.current.send(JSON.stringify({
            type: "join_room",
            payload: { 
              roomCode: savedRoomCode, 
              username: savedUsername,
              playerId: savedPlayerId || undefined
            }
          }));
        }
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case "room_created":
              setPlayerId(message.payload.playerId);
              setRoomCode(message.payload.roomCode);
              setGameState(message.payload.gameState);
              localStorage.setItem("katmannames_player_id", message.payload.playerId);
              localStorage.setItem("katmannames_room_code", message.payload.roomCode);
              break;

            case "room_joined":
              setPlayerId(message.payload.playerId);
              setGameState(message.payload.gameState);
              setRoomCode(message.payload.gameState.roomCode);
              localStorage.setItem("katmannames_player_id", message.payload.playerId);
              localStorage.setItem("katmannames_room_code", message.payload.gameState.roomCode);
              break;

            case "game_updated":
            case "player_joined":
            case "player_left":
            case "clue_given":
              setGameState(message.payload.gameState);
              break;

            case "game_started":
            case "card_revealed":
            case "game_restarted":
              setGameState(message.payload.gameState);
              break;

            case "error":
              setError(message.payload.message);
              break;
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      ws.current.onclose = () => {
        setIsConnected(false);
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, 3000);
      };

      ws.current.onerror = (error) => {
        console.error("WebSocket error:", error);
        setError("Bağlantı hatası");
      };
    } catch (err) {
      console.error("Error connecting to WebSocket:", err);
      setError("Sunucuya bağlanılamadı");
    }
  }, []);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((type: string, payload: any) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type, payload }));
      setError("");
    } else {
      setError("Bağlantı yok");
    }
  }, []);

  return {
    isConnected,
    gameState,
    playerId,
    roomCode,
    error,
    send,
  };
}
