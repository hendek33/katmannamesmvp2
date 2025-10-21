import type { GameState, Player, Card, CardType, Team, Clue, RoomListItem } from "@shared/schema";
import { randomUUID } from "crypto";
import { getRandomWords } from "./words";

interface RoomData {
  gameState: GameState;
  password?: string;
  guessesRemaining: number;
  maxGuesses: number;
  cardVotes: Map<number, Set<string>>; // cardId -> Set of playerIds who voted
  cardImages?: Map<number, string>; // cardId -> image path for revealed cards
}

export interface IStorage {
  createRoom(ownerUsername: string, password?: string): { roomCode: string; playerId: string; gameState: GameState };
  getRoom(roomCode: string): GameState | undefined;
  joinRoom(roomCode: string, username: string, password?: string, reconnectPlayerId?: string): { playerId: string; gameState: GameState; isReconnect: boolean } | null;
  listRooms(): RoomListItem[];
  addBot(roomCode: string, team: Team, role: "spymaster" | "guesser"): GameState | null;
  updatePlayerTeam(roomCode: string, playerId: string, team: Team): GameState | null;
  updatePlayerRole(roomCode: string, playerId: string, role: "spymaster" | "guesser"): GameState | null;
  updateTeamName(roomCode: string, team: Team, name: string): GameState | null;
  updateTimerSettings(roomCode: string, timedMode: boolean, spymasterTime: number, guesserTime: number): GameState | null;
  startGame(roomCode: string): GameState | null;
  giveClue(roomCode: string, playerId: string, word: string, count: number): GameState | null;
  revealCard(roomCode: string, playerId: string, cardId: number): GameState | null;
  restartGame(roomCode: string, playerId: string): GameState | null;
  returnToLobby(roomCode: string): GameState | null;
  endTurn(roomCode: string, playerId: string): GameState | null;
  removePlayer(roomCode: string, playerId: string): void;
  cleanupEmptyRooms(): void;
  getCardImages(roomCode: string): Record<number, string> | null;
}

export class MemStorage implements IStorage {
  private rooms: Map<string, RoomData>;
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

  private assignCardImages(roomData: RoomData): void {
    // Image pools for each card type - using actual file names
    const imagePools = {
      dark: [
        '/açılmış kelime kartları/ali mavi.png',
        '/açılmış kelime kartları/blush mavi.png',
        '/açılmış kelime kartları/hasan mavi.png',
        '/açılmış kelime kartları/kasım mavi.png',
        '/açılmış kelime kartları/mami mavi.png',
        '/açılmış kelime kartları/noeldayı mavi.png',
        '/açılmış kelime kartları/nuriben mavi.png',
        '/açılmış kelime kartları/triel2 mavi.png',
        '/açılmış kelime kartları/çağrı mavi.png'
      ],
      light: [
        '/açılmış kelime kartları/alik kırmızı.png',
        '/açılmış kelime kartları/begüm kırmızı.png',
        '/açılmış kelime kartları/dobby kırmızı.png',
        '/açılmış kelime kartları/karaman kırmızı.png',
        '/açılmış kelime kartları/neswin kırmızı.png',
        '/açılmış kelime kartları/noeldayı kırmızı.png',
        '/açılmış kelime kartları/perver kırmızı.png',
        '/açılmış kelime kartları/triel kırmızı.png',
        '/açılmış kelime kartları/şinasi kırmızı.png'
      ],
      neutral: [
        '/açılmış kelime kartları/blush beyaz.png',
        '/açılmış kelime kartları/hasan beyaz.png',
        '/açılmış kelime kartları/mami beyaz.png',
        '/açılmış kelime kartları/perver beyaz.png',
        '/açılmış kelime kartları/çağrı normal beyaz.png',
        '/açılmış kelime kartları/çağrı sigara beyaz.png',
        '/açılmış kelime kartları/şinasi su beyaz.png'
      ],
      assassin: ['/açılmış kelime kartları/arda siyah.png']
    };

    // Shuffle each pool
    for (const type in imagePools) {
      imagePools[type as keyof typeof imagePools] = imagePools[type as keyof typeof imagePools]
        .sort(() => Math.random() - 0.5);
    }

    // Create the mapping
    const cardImages = new Map<number, string>();
    const imageIndexes = { dark: 0, light: 0, neutral: 0, assassin: 0 };

    // Assign unique images to each card based on its type
    roomData.gameState.cards.forEach(card => {
      const type = card.type;
      const pool = imagePools[type];
      const index = imageIndexes[type];
      
      if (index < pool.length) {
        cardImages.set(card.id, pool[index]);
        imageIndexes[type]++;
      }
    });

    roomData.cardImages = cardImages;
  }

  private createGameCards(): Card[] {
    const words = getRandomWords(25);
    const cards: Card[] = [];
    
    const darkFirst = Math.random() > 0.5;
    const darkCards = darkFirst ? 9 : 8;
    const lightCards = darkFirst ? 8 : 9;
    
    const types: CardType[] = [
      ...Array(darkCards).fill("dark"),
      ...Array(lightCards).fill("light"),
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

  createRoom(ownerUsername: string, password?: string): { roomCode: string; playerId: string; gameState: GameState } {
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
      revealHistory: [],
      darkTeamName: "Mavi Takım",
      lightTeamName: "Kırmızı Takım",
      hasPassword: !!password,
      createdAt: Date.now(),
      timedMode: false,
      spymasterTime: 120, // Default 2 minutes for Intelligence Chiefs
      guesserTime: 180, // Default 3 minutes for Agents
      currentTurnStartTime: null,
    };

    this.rooms.set(roomCode, { 
      gameState, 
      password,
      guessesRemaining: 0,
      maxGuesses: 0,
      cardVotes: new Map() // Map of cardId to Set of playerIds who voted
    });
    this.playerToRoom.set(playerId, roomCode);

    return { roomCode, playerId, gameState };
  }

  getRoom(roomCode: string): GameState | undefined {
    const roomData = this.rooms.get(roomCode);
    return roomData?.gameState;
  }

  joinRoom(roomCode: string, username: string, password?: string, reconnectPlayerId?: string): { playerId: string; gameState: GameState; isReconnect: boolean } | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;

    const room = roomData.gameState;

    // Check if reconnecting with playerId
    if (reconnectPlayerId) {
      const existingPlayer = room.players.find(p => p.id === reconnectPlayerId && p.username === username);
      if (existingPlayer) {
        this.playerToRoom.set(existingPlayer.id, roomCode);
        return { playerId: existingPlayer.id, gameState: room, isReconnect: true };
      }
    }

    // Check if reconnecting by username
    if (room.players.some(p => p.username === username)) {
      const existingPlayer = room.players.find(p => p.username === username)!;
      this.playerToRoom.set(existingPlayer.id, roomCode);
      return { playerId: existingPlayer.id, gameState: room, isReconnect: true };
    }

    // For new players, check password
    if (roomData.password && roomData.password !== password) {
      return null;
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

  listRooms(): RoomListItem[] {
    const roomList: RoomListItem[] = [];
    
    this.rooms.forEach((roomData) => {
      roomList.push({
        roomCode: roomData.gameState.roomCode,
        playerCount: roomData.gameState.players.length,
        hasPassword: roomData.gameState.hasPassword,
        phase: roomData.gameState.phase,
        createdAt: roomData.gameState.createdAt,
      });
    });

    // Sort by creation time, newest first
    return roomList.sort((a, b) => b.createdAt - a.createdAt);
  }

  addBot(roomCode: string, team: Team, role: "spymaster" | "guesser"): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    if (room.phase !== "lobby") return null;

    if (role === "spymaster") {
      const teamPlayers = room.players.filter(p => p.team === team);
      const currentSpymaster = teamPlayers.find(p => p.role === "spymaster");
      
      if (currentSpymaster) {
        currentSpymaster.role = "guesser";
      }
    }

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
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;

    const oldTeam = player.team;
    
    if (team && player.team !== team) {
      const teamPlayers = room.players.filter(p => p.team === team);
      const hasSpymaster = teamPlayers.some(p => p.role === "spymaster");
      
      if (hasSpymaster && player.role === "spymaster") {
        player.role = "guesser";
      }
      
      // Add team change log if during game (runtime extension)
      if (room.phase === "playing" && oldTeam) {
        const teamChangeEntry: any = {
          type: "team_change",
          playerId: player.id,
          playerUsername: player.username,
          fromTeam: oldTeam,
          toTeam: team,
          timestamp: Date.now()
        };
        room.revealHistory.push(teamChangeEntry);
      }
    }

    player.team = team;
    return room;
  }

  updatePlayerRole(roomCode: string, playerId: string, role: "spymaster" | "guesser"): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.team) return null;

    const oldRole = player.role;

    if (role === "spymaster") {
      const teamPlayers = room.players.filter(p => p.team === player.team);
      const currentSpymaster = teamPlayers.find(p => p.role === "spymaster");
      
      if (currentSpymaster && currentSpymaster.id !== playerId) {
        currentSpymaster.role = "guesser";
      }
    }
    
    // Add role change log if during game and role actually changed (runtime extension)
    if (room.phase === "playing" && oldRole && oldRole !== role) {
      const roleChangeEntry: any = {
        type: "role_change",
        playerId: player.id,
        playerUsername: player.username,
        team: player.team,
        fromRole: oldRole,
        toRole: role,
        timestamp: Date.now()
      };
      room.revealHistory.push(roleChangeEntry);
    }

    player.role = role;
    return room;
  }

  updateTeamName(roomCode: string, team: Team, name: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData || !team) return null;
    const room = roomData.gameState;

    if (team === "dark") {
      room.darkTeamName = name;
    } else {
      room.lightTeamName = name;
    }

    return room;
  }

  updateTimerSettings(roomCode: string, timedMode: boolean, spymasterTime: number, guesserTime: number): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Only allow timer settings to be changed in lobby
    if (room.phase !== "lobby") return null;

    room.timedMode = timedMode;
    room.spymasterTime = spymasterTime;
    room.guesserTime = guesserTime;

    return room;
  }

  startGame(roomCode: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    if (room.phase !== "lobby") return null;

    const darkTeam = room.players.filter(p => p.team === "dark");
    const lightTeam = room.players.filter(p => p.team === "light");

    if (darkTeam.length === 0 || lightTeam.length === 0) return null;
    if (!darkTeam.some(p => p.role === "spymaster")) return null;
    if (!lightTeam.some(p => p.role === "spymaster")) return null;

    room.cards = this.createGameCards();
    room.phase = "playing";
    room.darkCardsRemaining = room.cards.filter(c => c.type === "dark").length;
    room.lightCardsRemaining = room.cards.filter(c => c.type === "light").length;
    
    // Assign unique images to cards when game starts
    this.assignCardImages(roomData);
    room.currentTeam = room.darkCardsRemaining === 9 ? "dark" : "light";
    room.currentClue = null;
    room.winner = null;
    room.revealHistory = [];
    
    // Reset guess tracking
    roomData.guessesRemaining = 0;
    roomData.maxGuesses = 0;
    
    // Start timer if timed mode is enabled
    if (room.timedMode) {
      room.currentTurnStartTime = Date.now();
    }

    return room;
  }

  giveClue(roomCode: string, playerId: string, word: string, count: number): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    if (room.phase !== "playing") return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.role !== "spymaster" || player.team !== room.currentTeam) {
      return null;
    }

    room.currentClue = {
      word: word.toUpperCase(),
      count,
      team: room.currentTeam,
    };
    
    // Set guess limit to clue count + 1
    roomData.maxGuesses = count + 1;
    roomData.guessesRemaining = count + 1;
    
    // Reset timer for guessing phase if timed mode is enabled
    if (room.timedMode) {
      room.currentTurnStartTime = Date.now();
    }

    return room;
  }

  revealCard(roomCode: string, playerId: string, cardId: number): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    if (room.phase !== "playing" || !room.currentTeam) return null;
    
    // Check if there's an active clue - can't reveal cards without a clue
    if (!room.currentClue) return null;

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.role !== "guesser" || player.team !== room.currentTeam) {
      return null;
    }

    const card = room.cards.find(c => c.id === cardId);
    if (!card || card.revealed) return null;

    card.revealed = true;
    
    // Add player info to history (runtime extension)
    const historyEntry: any = {
      cardId: card.id,
      word: card.word,
      type: card.type,
      team: room.currentTeam,
      timestamp: Date.now(),
      playerId: player.id,
      playerUsername: player.username,
      // Add clue information for this guess
      clue: room.currentClue ? {
        word: room.currentClue.word,
        count: room.currentClue.count
      } : null
    };
    room.revealHistory.push(historyEntry);
    
    // Decrement remaining guesses
    if (roomData.guessesRemaining > 0) {
      roomData.guessesRemaining--;
    }

    let shouldEndTurn = false;
    let correctGuess = false;

    if (card.type === "dark") {
      room.darkCardsRemaining--;
      if (room.darkCardsRemaining === 0) {
        room.winner = "dark";
        room.phase = "ended";
      } else if (room.currentTeam === "dark") {
        correctGuess = true;
        // Check if reached guess limit
        if (roomData.guessesRemaining === 0) {
          shouldEndTurn = true;
        }
      } else {
        shouldEndTurn = true;
      }
    } else if (card.type === "light") {
      room.lightCardsRemaining--;
      if (room.lightCardsRemaining === 0) {
        room.winner = "light";
        room.phase = "ended";
      } else if (room.currentTeam === "light") {
        correctGuess = true;
        // Check if reached guess limit
        if (roomData.guessesRemaining === 0) {
          shouldEndTurn = true;
        }
      } else {
        shouldEndTurn = true;
      }
    } else if (card.type === "assassin") {
      room.winner = room.currentTeam === "dark" ? "light" : "dark";
      room.phase = "ended";
    } else {
      // Neutral card - always ends turn
      shouldEndTurn = true;
    }
    
    // End turn if needed
    if (shouldEndTurn && room.phase !== "ended") {
      room.currentTeam = room.currentTeam === "dark" ? "light" : "dark";
      room.currentClue = null;
      roomData.guessesRemaining = 0;
      roomData.maxGuesses = 0;
      // Clear votes when turn ends
      roomData.cardVotes.clear();
      
      // Reset timer for new team's turn if timed mode is enabled
      if (room.timedMode) {
        room.currentTurnStartTime = Date.now();
      }
    }

    return room;
  }

  restartGame(roomCode: string, playerId: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isRoomOwner) return null;

    room.cards = this.createGameCards();
    room.phase = "playing";
    room.darkCardsRemaining = room.cards.filter(c => c.type === "dark").length;
    room.lightCardsRemaining = room.cards.filter(c => c.type === "light").length;
    
    // Reassign unique images for the new game
    this.assignCardImages(roomData);
    
    room.currentTeam = room.darkCardsRemaining === 9 ? "dark" : "light";
    room.currentClue = null;
    room.winner = null;
    room.revealHistory = [];
    
    // Reset guess tracking
    roomData.guessesRemaining = 0;
    roomData.maxGuesses = 0;
    // Clear votes on restart
    roomData.cardVotes.clear();
    
    // Reset timer if timed mode is enabled
    if (room.timedMode) {
      room.currentTurnStartTime = Date.now();
    }

    return room;
  }

  returnToLobby(roomCode: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;

    room.phase = "lobby";
    room.cards = [];
    room.darkCardsRemaining = 0;
    room.lightCardsRemaining = 0;
    room.currentTeam = null;
    room.currentClue = null;
    room.winner = null;
    room.revealHistory = [];
    
    // Reset guess tracking
    roomData.guessesRemaining = 0;
    roomData.maxGuesses = 0;
    // Clear votes on return to lobby
    roomData.cardVotes.clear();
    
    // Clear timer when returning to lobby
    room.currentTurnStartTime = null;

    return room;
  }

  endTurn(roomCode: string, playerId: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Check if player can end turn
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.team !== room.currentTeam || player.role !== "guesser") {
      return null;
    }
    
    // Check if game is in guessing phase
    if (room.phase !== "playing" || !room.currentClue) {
      return null;
    }
    
    // Add end turn log entry (runtime extension)
    const endTurnEntry: any = {
      type: "end_turn",
      team: room.currentTeam,
      playerId: player.id,
      playerUsername: player.username,
      timestamp: Date.now(),
      clue: room.currentClue ? {
        word: room.currentClue.word,
        count: room.currentClue.count
      } : null
    };
    room.revealHistory.push(endTurnEntry);
    
    // Switch teams and reset clue
    room.currentTeam = room.currentTeam === "dark" ? "light" : "dark";
    room.currentClue = null;
    roomData.guessesRemaining = 0;
    roomData.maxGuesses = 0;
    // Clear votes when turn ends
    roomData.cardVotes.clear();
    
    // Reset timer for new team's turn if timed mode is enabled
    if (room.timedMode) {
      room.currentTurnStartTime = Date.now();
    }
    
    return room;
  }

  removePlayer(roomCode: string, playerId: string): void {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return;
    const room = roomData.gameState;

    room.players = room.players.filter(p => p.id !== playerId);
    this.playerToRoom.delete(playerId);

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
    } else if (room.players.every(p => !p.isRoomOwner)) {
      room.players[0].isRoomOwner = true;
    }
  }

  cleanupEmptyRooms(): void {
    Array.from(this.rooms.entries()).forEach(([roomCode, roomData]) => {
      if (roomData.gameState.players.length === 0) {
        this.rooms.delete(roomCode);
      }
    });
  }

  voteCard(roomCode: string, playerId: string, cardId: number): { gameState: GameState; votes: Map<number, string[]> } | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Check if game is in playing phase and there's an active clue
    if (room.phase !== "playing" || !room.currentClue) return null;
    
    // Check if player can vote (must be guesser on current team)
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.role !== "guesser" || player.team !== room.currentTeam) {
      return null;
    }
    
    // Check if card exists and is not revealed
    const card = room.cards.find(c => c.id === cardId);
    if (!card || card.revealed) return null;
    
    // Initialize votes for this card if not exists
    if (!roomData.cardVotes.has(cardId)) {
      roomData.cardVotes.set(cardId, new Set());
    }
    
    // Add or remove vote
    const cardVoters = roomData.cardVotes.get(cardId)!;
    if (cardVoters.has(playerId)) {
      cardVoters.delete(playerId);
    } else {
      cardVoters.add(playerId);
    }
    
    // Convert votes to format for frontend (Map of cardId to array of usernames)
    const votesWithUsernames = new Map<number, string[]>();
    roomData.cardVotes.forEach((voterIds, cardId) => {
      const usernames = Array.from(voterIds).map(voterId => {
        const voter = room.players.find(p => p.id === voterId);
        return voter?.username || 'Unknown';
      });
      if (usernames.length > 0) {
        votesWithUsernames.set(cardId, usernames);
      }
    });
    
    return { gameState: room, votes: votesWithUsernames };
  }
  
  getCardVotes(roomCode: string): Map<number, string[]> | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Convert votes to format for frontend
    const votesWithUsernames = new Map<number, string[]>();
    roomData.cardVotes.forEach((voterIds, cardId) => {
      const usernames = Array.from(voterIds).map(voterId => {
        const voter = room.players.find(p => p.id === voterId);
        return voter?.username || 'Unknown';
      });
      if (usernames.length > 0) {
        votesWithUsernames.set(cardId, usernames);
      }
    });
    
    return votesWithUsernames;
  }
  
  clearTurnVotes(roomCode: string): void {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return;
    
    // Clear all votes when turn changes
    roomData.cardVotes.clear();
  }

  getCardImages(roomCode: string): Record<number, string> | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData || !roomData.cardImages) return null;
    
    // Convert Map to object for sending through WebSocket
    const imagesObject: Record<number, string> = {};
    roomData.cardImages.forEach((imagePath, cardId) => {
      imagesObject[cardId] = imagePath;
    });
    
    return imagesObject;
  }
}

export const storage = new MemStorage();
