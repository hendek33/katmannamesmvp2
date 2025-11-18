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
  const [endGameGuessVotes, setEndGameGuessVotes] = useState<Record<string, string[]>>({});
  const [serverTimer, setServerTimer] = useState<{ timeRemaining: number; isExpired: boolean } | null>(null);
  const [usernameChangeStatus, setUsernameChangeStatus] = useState<{ success: boolean; message?: string } | null>(null);
  const [taunts, setTaunts] = useState<any[]>([]);
  const [insults, setInsults] = useState<any[]>([]);
  const [tomatoes, setTomatoes] = useState<any[]>([]);
  const [tauntEnabled, setTauntEnabled] = useState<boolean>(true);
  const [insultEnabled, setInsultEnabled] = useState<boolean>(true);
  const [tomatoThrowEnabled, setTomatoThrowEnabled] = useState<boolean>(true);
  const [globalTauntCooldown, setGlobalTauntCooldown] = useState<number>(0);
  const [globalInsultCooldown, setGlobalInsultCooldown] = useState<number>(0);
  const [globalTomatoCooldown, setGlobalTomatoCooldown] = useState<number>(0);
  const [kickChatMessages, setKickChatMessages] = useState<any[]>([]);
  const [kickChatVotes, setKickChatVotes] = useState({ likes: 0, dislikes: 0 });
  const [kickChatConfig, setKickChatConfig] = useState<any>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef<number>(0);
  const maxReconnectAttempts = 5;
  const pingInterval = useRef<NodeJS.Timeout>();
  const playerIdRef = useRef<string>("");

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
            if (savedPlayerId) {
              playerIdRef.current = savedPlayerId;
              setPlayerId(savedPlayerId);
            }
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
                playerIdRef.current = message.payload.playerId;
                setRoomCode(message.payload.roomCode);
                setGameState(message.payload.gameState);
                setError(""); // Clear any previous errors
                localStorage.setItem("katmannames_player_id", message.payload.playerId);
                localStorage.setItem("katmannames_room_code", message.payload.roomCode);
                break;

              case "room_joined":
                setPlayerId(message.payload.playerId);
                playerIdRef.current = message.payload.playerId;
                setGameState(message.payload.gameState);
                setRoomCode(message.payload.gameState.roomCode);
                setError(""); // Clear any previous errors
                if (message.payload.cardImages) {
                  setCardImages(message.payload.cardImages);
                }
                if (message.payload.kickChatConfig) {
                  setKickChatConfig(message.payload.kickChatConfig);
                }
                localStorage.setItem("katmannames_player_id", message.payload.playerId);
                localStorage.setItem("katmannames_room_code", message.payload.gameState.roomCode);
                break;

              case "game_updated":
              case "player_joined":
              case "player_left":
              case "player_disconnected":
              case "clue_given":
                setGameState(message.payload.gameState);
                break;

              case "game_started":
              case "game_restarted":
                setGameState(message.payload.gameState);
                if (message.payload.cardImages) {
                  setCardImages(message.payload.cardImages);
                }
                // Reset kick chat votes when game starts
                setKickChatVotes({ likes: 0, dislikes: 0 });
                break;

              // Introduction phase handlers
              case "player_introducing":
                setGameState(message.payload.gameState);
                // Reset votes when a new player starts introducing
                setKickChatVotes({ likes: 0, dislikes: 0 });
                break;
                
              case "introduction_finished":
              case "introduction_liked":
                setGameState(message.payload.gameState);
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
                
              case "kicked":
                // Player was kicked from the room
                setGameState(null);
                setRoomCode("");
                setPlayerId("");
                localStorage.removeItem("katmannames_room_code");
                localStorage.removeItem("katmannames_player_id");
                setError(message.payload.message || "Oyundan atıldınız");
                // Redirect to rooms page
                window.location.href = "/rooms";
                break;
                
              case "player_kicked":
                // Another player was kicked from the room
                setGameState(message.payload.gameState);
                break;

              case "votes_updated":
                setCardVotes(message.payload.votes || {});
                break;

              case "end_game_votes_updated":
                setEndGameGuessVotes(message.payload.votes || {});
                if (message.payload.gameState) {
                  setGameState(message.payload.gameState);
                }
                break;
                
              case "error":
                setError(message.payload.message);
                break;
                
              case "pong":
                // Server acknowledged our ping, connection is alive
                break;
                
              case "timer_tick":
                // Handle server-sent timer updates
                setServerTimer(message.payload);
                break;
                
              case "timer_expired":
                // Handle timer expiry notification
                setServerTimer({ timeRemaining: 0, isExpired: true });
                break;
                
              case "username_changed":
                // Handle username change response
                if (message.payload.success) {
                  // Username changed successfully - update local storage
                  const currentPlayer = message.payload.gameState?.players?.find((p: any) => p.id === playerId);
                  if (currentPlayer) {
                    localStorage.setItem("katmannames_username", currentPlayer.username);
                  }
                  setUsernameChangeStatus({ success: true });
                  setError("");
                } else {
                  setUsernameChangeStatus({ 
                    success: false, 
                    message: message.payload.message || "İsim değiştirilemedi" 
                  });
                  setError(message.payload.message || "İsim değiştirilemedi");
                }
                break;
                
              case "game_state_updated":
                // Handle game state updates (team changes, username changes, etc.)
                if (message.payload.gameState) {
                  setGameState(message.payload.gameState);
                  // Update username in localStorage if it changed
                  const currentPlayer = message.payload.gameState.players?.find((p: any) => p.id === playerId);
                  if (currentPlayer) {
                    const storedUsername = localStorage.getItem("katmannames_username");
                    if (storedUsername !== currentPlayer.username) {
                      localStorage.setItem("katmannames_username", currentPlayer.username);
                    }
                  }
                }
                break;
                
              case "taunt_triggered":
                // Handle taunt events
                // Prevent duplicates by checking if this exact taunt already exists
                setTaunts(prev => {
                  const isDuplicate = prev.some(t => 
                    t.playerId === message.payload.playerId && 
                    t.expiresAt === message.payload.expiresAt
                  );
                  if (isDuplicate) {
                    return prev;
                  }
                  return [...prev, message.payload];
                });
                // Only set cooldown for the same team
                // Use gameState from payload if available, or the latest state
                const tauntGameState = message.payload.gameState;
                if (tauntGameState && tauntGameState.players) {
                  const currentPlayerForTaunt = tauntGameState.players.find((p: any) => p.id === playerIdRef.current);
                  if (currentPlayerForTaunt && currentPlayerForTaunt.team === message.payload.team) {
                    setGlobalTauntCooldown(5);
                  }
                }
                // Remove taunt after expiry - don't set duplicate timeouts
                // The TauntOverlay component already handles cleanup
                break;
                
              case "insult_sent":
                // Handle insult events
                // Prevent duplicates by checking if this exact insult already exists
                setInsults(prev => {
                  const isDuplicate = prev.some(i => 
                    i.timestamp === message.payload.timestamp && 
                    i.senderId === message.payload.senderId
                  );
                  if (isDuplicate) {
                    return prev;
                  }
                  return [...prev, message.payload];
                });
                // Only set cooldown for the same team
                // Use gameState from payload if available, or the latest state
                const insultGameState = message.payload.gameState;
                if (insultGameState && insultGameState.players) {
                  const currentPlayerForInsult = insultGameState.players.find((p: any) => p.id === playerIdRef.current);
                  if (currentPlayerForInsult && currentPlayerForInsult.team === message.payload.senderTeam) {
                    setGlobalInsultCooldown(5);
                  }
                }
                // Don't remove insult here - let InsultBubble component handle its own lifecycle
                break;
                
              case "taunt_toggled":
                setTauntEnabled(message.payload.tauntEnabled);
                break;
                
              case "insult_toggled":
                setInsultEnabled(message.payload.insultEnabled);
                break;
                
              case "tomato_thrown":
                // Handle tomato events
                // Prevent duplicates by checking if this exact tomato already exists
                setTomatoes(prev => {
                  const isDuplicate = prev.some(t => 
                    t.timestamp === message.payload.timestamp &&
                    t.playerId === message.payload.playerId
                  );
                  
                  if (isDuplicate) {
                    return prev;
                  }
                  
                  // Override position to use team panel locations
                  // Dark team panel at 15%, Light team panel at 85%, both at 50% vertical
                  const fromTeam = message.payload.fromTeam;
                  const targetTeam = message.payload.targetTeam;
                  
                  const tomatoWithPanelPositions = {
                    ...message.payload,
                    position: { 
                      x: fromTeam === 'dark' ? 0.15 : 0.85, 
                      y: 0.50 
                    },
                    targetPosition: { 
                      x: targetTeam === 'dark' ? 0.15 : 0.85, 
                      y: 0.50 
                    }
                  };
                  
                  return [...prev, tomatoWithPanelPositions];
                });
                
                // Update game state if provided
                if (message.payload.gameState) {
                  setGameState(message.payload.gameState);
                }
                
                // Set cooldown for the throwing player
                const tomatoGameState = message.payload.gameState;
                if (tomatoGameState && tomatoGameState.players) {
                  const currentPlayerForTomato = tomatoGameState.players.find((p: any) => p.id === playerIdRef.current);
                  if (currentPlayerForTomato && message.payload.playerId === playerIdRef.current) {
                    setGlobalTomatoCooldown(5);
                  }
                }
                break;
                
              case "tomato_toggled":
                setTomatoThrowEnabled(message.payload.tomatoThrowEnabled);
                break;
                
              case "room_features":
                setTauntEnabled(message.payload.tauntEnabled);
                setInsultEnabled(message.payload.insultEnabled);
                setTomatoThrowEnabled(message.payload.tomatoThrowEnabled);
                setGlobalTauntCooldown(message.payload.teamTauntCooldown || 0);
                setGlobalInsultCooldown(message.payload.teamInsultCooldown || 0);
                setGlobalTomatoCooldown(message.payload.playerTomatoCooldown || 0);
                break;
                
              case "kick_chat_message":
                // Handle single message (legacy support)
                setKickChatMessages(prev => {
                  if (!message.payload?.id) return prev;
                  if (prev.some(msg => msg.id === message.payload.id)) return prev;
                  const next = [...prev, message.payload];
                  const limit = message.payload?.historyLimit ?? 50;
                  return next.slice(-limit);
                });
                break;
                
              case "kick_chat_messages_batch":
                // Handle batched messages for better performance
                setKickChatMessages(prev => {
                  if (!message.payload || !Array.isArray(message.payload)) return prev;
                  
                  // Filter out duplicates and add new messages
                  const existingIds = new Set(prev.map(msg => msg.id));
                  const newMessages = message.payload.filter(msg => 
                    msg?.id && !existingIds.has(msg.id)
                  );
                  
                  if (newMessages.length === 0) return prev;
                  
                  const next = [...prev, ...newMessages];
                  const limit = 50; // Keep last 50 messages
                  return next.slice(-limit);
                });
                break;
                
              case "kick_chat_vote":
                setKickChatVotes(prev => {
                  // Check if this is a vote event or a vote summary
                  if (message.payload?.vote) {
                    // Individual vote event - handle vote changes
                    const newVote = message.payload.vote;
                    const previousVote = message.payload.previousVote;
                    
                    let newLikes = prev.likes;
                    let newDislikes = prev.dislikes;
                    
                    // Remove previous vote if it existed
                    if (previousVote === 'like') {
                      newLikes = Math.max(0, newLikes - 1);
                    } else if (previousVote === 'dislike') {
                      newDislikes = Math.max(0, newDislikes - 1);
                    }
                    
                    // Add new vote
                    if (newVote === 'like') {
                      newLikes += 1;
                    } else if (newVote === 'dislike') {
                      newDislikes += 1;
                    }
                    
                    return {
                      likes: newLikes,
                      dislikes: newDislikes
                    };
                  } else if ('likes' in message.payload && 'dislikes' in message.payload) {
                    // Vote summary (e.g., end of session or reset)
                    return {
                      likes: message.payload.likes || 0,
                      dislikes: message.payload.dislikes || 0
                    };
                  }
                  return prev;
                });
                break;
                
              case "kick_chat_config_updated":
                if (message.payload?.config) {
                  setKickChatConfig(message.payload.config);
                }
                break;
            }
          } catch (err) {
          }
        };

        ws.current.onclose = (event) => {
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

  const clearUsernameChangeStatus = useCallback(() => {
    setUsernameChangeStatus(null);
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
    endGameGuessVotes,
    serverTimer,
    usernameChangeStatus,
    clearUsernameChangeStatus,
    taunts,
    insults,
    setInsults,
    tomatoes,
    setTomatoes,
    tauntEnabled,
    insultEnabled,
    tomatoThrowEnabled,
    globalTauntCooldown,
    globalInsultCooldown,
    globalTomatoCooldown,
    setGlobalTauntCooldown,
    setGlobalInsultCooldown,
    setGlobalTomatoCooldown,
    kickChatMessages,
    kickChatVotes,
    kickChatConfig,
    setKickChatMessages,
    send,
  };
}
