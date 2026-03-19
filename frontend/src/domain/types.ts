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
  // Predicted metrics for hover previews
  a_biosphere_after: number;
  a_society_after: number;
  a_economy_after: number;
  b_biosphere_after: number;
  b_society_after: number;
  b_economy_after: number;
  game_over?: boolean;
};

export type RoundResponse = {
  biosphere: number;
  society: number;
  economy: number;
  game_over: boolean;
  final_score?: number;
};

export type LeaderboardResponse = {
  metadata: {
    total_entries: number;
    limit: number;
    offset: number;
  };
  entries: {
    rank: number;
    username: string;
    score: number;
    achieved_at: string;
    is_user_score: boolean;
  }[];
};

export type LeaderboardRequest = {
  limit: number;
  offset: number;
  period: string;
  user_id: number
}

export type leaderboardEntry = {
  rank: number;
  username: string;
  score: number;
  achieved_at: string;
  is_user_score: boolean;
}