const API_BASE = "http://127.0.0.1:5001";

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

export async function createSession(username: string): Promise<SessionResponse> {
  const response = await fetch(`${API_BASE}/api/sessions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return response.json();
}

export async function getNextCard(session_id: number): Promise<CardResponse> {
  const response = await fetch(`${API_BASE}/api/scenarios/next?session_id=${session_id}`);
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "No more scenarios");
  }
  return response.json();
}

export async function submitRound(
  session_id: number,
  scenario_id: number,
  choice_made: "a" | "b"
): Promise<RoundResponse> {
  const response = await fetch(`${API_BASE}/api/rounds`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ session_id, scenario_id, choice_made }),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }
  return response.json();
}
