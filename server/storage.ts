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
  globalTauntCooldown?: number; // Global taunt cooldown timestamp
  globalInsultCooldown?: number; // Global insult cooldown timestamp
}

export interface IStorage {
  checkUsernameAvailable(username: string): boolean;
  createRoom(ownerUsername: string, password?: string): { roomCode: string; playerId: string; gameState: GameState };
  getRoom(roomCode: string): GameState | undefined;
  joinRoom(roomCode: string, username: string, password?: string, reconnectPlayerId?: string): { playerId: string; gameState: GameState; isReconnect: boolean } | null;
  listRooms(): RoomListItem[];
  addBot(roomCode: string, team: Team, role: "spymaster" | "guesser"): GameState | null;
  updatePlayerTeam(roomCode: string, playerId: string, team: Team): GameState | null;
  updatePlayerRole(roomCode: string, playerId: string, role: "spymaster" | "guesser"): GameState | null;
  updateTeamName(roomCode: string, team: Team, name: string): GameState | null;
  updateTimerSettings(roomCode: string, timedMode: boolean, spymasterTime: number, guesserTime: number): GameState | null;
  updateChaosMode(roomCode: string, chaosMode: boolean): GameState | null;
  updatePassword(roomCode: string, password: string | null): GameState | null;
  guessProphet(roomCode: string, playerId: string, targetPlayerId: string): GameState | null;
  guessDoubleAgent(roomCode: string, playerId: string, targetPlayerId: string): GameState | null;
  startGame(roomCode: string): GameState | null;
  giveClue(roomCode: string, playerId: string, word: string, count: number): GameState | null;
  revealCard(roomCode: string, playerId: string, cardId: number): GameState | null;
  restartGame(roomCode: string, playerId: string): GameState | null;
  returnToLobby(roomCode: string): GameState | null;
  endTurn(roomCode: string, playerId: string): GameState | null;
  removePlayer(roomCode: string, playerId: string): void;
  cleanupEmptyRooms(): void;
  getCardImages(roomCode: string): Record<number, string> | null;
  triggerTaunt(roomCode: string, playerId: string): any;
  sendInsult(roomCode: string, playerId: string, targetId?: string): any;
  toggleTaunt(roomCode: string, enabled: boolean): any;
  toggleInsult(roomCode: string, enabled: boolean): any;
  getRoomFeatures(roomCode: string): { tauntEnabled: boolean; insultEnabled: boolean; globalTauntCooldown?: number; globalInsultCooldown?: number } | null;
}

// Insult templates
const insultMessages = [
  "{target} acayip hayvanlara benziyirsen!",
  "{target} sütünü iç de uyu!",
  "{target} fuck you!",
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
  "{target} haha ezik XD"
];

export class MemStorage implements IStorage {
  private rooms: Map<string, RoomData>;
  private playerToRoom: Map<string, string>;
  private lastInsultTime: Map<string, number>; // roomCode -> timestamp
  private playerInsultCooldown: Map<string, number>; // playerId -> timestamp
  private insultCooldowns: Map<string, number>; // For V2 system
  private tauntCooldowns: Map<string, number>; // For taunt system
  private globalUsernames: Set<string>; // Track all usernames globally

  constructor() {
    this.rooms = new Map();
    this.playerToRoom = new Map();
    this.lastInsultTime = new Map();
    this.playerInsultCooldown = new Map();
    this.insultCooldowns = new Map(); // Initialize V2 cooldowns
    this.tauntCooldowns = new Map(); // Initialize taunt cooldowns
    this.globalUsernames = new Set(); // Initialize global username tracking
    
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

  checkUsernameAvailable(username: string): boolean {
    return !this.globalUsernames.has(username.toLowerCase());
  }

  private assignCardImages(roomData: RoomData): void {
    // Image pools for each card type - using ALL available images from both folders
    const imagePools = {
      dark: [
        '/acilmiskartgorsel/ali mavi.png',
        '/acilmiskartgorsel/blush mavi.png',
        '/acilmiskartgorsel/hasan mavi.png',
        '/acilmiskartgorsel/kasım mavi.png',
        '/acilmiskartgorsel/mami mavi.png',
        '/acilmiskartgorsel/noeldayı mavi.png',
        '/acilmiskartgorsel/nuriben mavi.png',
        '/acilmiskartgorsel/çağrı mavi.png',
        '/acilmiskartgorsel/triel2 mavi.png'  // 9 total blue/dark cards!
      ],
      light: [
        '/acilmiskartgorsel/alik kırmızı.png',
        '/acilmiskartgorsel/begüm kırmızı.png',
        '/acilmiskartgorsel/dobby kırmızı.png',
        '/acilmiskartgorsel/karaman kırmızı.png',
        '/acilmiskartgorsel/neswin kırmızı.png',
        '/acilmiskartgorsel/noeldayı kırmızı.png',
        '/acilmiskartgorsel/perver kırmızı.png',
        '/acilmiskartgorsel/triel kırmızı.png',
        '/acilmiskartgorsel/şinasi kırmızı.png'  // 9 total red/light cards!
      ],
      neutral: [
        '/acilmiskartgorsel/blush beyaz.png',
        '/acilmiskartgorsel/hasan beyaz.png',
        '/acilmiskartgorsel/mami beyaz.png',
        '/acilmiskartgorsel/perver beyaz.png',
        '/acilmiskartgorsel/çağrı normal beyaz.png',
        '/acilmiskartgorsel/çağrı sigara beyaz.png',
        '/acilmiskartgorsel/şinasi su beyaz.png'  // 7 total neutral cards!
      ],
      assassin: ['/ajan siyah.png']
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
    // Check if username is available
    if (!this.checkUsernameAvailable(ownerUsername)) {
      throw new Error("Bu kullanıcı adı zaten kullanımda!");
    }
    
    const roomCode = this.generateRoomCode();
    const playerId = randomUUID();
    
    // Add username to global set
    this.globalUsernames.add(ownerUsername.toLowerCase());
    
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
      insultEnabled: true // Enable insult by default
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

    // Check if reconnecting by username in same room
    if (room.players.some(p => p.username === username)) {
      const existingPlayer = room.players.find(p => p.username === username)!;
      this.playerToRoom.set(existingPlayer.id, roomCode);
      return { playerId: existingPlayer.id, gameState: room, isReconnect: true };
    }

    // For new players, check if username is available globally
    if (!this.checkUsernameAvailable(username)) {
      return null; // Username already taken globally
    }

    // Check password
    if (roomData.password && roomData.password !== password) {
      return null;
    }

    // Add username to global set
    this.globalUsernames.add(username.toLowerCase());

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

    // Only assign roles to human players (not bots) who are guessers
    const darkGuessers = room.players.filter(p => !p.isBot && p.team === "dark" && p.role === "guesser");
    const lightGuessers = room.players.filter(p => !p.isBot && p.team === "light" && p.role === "guesser");
    
    // Assign Prophet to one player from each team (if there are guessers)
    if (darkGuessers.length > 0) {
      const darkProphet = darkGuessers[Math.floor(Math.random() * darkGuessers.length)];
      darkProphet.secretRole = "prophet";
      // Give prophet 3 random cards from their team
      const darkCards = room.cards.filter(c => c.type === "dark").map(c => c.id);
      const shuffled = darkCards.sort(() => Math.random() - 0.5);
      darkProphet.knownCards = shuffled.slice(0, Math.min(3, shuffled.length));
    }
    
    if (lightGuessers.length > 0) {
      const lightProphet = lightGuessers[Math.floor(Math.random() * lightGuessers.length)];
      lightProphet.secretRole = "prophet";
      // Give prophet 3 random cards from their team
      const lightCards = room.cards.filter(c => c.type === "light").map(c => c.id);
      const shuffled = lightCards.sort(() => Math.random() - 0.5);
      lightProphet.knownCards = shuffled.slice(0, Math.min(3, shuffled.length));
    }
    
    // Assign Double Agent to one remaining player from each team
    const remainingDarkGuessers = darkGuessers.filter(p => p.secretRole !== "prophet");
    const remainingLightGuessers = lightGuessers.filter(p => p.secretRole !== "prophet");
    
    // Assign Double Agent to one player from Dark team
    if (remainingDarkGuessers.length > 0) {
      const darkDoubleAgent = remainingDarkGuessers[Math.floor(Math.random() * remainingDarkGuessers.length)];
      darkDoubleAgent.secretRole = "double_agent";
    }
    
    // Assign Double Agent to one player from Light team  
    if (remainingLightGuessers.length > 0) {
      const lightDoubleAgent = remainingLightGuessers[Math.floor(Math.random() * remainingLightGuessers.length)];
      lightDoubleAgent.secretRole = "double_agent";
    }
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
    
    // Reassign secret roles for Chaos Mode on restart
    if (room.chaosMode) {
      this.assignSecretRoles(room);
    }

    // Reset prophet guess tracking for new game
    room.prophetGuessUsed = undefined;
    room.prophetGuessResult = undefined;
    room.doubleAgentGuessUsed = undefined;
    room.doubleAgentGuessResult = undefined;

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
    
    // Check GLOBAL cooldown (5 seconds)
    const now = Date.now();
    if (roomData.globalTauntCooldown && (now - roomData.globalTauntCooldown) < 5000) {
      return null; // Still on global cooldown
    }
    
    // Update global taunt cooldown
    roomData.globalTauntCooldown = now;
    
    // Generate random position on board (normalized 0-1)
    const position = {
      x: Math.random(),
      y: Math.random()
    };
    
    // Determine video source based on team
    const videoSrc = player.team === "dark" ? "/mavi taunt yeni.mp4" : "/kırmızı taunt.mp4";
    
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

    // Find the player to get their username
    const player = room.players.find(p => p.id === playerId);
    if (player) {
      // Remove username from global tracking (bots don't have global usernames)
      if (!player.isBot) {
        this.globalUsernames.delete(player.username.toLowerCase());
      }
    }

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
        // Also remove all player usernames from global tracking when room is deleted
        roomData.gameState.players.forEach(player => {
          if (!player.isBot) {
            this.globalUsernames.delete(player.username.toLowerCase());
          }
        });
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
  
  // NEW Insult System V2 - Clean implementation
  sendInsultV2(roomCode: string, senderId: string, targetPlayerId: string | undefined): any {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    
    const room = roomData.gameState;

    // Check if insult is enabled
    if (!roomData.insultEnabled) return null;

    // Check GLOBAL cooldown (5 seconds)
    const now = Date.now();
    if (roomData.globalInsultCooldown && (now - roomData.globalInsultCooldown) < 5000) {
      return null; // Still on global cooldown
    }

    // Get sender and target
    const sender = room.players.find(p => p.id === senderId);
    if (!sender || !sender.team) return null;

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

    // Set global cooldown
    roomData.globalInsultCooldown = now;

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
  
  getRoomFeatures(roomCode: string): { tauntEnabled: boolean; insultEnabled: boolean; globalTauntCooldown?: number; globalInsultCooldown?: number } | null {
    const roomData = this.rooms.get(roomCode);
    if (!roomData) return null;
    
    const now = Date.now();
    const tauntRemaining = roomData.globalTauntCooldown && (roomData.globalTauntCooldown + 5000 - now) > 0 
      ? Math.ceil((roomData.globalTauntCooldown + 5000 - now) / 1000) 
      : 0;
    const insultRemaining = roomData.globalInsultCooldown && (roomData.globalInsultCooldown + 5000 - now) > 0
      ? Math.ceil((roomData.globalInsultCooldown + 5000 - now) / 1000)
      : 0;
    
    return {
      tauntEnabled: roomData.tauntEnabled !== false, // Default to true
      insultEnabled: roomData.insultEnabled !== false, // Default to true
      globalTauntCooldown: tauntRemaining > 0 ? tauntRemaining : undefined,
      globalInsultCooldown: insultRemaining > 0 ? insultRemaining : undefined
    };
  }
}

export const storage = new MemStorage();
