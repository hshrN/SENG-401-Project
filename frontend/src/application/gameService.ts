/**
 * Application layer: game use cases (sessions, scenarios, rounds).
 * Orchestrates infrastructure (game API); called by presentation (pages) only.
 */

import type {
  SessionResponse,
  CardResponse,
  RoundResponse,
  ScenarioSettingsResponse,
} from "../domain/types";
import * as gameApi from "../infrastructure/api/gameApi";

export type {
  SessionResponse,
  CardResponse,
  RoundResponse,
  ScenarioSettingsResponse,
} from "../domain/types";

export async function createSession(
  username: string,
  targetQuestions: number
): Promise<SessionResponse> {
  return gameApi.createSession(username, targetQuestions);
}

export async function getScenarioSettings(): Promise<ScenarioSettingsResponse> {
  return gameApi.getScenarioSettings();
}

export async function getNextCard(sessionId: number): Promise<CardResponse> {
  return gameApi.getNextCard(sessionId);
}

export async function submitRound(
  sessionId: number,
  scenarioId: number,
  choiceMade: "a" | "b",
  targetQuestions: number
): Promise<RoundResponse> {
  return gameApi.submitRound(sessionId, scenarioId, choiceMade, targetQuestions);
}

export async function generateScenarios(count: number = 5): Promise<{ created: number; scenarios: unknown[] }> {
  return gameApi.generateScenarios(count);
}
