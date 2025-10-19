import type { GameState, Player, Card, CardType, Team, Clue } from "@shared/schema";
import { randomUUID } from "crypto";
import { getRandomWords } from "./words";

export interface IStorage {
  createRoom(ownerUsername: string): { roomCode: string; playerId: string; gameState: GameState };
  getRoom(roomCode: string): GameState | undefined;
  joinRoom(roomCode: string, username: string, reconnectPlayerId?: string): { playerId: string; gameState: GameState; isReconnect: boolean } | null;
  addBot(roomCode: string, team: Team, role: "spymaster" | "guesser"): GameState | null;
  updatePlayerTeam(roomCode: string, playerId: string, team: Team): GameState | null;
  updatePlayerRole(roomCode: string, playerId: string, role: "spymaster" | "guesser"): GameState | null;
  startGame(roomCode: string): GameState | null;
  giveClue(roomCode: string, playerId: string, word: string, count: number): GameState | null;
  revealCard(roomCode: string, playerId: string, cardId: number): GameState | null;
  restartGame(roomCode: string, playerId: string): GameState | null;
  removePlayer(roomCode: string, playerId: string): void;
  cleanupEmptyRooms(): void;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, GameState>;
  private playerToRoom: Map<string, string>;

  constructor() {
    this.rooms = new Map();
    this.playerToRoom = new Map();
    
    setInterval(() => this.cleanupEmptyRooms(), 60000);
  }

  private generateRoomCode(): string {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return this.rooms.has(code) ? this.generateRoomCode() : code;
  }

  private createGameCards(): Card[] {
    const words = getRandomWords(25);
    const cards: Card[] = [];
    
    const types: CardType[] = [
      ...Array(9).fill("dark"),
      ...Array(8).fill("light"),
      ...Array(7).fill("neutral"),
      "assassin"
    ];
    
    const shuffledTypes = types.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < 25; i++) {
      cards.push({
        id: i,
        word: words[i],
        type: shuffledTypes[i],
        revealed: false,
      });
    }
    
    return cards;
  }

  createRoom(ownerUsername: string): { roomCode: string; playerId: string; gameState: GameState } {
    const roomCode = this.generateRoomCode();
    const playerId = randomUUID();
    
    const player: Player = {
      id: playerId,
      username: ownerUsername,
      team: null,
      role: "guesser",
      isRoomOwner: true,
      isBot: false,
    };

    const gameState: GameState = {
      roomCode,
      phase: "lobby",
      players: [player],
      cards: [],
      currentTeam: Math.random() > 0.5 ? "dark" : "light",
      darkCardsRemaining: 0,
      lightCardsRemaining: 0,
      currentClue: null,
      winner: null,
    };

    this.rooms.set(roomCode, gameState);
    this.playerToRoom.set(playerId, roomCode);

    return { roomCode, playerId, gameState };
  }

  getRoom(roomCode: string): GameState | undefined {
    return this.rooms.get(roomCode);
  }

  joinRoom(roomCode: string, username: string, reconnectPlayerId?: string): { playerId: string; gameState: GameState; isReconnect: boolean } | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    if (reconnectPlayerId) {
      const existingPlayer = room.players.find(p => p.id === reconnectPlayerId && p.username === username);
      if (existingPlayer) {
        this.playerToRoom.set(existingPlayer.id, roomCode);
        return { playerId: existingPlayer.id, gameState: room, isReconnect: true };
      }
    }

    if (room.players.some(p => p.username === username)) {
      const existingPlayer = room.players.find(p => p.username === username)!;
      this.playerToRoom.set(existingPlayer.id, roomCode);
      return { playerId: existingPlayer.id, gameState: room, isReconnect: true };
    }

    const playerId = randomUUID();
    const player: Player = {
      id: playerId,
      username,
      team: null,
      role: "guesser",
      isRoomOwner: false,
      isBot: false,
    };

    room.players.push(player);
    this.playerToRoom.set(playerId, roomCode);

    return { playerId, gameState: room, isReconnect: false };
  }

  addBot(roomCode: string, team: Team, role: "spymaster" | "guesser"): GameState | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "lobby") return null;

    const botNumber = room.players.filter(p => p.isBot).length + 1;
    const botId = randomUUID();
    
    const bot: Player = {
      id: botId,
      username: `Bot ${botNumber}`,
      team,
      role,
      isRoomOwner: false,
      isBot: true,
    };

    room.players.push(bot);
    this.playerToRoom.set(botId, roomCode);

    return room;
  }

  updatePlayerTeam(roomCode: string, playerId: string, team: Team): GameState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    if (team && player.team !== team) {
      const teamPlayers = room.players.filter(p => p.team === team);
      const hasSpymaster = teamPlayers.some(p => p.role === "spymaster");
      
      if (hasSpymaster && player.role === "spymaster") {
        player.role = "guesser";
      }
    }

    player.team = team;
    return room;
  }

  updatePlayerRole(roomCode: string, playerId: string, role: "spymaster" | "guesser"): GameState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.team) return null;

    if (role === "spymaster") {
      const teamPlayers = room.players.filter(p => p.team === player.team);
      const currentSpymaster = teamPlayers.find(p => p.role === "spymaster");
      
      if (currentSpymaster && currentSpymaster.id !== playerId) {
        currentSpymaster.role = "guesser";
      }
    }

    player.role = role;
    return room;
  }

  startGame(roomCode: string): GameState | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "lobby") return null;

    const darkTeam = room.players.filter(p => p.team === "dark");
    const lightTeam = room.players.filter(p => p.team === "light");

    if (darkTeam.length === 0 || lightTeam.length === 0) return null;
    if (!darkTeam.some(p => p.role === "spymaster")) return null;
    if (!lightTeam.some(p => p.role === "spymaster")) return null;

    room.cards = this.createGameCards();
    room.phase = "playing";
    room.darkCardsRemaining = room.cards.filter(c => c.type === "dark").length;
    room.lightCardsRemaining = room.cards.filter(c => c.type === "light").length;
    room.currentClue = null;
    room.winner = null;

    return room;
  }

  giveClue(roomCode: string, playerId: string, word: string, count: number): GameState | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "playing") return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.role !== "spymaster" || player.team !== room.currentTeam) {
      return null;
    }

    room.currentClue = {
      word: word.toUpperCase(),
      count,
      team: room.currentTeam,
    };

    return room;
  }

  revealCard(roomCode: string, playerId: string, cardId: number): GameState | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.phase !== "playing") return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.role !== "guesser" || player.team !== room.currentTeam) {
      return null;
    }

    const card = room.cards.find(c => c.id === cardId);
    if (!card || card.revealed) return null;

    card.revealed = true;

    if (card.type === "dark") {
      room.darkCardsRemaining--;
      if (room.darkCardsRemaining === 0) {
        room.winner = "dark";
        room.phase = "ended";
      } else if (room.currentTeam !== "dark") {
        room.currentTeam = room.currentTeam === "dark" ? "light" : "dark";
        room.currentClue = null;
      }
    } else if (card.type === "light") {
      room.lightCardsRemaining--;
      if (room.lightCardsRemaining === 0) {
        room.winner = "light";
        room.phase = "ended";
      } else if (room.currentTeam !== "light") {
        room.currentTeam = room.currentTeam === "dark" ? "light" : "dark";
        room.currentClue = null;
      }
    } else if (card.type === "assassin") {
      room.winner = room.currentTeam === "dark" ? "light" : "dark";
      room.phase = "ended";
    } else {
      room.currentTeam = room.currentTeam === "dark" ? "light" : "dark";
      room.currentClue = null;
    }

    return room;
  }

  restartGame(roomCode: string, playerId: string): GameState | null {
    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isRoomOwner) return null;

    room.cards = this.createGameCards();
    room.phase = "playing";
    room.currentTeam = Math.random() > 0.5 ? "dark" : "light";
    room.darkCardsRemaining = room.cards.filter(c => c.type === "dark").length;
    room.lightCardsRemaining = room.cards.filter(c => c.type === "light").length;
    room.currentClue = null;
    room.winner = null;

    return room;
  }

  removePlayer(roomCode: string, playerId: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== playerId);
    this.playerToRoom.delete(playerId);

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
    } else if (room.players.every(p => !p.isRoomOwner)) {
      room.players[0].isRoomOwner = true;
    }
  }

  cleanupEmptyRooms(): void {
    for (const [roomCode, room] of this.rooms.entries()) {
      if (room.players.length === 0) {
        this.rooms.delete(roomCode);
      }
    }
  }
}

export const storage = new MemStorage();
