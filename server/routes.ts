import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage } from "./storage";
import type { GameState } from "@shared/schema";
import { sanitizeUsername, sanitizePassword, sanitizeRoomCode, isXssSafe } from "./sanitize";
import {
  createRoomSchema,
  joinRoomSchema,
  teamSelectSchema,
  roleSelectSchema,
  giveClueSchema,
  revealCardSchema,
  addBotSchema,
  updateTeamNameSchema,
  updateTimerSettingsSchema,
  updateChaosModeSchema,
  updateChaosModeTypeSchema,
  updateProphetVisibilitySchema,
  updateProphetWinModeSchema,
  updateTomatoThrowEnabledSchema,
  throwTomatoSchema,
  guessProphetSchema,
  guessDoubleAgentSchema,
  endGameGuessSchema,
  voteEndGameGuessSchema,
  selectPlayerForIntroductionSchema,
  finishIntroductionSchema,
  likeIntroductionSchema,
  skipIntroductionSchema,
} from "@shared/schema";
import { kickChatService } from "./kickChatService";
import { registerAdminRoutes } from "./admin-routes";

interface WSClient extends WebSocket {
  playerId?: string;
  roomCode?: string;
  isAlive?: boolean;
  replaced?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Register admin routes
  registerAdminRoutes(app);
  
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const roomClients = new Map<string, Set<WSClient>>();
  const roomTimers = new Map<string, NodeJS.Timeout>();

  // Timer management functions
  function startRoomTimer(roomCode: string) {
    // Clear existing timer if any
    stopRoomTimer(roomCode);
    
    const interval = setInterval(() => {
      const room = storage.getRoom(roomCode);
      if (!room || room.phase !== 'playing' || !room.timedMode || !room.currentTurnStartTime) {
        stopRoomTimer(roomCode);
        return;
      }

      const duration = room.currentClue 
        ? (room.guesserTime || 180) * 1000 
        : (room.spymasterTime || 120) * 1000;
      const elapsed = Date.now() - room.currentTurnStartTime;
      const remaining = Math.max(0, duration - elapsed);
      
      // Broadcast timer update to all clients in the room
      broadcastToRoom(roomCode, {
        type: "timer_tick",
        payload: { 
          timeRemaining: Math.floor(remaining / 1000),
          isExpired: remaining === 0
        }
      });

      // Timer expired - just notify, don't end turn
      if (remaining === 0) {
        // Just notify that time expired, but don't end the turn
        broadcastToRoom(roomCode, {
          type: "timer_expired",
          payload: { 
            message: "Süre doldu! Oynamaya devam edebilirsiniz.",
            autoEndDisabled: true 
          }
        });
        stopRoomTimer(roomCode);
      }
    }, 1000); // Update every second
    
    roomTimers.set(roomCode, interval);
  }

  function stopRoomTimer(roomCode: string) {
    const timer = roomTimers.get(roomCode);
    if (timer) {
      clearInterval(timer);
      roomTimers.delete(roomCode);
    }
  }

  function broadcastToRoom(roomCode: string, message: any, excludeClient?: WSClient) {
    const clients = roomClients.get(roomCode);
    if (!clients) return;

    const messageStr = JSON.stringify(message);
    clients.forEach(client => {
      if (client !== excludeClient && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }
  
  // Broadcast updates to all connected admin panels
  function broadcastToAdmins() {
    const adminData = {
      overview: storage.getAdminOverview(),
      rooms: storage.getAdminRooms(),
      players: storage.getAdminPlayers()
    };
    
    const messageStr = JSON.stringify({
      type: "admin_data",
      payload: adminData
    });
    
    wss.clients.forEach((client: any) => {
      if (client.readyState === WebSocket.OPEN && client.isAdmin) {
        client.send(messageStr);
      }
    });
  }

  function sendToClient(client: WSClient, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  function getFilteredGameState(gameState: GameState, playerId: string): GameState {
    const player = gameState.players.find(p => p.id === playerId);
    const isSpymaster = player?.role === "spymaster";
    const isProphet = player?.secretRole === "prophet";
    
    // Spymasters always see all cards
    if (isSpymaster || gameState.phase !== "playing") {
      return gameState;
    }
    
    // For prophets, show true card types only for cards in their knownCards array
    if (isProphet && player?.knownCards) {
      return {
        ...gameState,
        cards: gameState.cards.map(card => ({
          ...card,
          type: card.revealed || player.knownCards?.includes(card.id) 
            ? card.type 
            : ("neutral" as any),
        })),
        consecutivePasses: gameState.consecutivePasses,
      };
    }

    // For regular guessers, mask all unrevealed cards
    return {
      ...gameState,
      cards: gameState.cards.map(card => ({
        ...card,
        type: card.revealed ? card.type : ("neutral" as any),
      })),
      consecutivePasses: gameState.consecutivePasses,
    };
  }

  // Message batching for Kick chat to reduce server load
  const kickChatMessageBuffer = new Map<string, any[]>();
  const kickChatBatchInterval = 500; // Send messages every 500ms max
  const maxBatchSize = 30; // Maximum messages per batch - increased for high traffic
  
  // Set up Kick chat service event listeners with batching and filtering
  kickChatService.on('message', (message) => {
    // Forward chat messages only to rooms that have Kick chat enabled AND are in appropriate phase
    roomClients.forEach((clients, roomCode) => {
      const kickConfig = storage.getKickChatConfig(roomCode);
      if (!kickConfig?.enabled) return;
      
      // If chatroomId is specified, only broadcast to matching rooms
      if (kickConfig.chatroomId && 
          kickConfig.chatroomId !== message.chatroomId) {
        return;
      }
      
      // PERFORMANCE FIX: Only forward messages to rooms that are actively in-game
      const gameState = storage.getRoom(roomCode);
      if (!gameState) return;
      
      // Only send messages during introduction phase where Kick chat is actually used
      if (gameState.phase !== 'introduction') {
        return; // Skip sending messages during lobby, playing, or ended phases
      }
      
      // Add message to buffer for batching
      if (!kickChatMessageBuffer.has(roomCode)) {
        kickChatMessageBuffer.set(roomCode, []);
        
        // Set up batch sending for this room
        setTimeout(() => {
          const messages = kickChatMessageBuffer.get(roomCode);
          if (messages && messages.length > 0) {
            // Send all messages in chunks with small delays between chunks
            let remaining = [...messages];
            let chunkIndex = 0;
            
            const sendNextChunk = () => {
              if (remaining.length > 0) {
                const chunk = remaining.slice(0, maxBatchSize);
                broadcastToRoom(roomCode, {
                  type: 'kick_chat_messages_batch',
                  payload: chunk
                });
                remaining = remaining.slice(maxBatchSize);
                
                // If there are more chunks, send them with 50ms delay
                if (remaining.length > 0) {
                  chunkIndex++;
                  setTimeout(sendNextChunk, 50 * chunkIndex); // Progressive delay: 50ms, 100ms, 150ms...
                } else {
                  // Only delete buffer after all chunks are sent
                  kickChatMessageBuffer.delete(roomCode);
                }
              }
            };
            
            // Start sending chunks
            sendNextChunk();
            // Buffer will be deleted after last chunk is sent
          }
        }, kickChatBatchInterval);
      }
      
      const buffer = kickChatMessageBuffer.get(roomCode);
      if (buffer) {
        // Always add message to buffer - no limit on buffer size
        // Messages will be sent in chunks when timer triggers
        buffer.push(message);
      }
    });
  });
  
  kickChatService.on('vote', (voteData) => {
    // Forward vote events only to rooms with Kick chat enabled
    roomClients.forEach((clients, roomCode) => {
      const kickConfig = storage.getKickChatConfig(roomCode);
      if (!kickConfig?.enabled) return;
      
      // If chatroomId is specified, only broadcast to matching rooms  
      if (kickConfig.chatroomId && 
          kickConfig.chatroomId !== voteData.chatroomId) {
        return;
      }
      
      broadcastToRoom(roomCode, {
        type: 'kick_chat_vote',
        payload: voteData
      });
    });
  });

  // Rate limiting for WebSocket messages
  const messageRateLimiter = new Map<string, { count: number; resetTime: number }>();
  const MAX_MESSAGES_PER_SECOND = 10;
  const RATE_LIMIT_WINDOW = 1000; // 1 second
  
  wss.on("connection", (ws: WSClient) => {
    ws.isAlive = true;
    let messageCount = 0;
    let lastReset = Date.now();

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (data: Buffer) => {
      // Simple flood protection
      const now = Date.now();
      if (now - lastReset > RATE_LIMIT_WINDOW) {
        messageCount = 0;
        lastReset = now;
      }
      
      messageCount++;
      if (messageCount > MAX_MESSAGES_PER_SECOND) {
        console.warn(`[WebSocket] Rate limit exceeded for client ${ws.playerId || 'unknown'}`);
        sendToClient(ws, {
          type: "error",
          payload: { message: "Çok fazla mesaj gönderiyorsunuz. Lütfen yavaşlayın." }
        });
        return;
      }
      
      try {
        const message = JSON.parse(data.toString());
        const { type, payload } = message;
        
        // Debug logging for all messages
        if (type === "send_insult") {
          console.log("[ROUTES] Raw message:", message);
          console.log("[ROUTES] Message keys:", Object.keys(message));
          console.log("[ROUTES] Type:", type, "Payload:", payload);
        }

        switch (type) {
          case "ping": {
            // Simple ping-pong to keep connection alive
            sendToClient(ws, {
              type: "pong",
              payload: {},
            });
            break;
          }
          
          case "admin_connect": {
            // Admin panel WebSocket connection
            const token = payload.token;
            if (!token || !storage.validateAdminSession(token)) {
              sendToClient(ws, {
                type: "error",
                payload: { message: "Geçersiz admin oturumu" }
              });
              ws.close();
              return;
            }
            
            // Mark this as an admin connection
            (ws as any).isAdmin = true;
            (ws as any).adminToken = token;
            
            // Send initial data
            sendToClient(ws, {
              type: "admin_data",
              payload: {
                overview: storage.getAdminOverview(),
                rooms: storage.getAdminRooms(),
                players: storage.getAdminPlayers()
              }
            });
            break;
          }
          
          case "check_username": {
            const rawUsername = payload.username;
            if (!rawUsername || typeof rawUsername !== "string") {
              sendToClient(ws, {
                type: "username_availability",
                payload: { available: false, username: rawUsername },
              });
              return;
            }
            
            // Sanitize username to prevent XSS
            const username = sanitizeUsername(rawUsername);
            
            // Check if sanitization changed the username (potential XSS attempt)
            if (username !== rawUsername || !isXssSafe(rawUsername)) {
              sendToClient(ws, {
                type: "username_availability",
                payload: { 
                  available: false, 
                  username: rawUsername,
                  message: "Kullanıcı adı geçersiz karakterler içeriyor" 
                },
              });
              return;
            }
            
            const available = storage.isUsernameAvailable(username);
            sendToClient(ws, {
              type: "username_availability",
              payload: { available, username },
            });
            break;
          }
          
          case "reserve_username": {
            const rawUsername = payload.username;
            if (!rawUsername || typeof rawUsername !== "string") {
              sendToClient(ws, {
                type: "username_reserved",
                payload: { success: false, username: rawUsername },
              });
              return;
            }
            
            // Sanitize username to prevent XSS
            const username = sanitizeUsername(rawUsername);
            
            // Check if sanitization changed the username (potential XSS attempt)
            if (username !== rawUsername || !isXssSafe(rawUsername)) {
              sendToClient(ws, {
                type: "username_reserved",
                payload: { 
                  success: false, 
                  username: rawUsername,
                  message: "Kullanıcı adı geçersiz karakterler içeriyor" 
                },
              });
              return;
            }
            
            const tempId = storage.reserveUsername(username);
            sendToClient(ws, {
              type: "username_reserved",
              payload: { 
                success: !!tempId, 
                username,
                tempId 
              },
            });
            break;
          }
          
          case "release_username": {
            const username = payload.username;
            if (username && typeof username === "string") {
              storage.releaseUsername(username);
            }
            break;
          }
          
          case "change_username": {
            const { newUsername: rawNewUsername } = payload;
            if (!rawNewUsername || typeof rawNewUsername !== "string" || !ws.playerId || !ws.roomCode) {
              sendToClient(ws, { 
                type: "username_changed", 
                payload: { 
                  success: false, 
                  message: "Geçersiz veri veya oturum" 
                } 
              });
              return;
            }
            
            // Sanitize username to prevent XSS
            const newUsername = sanitizeUsername(rawNewUsername);
            
            // Check if sanitization changed the username (potential XSS attempt)
            if (newUsername !== rawNewUsername || !isXssSafe(rawNewUsername)) {
              sendToClient(ws, {
                type: "username_changed",
                payload: { 
                  success: false,
                  message: "Kullanıcı adı geçersiz karakterler içeriyor"
                }
              });
              return;
            }
            
            // Validate username length
            if (newUsername.length < 2 || newUsername.length > 20) {
              sendToClient(ws, {
                type: "username_changed",
                payload: { 
                  success: false,
                  message: "İsim 2-20 karakter arasında olmalıdır"
                }
              });
              return;
            }
            
            const gameState = storage.changePlayerUsername(ws.roomCode, ws.playerId, newUsername);
            if (!gameState) {
              sendToClient(ws, {
                type: "username_changed", 
                payload: { 
                  success: false,
                  message: "Bu kullanıcı adı zaten kullanımda veya değiştirilemedi"
                }
              });
              return;
            }
            
            // Notify all clients in the room
            const clients = roomClients.get(ws.roomCode);
            if (clients) {
              for (const client of Array.from(clients)) {
                sendToClient(client, {
                  type: "game_state_updated",
                  payload: { gameState: getFilteredGameState(gameState, client.playerId || "") }
                });
              }
            }
            
            sendToClient(ws, {
              type: "username_changed",
              payload: { 
                success: true,
                message: "Kullanıcı adınız başarıyla değiştirildi"
              }
            });
            break;
          }
          
          case "list_rooms": {
            const roomList = storage.listRooms();
            sendToClient(ws, {
              type: "rooms_list",
              payload: { rooms: roomList },
            });
            break;
          }

          case "create_room": {
            const validation = createRoomSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz veri" } });
              return;
            }

            // Sanitize inputs to prevent XSS
            const sanitizedUsername = sanitizeUsername(validation.data.username);
            const sanitizedPassword = validation.data.password ? sanitizePassword(validation.data.password) : undefined;
            
            // Check if sanitization changed the inputs (potential XSS attempt)
            if (sanitizedUsername !== validation.data.username || !isXssSafe(validation.data.username)) {
              sendToClient(ws, { 
                type: "error", 
                payload: { 
                  message: "Kullanıcı adı geçersiz karakterler içeriyor",
                  code: "INVALID_USERNAME" 
                } 
              });
              return;
            }
            
            if (validation.data.password && sanitizedPassword !== validation.data.password) {
              sendToClient(ws, { 
                type: "error", 
                payload: { 
                  message: "Şifre geçersiz karakterler içeriyor",
                  code: "INVALID_PASSWORD" 
                } 
              });
              return;
            }

            const result = storage.createRoom(
              sanitizedUsername,
              sanitizedPassword
            );
            
            if (!result) {
              sendToClient(ws, { 
                type: "error", 
                payload: { 
                  message: "Bu kullanıcı adı zaten kullanımda! Lütfen farklı bir kullanıcı adı seçin.",
                  code: "USERNAME_TAKEN" 
                } 
              });
              return;
            }
            
            const { roomCode, playerId, gameState } = result;
            
            ws.playerId = playerId;
            ws.roomCode = roomCode;

            if (!roomClients.has(roomCode)) {
              roomClients.set(roomCode, new Set());
            }
            roomClients.get(roomCode)!.add(ws);

            sendToClient(ws, {
              type: "room_created",
              payload: { roomCode, playerId, gameState: getFilteredGameState(gameState, playerId) },
            });
            
            // Notify admins about new room
            broadcastToAdmins();
            break;
          }

          case "join_room": {
            const validation = joinRoomSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz veri" } });
              return;
            }

            // Sanitize inputs to prevent XSS
            const sanitizedRoomCode = sanitizeRoomCode(validation.data.roomCode);
            const sanitizedUsername = sanitizeUsername(validation.data.username);
            const sanitizedPassword = validation.data.password ? sanitizePassword(validation.data.password) : undefined;
            
            // Check if sanitization changed the inputs (potential XSS attempt)
            if (sanitizedUsername !== validation.data.username || !isXssSafe(validation.data.username)) {
              sendToClient(ws, { 
                type: "error", 
                payload: { 
                  message: "Kullanıcı adı geçersiz karakterler içeriyor",
                  code: "INVALID_USERNAME" 
                } 
              });
              return;
            }
            
            if (validation.data.password && sanitizedPassword !== validation.data.password) {
              sendToClient(ws, { 
                type: "error", 
                payload: { 
                  message: "Şifre geçersiz karakterler içeriyor",
                  code: "INVALID_PASSWORD" 
                } 
              });
              return;
            }

            const result = storage.joinRoom(
              sanitizedRoomCode, 
              sanitizedUsername,
              sanitizedPassword,
              validation.data.playerId
            );
            if (!result) {
              // Try to determine the specific error
              const room = storage.getRoom(validation.data.roomCode);
              if (!room) {
                sendToClient(ws, { type: "error", payload: { message: "Oda bulunamadı" } });
              } else {
                // Username is likely taken
                sendToClient(ws, { 
                  type: "error", 
                  payload: { 
                    message: "Bu kullanıcı adı zaten kullanımda! Lütfen farklı bir kullanıcı adı seçin.",
                    code: "USERNAME_TAKEN" 
                  } 
                });
              }
              return;
            }

            const { playerId, gameState, isReconnect } = result;
            const existingClients = roomClients.get(validation.data.roomCode);
            if (existingClients) {
              for (const client of Array.from(existingClients)) {
                if (client.playerId === playerId) {
                  client.replaced = true;
                  client.close();
                  existingClients.delete(client);
                  break;
                }
              }
            }

            ws.playerId = playerId;
            ws.roomCode = validation.data.roomCode;

            if (!roomClients.has(validation.data.roomCode)) {
              roomClients.set(validation.data.roomCode, new Set());
            }
            roomClients.get(validation.data.roomCode)!.add(ws);

            const cardImages = storage.getCardImages(validation.data.roomCode);
            const kickConfig = storage.getKickChatConfig(validation.data.roomCode);
            sendToClient(ws, {
              type: "room_joined",
              payload: { 
                playerId, 
                gameState: getFilteredGameState(gameState, playerId),
                cardImages: cardImages || {},
                kickChatConfig: kickConfig || { enabled: false }
              },
            });
            
            // Send initial votes
            const votes = storage.getCardVotes(validation.data.roomCode);
            if (votes) {
              sendToClient(ws, {
                type: "votes_updated",
                payload: { votes: Object.fromEntries(votes) },
              });
            }

            if (!isReconnect) {
              broadcastToRoom(validation.data.roomCode, {
                type: "player_joined",
                payload: { gameState },
              }, ws);
            }
            
            // Notify admins about player joined
            broadcastToAdmins();
            break;
          }

          case "select_team": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = teamSelectSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz takım" } });
              return;
            }

            const gameState = storage.updatePlayerTeam(ws.roomCode, ws.playerId, validation.data.team);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Takım seçilemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            
            // Notify admins about team selection
            broadcastToAdmins();
            break;
          }

          case "select_role": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = roleSelectSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz rol" } });
              return;
            }

            const gameState = storage.updatePlayerRole(ws.roomCode, ws.playerId, validation.data.role);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Rol seçilemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            
            // Notify admins about role selection
            broadcastToAdmins();
            break;
          }

          case "add_bot": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const room = storage.getRoom(ws.roomCode);
            const player = room?.players.find(p => p.id === ws.playerId);
            if (!player?.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi bot ekleyebilir" } });
              return;
            }

            const validation = addBotSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz bot bilgisi" } });
              return;
            }

            const gameState = storage.addBot(ws.roomCode, validation.data.team, validation.data.role);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Bot eklenemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            
            // Notify admins about bot addition
            broadcastToAdmins();
            break;
          }

          case "remove_bot": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const room = storage.getRoom(ws.roomCode);
            const player = room?.players.find(p => p.id === ws.playerId);
            if (!player?.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi bot kaldırabilir" } });
              return;
            }

            const validation = z.object({ botId: z.string() }).safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz bot bilgisi" } });
              return;
            }

            // Check if the bot exists and is actually a bot
            const bot = room?.players.find(p => p.id === validation.data.botId);
            if (!bot || !bot.isBot) {
              sendToClient(ws, { type: "error", payload: { message: "Bot bulunamadı" } });
              return;
            }

            storage.removePlayer(ws.roomCode, validation.data.botId);
            const updatedRoom = storage.getRoom(ws.roomCode);
            
            // Notify admins about bot removal
            broadcastToAdmins();
            
            if (updatedRoom) {
              broadcastToRoom(ws.roomCode, {
                type: "game_updated",
                payload: { gameState: updatedRoom },
              });
            }
            break;
          }

          case "update_team_name": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const room = storage.getRoom(ws.roomCode);
            const player = room?.players.find(p => p.id === ws.playerId);
            if (!player?.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi takım isimlerini değiştirebilir" } });
              return;
            }

            const validation = updateTeamNameSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz takım ismi" } });
              return;
            }

            const gameState = storage.updateTeamName(ws.roomCode, validation.data.team, validation.data.name);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Takım ismi güncellenemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            break;
          }

          case "update_timer_settings": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const room = storage.getRoom(ws.roomCode);
            const player = room?.players.find(p => p.id === ws.playerId);
            if (!player?.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi zamanlayıcı ayarlarını değiştirebilir" } });
              return;
            }

            const validation = updateTimerSettingsSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz zamanlayıcı ayarları" } });
              return;
            }

            const gameState = storage.updateTimerSettings(
              ws.roomCode,
              validation.data.timedMode,
              validation.data.spymasterTime,
              validation.data.guesserTime
            );
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Zamanlayıcı ayarları güncellenemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            break;
          }

          case "update_chaos_mode": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const room = storage.getRoom(ws.roomCode);
            const player = room?.players.find(p => p.id === ws.playerId);
            if (!player?.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi Kaos Modunu değiştirebilir" } });
              return;
            }

            const validation = updateChaosModeSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz Kaos Modu ayarları" } });
              return;
            }

            const gameState = storage.updateChaosMode(ws.roomCode, validation.data.chaosMode);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Kaos Modu güncellenemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            break;
          }

          case "update_chaos_mode_type": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const room = storage.getRoom(ws.roomCode);
            const player = room?.players.find(p => p.id === ws.playerId);
            if (!player?.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi Kaos Modu tipini değiştirebilir" } });
              return;
            }

            const validation = updateChaosModeTypeSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz Kaos Modu tipi" } });
              return;
            }

            const gameState = storage.updateChaosModeType(ws.roomCode, validation.data.type);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Kaos Modu tipi güncellenemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            break;
          }

          case "update_prophet_visibility": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const room = storage.getRoom(ws.roomCode);
            const player = room?.players.find(p => p.id === ws.playerId);
            if (!player?.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi Kahin görünürlüğünü değiştirebilir" } });
              return;
            }

            const validation = updateProphetVisibilitySchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz görünürlük ayarı" } });
              return;
            }

            const gameState = storage.updateProphetVisibility(ws.roomCode, validation.data.visibility);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Kahin görünürlük ayarı güncellenemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            break;
          }
            
          case "update-prophet-win-mode":
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bir odaya katıl" } });
              return;
            }

            // Check if player is room owner
            const winModePlayer = storage.getRoom(ws.roomCode)?.players.find(p => p.id === ws.playerId);
            if (!winModePlayer?.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi Kahin kazanç modunu değiştirebilir" } });
              return;
            }

            const winModeValidation = updateProphetWinModeSchema.safeParse(payload);
            if (!winModeValidation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz kazanç modu" } });
              return;
            }

            const winModeGameState = storage.updateProphetWinMode(ws.roomCode, winModeValidation.data.mode);
            if (!winModeGameState) {
              sendToClient(ws, { type: "error", payload: { message: "Kahin kazanç modu güncellenemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState: winModeGameState },
            });
            break;

          case "update_password": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const room = storage.getRoom(ws.roomCode);
            const player = room?.players.find(p => p.id === ws.playerId);
            if (!player?.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi şifre değiştirebilir" } });
              return;
            }

            // Sanitize password to prevent XSS
            const sanitizedPassword = payload.password ? sanitizePassword(payload.password) : undefined;
            
            // Check if sanitization changed the password (potential XSS attempt)
            if (payload.password && sanitizedPassword !== payload.password) {
              sendToClient(ws, { 
                type: "error", 
                payload: { 
                  message: "Şifre geçersiz karakterler içeriyor",
                  code: "INVALID_PASSWORD" 
                } 
              });
              return;
            }

            const gameState = storage.updatePassword(ws.roomCode, sanitizedPassword || null);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Şifre güncellenemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            break;
          }

          case "update_tomato_throw_enabled": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const room = storage.getRoom(ws.roomCode);
            const player = room?.players.find(p => p.id === ws.playerId);
            if (!player?.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi domates fırlatma ayarını değiştirebilir" } });
              return;
            }

            const validation = updateTomatoThrowEnabledSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz domates fırlatma ayarı" } });
              return;
            }

            const gameState = storage.updateTomatoThrowEnabled(ws.roomCode, validation.data.enabled);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Domates fırlatma ayarı güncellenemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            break;
          }

          case "guess_prophet": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = guessProphetSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz tahmin" } });
              return;
            }

            const gameState = storage.guessProphet(ws.roomCode, ws.playerId, validation.data.targetPlayerId);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Kahin tahmini yapılamadı. Belki takımınız tahmin hakkını kullandı veya sıra sizde değil." } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            break;
          }

          case "vote_end_game_guess": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = voteEndGameGuessSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz oy" } });
              return;
            }

            const result = storage.voteEndGameGuess(ws.roomCode, ws.playerId, validation.data.targetPlayerId);
            if (!result) {
              sendToClient(ws, { type: "error", payload: { message: "Oy verilemedi" } });
              return;
            }

            // Broadcast updated votes to all clients in room
            broadcastToRoom(ws.roomCode, {
              type: "end_game_votes_updated",
              payload: { 
                votes: Object.fromEntries(result.votes),
                gameState: result.gameState
              },
            });
            break;
          }

          case "end_game_guess": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = endGameGuessSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz tahmin" } });
              return;
            }

            const gameState = storage.endGameGuess(ws.roomCode, ws.playerId, validation.data.targetPlayerId);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Oyun sonu tahmini yapılamadı" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            break;
          }

          case "guess_double_agent": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = guessDoubleAgentSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz tahmin" } });
              return;
            }

            const gameState = storage.guessDoubleAgent(ws.roomCode, ws.playerId, validation.data.targetPlayerId);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Çift ajan tahmini yapılamadı" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            break;
          }


          case "start_game": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            console.log(`\n========== OYUN BAŞLATILIYOR ==========`);
            console.log(`Oda Kodu: ${ws.roomCode}`);
            console.log(`Başlatan: ${ws.playerId}`);
            console.log(`Tarih/Saat: ${new Date().toLocaleString('tr-TR')}`);

            // Check if chaos mode type is selected when chaos mode is enabled
            const currentRoom = storage.getRoom(ws.roomCode);
            if (currentRoom?.chaosMode && !currentRoom?.chaosModeType) {
              sendToClient(ws, { type: "error", payload: { message: "Kaos Modu açık ancak rol tipi seçilmedi! Lütfen Kahin veya Çift Ajan modunu seçin." } });
              return;
            }

            const gameState = storage.startGame(ws.roomCode);
            
            // Notify admins about game start
            broadcastToAdmins();
            
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Oyun başlatılamadı. Her takımda bir İpucu Veren olmalı." } });
              return;
            }

            const cardImages = storage.getCardImages(ws.roomCode);
            const clients = roomClients.get(ws.roomCode);
            if (clients) {
              clients.forEach(client => {
                if (client.playerId) {
                  sendToClient(client, {
                    type: "game_started",
                    payload: { 
                      gameState: getFilteredGameState(gameState, client.playerId),
                      cardImages: cardImages || {}
                    },
                  });
                }
              });
            }
            
            // Start timer if timed mode is enabled
            const room = storage.getRoom(ws.roomCode);
            if (room && room.timedMode) {
              startRoomTimer(ws.roomCode);
            }
            break;
          }

          case "give_clue": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = giveClueSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz ipucu" } });
              return;
            }

            const gameState = storage.giveClue(ws.roomCode, ws.playerId, validation.data.word, validation.data.count);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "İpucu verilemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "clue_given",
              payload: { gameState },
            });
            
            // Notify admins about clue given
            broadcastToAdmins();
            
            // Timer continues for guessers after clue is given
            const room = storage.getRoom(ws.roomCode);
            if (room && room.timedMode) {
              startRoomTimer(ws.roomCode);
            }
            break;
          }

          case "reveal_card": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = revealCardSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz kart" } });
              return;
            }

            const gameState = storage.revealCard(ws.roomCode, ws.playerId, validation.data.cardId);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Kart açılamadı" } });
              return;
            }

            const cardImages = storage.getCardImages(ws.roomCode);
            const clients = roomClients.get(ws.roomCode);
            if (clients) {
              clients.forEach(client => {
                if (client.playerId) {
                  sendToClient(client, {
                    type: "card_revealed",
                    payload: { 
                      gameState: getFilteredGameState(gameState, client.playerId),
                      cardImages: cardImages || {}
                    },
                  });
                }
              });
            }
            
            // Send updated votes (empty after turn change)
            const votes = storage.getCardVotes(ws.roomCode);
            broadcastToRoom(ws.roomCode, {
              type: "votes_updated", 
              payload: { votes: votes ? Object.fromEntries(votes) : {} },
            });
            
            // Notify admins about card revealed
            broadcastToAdmins();
            break;
          }

          case "vote_card": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = z.object({ cardId: z.number() }).safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz kart" } });
              return;
            }

            const result = storage.voteCard(ws.roomCode, ws.playerId, validation.data.cardId);
            if (!result) {
              sendToClient(ws, { type: "error", payload: { message: "Oy verilemedi" } });
              return;
            }

            // Broadcast updated votes to all clients in room
            broadcastToRoom(ws.roomCode, {
              type: "votes_updated",
              payload: { 
                votes: Object.fromEntries(result.votes) 
              },
            });
            break;
          }

          case "restart_game": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const gameState = storage.restartGame(ws.roomCode, ws.playerId);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Oyun yeniden başlatılamadı" } });
              return;
            }

            const cardImages = storage.getCardImages(ws.roomCode);
            const clients = roomClients.get(ws.roomCode);
            if (clients) {
              clients.forEach(client => {
                if (client.playerId) {
                  sendToClient(client, {
                    type: "game_restarted",
                    payload: { 
                      gameState: getFilteredGameState(gameState, client.playerId),
                      cardImages: cardImages || {}
                    },
                  });
                }
              });
            }
            
            // Clear votes on restart
            broadcastToRoom(ws.roomCode, {
              type: "votes_updated",
              payload: { votes: {} },
            });
            
            // Restart timer if timed mode is enabled
            const room = storage.getRoom(ws.roomCode);
            if (room && room.timedMode) {
              startRoomTimer(ws.roomCode);
            }
            break;
          }

          case "leave_room": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const roomCode = ws.roomCode;
            const playerId = ws.playerId;

            storage.removePlayer(roomCode, playerId);
            
            const clients = roomClients.get(roomCode);
            if (clients) {
              clients.delete(ws);
            }

            ws.roomCode = undefined;
            ws.playerId = undefined;

            const room = storage.getRoom(roomCode);
            if (room) {
              broadcastToRoom(roomCode, {
                type: "player_left",
                payload: { gameState: room },
              });
            }

            if (clients && clients.size === 0) {
              roomClients.delete(roomCode);
              stopRoomTimer(roomCode); // Clean up timer when room is deleted
            }

            sendToClient(ws, { type: "left_room", payload: {} });
            
            // Notify admins about player leaving
            broadcastToAdmins();
            break;
          }

          case "kick_player": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const targetPlayerId = payload.targetPlayerId as string;
            if (!targetPlayerId) {
              sendToClient(ws, { type: "error", payload: { message: "Hedef oyuncu belirtilmedi" } });
              return;
            }

            // Check if player is room owner
            const room = storage.getRoom(ws.roomCode);
            if (!room) {
              sendToClient(ws, { type: "error", payload: { message: "Oda bulunamadı" } });
              return;
            }

            const currentPlayer = room.players.find(p => p.id === ws.playerId);
            if (!currentPlayer || !currentPlayer.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda kurucusu oyuncu atabilir" } });
              return;
            }

            // Cannot kick yourself
            if (targetPlayerId === ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Kendinizi atamazsınız" } });
              return;
            }

            // Remove the player
            storage.removePlayer(ws.roomCode, targetPlayerId);
            
            // Find and disconnect the kicked player's WebSocket
            const clients = roomClients.get(ws.roomCode);
            if (clients) {
              const kickedClient = Array.from(clients).find(client => client.playerId === targetPlayerId);
              if (kickedClient) {
                // Notify the kicked player
                sendToClient(kickedClient, { 
                  type: "kicked",
                  payload: { message: "Oda kurucusu tarafından oyundan atıldınız" }
                });
                
                // Clean up their connection
                kickedClient.roomCode = undefined;
                kickedClient.playerId = undefined;
                clients.delete(kickedClient);
              }
            }

            // Get updated room state
            const updatedRoom = storage.getRoom(ws.roomCode);
            if (updatedRoom) {
              broadcastToRoom(ws.roomCode, {
                type: "player_kicked",
                payload: { 
                  gameState: updatedRoom,
                  kickedPlayerId: targetPlayerId
                },
              });
            }

            // Notify admins about player kicked
            broadcastToAdmins();
            break;
          }

          case "return_to_lobby": {
            if (!ws.roomCode) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const gameState = storage.returnToLobby(ws.roomCode);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Lobiye dönülemedi" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "returned_to_lobby",
              payload: { gameState },
            });
            
            // Clear votes when returning to lobby
            broadcastToRoom(ws.roomCode, {
              type: "votes_updated",
              payload: { votes: {} },
            });
            
            // Stop timer when returning to lobby
            stopRoomTimer(ws.roomCode);
            
            // Notify admins about lobby return
            broadcastToAdmins();
            break;
          }

          case "end_turn": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const gameState = storage.endTurn(ws.roomCode, ws.playerId);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Tahmin bitirilemedi. Sadece tahminciler kendi sırasında tahmini bitirebilir." } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_updated",
              payload: { gameState },
            });
            
            // Send updated votes (empty after turn change)
            const votes = storage.getCardVotes(ws.roomCode);
            broadcastToRoom(ws.roomCode, {
              type: "votes_updated",
              payload: { votes: votes ? Object.fromEntries(votes) : {} },
            });
            
            // Restart timer for new turn if timed mode is enabled
            const room = storage.getRoom(ws.roomCode);
            if (room && room.timedMode && gameState.phase === 'playing') {
              startRoomTimer(ws.roomCode);
            }
            break;
          }
          
          case "trigger_taunt": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const tauntData = storage.triggerTaunt(ws.roomCode, ws.playerId);
            if (!tauntData) {
              sendToClient(ws, { type: "error", payload: { message: "Hareket çekme devre dışı veya cooldown'da" } });
              return;
            }

            const gameState = storage.getRoom(ws.roomCode);
            broadcastToRoom(ws.roomCode, {
              type: "taunt_triggered",
              payload: { ...tauntData, gameState },
            });
            break;
          }
          
          case "send_insult": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            // CRITICAL FIX - Pass targetId properly
            const targetId = payload.targetId;
            console.log("[CRITICAL] Passing targetId:", targetId);
            const insultData = storage.sendInsult(ws.roomCode, ws.playerId, targetId);
            if (!insultData) {
              sendToClient(ws, { type: "error", payload: { message: "Laf sokma devre dışı veya cooldown'da" } });
              return;
            }

            const gameState = storage.getRoom(ws.roomCode);
            broadcastToRoom(ws.roomCode, {
              type: "insult_sent",
              payload: { ...insultData, gameState },
            });
            break;
          }
          
          case "toggle_taunt": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }
            
            // Check if player is moderator (room owner)
            const gameState = storage.getRoom(ws.roomCode);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Oda bulunamadı" } });
              return;
            }
            
            const player = gameState.players.find(p => p.id === ws.playerId);
            if (!player || !player.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece moderatör bu özelliği değiştirebilir" } });
              return;
            }
            
            const validation = z.object({ enabled: z.boolean() }).safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz veri" } });
              return;
            }
            
            const result = storage.toggleTaunt(ws.roomCode, validation.data.enabled);
            if (!result) {
              sendToClient(ws, { type: "error", payload: { message: "Özellik değiştirilemedi" } });
              return;
            }
            
            broadcastToRoom(ws.roomCode, {
              type: "taunt_toggled",
              payload: result,
            });
            break;
          }
          
          case "send_insult_v2": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            // NEW V2 SYSTEM - Direct parameter passing
            const targetId = payload?.targetId;
            console.log("[V2 ROUTE] Received targetId:", targetId);
            
            const insultData = storage.sendInsultV2(ws.roomCode, ws.playerId, targetId);
            if (!insultData) {
              sendToClient(ws, { type: "error", payload: { message: "Laf sokma devre dışı veya cooldown'da" } });
              return;
            }

            const gameState = storage.getRoom(ws.roomCode);
            broadcastToRoom(ws.roomCode, {
              type: "insult_sent",
              payload: { ...insultData, gameState },
            });
            break;
          }
          
          case "throw_tomato": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = throwTomatoSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz veri" } });
              return;
            }

            const tomatoData = storage.throwTomato(ws.roomCode, ws.playerId, validation.data.targetTeam);
            if (!tomatoData) {
              sendToClient(ws, { type: "error", payload: { message: "Domates fırlatma devre dışı veya cooldown'da" } });
              return;
            }
            
            // Check if this is an error response (cooldown)
            if (tomatoData.error) {
              sendToClient(ws, { type: "error", payload: { message: tomatoData.error } });
              return;
            }

            const gameState = storage.getRoom(ws.roomCode);
            broadcastToRoom(ws.roomCode, {
              type: "tomato_thrown",
              payload: { ...tomatoData, gameState },
            });
            break;
          }
          
          case "toggle_insult": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }
            
            // Check if player is moderator (room owner)
            const gameState = storage.getRoom(ws.roomCode);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Oda bulunamadı" } });
              return;
            }
            
            const player = gameState.players.find(p => p.id === ws.playerId);
            if (!player || !player.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece moderatör bu özelliği değiştirebilir" } });
              return;
            }
            
            const validation = z.object({ enabled: z.boolean() }).safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz veri" } });
              return;
            }
            
            const result = storage.toggleInsult(ws.roomCode, validation.data.enabled);
            if (!result) {
              sendToClient(ws, { type: "error", payload: { message: "Özellik değiştirilemedi" } });
              return;
            }
            
            broadcastToRoom(ws.roomCode, {
              type: "insult_toggled",
              payload: result,
            });
            break;
          }
          
          
          case "toggle_tomato": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }
            
            // Check if player is moderator (room owner)
            let gameState = storage.getRoom(ws.roomCode);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Oda bulunamadı" } });
              return;
            }
            
            const player = gameState.players.find(p => p.id === ws.playerId);
            if (!player || !player.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece moderatör bu özelliği değiştirebilir" } });
              return;
            }
            
            const validation = z.object({ enabled: z.boolean() }).safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz veri" } });
              return;
            }
            
            const result = storage.toggleTomato(ws.roomCode, validation.data.enabled);
            if (!result) {
              sendToClient(ws, { type: "error", payload: { message: "Özellik değiştirilemedi" } });
              return;
            }
            
            // Broadcast tomato_toggled event - clients will update their gameState
            broadcastToRoom(ws.roomCode, {
              type: "tomato_toggled",
              payload: result,
            });
            break;
          }
          
          case "get_room_features": {
            if (!ws.roomCode) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }
            
            const features = storage.getRoomFeatures(ws.roomCode, ws.playerId);
            if (!features) {
              sendToClient(ws, { type: "error", payload: { message: "Oda bulunamadı" } });
              return;
            }
            
            sendToClient(ws, {
              type: "room_features",
              payload: features,
            });
            break;
          }

          // Introduction phase handlers
          case "select_player_for_introduction": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = selectPlayerForIntroductionSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz veri" } });
              return;
            }

            const result = storage.selectPlayerForIntroduction(ws.roomCode, ws.playerId, validation.data.playerId);
            if (!result) {
              sendToClient(ws, { type: "error", payload: { message: "Oyuncu seçilemedi" } });
              return;
            }
            
            // Start vote session for Kick chat if enabled
            const kickConfig = storage.getKickChatConfig(ws.roomCode);
            if (kickConfig?.enabled && validation.data.playerId) {
              kickChatService.startVoteSession(validation.data.playerId);
              
              // Broadcast initial vote state
              broadcastToRoom(ws.roomCode, {
                type: "kick_chat_vote",
                payload: { likes: 0, dislikes: 0 }
              });
            }

            broadcastToRoom(ws.roomCode, {
              type: "player_introducing",
              payload: { gameState: result },
            });
            break;
          }

          case "finish_introduction": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = finishIntroductionSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz veri" } });
              return;
            }

            // Get kick chat votes before finishing introduction
            let kickVotes = { likes: 0, dislikes: 0 };
            const kickConfig = storage.getKickChatConfig(ws.roomCode);
            if (kickConfig?.enabled) {
              kickVotes = kickChatService.endVoteSession();
            }
            
            const result = storage.finishPlayerIntroduction(ws.roomCode, ws.playerId, validation.data.playerId, kickVotes);
            if (!result) {
              sendToClient(ws, { type: "error", payload: { message: "Tanıtım bitirilemedi" } });
              return;
            }
            
            // Broadcast final vote results
            if (kickConfig?.enabled) {
              const roomCode = ws.roomCode;
              
              // Broadcast final vote results
              broadcastToRoom(roomCode, {
                type: "kick_chat_vote",
                payload: kickVotes
              });
              
              // Reset votes for next player
              setTimeout(() => {
                broadcastToRoom(roomCode, {
                  type: "kick_chat_vote",
                  payload: { likes: 0, dislikes: 0 }
                });
              }, 3000);
            }

            broadcastToRoom(ws.roomCode, {
              type: "introduction_finished",
              payload: { gameState: result },
            });
            break;
          }

          case "like_introduction": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const validation = likeIntroductionSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz veri" } });
              return;
            }

            const result = storage.likeIntroduction(ws.roomCode, ws.playerId, validation.data.targetPlayerId, validation.data.isLike);
            if (!result) {
              sendToClient(ws, { type: "error", payload: { message: "Oy kullanılamadı" } });
              return;
            }

            broadcastToRoom(ws.roomCode, {
              type: "introduction_liked",
              payload: { gameState: result },
            });
            break;
          }


          case "skip_introduction": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }

            const result = storage.skipIntroduction(ws.roomCode, ws.playerId);
            if (!result) {
              sendToClient(ws, { type: "error", payload: { message: "Tanıtım atlanamadı" } });
              return;
            }
            
            // End any active vote session if Kick chat is enabled
            const kickConfig = storage.getKickChatConfig(ws.roomCode);
            if (kickConfig?.enabled) {
              kickChatService.endVoteSession();
              
              // Clear votes
              broadcastToRoom(ws.roomCode, {
                type: "kick_chat_vote",
                payload: { likes: 0, dislikes: 0 }
              });
            }

            broadcastToRoom(ws.roomCode, {
              type: "game_started",
              payload: { gameState: result },
            });
            break;
          }
          
          case "update_kick_chat_config": {
            if (!ws.roomCode || !ws.playerId) {
              sendToClient(ws, { type: "error", payload: { message: "Bağlantı hatası" } });
              return;
            }
            
            // Check if player is room owner
            const gameState = storage.getRoom(ws.roomCode);
            if (!gameState) {
              sendToClient(ws, { type: "error", payload: { message: "Oda bulunamadı" } });
              return;
            }
            
            const player = gameState.players.find(p => p.id === ws.playerId);
            if (!player || !player.isRoomOwner) {
              sendToClient(ws, { type: "error", payload: { message: "Sadece oda sahibi Kick chat ayarlarını değiştirebilir" } });
              return;
            }
            
            // Validate config
            const validation = z.object({
              enabled: z.boolean(),
              chatroomId: z.number().optional(),
              channelName: z.string().optional()
            }).safeParse(payload);
            
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz Kick chat ayarları" } });
              return;
            }
            
            // Update Kick chat service configuration
            const config = validation.data;
            
            // Store config in room for persistence
            storage.updateKickChatConfig(ws.roomCode, config);
            
            // Only update service if enabled with valid chatroomId
            if (config.enabled && config.chatroomId) {
              kickChatService.updateConfig({
                enabled: true,
                chatroomId: config.chatroomId,
                channelName: config.channelName
              });
            } else {
              // Disconnect if disabled
              kickChatService.disconnect();
            }
            
            // Broadcast config update to all clients
            broadcastToRoom(ws.roomCode, {
              type: "kick_chat_config_updated",
              payload: { config }
            });
            
            sendToClient(ws, { type: "update_kick_chat_config_response", payload: { success: true } });
            break;
          }

          default:
            sendToClient(ws, { type: "error", payload: { message: "Bilinmeyen komut" } });
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
        sendToClient(ws, { type: "error", payload: { message: "Sunucu hatası" } });
      }
    });

    ws.on("close", () => {
      if (ws.roomCode && ws.playerId && !ws.replaced) {
        const roomCode = ws.roomCode;
        const playerId = ws.playerId;
        
        const clients = roomClients.get(roomCode);
        if (clients) {
          clients.delete(ws);
        }
        
        // Immediately mark as disconnected (but don't remove yet)
        const updatedRoom = storage.markPlayerDisconnected(roomCode, playerId);
        if (updatedRoom) {
          broadcastToRoom(roomCode, {
            type: "player_disconnected",
            payload: { gameState: updatedRoom, disconnectedPlayerId: playerId },
          });
        }
        
        // Don't automatically remove disconnected players - they can reconnect anytime
        // Only clean up if the room itself is deleted
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws: WSClient) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping(() => {}); // Add empty callback to prevent errors
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return httpServer;
}
