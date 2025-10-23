import { z } from "zod";

export type Team = "dark" | "light" | null;
export type Role = "spymaster" | "guesser";
export type CardType = "dark" | "light" | "neutral" | "assassin";
export type GamePhase = "lobby" | "playing" | "ended";
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
  prophetGuessUsed?: { dark: boolean; light: boolean }; // Track if prophet guess has been used during game
  prophetGuessResult?: { team: Team; success: boolean; targetId?: string }; // Result of prophet guess
  doubleAgentGuessUsed?: boolean; // Track if losing team used double agent guess
  doubleAgentGuessResult?: { success: boolean; targetId?: string }; // Result of double agent guess
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

export const guessProphetSchema = z.object({
  targetPlayerId: z.string(),
});

export const guessDoubleAgentSchema = z.object({
  targetPlayerId: z.string(),
});

export const triggerTauntSchema = z.object({
  playerId: z.string(),
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
