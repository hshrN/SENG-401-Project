/**
 * Infrastructure: game API client (raw HTTP calls to backend).
 * Application layer uses this; UI must not call this directly.
 */

import type { SessionResponse, CardResponse, RoundResponse } from "../../domain/types";
import { apiFetch } from "./client";

export async function createSession(username: string): Promise<SessionResponse> {
  const response = await apiFetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ username }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? "Failed to create session");
  }
  return response.json();
}

export async function getNextCard(sessionId: number): Promise<CardResponse> {
  const response = await apiFetch(`/api/scenarios/next?session_id=${sessionId}`);
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? "No more scenarios");
  }
  return response.json();
}

export async function submitRound(
  sessionId: number,
  scenarioId: number,
  choiceMade: "a" | "b"
): Promise<RoundResponse> {
  const response = await apiFetch("/api/rounds", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      scenario_id: scenarioId,
      choice_made: choiceMade,
    }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? "Failed to submit round");
  }
  return response.json();
}

export async function generateScenarios(count: number = 5): Promise<{ created: number; scenarios: unknown[] }> {
  const response = await apiFetch("/api/scenarios/generate", {
    method: "POST",
    body: JSON.stringify({ count }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? "Failed to generate scenarios");
  }
  return response.json();
}
