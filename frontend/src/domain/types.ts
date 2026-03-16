/**
 * Domain types: shared concepts and DTOs used across the app.
 * No framework or I/O — pure type definitions.
 */

export type User = {
  id: number;
  username: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type SignupRequest = {
  username: string;
  password: string;
  confirmPassword: string;
};

export type AuthSuccessResponse = {
  user: User;
};

export type SessionResponse = {
  session_id: number;
  biosphere: number;
  society: number;
  economy: number;
};

export type CardResponse = {
  scenario_id: number;
  scenario_text: string;
  decision_a: string;
  decision_b: string;
  game_over?: boolean;
};

export type RoundResponse = {
  biosphere: number;
  society: number;
  economy: number;
  game_over: boolean;
  final_score?: number;
};
