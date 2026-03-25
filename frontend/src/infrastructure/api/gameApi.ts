/**
 * Infrastructure: game API client (raw HTTP calls to backend).
 * Application layer uses this; UI must not call this directly.
 */

import type {
  SessionResponse,
  CardResponse,
  RoundResponse,
  ScenarioSettingsResponse,
} from "../../domain/types";
import { apiFetch } from "./client";

type ScenarioCompletionError = Error & {
  game_result?: string;
  final_score?: number;
  completed_questions?: number;
  target_questions?: number;
};

export async function createSession(
  username: string,
  targetQuestions: number
): Promise<SessionResponse> {
  const response = await apiFetch("/api/sessions", {
    method: "POST",
    body: JSON.stringify({ username, target_questions: targetQuestions }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? "Failed to create session");
  }
  return response.json();
}

export async function getScenarioSettings(): Promise<ScenarioSettingsResponse> {
  const response = await apiFetch("/api/scenarios/settings");
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error ?? "Failed to load scenario settings");
  }
  return response.json();
}

export async function getNextCard(sessionId: number): Promise<CardResponse> {
  const response = await apiFetch(`/api/scenarios/next?session_id=${sessionId}`);
  if (!response.ok) {
    const err = await response.json();
    const error: ScenarioCompletionError = new Error(
      err.error ?? "No more scenarios"
    );
    error.game_result = err.game_result;
    error.final_score = err.final_score;
    error.completed_questions = err.completed_questions;
    error.target_questions = err.target_questions;
    throw error;
  }
  return response.json();
}

export async function submitRound(
  sessionId: number,
  scenarioId: number,
  choiceMade: "a" | "b",
  targetQuestions: number
): Promise<RoundResponse> {
  const response = await apiFetch("/api/rounds", {
    method: "POST",
    body: JSON.stringify({
      session_id: sessionId,
      scenario_id: scenarioId,
      choice_made: choiceMade,
      target_questions: targetQuestions,
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
