import { z } from "zod";

export type Team = "dark" | "light" | null;
export type Role = "spymaster" | "guesser";
export type CardType = "dark" | "light" | "neutral" | "assassin";
export type GamePhase = "lobby" | "introduction" | "playing" | "ended";
export type SecretRole = "prophet" | "double_agent" | null;

export interface Player {
  id: string;
  username: string;
  team: Team;
  role: Role;
  isRoomOwner: boolean;
  isBot: boolean;
  secretRole?: SecretRole; // Secret role in Chaos Mode
  knownCards?: number[]; // Card IDs known to prophet
  lastTauntAt?: number; // Timestamp of last taunt for cooldown
  introduced?: boolean; // Whether player has been introduced
  introductionLikes?: { [playerId: string]: Team }; // Who liked during introduction
  introductionDislikes?: { [playerId: string]: Team }; // Who disliked during introduction
  introductionBoos?: { [playerId: string]: Team }; // Who booed during introduction
  introductionApplause?: { [playerId: string]: Team }; // Who applauded during introduction
  kickChatLikes?: number; // Kick chat likes count for this player's introduction
  kickChatDislikes?: number; // Kick chat dislikes count for this player's introduction
}

export interface Card {
  id: number;
  word: string;
  type: CardType;
  revealed: boolean;
}

export interface Clue {
  word: string;
  count: number;
  team: Team;
}

export interface RevealHistoryEntry {
  cardId: number;
  word: string;
  type: CardType;
  team: Team;
  timestamp: number;
}

export interface GameState {
  roomCode: string;
  phase: GamePhase;
  players: Player[];
  cards: Card[];
  currentTeam: Team;
  darkCardsRemaining: number;
  lightCardsRemaining: number;
  currentClue: Clue | null;
  winner: Team | null;
  revealHistory: RevealHistoryEntry[];
  darkTeamName: string;
  lightTeamName: string;
  hasPassword: boolean;
  createdAt: number;
  timedMode: boolean;
  spymasterTime: number; // Time in seconds for Intelligence Chiefs
  guesserTime: number; // Time in seconds for Agents
  currentTurnStartTime: number | null; // Timestamp when current turn started
  chaosMode: boolean; // Whether Chaos Mode is enabled
  chaosModeType?: "prophet" | "double_agent" | null; // Type of chaos mode
  prophetVisibility?: "own_team" | "both_teams" | "all_cards"; // What cards prophets can see
  prophetWinMode?: "tie" | "guesser_wins"; // What happens when prophet is correctly identified
  prophetGuessUsed?: { dark: boolean; light: boolean }; // Track if prophet guess has been used during game
  prophetGuessResult?: { team: Team; success: boolean; targetId?: string }; // Result of prophet guess
  doubleAgentGuessUsed?: boolean; // Track if losing team used double agent guess
  doubleAgentGuessResult?: { success: boolean; targetId?: string }; // Result of double agent guess
  endGameGuessUsed?: boolean; // Track if end game guess has been used (for both modes)
  endGameGuessSequence?: { // Dramatic sequence for end game guess
    guessingTeam: Team;
    guessingTeamName?: string;
    targetPlayer: string;
    targetTeam: Team;
    targetTeamName?: string;
    guessType: "prophet" | "double_agent";
    actualRole?: "prophet" | "double_agent" | null;
    success?: boolean;
    finalWinner?: Team | null;
    finalWinnerName?: string;
  };
  introductionPhase?: { // Introduction phase state
    hasOccurred: boolean; // Whether introduction has happened this session
    currentIntroducingPlayer?: string; // ID of currently introducing player
    introductionStarted?: boolean; // Whether introduction phase has started
    playersIntroduced?: string[]; // IDs of players who have been introduced
  };
  consecutivePasses?: { // Track consecutive passes per team
    dark: number;
    light: number;
  };
  neutralCardsRevealedByTeam?: { // Track neutral cards revealed by each team
    dark: number;
    light: number;
  };
  tomatoThrowEnabled?: boolean; // Domates fırlatma özelliği etkin mi
}

export interface RoomListItem {
  roomCode: string;
  playerCount: number;
  hasPassword: boolean;
  phase: GamePhase;
  createdAt: number;
}

export const joinRoomSchema = z.object({
  roomCode: z.string().min(4).max(6),
  username: z.string().min(2).max(20),
  playerId: z.string().optional(),
  password: z.string().optional(),
});

export const createRoomSchema = z.object({
  username: z.string().min(2).max(20),
  password: z.string().optional(),
});

export const teamSelectSchema = z.object({
  team: z.enum(["dark", "light"]),
});

export const roleSelectSchema = z.object({
  role: z.enum(["spymaster", "guesser"]),
});

export const giveClueSchema = z.object({
  word: z.string().min(1).max(20),
  count: z.number().min(0).max(9),
});

export const revealCardSchema = z.object({
  cardId: z.number(),
});

export const addBotSchema = z.object({
  team: z.enum(["dark", "light"]),
  role: z.enum(["spymaster", "guesser"]),
});

export const updateTeamNameSchema = z.object({
  team: z.enum(["dark", "light"]),
  name: z.string().min(1).max(20),
});

export const updateTimerSettingsSchema = z.object({
  timedMode: z.boolean(),
  spymasterTime: z.number().min(30).max(600), // 30 seconds to 10 minutes
  guesserTime: z.number().min(30).max(600), // 30 seconds to 10 minutes
});

export const updateChaosModeSchema = z.object({
  chaosMode: z.boolean(),
});

export const updateChaosModeTypeSchema = z.object({
  type: z.enum(["prophet", "double_agent"]),
});

export const updateProphetWinModeSchema = z.object({
  mode: z.enum(["tie", "guesser_wins"]),
});

export const updateProphetVisibilitySchema = z.object({
  visibility: z.enum(["own_team", "both_teams", "all_cards"]),
});

export const updateTomatoThrowEnabledSchema = z.object({
  enabled: z.boolean(),
});

export const guessProphetSchema = z.object({
  targetPlayerId: z.string(),
});

export const guessDoubleAgentSchema = z.object({
  targetPlayerId: z.string(),
});

export const endGameGuessSchema = z.object({
  targetPlayerId: z.string(),
});

export const voteEndGameGuessSchema = z.object({
  targetPlayerId: z.string(),
});

export const triggerTauntSchema = z.object({
  playerId: z.string(),
});

export const throwTomatoSchema = z.object({
  targetTeam: z.enum(["dark", "light"]),
});

// Introduction schemas
export const selectPlayerForIntroductionSchema = z.object({
  playerId: z.string(),
});

export const finishIntroductionSchema = z.object({
  playerId: z.string(),
});

export const likeIntroductionSchema = z.object({
  targetPlayerId: z.string(),
  isLike: z.boolean(), // true for like, false for dislike
});

export const skipIntroductionSchema = z.object({});

export const booApplaudIntroductionSchema = z.object({
  targetPlayerId: z.string(),
  isBoo: z.boolean(), // true for boo, false for applaud
});

// Taunt broadcast payload
export interface TauntBroadcast {
  playerId: string;
  username: string;
  team: Team;
  videoSrc: string;
  position: { x: number; y: number }; // Normalized 0-1 position on board
  expiresAt: number; // When taunt should disappear
}

// Tomato throw broadcast payload
export interface TomatoThrowBroadcast {
  playerId: string;
  username: string;
  fromTeam: Team;
  targetTeam: Team;
  position: { x: number; y: number }; // Start position
  targetPosition: { x: number; y: number }; // End position
  timestamp: number;
}

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type TeamSelectInput = z.infer<typeof teamSelectSchema>;
export type RoleSelectInput = z.infer<typeof roleSelectSchema>;
export type GiveClueInput = z.infer<typeof giveClueSchema>;
export type RevealCardInput = z.infer<typeof revealCardSchema>;
export type AddBotInput = z.infer<typeof addBotSchema>;
export type UpdateTeamNameInput = z.infer<typeof updateTeamNameSchema>;
export type UpdateTimerSettingsInput = z.infer<typeof updateTimerSettingsSchema>;
export type UpdateChaosModeInput = z.infer<typeof updateChaosModeSchema>;
export type GuessProphetInput = z.infer<typeof guessProphetSchema>;
export type GuessDoubleAgentInput = z.infer<typeof guessDoubleAgentSchema>;
export type TriggerTauntInput = z.infer<typeof triggerTauntSchema>;
export type SelectPlayerForIntroductionInput = z.infer<typeof selectPlayerForIntroductionSchema>;
export type FinishIntroductionInput = z.infer<typeof finishIntroductionSchema>;
export type LikeIntroductionInput = z.infer<typeof likeIntroductionSchema>;
export type SkipIntroductionInput = z.infer<typeof skipIntroductionSchema>;
export type BooApplaudIntroductionInput = z.infer<typeof booApplaudIntroductionSchema>;

// Admin schemas
export const adminLoginSchema = z.object({
  password: z.string().min(1, "Şifre gereklidir").max(100, "Şifre çok uzun")
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

// Admin types
export interface AdminSession {
  tokenId: string; // Public identifier
  hashedSecret: string; // Hashed token secret
  createdAt: Date;
  expiresAt: Date;
  hardExpiresAt: Date; // Absolute 24h expiry
}

export interface AdminOverview {
  totalRooms: number;
  totalPlayers: number;
  activeGames: number;
  lobbyRooms: number;
}

export interface AdminRoomSummary {
  roomCode: string;
  hasPassword: boolean;
  playerCount: number;
  gamePhase: string;
  darkScore: number;
  lightScore: number;
  currentTurn?: string;
  cardsRevealed: number;
  createdAt: Date;
}

export interface AdminPlayerInfo {
  id: string;
  name: string;
  roomCode: string;
  team?: string;
  role?: string;
  isRoomOwner: boolean;
  isBot: boolean;
}

// Room History for admin tracking
export interface RoomHistory {
  historyId: string; // Unique ID for this history entry
  roomCode: string;
  createdAt: number; // Unix timestamp
  endedAt?: number; // Unix timestamp
  status: "active" | "ended" | "abandoned";
  maxPlayerCount: number;
  totalPlayers: string[]; // Array of all player IDs who joined
  playerNames: { [playerId: string]: string }; // Map of player IDs to names
  gamePhases: GamePhase[]; // All phases the game went through
  finalScores?: {
    dark: number;
    light: number;
    winner?: Team;
  };
  gameDuration?: number; // Duration in milliseconds
  hasPassword: boolean;
  darkTeamName?: string;
  lightTeamName?: string;
  chaosMode?: boolean;
  timedMode?: boolean;
}
