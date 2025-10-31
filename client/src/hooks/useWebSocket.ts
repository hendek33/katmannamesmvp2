import { useEffect, useRef, useState, useCallback } from "react";
import type { GameState, RoomListItem } from "@shared/schema";

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
  const [roomsList, setRoomsList] = useState<RoomListItem[]>([]);
  const [cardVotes, setCardVotes] = useState<Record<number, string[]>>({});
  const [cardImages, setCardImages] = useState<Record<number, string>>({});
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const pingInterval = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let isCleanedUp = false;

    const connect = () => {
      if (isCleanedUp) return;
      
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        if (ws.current?.readyState === WebSocket.OPEN || ws.current?.readyState === WebSocket.CONNECTING) {
          return;
        }

        ws.current = new WebSocket(wsUrl);
        
        // Expose ws ref globally for taunt handling
        (window as any).wsRef = ws;

        ws.current.onopen = () => {
          setIsConnected(true);
          setError("");
          reconnectAttempts.current = 0;
          console.log("WebSocket connected");
          
          // Start ping interval to keep connection alive
          if (pingInterval.current) {
            clearInterval(pingInterval.current);
          }
          pingInterval.current = setInterval(() => {
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({ type: "ping", payload: {} }));
            }
          }, 4000); // Ping every 4 seconds to prevent 5-second timeout
          
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
              case "rooms_list":
                setRoomsList(message.payload.rooms);
                break;

              case "room_created":
                setPlayerId(message.payload.playerId);
                setRoomCode(message.payload.roomCode);
                setGameState(message.payload.gameState);
                setError(""); // Clear any previous errors
                localStorage.setItem("katmannames_player_id", message.payload.playerId);
                localStorage.setItem("katmannames_room_code", message.payload.roomCode);
                break;

              case "room_joined":
                setPlayerId(message.payload.playerId);
                setGameState(message.payload.gameState);
                setRoomCode(message.payload.gameState.roomCode);
                setError(""); // Clear any previous errors
                if (message.payload.cardImages) {
                  setCardImages(message.payload.cardImages);
                }
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
              case "game_restarted":
                setGameState(message.payload.gameState);
                if (message.payload.cardImages) {
                  setCardImages(message.payload.cardImages);
                }
                break;
                
              case "card_revealed":
                setGameState(message.payload.gameState);
                if (message.payload.cardImages) {
                  setCardImages(message.payload.cardImages);
                }
                break;
                
              case "returned_to_lobby":
                setGameState(message.payload.gameState);
                setCardImages({});
                break;

              case "left_room":
                setGameState(null);
                setRoomCode("");
                setPlayerId("");
                localStorage.removeItem("katmannames_room_code");
                localStorage.removeItem("katmannames_player_id");
                break;

              case "votes_updated":
                setCardVotes(message.payload.votes || {});
                break;
                
              case "error":
                setError(message.payload.message);
                break;
                
              case "pong":
                // Server acknowledged our ping, connection is alive
                break;
            }
          } catch (err) {
            console.error("Error parsing WebSocket message:", err);
          }
        };

        ws.current.onclose = (event) => {
          console.log(`WebSocket closed. Code: ${event.code}, Reason: ${event.reason}`);
          setIsConnected(false);
          
          // Clear ping interval
          if (pingInterval.current) {
            clearInterval(pingInterval.current);
            pingInterval.current = undefined;
          }
          
          // Don't reconnect if cleaned up or normal closure
          if (isCleanedUp || event.code === 1000) {
            return;
          }
          
          // Only reconnect if haven't exceeded max attempts
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            const delay = Math.min(3000 * reconnectAttempts.current, 10000);
            console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})...`);
            
            reconnectTimeout.current = setTimeout(() => {
              connect();
            }, delay);
          } else {
            setError("Bağlantı kurulamadı. Lütfen sayfayı yenileyin.");
          }
        };

        ws.current.onerror = (error) => {
          console.error("WebSocket error:", error);
          setError("Bağlantı hatası");
        };
      } catch (err) {
        console.error("Error connecting to WebSocket:", err);
        setError("Sunucuya bağlanılamadı");
      }
    };

    connect();

    return () => {
      isCleanedUp = true;
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.close(1000, "Component unmounted");
      }
    };
  }, []);

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
    roomsList,
    cardVotes,
    cardImages,
    send,
  };
}
