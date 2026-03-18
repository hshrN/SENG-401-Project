import type { LeaderboardRequest, LeaderboardResponse } from "../domain/types";
import { leaderboardRequest } from "../infrastructure/api/leaderboardApi";

export type { LeaderboardRequest, LeaderboardResponse, leaderboardEntry } from "../domain/types";

export async function getLeaderboard(data: LeaderboardRequest): Promise<LeaderboardResponse> {
  return leaderboardRequest(data);
}

