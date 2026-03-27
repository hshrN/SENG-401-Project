import pytest
import application.ai_service as ai_service
from application.ai_service import _clamp_impact, _strip_markdown_fences, generate_scenarios, AIServiceError, _call_openai, _call_gemini, _call_ai
from models import Scenario
import json

# clamp_impact tests

@pytest.mark.parametrize(
    "value, expected",
    [
        (5, 5),
        (12, 12),
        (-12, -12),
        (20, 12),
        (-20, -12),
        ("7", 7),
        (7.9, 7),
    ],
)
def test_clamp_impact(value, expected):
    assert _clamp_impact(value) == expected

# strip_markdown_fences tests

@pytest.mark.parametrize(
    "text, expected",
    [
        ("hello", "hello"),
        ("  hello  ", "hello"),
        ("```json\n[1,2,3]\n```", "[1,2,3]"),
        ("```\nhello\n```", "hello"),
        ("```text\nhello", "hello"),
    ],
)
def test_strip_markdown_fences(text, expected):
    assert _strip_markdown_fences(text) == expected

# generate_scenarios tests

def test_generate_scenarios_success(app, monkeypatch):

    fake_data = [
        {
            "scenario_text": "Save the forest?",
            "decision_a": "Protect it",
            "decision_b": "Sell it",
            "a_biosphere": 15,
            "a_society": 5,
            "a_economy": -3,
            "b_biosphere": -20,
            "b_society": 2,
            "b_economy": 10,
        }
    ]

    monkeypatch.setattr(ai_service, "_call_ai", lambda prompt: json.dumps(fake_data))

    result = generate_scenarios(1)

    saved = Scenario.query.all()

    assert len(result) == 1
    assert len(saved) == 1
    assert saved[0].scenario_text == "Save the forest?"
    assert saved[0].a_biosphere == 12
    assert saved[0].b_biosphere == -12

def test_generate_scenarios_strips_markdown_fences(app, monkeypatch):

    wrapped_json = """```json
[
  {
    "scenario_text": "Test",
    "decision_a": "A",
    "decision_b": "B",
    "a_biosphere": 1,
    "a_society": 2,
    "a_economy": 3,
    "b_biosphere": 4,
    "b_society": 5,
    "b_economy": 6
  }
]
```"""

    monkeypatch.setattr(ai_service, "_call_ai", lambda prompt: wrapped_json)

    result = generate_scenarios(1)

    assert len(result) == 1

def test_generate_scenarios_rejects_non_array_json(app, monkeypatch):

    monkeypatch.setattr(ai_service, "_call_ai", lambda prompt: '{"foo": "bar"}')

    with pytest.raises(AIServiceError) as exc:
        generate_scenarios(1)

    assert exc.value.status_code == 502
    assert str(exc.value) == "AI response is not a JSON array"


def test_generate_scenarios_invalid_json(app, monkeypatch):

    monkeypatch.setattr(ai_service, "_call_ai", lambda prompt: "not json")

    with pytest.raises(AIServiceError) as exc:
        generate_scenarios(1)

    assert exc.value.status_code == 502
    assert str(exc.value) == "Failed to parse AI response as JSON"

def test_generate_scenarios_skips_malformed_entries(app, monkeypatch):

    fake_data = [
        {
            "scenario_text": "Valid",
            "decision_a": "A",
            "decision_b": "B",
            "a_biosphere": 1,
            "a_society": 2,
            "a_economy": 3,
            "b_biosphere": 4,
            "b_society": 5,
            "b_economy": 6,
        },
        {
            "scenario_text": "Invalid missing fields"
        },
    ]

    monkeypatch.setattr(ai_service, "_call_ai", lambda prompt: json.dumps(fake_data))

    result = generate_scenarios(2)

    assert len(result) == 1
    assert Scenario.query.count() == 1

# API Calls tests

def test_call_openai_missing_key(monkeypatch):
    monkeypatch.delenv("OPENAI_KEY", raising=False)

    with pytest.raises(AIServiceError) as exc:
        _call_openai("test prompt")

    assert exc.value.status_code == 500
    assert str(exc.value) == "OPENAI_KEY not set in environment"

def test_call_gemini_missing_key(monkeypatch):
    monkeypatch.delenv("GEMINI_KEY", raising=False)

    with pytest.raises(AIServiceError) as exc:
        _call_gemini("test prompt")

    assert exc.value.status_code == 500
    assert str(exc.value) == "GEMINI_KEY not set in environment"


def test_call_ai_uses_primary_provider(monkeypatch):

    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setitem(ai_service.PROVIDERS, "openai", lambda prompt: "openai ok")
    monkeypatch.setitem(ai_service.PROVIDERS, "gemini", lambda prompt: "gemini ok")

    assert _call_ai("prompt") == "openai ok"

def test_call_ai_falls_back_when_primary_fails(monkeypatch):

    def fail(prompt):
        raise AIServiceError("primary failed", 502)

    def succeed(prompt):
        return "fallback ok"

    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setitem(ai_service.PROVIDERS, "openai", fail)
    monkeypatch.setitem(ai_service.PROVIDERS, "gemini", succeed)

    assert _call_ai("prompt") == "fallback ok"

def test_call_ai_raises_when_both_providers_fail(monkeypatch):

    def fail_openai(prompt):
        raise AIServiceError("openai failed", 502)

    def fail_gemini(prompt):
        raise AIServiceError("gemini failed", 502)

    monkeypatch.setenv("AI_PROVIDER", "openai")
    monkeypatch.setitem(ai_service.PROVIDERS, "openai", fail_openai)
    monkeypatch.setitem(ai_service.PROVIDERS, "gemini", fail_gemini)

    with pytest.raises(AIServiceError) as exc:
        _call_ai("prompt")

    assert "Both providers failed" in str(exc.value)