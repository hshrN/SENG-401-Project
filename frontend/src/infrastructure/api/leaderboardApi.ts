import type { LeaderboardResponse, LeaderboardRequest } from "../../domain/types";
import { apiFetch } from "./client";

export async function leaderboardRequest(data: LeaderboardRequest): Promise<LeaderboardResponse> {
    const params = new URLSearchParams({
    limit: String(data.limit),
    offset: String(data.offset),
    period: data.period,
    user_id: String(data.user_id),
  });

  const response = await apiFetch(`/api/leaderboard?${params.toString()}`, {
    method: "GET",
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.message ?? "Could not load leaderboard ");
  }
  return response.json();
}