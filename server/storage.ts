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
  tauntEnabled?: boolean;
  insultEnabled?: boolean;
  teamTauntCooldown?: { dark?: number; light?: number }; // Team-specific taunt cooldown timestamps
  teamInsultCooldown?: { dark?: number; light?: number }; // Team-specific insult cooldown timestamps
  endGameGuessVotes?: Map<string, Set<string>>; // targetPlayerId -> Set of playerIds who voted
  usedWords?: Set<string>; // Track used words to prevent repetition across games in the same room
}

export interface IStorage {
  createRoom(ownerUsername: string, password?: string): { roomCode: string; playerId: string; gameState: GameState } | null;
  getRoom(roomCode: string): GameState | undefined;
  joinRoom(roomCode: string, username: string, password?: string, reconnectPlayerId?: string): { playerId: string; gameState: GameState; isReconnect: boolean } | null;
  listRooms(): RoomListItem[];
  isUsernameAvailable(username: string): boolean;
  reserveUsername(username: string): string | null;
  releaseUsername(username: string): void;
  addBot(roomCode: string, team: Team, role: "spymaster" | "guesser"): GameState | null;
  updatePlayerTeam(roomCode: string, playerId: string, team: Team): GameState | null;
  updatePlayerRole(roomCode: string, playerId: string, role: "spymaster" | "guesser"): GameState | null;
  updateTeamName(roomCode: string, team: Team, name: string): GameState | null;
  updateTimerSettings(roomCode: string, timedMode: boolean, spymasterTime: number, guesserTime: number): GameState | null;
  updateChaosMode(roomCode: string, chaosMode: boolean): GameState | null;
  updateChaosModeType(roomCode: string, type: "prophet" | "double_agent"): GameState | null;
  updatePassword(roomCode: string, password: string | null): GameState | null;
  guessProphet(roomCode: string, playerId: string, targetPlayerId: string): GameState | null;
  guessDoubleAgent(roomCode: string, playerId: string, targetPlayerId: string): GameState | null;
  endGameGuess(roomCode: string, playerId: string, targetPlayerId: string): GameState | null;
  startGame(roomCode: string): GameState | null;
  giveClue(roomCode: string, playerId: string, word: string, count: number): GameState | null;
  revealCard(roomCode: string, playerId: string, cardId: number): GameState | null;
  restartGame(roomCode: string, playerId: string): GameState | null;
  returnToLobby(roomCode: string): GameState | null;
  endTurn(roomCode: string, playerId: string): GameState | null;
  markPlayerDisconnected(roomCode: string, playerId: string): GameState | null;
  removePlayer(roomCode: string, playerId: string): void;
  cleanupEmptyRooms(): void;
  getCardImages(roomCode: string): Record<number, string> | null;
  triggerTaunt(roomCode: string, playerId: string): any;
  sendInsult(roomCode: string, playerId: string, targetId?: string): any;
  toggleTaunt(roomCode: string, enabled: boolean): any;
  toggleInsult(roomCode: string, enabled: boolean): any;
  getRoomFeatures(roomCode: string, playerId?: string): { tauntEnabled: boolean; insultEnabled: boolean; teamTauntCooldown?: number; teamInsultCooldown?: number } | null;
  // Introduction phase methods
  startIntroduction(roomCode: string): GameState | null;
  selectPlayerForIntroduction(roomCode: string, playerId: string, targetPlayerId: string): GameState | null;
  finishPlayerIntroduction(roomCode: string, playerId: string, targetPlayerId: string): GameState | null;
  likeIntroduction(roomCode: string, playerId: string, targetPlayerId: string, isLike: boolean): GameState | null;
  skipIntroduction(roomCode: string, playerId: string): GameState | null;
}

// Insult templates
const insultMessages = [
  "{target} acayip hayvanlara benziyirsen!",
  "{target} sütünü iç de uyu!",
  "{target} pislik topu!",
  "{target} sen SALAKSIN!",
  "{target} beynini söğüş yapıp yemiş...",
  "{target} git köşende ağla!",
  "{target} sırtına vururum ha!",
  "{target} patates kafalı!",
  "{target} hadi köyüne!",
  "{target} uyku vaktin gelmedi mi senin?",
  "{target} git kumda oyna!",
  "{target} seni gidi aptal!",
  "{target} karga beyinli!",
  "{target} yazık kafana!",
  "{target} peş para etmezsin!",
  "{target} akılsız mahlukat!",
  "{target} ezan okundu hadi evine!",
  "{target} haline gülsem mi ağlasam mı?!",
  "{target} seni soğan kafalı!",
  "{target} A.M.K!",
  "{target} sen tam bir soytarısın!",
  "{target} ağlayacaksan peçete getireyim?",
  "{target} şinasi bile senden akıllı...",
  "{target} vay gerizekalı vay!",
  "{target} haha ezik XD",
  "{target} kımıl zararlısı!"
];

export class MemStorage implements IStorage {
  private rooms: Map<string, RoomData>;
  private playerToRoom: Map<string, string>;
  private lastInsultTime: Map<string, number>; // roomCode -> timestamp
  private playerInsultCooldown: Map<string, number>; // playerId -> timestamp
  private insultCooldowns: Map<string, number>; // For V2 system
  private tauntCooldowns: Map<string, number>; // For taunt system
  private activeUsernames: Map<string, string>; // username -> playerId, tracks active usernames globally
  private playerIdToUsername: Map<string, string>; // playerId -> username for cleanup
  private disconnectedPlayers: Map<string, { player: Player; roomCode: string; disconnectedAt: number }>; // Track disconnected players with timestamp

  constructor() {
    this.rooms = new Map();
    this.playerToRoom = new Map();
    this.lastInsultTime = new Map();
    this.playerInsultCooldown = new Map();
    this.insultCooldowns = new Map(); // Initialize V2 cooldowns
    this.tauntCooldowns = new Map(); // Initialize taunt cooldowns
    this.activeUsernames = new Map(); // Track active usernames globally
    this.playerIdToUsername = new Map(); // Track playerId to username mapping
    this.disconnectedPlayers = new Map(); // Track disconnected players for reconnection
    
    setInterval(() => this.cleanupEmptyRooms(), 60000);
    setInterval(() => this.cleanupDisconnectedPlayers(), 30000); // Clean up old disconnected players every 30 seconds
  }

  private cleanupDisconnectedPlayers(): void {
    // Don't automatically clean up disconnected players
    // They can reconnect anytime as long as the room exists
    // Only clean up when the room itself is deleted
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
    // Image pools for each card type - using ALL available images from both folders
    const imagePools = {
      dark: [
        '/acilmiskartgorsel/ali mavi.webp',
        '/acilmiskartgorsel/blush mavi.webp',
        '/acilmiskartgorsel/hasan mavi.webp',
        '/acilmiskartgorsel/kasım mavi.webp',
        '/acilmiskartgorsel/mami mavi.webp',
        '/acilmiskartgorsel/noeldayı mavi.webp',
        '/acilmiskartgorsel/nuriben mavi.webp',
        '/acilmiskartgorsel/çağrı mavi.webp',
        '/acilmiskartgorsel/triel2 mavi.webp'  // 9 total blue/dark cards!
      ],
      light: [
        '/acilmiskartgorsel/alik kırmızı.webp',
        '/acilmiskartgorsel/begüm kırmızı.webp',
        '/acilmiskartgorsel/dobby kırmızı.webp',
        '/acilmiskartgorsel/karaman kırmızı.webp',
        '/acilmiskartgorsel/neswin kırmızı.webp',
        '/acilmiskartgorsel/noeldayı kırmızı.webp',
        '/acilmiskartgorsel/perver kırmızı.webp',
        '/acilmiskartgorsel/triel kırmızı.webp',
        '/acilmiskartgorsel/şinasi kırmızı.webp',
        '/acilmiskartgorsel/timoçin kırmızı.webp'  // 10 total red/light cards!
      ],
      neutral: [
        '/acilmiskartgorsel/blush beyaz.webp',
        '/acilmiskartgorsel/hasan beyaz.webp',
        '/acilmiskartgorsel/mami beyaz.webp',
        '/acilmiskartgorsel/perver beyaz.webp',
        '/acilmiskartgorsel/çağrı normal beyaz.webp',
        '/acilmiskartgorsel/çağrı sigara beyaz.webp',
        '/acilmiskartgorsel/şinasi su beyaz.webp'  // 7 total neutral cards!
      ],
      assassin: ['/ajan siyah.webp', '/acilmiskartgorsel/arda siyah.webp']
    };

    // Shuffle each pool
    for (const type in imagePools) {
      imagePools[type as keyof typeof imagePools] = imagePools[type as keyof typeof imagePools]
        .sort(() => Math.random() - 0.5);
    }

    // Create the mapping - now we have enough unique images for all cards!
    const cardImages = new Map<number, string>();
    const imageIndexes = { dark: 0, light: 0, neutral: 0, assassin: 0 };

    // Assign unique images to each card based on its type
    roomData.gameState.cards.forEach(card => {
      const type = card.type;
      const pool = imagePools[type];
      const index = imageIndexes[type];
      
      // This should never happen now that we have enough images
      if (!pool || index >= pool.length) {
        console.error(`Not enough images for card type: ${type}, index: ${index}`);
        // Fallback: use modulo to reuse images if needed
        const safeIndex = index % pool.length;
        cardImages.set(card.id, pool[safeIndex]);
      } else {
        cardImages.set(card.id, pool[index]);
      }
      
      imageIndexes[type]++;
    });

    roomData.cardImages = cardImages;
  }

  // Fisher-Yates shuffle algoritması - daha iyi karıştırma için
  private fisherYatesShuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private createGameCards(usedWords?: Set<string>): Card[] {
    // Kelimeleri al ve tekrar karıştır (getRandomWords'ün üstüne ekstra karıştırma)
    // Pass the usedWords set to prevent repetition
    let words = getRandomWords(25, usedWords);
    // Kelimeleri Fisher-Yates ile tekrar karıştır
    words = this.fisherYatesShuffle(words);
    
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
    
    // Kart tiplerini Fisher-Yates ile karıştır
    const shuffledTypes = this.fisherYatesShuffle(types);
    
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

  createRoom(ownerUsername: string, password?: string): { roomCode: string; playerId: string; gameState: GameState } | null {
    const roomCode = this.generateRoomCode();
    const playerId = randomUUID();
    
    // Check if username is reserved or taken by another player
    const existingPlayerId = this.activeUsernames.get(ownerUsername.toLowerCase());
    if (existingPlayerId) {
      // If it's a temporary reservation (from reserve_username), replace it
      const existingRoom = this.playerToRoom.get(existingPlayerId);
      if (!existingRoom) {
        // This is just a reservation, we can replace it
        this.activeUsernames.delete(ownerUsername.toLowerCase());
        this.playerIdToUsername.delete(existingPlayerId);
      } else {
        // Username is actually in use by another player in a room
        return null;
      }
    }
    
    // Register username globally with the actual playerId
    this.activeUsernames.set(ownerUsername.toLowerCase(), playerId);
    this.playerIdToUsername.set(playerId, ownerUsername.toLowerCase());
    
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
      chaosMode: false,
      prophetGuessUsed: { dark: false, light: false },
    };

    this.rooms.set(roomCode, { 
      gameState, 
      password,
      guessesRemaining: 0,
      maxGuesses: 0,
      cardVotes: new Map(), // Map of cardId to Set of playerIds who voted
      tauntEnabled: true, // Enable taunt by default
      insultEnabled: true, // Enable insult by default
      usedWords: new Set<string>() // Track used words across games in this room
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

    // First check if this is a disconnected player reconnecting
    if (reconnectPlayerId && this.disconnectedPlayers.has(reconnectPlayerId)) {
      const disconnectedData = this.disconnectedPlayers.get(reconnectPlayerId);
      if (disconnectedData && disconnectedData.roomCode === roomCode && disconnectedData.player.username === username) {
        // Restore the disconnected player
        const existingPlayer = room.players.find(p => p.id === reconnectPlayerId);
        if (existingPlayer) {
          // Clear disconnected flag
          delete (existingPlayer as any).isDisconnected;
          this.disconnectedPlayers.delete(reconnectPlayerId);
          this.playerToRoom.set(reconnectPlayerId, roomCode);
          console.log(`[RECONNECT] Player ${reconnectPlayerId} (${username}) reconnected to room ${roomCode}`);
          return { playerId: reconnectPlayerId, gameState: room, isReconnect: true };
        }
      }
    }

    // Check if reconnecting with playerId
    if (reconnectPlayerId) {
      const existingPlayer = room.players.find(p => p.id === reconnectPlayerId && p.username === username);
      if (existingPlayer) {
        // Check if this username belongs to this playerId
        if (this.playerIdToUsername.get(existingPlayer.id) === username.toLowerCase()) {
          // Clear any disconnected flag
          delete (existingPlayer as any).isDisconnected;
          this.playerToRoom.set(existingPlayer.id, roomCode);
          return { playerId: existingPlayer.id, gameState: room, isReconnect: true };
        }
      }
    }

    // Check if reconnecting by username - only allow if it's the same player
    const existingPlayerId = this.activeUsernames.get(username.toLowerCase());
    if (existingPlayerId) {
      // Check if this player is in this room
      const existingPlayer = room.players.find(p => p.id === existingPlayerId);
      if (existingPlayer) {
        // Clear any disconnected flag
        delete (existingPlayer as any).isDisconnected;
        this.playerToRoom.set(existingPlayer.id, roomCode);
        return { playerId: existingPlayer.id, gameState: room, isReconnect: true };
      }
      
      // Check if it's just a reservation (not in any room)
      const existingRoom = this.playerToRoom.get(existingPlayerId);
      if (!existingRoom) {
        // This is just a reservation, we can replace it
        this.activeUsernames.delete(username.toLowerCase());
        this.playerIdToUsername.delete(existingPlayerId);
      } else {
        // Username is taken by someone in another room - reject
        return null;
      }
    }

    // For new players, check password
    if (roomData.password && roomData.password !== password) {
      return null;
    }

    const playerId = randomUUID();
    
    // Register username globally
    this.activeUsernames.set(username.toLowerCase(), playerId);
    this.playerIdToUsername.set(playerId, username.toLowerCase());
    
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
      // Find the room owner's name
      const owner = roomData.gameState.players.find(p => p.isRoomOwner);
      const ownerName = owner ? owner.username : "Unknown";
      
      roomList.push({
        roomCode: roomData.gameState.roomCode,
        playerCount: roomData.gameState.players.length,
        hasPassword: roomData.gameState.hasPassword,
        phase: roomData.gameState.phase,
        createdAt: roomData.gameState.createdAt,
        ownerName: ownerName,
      } as any); // Cast to any to add ownerName without modifying shared schema
    });

    // Sort by creation time, newest first
    return roomList.sort((a, b) => b.createdAt - a.createdAt);
  }

  isUsernameAvailable(username: string): boolean {
    return !this.activeUsernames.has(username.toLowerCase());
  }

  reserveUsername(username: string): string | null {
    if (!this.isUsernameAvailable(username)) {
      return null;
    }
    const tempId = randomUUID();
    this.activeUsernames.set(username.toLowerCase(), tempId);
    this.playerIdToUsername.set(tempId, username.toLowerCase());
    return tempId;
  }

  releaseUsername(username: string): void {
    const playerId = this.activeUsernames.get(username.toLowerCase());
    if (playerId) {
      this.activeUsernames.delete(username.toLowerCase());
      this.playerIdToUsername.delete(playerId);
    }
  }

  changePlayerUsername(roomCode: string, playerId: string, newUsername: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;

    const player = room.players.find(p => p.id === playerId);
    if (!player || player.isBot) return null;

    // Check if new username is available (excluding current player)
    const newUsernameLower = newUsername.toLowerCase();
    const currentOwner = this.activeUsernames.get(newUsernameLower);
    if (currentOwner && currentOwner !== playerId) {
      return null; // Username already taken by another player
    }

    // Release old username
    const oldUsername = this.playerIdToUsername.get(playerId);
    if (oldUsername) {
      this.activeUsernames.delete(oldUsername);
    }

    // Reserve new username
    this.activeUsernames.set(newUsernameLower, playerId);
    this.playerIdToUsername.set(playerId, newUsernameLower);

    // Update player in game state
    player.username = newUsername;
    
    // Update disconnected player info if exists
    const disconnectedInfo = this.disconnectedPlayers.get(playerId);
    if (disconnectedInfo) {
      disconnectedInfo.player.username = newUsername;
    }

    return room;
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

  updateChaosMode(roomCode: string, chaosMode: boolean): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Only allow chaos mode settings to be changed in lobby
    if (room.phase !== "lobby") return null;

    room.chaosMode = chaosMode;
    // Reset type when disabling
    if (!chaosMode) {
      room.chaosModeType = null;
    }

    return room;
  }

  updateChaosModeType(roomCode: string, type: "prophet" | "double_agent"): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Only allow chaos mode type to be changed in lobby
    if (room.phase !== "lobby") return null;

    room.chaosModeType = type;

    return room;
  }

  updatePassword(roomCode: string, password: string | null): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Update the password and hasPassword flag
    if (password) {
      roomData.password = password;
      room.hasPassword = true;
    } else {
      roomData.password = undefined;
      room.hasPassword = false;
    }

    return room;
  }

  private assignSecretRoles(room: GameState): void {
    // Clear any existing secret roles
    room.players.forEach(p => {
      p.secretRole = null;
      p.knownCards = undefined;
    });

    // Only assign roles if chaos mode is enabled and a type is selected
    if (!room.chaosMode || !room.chaosModeType) {
      return;
    }

    // Helper function for truly random selection
    const getRandomIndex = (max: number): number => {
      // Use Date.now() to add more randomness
      const seed = Date.now() % 1000;
      return Math.floor((Math.random() * seed + Math.random() * (1000 - seed)) / 1000 * max);
    };

    // Assign roles to all players (including bots) who are guessers
    // Shuffle the arrays first to ensure randomness
    const darkGuessers = room.players
      .filter(p => p.team === "dark" && p.role === "guesser")
      .sort(() => Math.random() - 0.5);
    const lightGuessers = room.players
      .filter(p => p.team === "light" && p.role === "guesser")
      .sort(() => Math.random() - 0.5);
    
    if (room.chaosModeType === "prophet") {
      // Prophet mode: Assign Prophet to one player from each team (if there are guessers)
      if (darkGuessers.length > 0) {
        const randomIndex = getRandomIndex(darkGuessers.length);
        const darkProphet = darkGuessers[randomIndex];
        darkProphet.secretRole = "prophet";
        console.log(`Dark team prophet assigned to: ${darkProphet.username} (index ${randomIndex} of ${darkGuessers.length})`);
        
        // Give prophet 3 random cards from their team
        const darkCards = room.cards.filter(c => c.type === "dark").map(c => c.id);
        // Fisher-Yates shuffle for better randomization
        for (let i = darkCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [darkCards[i], darkCards[j]] = [darkCards[j], darkCards[i]];
        }
        darkProphet.knownCards = darkCards.slice(0, Math.min(3, darkCards.length));
      }
      
      if (lightGuessers.length > 0) {
        const randomIndex = getRandomIndex(lightGuessers.length);
        const lightProphet = lightGuessers[randomIndex];
        lightProphet.secretRole = "prophet";
        console.log(`Light team prophet assigned to: ${lightProphet.username} (index ${randomIndex} of ${lightGuessers.length})`);
        
        // Give prophet 3 random cards from their team
        const lightCards = room.cards.filter(c => c.type === "light").map(c => c.id);
        // Fisher-Yates shuffle for better randomization
        for (let i = lightCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [lightCards[i], lightCards[j]] = [lightCards[j], lightCards[i]];
        }
        lightProphet.knownCards = lightCards.slice(0, Math.min(3, lightCards.length));
      }
    } else if (room.chaosModeType === "double_agent") {
      // Double Agent mode: Assign Double Agent to one player from each team
      
      // Assign Double Agent to one player from Dark team
      if (darkGuessers.length > 0) {
        const randomIndex = getRandomIndex(darkGuessers.length);
        const darkDoubleAgent = darkGuessers[randomIndex];
        darkDoubleAgent.secretRole = "double_agent";
        console.log(`Dark team double agent assigned to: ${darkDoubleAgent.username} (index ${randomIndex} of ${darkGuessers.length})`);
      }
      
      // Assign Double Agent to one player from Light team  
      if (lightGuessers.length > 0) {
        const randomIndex = getRandomIndex(lightGuessers.length);
        const lightDoubleAgent = lightGuessers[randomIndex];
        lightDoubleAgent.secretRole = "double_agent";
        console.log(`Light team double agent assigned to: ${lightDoubleAgent.username} (index ${randomIndex} of ${lightGuessers.length})`);
      }
    }
  }

  startGame(roomCode: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    if (room.phase !== "lobby") return null;

    // If Chaos Mode is enabled, a type must be selected
    if (room.chaosMode && !room.chaosModeType) {
      console.log("Chaos Mode enabled but no type selected, cannot start game");
      return null;
    }

    const darkTeam = room.players.filter(p => p.team === "dark");
    const lightTeam = room.players.filter(p => p.team === "light");

    if (darkTeam.length === 0 || lightTeam.length === 0) return null;
    if (!darkTeam.some(p => p.role === "spymaster")) return null;
    if (!lightTeam.some(p => p.role === "spymaster")) return null;

    // Check if we should go to introduction phase first
    if (!room.introductionPhase?.hasOccurred && room.players.length > 2) {
      // Start introduction phase for first game
      return this.startIntroduction(roomCode);
    }

    // Create game cards with excluded words
    room.cards = this.createGameCards(roomData.usedWords);
    
    // Track the newly used words
    if (!roomData.usedWords) {
      roomData.usedWords = new Set<string>();
    }
    room.cards.forEach(card => {
      roomData.usedWords!.add(card.word);
    });
    
    // Log used words count
    console.log(`Room ${roomCode} has used ${roomData.usedWords!.size} words total`);
    
    room.phase = "playing";
    room.darkCardsRemaining = room.cards.filter(c => c.type === "dark").length;
    room.lightCardsRemaining = room.cards.filter(c => c.type === "light").length;
    
    // Assign unique images to cards when game starts
    this.assignCardImages(roomData);
    room.currentTeam = room.darkCardsRemaining === 9 ? "dark" : "light";
    room.currentClue = null;
    room.winner = null;
    room.revealHistory = [];

    // Assign secret roles for Chaos Mode
    if (room.chaosMode) {
      this.assignSecretRoles(room);
    }
    
    // Reset guess tracking
    roomData.guessesRemaining = 0;
    roomData.maxGuesses = 0;
    
    // Start timer if timed mode is enabled
    if (room.timedMode) {
      room.currentTurnStartTime = Date.now();
    }

    // Log game details to console
    console.log(`\n========== OYUN DETAYLARI ==========`);
    console.log(`Oda Kodu: ${room.roomCode}`);
    console.log(`Oyun Modları:`);
    console.log(`  - Zamanlı Mod: ${room.timedMode ? 'AÇIK' : 'KAPALI'}`);
    console.log(`  - Kaos Modu: ${room.chaosMode ? 'AÇIK' : 'KAPALI'}`);
    console.log(`\n----- TAKIMLAR -----`);
    console.log(`${room.darkTeamName} (${room.darkCardsRemaining} kart):`);
    darkTeam.forEach(p => {
      console.log(`  - ${p.username} (${p.role === 'spymaster' ? 'İstihbarat Şefi' : 'Ajan'})`);
    });
    console.log(`\n${room.lightTeamName} (${room.lightCardsRemaining} kart):`);
    lightTeam.forEach(p => {
      console.log(`  - ${p.username} (${p.role === 'spymaster' ? 'İstihbarat Şefi' : 'Ajan'})`);
    });
    
    console.log(`\n----- KART DAĞILIMI -----`);
    console.log(`  - ${room.darkTeamName}: ${room.darkCardsRemaining} kart`);
    console.log(`  - ${room.lightTeamName}: ${room.lightCardsRemaining} kart`);
    console.log(`  - Tarafsız: ${room.cards.filter(c => c.type === "neutral").length} kart`);
    console.log(`  - Suikastçı: 1 kart`);
    console.log(`  - Toplam: 25 kart`);
    
    console.log(`\nİlk başlayan takım: ${room.currentTeam === "dark" ? room.darkTeamName : room.lightTeamName}`);
    console.log(`========================================\n`);

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

    // Create game cards with excluded words
    room.cards = this.createGameCards(roomData.usedWords);
    
    // Track the newly used words
    if (!roomData.usedWords) {
      roomData.usedWords = new Set<string>();
    }
    room.cards.forEach(card => {
      roomData.usedWords!.add(card.word);
    });
    
    // Log used words count
    console.log(`Room ${roomCode} has used ${roomData.usedWords!.size} words total`);
    
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
    
    // Reassign secret roles for Chaos Mode on restart
    if (room.chaosMode) {
      this.assignSecretRoles(room);
    }

    // Reset prophet guess tracking for new game
    room.prophetGuessUsed = undefined;
    room.prophetGuessResult = undefined;
    room.doubleAgentGuessUsed = undefined;
    room.doubleAgentGuessResult = undefined;
    room.endGameGuessUsed = undefined;
    room.endGameGuessSequence = undefined;

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
    
    // Clear end game guess tracking
    room.endGameGuessUsed = undefined;
    room.endGameGuessSequence = undefined;

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

  markPlayerDisconnected(roomCode: string, playerId: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return null;
    }

    // Mark the player as disconnected in our tracking, but keep them in the room
    const disconnectedEntry = {
      player: { ...player }, // Store a copy of player data
      roomCode: roomCode,
      disconnectedAt: Date.now()
    };
    this.disconnectedPlayers.set(playerId, disconnectedEntry);

    // Mark player as disconnected in the game state (add a runtime property)
    (player as any).isDisconnected = true;

    console.log(`[DISCONNECT] Marked player ${playerId} (${player.username}) as disconnected from room ${roomCode}`);
    
    // Don't remove them from the room yet - give them time to reconnect
    // The game continues with the player marked as disconnected
    return room;
  }

  guessProphet(roomCode: string, playerId: string, targetPlayerId: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Prophet guessing only works during the game, not after it ends
    if (room.phase !== "playing" || !room.chaosMode) return null;
    
    // Check if player is a guesser on the current team
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.team !== room.currentTeam || player.role !== "guesser") {
      return null;
    }
    
    // Check if the team hasn't used their prophet guess yet
    if (room.prophetGuessUsed && room.prophetGuessUsed[room.currentTeam as "dark" | "light"]) {
      return null;
    }
    
    // Get the target player
    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.team === room.currentTeam) {
      return null; // Can't guess your own team
    }
    
    // Mark the guess as used
    if (!room.prophetGuessUsed) {
      room.prophetGuessUsed = { dark: false, light: false };
    }
    room.prophetGuessUsed[room.currentTeam as "dark" | "light"] = true;
    
    // Check if the guess is correct
    const isCorrect = targetPlayer.secretRole === "prophet";
    
    // Store the result
    room.prophetGuessResult = {
      team: room.currentTeam,
      success: isCorrect,
      targetId: targetPlayerId
    };
    
    // If correct, the guessing team wins immediately
    // If incorrect, the guessing team loses immediately!
    if (isCorrect) {
      room.winner = room.currentTeam;
      room.phase = "ended";
    } else {
      // Wrong guess means instant loss for the guessing team!
      room.winner = room.currentTeam === "dark" ? "light" : "dark";
      room.phase = "ended";
    }
    
    return room;
  }

  voteEndGameGuess(roomCode: string, playerId: string, targetPlayerId: string): { gameState: GameState; votes: Map<string, string[]> } | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // End game voting only works after the game ends, in chaos mode
    if (room.phase !== "ended" || !room.chaosMode || !room.chaosModeType) return null;
    
    // Check if there's a winner already (a team won normally)
    if (!room.winner) return null;
    
    // Check if end game guess hasn't been used yet
    if (room.endGameGuessUsed) return null;
    
    // Check if player is on the losing team
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.team === room.winner) {
      return null; // Only losing team can vote
    }
    
    // Get the target player and verify they're on the winning team
    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.team !== room.winner) {
      return null; // Can only vote for players on the winning team
    }
    
    // Initialize votes map if not exists
    if (!roomData.endGameGuessVotes) {
      roomData.endGameGuessVotes = new Map();
    }
    
    // Clear player's previous vote from all targets
    roomData.endGameGuessVotes.forEach((voters, targetId) => {
      voters.delete(playerId);
      if (voters.size === 0) {
        roomData.endGameGuessVotes!.delete(targetId);
      }
    });
    
    // Add new vote
    if (!roomData.endGameGuessVotes.has(targetPlayerId)) {
      roomData.endGameGuessVotes.set(targetPlayerId, new Set());
    }
    roomData.endGameGuessVotes.get(targetPlayerId)!.add(playerId);
    
    // Convert votes to format for frontend (Map of playerId to array of usernames)
    const votesWithUsernames = new Map<string, string[]>();
    roomData.endGameGuessVotes.forEach((voterIds, targetId) => {
      const usernames = Array.from(voterIds).map(voterId => {
        const voter = room.players.find(p => p.id === voterId);
        return voter?.username || 'Unknown';
      });
      if (usernames.length > 0) {
        votesWithUsernames.set(targetId, usernames);
      }
    });
    
    return { gameState: room, votes: votesWithUsernames };
  }
  
  getEndGameGuessVotes(roomCode: string): Map<string, string[]> | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData || !roomData.endGameGuessVotes) return null;
    const room = roomData.gameState;
    
    // Convert votes to format for frontend
    const votesWithUsernames = new Map<string, string[]>();
    roomData.endGameGuessVotes.forEach((voterIds, targetId) => {
      const usernames = Array.from(voterIds).map(voterId => {
        const voter = room.players.find(p => p.id === voterId);
        return voter?.username || 'Unknown';
      });
      if (usernames.length > 0) {
        votesWithUsernames.set(targetId, usernames);
      }
    });
    
    return votesWithUsernames;
  }

  endGameGuess(roomCode: string, playerId: string, targetPlayerId: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // End game guessing only works after the game ends, in chaos mode
    if (room.phase !== "ended" || !room.chaosMode || !room.chaosModeType) return null;
    
    // Check if there's a winner already (a team won normally)
    if (!room.winner) return null;
    
    // Check if end game guess hasn't been used yet
    if (room.endGameGuessUsed) return null;
    
    // Check if player is on the losing team
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.team === room.winner) {
      return null; // Only losing team can guess
    }
    
    // Get the target player
    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer) return null;
    
    // Mark that end game guess has been used
    room.endGameGuessUsed = true;
    
    // Clear votes after guess is made
    if (roomData.endGameGuessVotes) {
      roomData.endGameGuessVotes.clear();
    }
    
    // Get team names
    const guessingTeamName = player.team === "dark" ? room.darkTeamName : room.lightTeamName;
    const targetTeamName = targetPlayer.team === "dark" ? room.darkTeamName : room.lightTeamName;
    
    // Initialize the dramatic sequence
    room.endGameGuessSequence = {
      guessingTeam: player.team,
      guessingTeamName: guessingTeamName,
      targetPlayer: targetPlayer.username,
      targetTeam: targetPlayer.team,
      targetTeamName: targetTeamName,
      guessType: room.chaosModeType,
      actualRole: targetPlayer.secretRole,
      success: false,
      finalWinner: room.winner,
      finalWinnerName: room.winner === "dark" ? room.darkTeamName : room.lightTeamName
    };
    
    let guessCorrect = false;
    
    if (room.chaosModeType === "prophet") {
      // In Prophet mode: Losing team guesses the prophet on the OPPOSING team
      if (targetPlayer.team !== player.team && targetPlayer.secretRole === "prophet") {
        guessCorrect = true;
      }
    } else if (room.chaosModeType === "double_agent") {
      // In Double Agent mode: Losing team guesses the double agent on THEIR OWN team
      if (targetPlayer.team === player.team && targetPlayer.secretRole === "double_agent") {
        guessCorrect = true;
      }
    }
    
    // Update the sequence with results
    room.endGameGuessSequence.success = guessCorrect;
    
    if (guessCorrect) {
      // If guess is correct, the losing team wins!
      room.winner = player.team;
      room.endGameGuessSequence.finalWinner = player.team;
      room.endGameGuessSequence.finalWinnerName = guessingTeamName;
      console.log(`END GAME GUESS CORRECT! ${player.team} team wins by guessing ${targetPlayer.username}`);
    } else {
      // If guess is wrong, the original winner remains
      room.endGameGuessSequence.finalWinnerName = room.winner === "dark" ? room.darkTeamName : room.lightTeamName;
      console.log(`END GAME GUESS WRONG! ${room.winner} team still wins. ${targetPlayer.username} was ${targetPlayer.secretRole || "normal player"}`);
    }
    
    return room;
  }

  guessDoubleAgent(roomCode: string, playerId: string, targetPlayerId: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Double agent guessing only works after the game ends, in chaos mode
    if (room.phase !== "ended" || !room.chaosMode) return null;
    
    // Check if there's a winner already (a team won normally)
    if (!room.winner) return null;
    
    // Check if double agent guess hasn't been used yet
    if (room.doubleAgentGuessUsed) return null;
    
    // Check if player is on the losing team
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.team === room.winner) {
      return null; // Only losing team can guess
    }
    
    // Get the target player
    const targetPlayer = room.players.find(p => p.id === targetPlayerId);
    if (!targetPlayer || targetPlayer.team !== room.winner) {
      return null; // Can only guess players on the winning team
    }
    
    // Mark the guess as used
    room.doubleAgentGuessUsed = true;
    
    // Check if the guess is correct
    const isCorrect = targetPlayer.secretRole === "double_agent";
    
    // Store the result
    room.doubleAgentGuessResult = {
      success: isCorrect,
      targetId: targetPlayerId
    };
    
    // If the guess is correct, the losing team steals the win
    if (isCorrect) {
      room.winner = player.team;
    }
    
    return room;
  }

  triggerTaunt(roomCode: string, playerId: string): any {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Check if taunt feature is enabled (defaults to true if not set)
    if (roomData.tauntEnabled === false) return null;
    
    // Only during playing phase
    if (room.phase !== "playing") return null;
    
    // Find the player
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.team) return null;
    
    // Check team-specific cooldown (5 seconds)
    const now = Date.now();
    if (!roomData.teamTauntCooldown) {
      roomData.teamTauntCooldown = {};
    }
    
    const teamCooldown = roomData.teamTauntCooldown[player.team];
    if (teamCooldown && (now - teamCooldown) < 5000) {
      return null; // Still on team cooldown
    }
    
    // Update team taunt cooldown
    roomData.teamTauntCooldown[player.team] = now;
    
    // Generate random position on board (normalized 0-1)
    const position = {
      x: Math.random(),
      y: Math.random()
    };
    
    // Determine video source based on team
    const videoSrc = player.team === "dark" ? "/mavi taunt.webm" : "/kırmızı taunt.webm";
    
    // Return taunt data for broadcast
    return {
      playerId: player.id,
      username: player.username,
      team: player.team,
      videoSrc,
      position,
      expiresAt: now + 3000 // Video lasts 3 seconds
    };
  }

  sendInsult(roomCode: string, playerId: string, targetId?: string): any {
    console.log(`[STORAGE.sendInsult] Called with targetId: "${targetId}" (type: ${typeof targetId})`);
    
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Check if insult feature is enabled (defaults to true if not set)
    if (roomData.insultEnabled === false) return null;
    
    // Only during playing phase
    if (room.phase !== "playing") return null;
    
    // Find the player
    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.team) return null;
    
    // Check global cooldown for room (no overlapping messages)
    const now = Date.now();
    const lastInsult = this.lastInsultTime.get(roomCode) || 0;
    if (now - lastInsult < 4000) { // 3 seconds for message + 1 second buffer
      return null;
    }
    
    // Check player's personal cooldown (5 seconds)
    const lastPlayerInsult = this.playerInsultCooldown.get(playerId) || 0;
    if (now - lastPlayerInsult < 5000) {
      return null;
    }
    
    console.log(`[INSULT] Processing insult from player: ${playerId} (${player.username}) to target: ${targetId}`);
    
    let target;
    if (targetId) {
      // Use specific target if provided
      target = room.players.find(p => p.id === targetId);
      console.log(`[INSULT] Found target: ${target?.id} (${target?.username}), team: ${target?.team}`);
      if (!target || !target.team || target.team === player.team) {
        console.log(`[INSULT] Invalid target - same team or missing`);
        return null;
      }
    } else {
      // Get random opponent from other team
      const oppositeTeam = player.team === "dark" ? "light" : "dark";
      const opponents = room.players.filter(p => p.team === oppositeTeam);
      
      if (opponents.length === 0) return null;
      
      target = opponents[Math.floor(Math.random() * opponents.length)];
      console.log(`[INSULT] No targetId provided, selected random: ${target.id} (${target.username})`);
    }
    
    // Get random insult message
    const message = insultMessages[Math.floor(Math.random() * insultMessages.length)]
      .replace("{target}", target.username);
    
    // Update cooldowns
    this.playerInsultCooldown.set(playerId, now);
    this.lastInsultTime.set(roomCode, now);
    
    // Return insult data for broadcast
    const insultData = {
      senderId: player.id,
      senderUsername: player.username,
      senderTeam: player.team,
      targetId: target.id,
      targetUsername: target.username,
      targetTeam: target.team,
      message,
      timestamp: now
    };
    
    console.log(`[INSULT] Sending insult data:`, insultData);
    return insultData;
  }

  removePlayer(roomCode: string, playerId: string): void {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return;
    const room = roomData.gameState;

    // Clean up disconnected player data if it exists
    this.disconnectedPlayers.delete(playerId);

    // Check if this player was the owner
    const removedPlayer = room.players.find(p => p.id === playerId);
    const wasOwner = removedPlayer?.isRoomOwner;

    room.players = room.players.filter(p => p.id !== playerId);
    this.playerToRoom.delete(playerId);

    // Clear username from global tracking
    const username = this.playerIdToUsername.get(playerId);
    if (username) {
      this.activeUsernames.delete(username);
      this.playerIdToUsername.delete(playerId);
    }

    if (room.players.length === 0) {
      this.rooms.delete(roomCode);
    } else {
      // Transfer ownership if needed
      if (wasOwner && room.players.length > 0) {
        room.players[0].isRoomOwner = true;
      }
      
      // Game continues even if owner or spymasters leave
      // The game state is preserved for reconnection
    }
  }

  cleanupEmptyRooms(): void {
    Array.from(this.rooms.entries()).forEach(([roomCode, roomData]) => {
      if (roomData.gameState.players.length === 0) {
        this.rooms.delete(roomCode);
        
        // Also clean up any disconnected players from this room
        Array.from(this.disconnectedPlayers.entries()).forEach(([playerId, data]) => {
          if (data.roomCode === roomCode) {
            this.disconnectedPlayers.delete(playerId);
            // Clean up username mappings
            const username = this.playerIdToUsername.get(playerId);
            if (username) {
              this.activeUsernames.delete(username);
              this.playerIdToUsername.delete(playerId);
            }
          }
        });
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
  
  // NEW Insult System V2 - Clean implementation
  sendInsultV2(roomCode: string, senderId: string, targetPlayerId: string | undefined): any {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    
    const room = roomData.gameState;

    // Check if insult is enabled
    if (!roomData.insultEnabled) return null;

    // Get sender and target
    const sender = room.players.find(p => p.id === senderId);
    if (!sender || !sender.team) return null;

    // Check team-specific cooldown (5 seconds)
    const now = Date.now();
    if (!roomData.teamInsultCooldown) {
      roomData.teamInsultCooldown = {};
    }
    
    const teamCooldown = roomData.teamInsultCooldown[sender.team];
    if (teamCooldown && (now - teamCooldown) < 5000) {
      return null; // Still on team cooldown
    }

    let target: Player | undefined;
    
    if (targetPlayerId) {
      // Use specified target
      target = room.players.find(p => p.id === targetPlayerId);
      console.log("[V2] Using specified target:", target?.username, "ID:", targetPlayerId);
    }
    
    if (!target) {
      // Select random opponent
      const opponents = room.players.filter(p => 
        p.team && p.team !== sender.team && !p.isBot
      );
      if (opponents.length > 0) {
        target = opponents[Math.floor(Math.random() * opponents.length)];
        console.log("[V2] Selected random target:", target.username);
      }
    }

    if (!target) return null;

    // Set team cooldown
    roomData.teamInsultCooldown[sender.team] = now;

    // Create insult - use V1 insult messages
    const insultTemplate = insultMessages[Math.floor(Math.random() * insultMessages.length)];
    const message = insultTemplate.replace("{target}", target.username);

    const insultData = {
      senderId: sender.id,
      senderUsername: sender.username,
      senderTeam: sender.team,
      targetId: target.id,
      targetUsername: target.username,
      targetTeam: target.team,
      message: message,
      timestamp: now
    };

    console.log("[V2] Sending insult:", insultData);
    return insultData;
  }
  
  toggleTaunt(roomCode: string, enabled: boolean): any {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    
    roomData.tauntEnabled = enabled;
    return { tauntEnabled: enabled };
  }
  
  toggleInsult(roomCode: string, enabled: boolean): any {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    
    roomData.insultEnabled = enabled;
    return { insultEnabled: enabled };
  }
  
  getRoomFeatures(roomCode: string, playerId?: string): { tauntEnabled: boolean; insultEnabled: boolean; teamTauntCooldown?: number; teamInsultCooldown?: number } | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    const now = Date.now();
    let tauntRemaining = 0;
    let insultRemaining = 0;
    
    // If playerId provided, get team-specific cooldowns
    if (playerId) {
      const player = room.players.find(p => p.id === playerId);
      if (player && player.team) {
        const teamTauntCooldown = roomData.teamTauntCooldown?.[player.team];
        const teamInsultCooldown = roomData.teamInsultCooldown?.[player.team];
        
        tauntRemaining = teamTauntCooldown && (teamTauntCooldown + 5000 - now) > 0
          ? Math.ceil((teamTauntCooldown + 5000 - now) / 1000)
          : 0;
        insultRemaining = teamInsultCooldown && (teamInsultCooldown + 5000 - now) > 0
          ? Math.ceil((teamInsultCooldown + 5000 - now) / 1000)
          : 0;
      }
    }
    
    return {
      tauntEnabled: roomData.tauntEnabled !== false, // Default to true
      insultEnabled: roomData.insultEnabled !== false, // Default to true
      teamTauntCooldown: tauntRemaining > 0 ? tauntRemaining : undefined,
      teamInsultCooldown: insultRemaining > 0 ? insultRemaining : undefined
    };
  }

  startIntroduction(roomCode: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Can only start introduction from lobby phase
    if (room.phase !== "lobby") return null;
    
    // Check if introduction has already occurred
    if (room.introductionPhase?.hasOccurred) return null;
    
    // Check teams are ready
    const darkTeam = room.players.filter(p => p.team === "dark");
    const lightTeam = room.players.filter(p => p.team === "light");
    
    if (darkTeam.length === 0 || lightTeam.length === 0) return null;
    if (!darkTeam.some(p => p.role === "spymaster")) return null;
    if (!lightTeam.some(p => p.role === "spymaster")) return null;
    
    // Move to introduction phase
    room.phase = "introduction";
    room.introductionPhase = {
      hasOccurred: false,
      introductionStarted: true,
      playersIntroduced: [],
      currentIntroducingPlayer: undefined
    };
    
    // Reset all player introduction states
    room.players.forEach(player => {
      player.introduced = false;
      player.introductionLikes = {};
      player.introductionDislikes = {};
    });
    
    return room;
  }

  selectPlayerForIntroduction(roomCode: string, playerId: string, targetPlayerId: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Must be in introduction phase
    if (room.phase !== "introduction") return null;
    if (!room.introductionPhase) return null;
    
    // Only red team (light) spymaster can control introductions
    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;
    if (player.team !== "light" || player.role !== "spymaster") return null;
    
    // Target must exist and not be introduced yet
    const target = room.players.find(p => p.id === targetPlayerId);
    if (!target) return null;
    if (target.introduced) return null;
    
    // Set current introducing player
    room.introductionPhase.currentIntroducingPlayer = targetPlayerId;
    
    return room;
  }

  finishPlayerIntroduction(roomCode: string, playerId: string, targetPlayerId: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Must be in introduction phase
    if (room.phase !== "introduction") return null;
    if (!room.introductionPhase) return null;
    
    // Only red team (light) spymaster can control introductions
    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;
    if (player.team !== "light" || player.role !== "spymaster") return null;
    
    // Must be introducing the specified player
    if (room.introductionPhase.currentIntroducingPlayer !== targetPlayerId) return null;
    
    // Mark player as introduced
    const target = room.players.find(p => p.id === targetPlayerId);
    if (!target) return null;
    target.introduced = true;
    
    // Add to introduced list
    if (!room.introductionPhase.playersIntroduced) {
      room.introductionPhase.playersIntroduced = [];
    }
    room.introductionPhase.playersIntroduced.push(targetPlayerId);
    
    // Clear current introducing player
    room.introductionPhase.currentIntroducingPlayer = undefined;
    
    // Check if all players have been introduced (if we want to auto-end)
    const allIntroduced = room.players.every(p => p.introduced);
    if (allIntroduced) {
      // Can optionally auto-transition to playing phase
      // For now, let the controller decide when to skip/finish
    }
    
    return room;
  }

  likeIntroduction(roomCode: string, playerId: string, targetPlayerId: string, isLike: boolean): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Must be in introduction phase
    if (room.phase !== "introduction") return null;
    if (!room.introductionPhase) return null;
    
    // Must be introducing someone
    if (!room.introductionPhase.currentIntroducingPlayer) return null;
    
    // Can only like/dislike the currently introducing player
    if (room.introductionPhase.currentIntroducingPlayer !== targetPlayerId) return null;
    
    // Cannot like/dislike yourself
    if (playerId === targetPlayerId) return null;
    
    const player = room.players.find(p => p.id === playerId);
    const target = room.players.find(p => p.id === targetPlayerId);
    if (!player || !target) return null;
    
    // Initialize like/dislike maps if not exists
    if (!target.introductionLikes) target.introductionLikes = {};
    if (!target.introductionDislikes) target.introductionDislikes = {};
    
    // Remove previous vote if exists
    delete target.introductionLikes[playerId];
    delete target.introductionDislikes[playerId];
    
    // Add new vote
    if (isLike) {
      target.introductionLikes[playerId] = player.team;
    } else {
      target.introductionDislikes[playerId] = player.team;
    }
    
    return room;
  }

  skipIntroduction(roomCode: string, playerId: string): GameState | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    const room = roomData.gameState;
    
    // Must be in introduction phase
    if (room.phase !== "introduction") return null;
    if (!room.introductionPhase) return null;
    
    // Only red team (light) spymaster can skip
    const player = room.players.find(p => p.id === playerId);
    if (!player) return null;
    if (player.team !== "light" || player.role !== "spymaster") return null;
    
    // Mark introduction as occurred and start the game
    room.introductionPhase.hasOccurred = true;
    
    // Transition to playing phase
    // Create game cards with excluded words
    room.cards = this.createGameCards(roomData.usedWords);
    
    // Track the newly used words
    if (!roomData.usedWords) {
      roomData.usedWords = new Set<string>();
    }
    room.cards.forEach(card => {
      roomData.usedWords!.add(card.word);
    });
    
    // Log used words count
    console.log(`Room ${roomCode} has used ${roomData.usedWords!.size} words total`);
    
    room.phase = "playing";
    room.darkCardsRemaining = room.cards.filter(c => c.type === "dark").length;
    room.lightCardsRemaining = room.cards.filter(c => c.type === "light").length;
    
    // Assign unique images to cards when game starts
    this.assignCardImages(roomData);
    room.currentTeam = room.darkCardsRemaining === 9 ? "dark" : "light";
    room.currentClue = null;
    room.winner = null;
    room.revealHistory = [];

    // Assign secret roles for Chaos Mode
    if (room.chaosMode) {
      this.assignSecretRoles(room);
    }
    
    // Reset guess tracking
    roomData.guessesRemaining = 0;
    roomData.maxGuesses = 0;
    
    // Start timer if timed mode is enabled
    if (room.timedMode) {
      room.currentTurnStartTime = Date.now();
    }
    
    return room;
  }
}

export const storage = new MemStorage();
