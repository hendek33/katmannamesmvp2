import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { storage } from "./storage";
import type { GameState } from "@shared/schema";
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
  guessProphetSchema,
} from "@shared/schema";

interface WSClient extends WebSocket {
  playerId?: string;
  roomCode?: string;
  isAlive?: boolean;
  replaced?: boolean;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  const roomClients = new Map<string, Set<WSClient>>();

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

  function sendToClient(client: WSClient, message: any) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  function getFilteredGameState(gameState: GameState, playerId: string): GameState {
    const player = gameState.players.find(p => p.id === playerId);
    const isSpymaster = player?.role === "spymaster";

    if (isSpymaster || gameState.phase !== "playing") {
      return gameState;
    }

    return {
      ...gameState,
      cards: gameState.cards.map(card => ({
        ...card,
        type: card.revealed ? card.type : ("neutral" as any),
      })),
    };
  }

  wss.on("connection", (ws: WSClient) => {
    ws.isAlive = true;

    ws.on("pong", () => {
      ws.isAlive = true;
    });

    ws.on("message", async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const { type, payload } = message;

        switch (type) {
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

            const { roomCode, playerId, gameState } = storage.createRoom(
              validation.data.username,
              validation.data.password
            );
            
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
            break;
          }

          case "join_room": {
            const validation = joinRoomSchema.safeParse(payload);
            if (!validation.success) {
              sendToClient(ws, { type: "error", payload: { message: "Geçersiz veri" } });
              return;
            }

            const result = storage.joinRoom(
              validation.data.roomCode, 
              validation.data.username,
              validation.data.password,
              validation.data.playerId
            );
            if (!result) {
              sendToClient(ws, { type: "error", payload: { message: "Oda bulunamadı veya şifre yanlış" } });
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
            sendToClient(ws, {
              type: "room_joined",
              payload: { 
                playerId, 
                gameState: getFilteredGameState(gameState, playerId),
                cardImages: cardImages || {}
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
              sendToClient(ws, { type: "error", payload: { message: "Tahmin yapılamadı. Belki takımınız tahmin hakkını kullandı." } });
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

            const gameState = storage.startGame(ws.roomCode);
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

            const clients = roomClients.get(ws.roomCode);
            if (clients) {
              clients.forEach(client => {
                if (client.playerId) {
                  sendToClient(client, {
                    type: "card_revealed",
                    payload: { gameState: getFilteredGameState(gameState, client.playerId) },
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
            }

            sendToClient(ws, { type: "left_room", payload: {} });
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
        
        setTimeout(() => {
          const currentClients = roomClients.get(roomCode);
          const playerReconnected = currentClients && Array.from(currentClients).some(c => c.playerId === playerId);
          
          if (!playerReconnected) {
            storage.removePlayer(roomCode, playerId);
            
            const room = storage.getRoom(roomCode);
            if (room) {
              broadcastToRoom(roomCode, {
                type: "player_left",
                payload: { gameState: room },
              });
            }
            
            if (currentClients && currentClients.size === 0) {
              roomClients.delete(roomCode);
            }
          }
        }, 5000);
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
      ws.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
  });

  return httpServer;
}
