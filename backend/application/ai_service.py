"""
AI service: generate new game scenarios using OpenAI (primary) or Gemini (fallback).
Set AI_PROVIDER=openai or AI_PROVIDER=gemini in .env to choose.
If the primary provider fails, it will automatically fall back to the other.
"""

import os
import json
from models import Scenario, db


class AIServiceError(Exception):
    """Raised when AI scenario generation fails."""
    def __init__(self, message: str, status_code: int = 500):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


SCENARIO_PROMPT = """You are a game designer for a sustainability card game inspired by Reigns.
Generate {count} NEW unique scenario cards. Each scenario presents a real-world global challenge
related to SDG 17 (Partnerships for the Goals). The player must choose between two options
that each affect three metrics: Biosphere, Society, and Economy.

Rules for metric impacts:
- Each impact must be an integer between -12 and 12.
- Choices should involve trade-offs (not one obviously better than the other).
- Scenarios should feel distinct from typical ones about climate, trade, health, tech, and diplomacy.

Return ONLY a JSON array (no markdown, no explanation) with this exact structure:
[
  {{
    "scenario_text": "Description of the scenario (1-2 sentences).",
    "decision_a": "Short label for choice A",
    "decision_b": "Short label for choice B",
    "a_biosphere": 0,
    "a_society": 0,
    "a_economy": 0,
    "b_biosphere": 0,
    "b_society": 0,
    "b_economy": 0
  }}
]
"""

REQUIRED_FIELDS = [
    "scenario_text", "decision_a", "decision_b",
    "a_biosphere", "a_society", "a_economy",
    "b_biosphere", "b_society", "b_economy",
]


def _clamp_impact(value: int) -> int:
    """Ensure metric impact is within the allowed range."""
    return max(-12, min(12, int(value)))


def _strip_markdown_fences(text: str) -> str:
    """Remove markdown code fences from AI response if present."""
    text = text.strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1]  # remove first line
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
    return text


# ---------------------------------------------------------------------------
# Provider: OpenAI
# ---------------------------------------------------------------------------
def _call_openai(prompt: str) -> str:
    """Call OpenAI gpt-4o-mini and return the response text."""
    from openai import OpenAI

    api_key = os.getenv("OPENAI_KEY")
    if not api_key:
        raise AIServiceError("OPENAI_KEY not set in environment", 500)

    client = OpenAI(api_key=api_key)
    try:
        response = client.responses.create(
            model="gpt-4o-mini",
            input=prompt,
        )
        return response.output_text
    except Exception as e:
        raise AIServiceError(f"OpenAI API call failed: {e}", 502)


# ---------------------------------------------------------------------------
# Provider: Gemini
# ---------------------------------------------------------------------------
def _call_gemini(prompt: str) -> str:
    """Call Gemini and return the response text."""
    from google import genai

    api_key = os.getenv("GEMINI_KEY")
    if not api_key:
        raise AIServiceError("GEMINI_KEY not set in environment", 500)

    client = genai.Client(api_key=api_key)
    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        return response.text
    except Exception as e:
        raise AIServiceError(f"Gemini API call failed: {e}", 502)


# ---------------------------------------------------------------------------
# Provider dispatcher with fallback
# ---------------------------------------------------------------------------
PROVIDERS = {
    "openai": _call_openai,
    "gemini": _call_gemini,
}


def _call_ai(prompt: str) -> str:
    """
    Call the configured AI provider (AI_PROVIDER env var, default 'openai').
    If the primary provider fails, automatically fall back to the other one.
    """
    primary = os.getenv("AI_PROVIDER", "openai").lower()
    fallback = "gemini" if primary == "openai" else "openai"

    # Try primary
    try:
        print(f"[AI] Trying {primary}...")
        return PROVIDERS[primary](prompt)
    except AIServiceError as primary_err:
        print(f"[AI] {primary} failed: {primary_err.message}")

    # Try fallback
    try:
        print(f"[AI] Falling back to {fallback}...")
        return PROVIDERS[fallback](prompt)
    except AIServiceError as fallback_err:
        raise AIServiceError(
            f"Both providers failed. {primary}: {primary_err.message} | {fallback}: {fallback_err.message}",
            502,
        )


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------
def generate_scenarios(count: int = 5) -> list[dict]:
    """
    Call AI to generate `count` new scenarios, validate them,
    save to the database, and return the list of created scenario dicts.
    """
    prompt = SCENARIO_PROMPT.format(count=count)
    raw_text = _call_ai(prompt)
    raw_text = _strip_markdown_fences(raw_text)

    try:
        scenarios_data = json.loads(raw_text)
    except json.JSONDecodeError:
        raise AIServiceError("Failed to parse AI response as JSON", 502)

    if not isinstance(scenarios_data, list):
        raise AIServiceError("AI response is not a JSON array", 502)

    created = []
    for item in scenarios_data:
        # Validate required fields
        if not all(field in item for field in REQUIRED_FIELDS):
            continue  # skip malformed entries

        scenario = Scenario(
            scenario_text=str(item["scenario_text"]),
            decision_a=str(item["decision_a"]),
            decision_b=str(item["decision_b"]),
            a_biosphere=_clamp_impact(item["a_biosphere"]),
            a_society=_clamp_impact(item["a_society"]),
            a_economy=_clamp_impact(item["a_economy"]),
            b_biosphere=_clamp_impact(item["b_biosphere"]),
            b_society=_clamp_impact(item["b_society"]),
            b_economy=_clamp_impact(item["b_economy"]),
        )
        db.session.add(scenario)
        created.append({
            "scenario_text": scenario.scenario_text,
            "decision_a": scenario.decision_a,
            "decision_b": scenario.decision_b,
        })

    db.session.commit()
    return created
