import { z } from "zod";

export type Team = "dark" | "light" | null;
export type Role = "spymaster" | "guesser";
export type CardType = "dark" | "light" | "neutral" | "assassin";
export type GamePhase = "lobby" | "playing" | "ended";

export interface Player {
  id: string;
  username: string;
  team: Team;
  role: Role;
  isRoomOwner: boolean;
  isBot: boolean;
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
}

export const joinRoomSchema = z.object({
  roomCode: z.string().min(4).max(6),
  username: z.string().min(2).max(20),
  playerId: z.string().optional(),
});

export const createRoomSchema = z.object({
  username: z.string().min(2).max(20),
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

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type TeamSelectInput = z.infer<typeof teamSelectSchema>;
export type RoleSelectInput = z.infer<typeof roleSelectSchema>;
export type GiveClueInput = z.infer<typeof giveClueSchema>;
export type RevealCardInput = z.infer<typeof revealCardSchema>;
