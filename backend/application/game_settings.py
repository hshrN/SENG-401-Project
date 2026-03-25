"""
Shared game-setting helpers for question-limit bounds.
"""

MIN_QUESTION_LIMIT = 15
DEFAULT_QUESTION_LIMIT = 20


def build_question_limit_settings(total_scenarios: int) -> dict[str, int]:
    """Return min/default/max question limits for the current scenario pool."""
    total = max(0, int(total_scenarios))
    if total == 0:
        return {
            "min_questions": 0,
            "default_questions": 0,
            "max_questions": 0,
        }

    min_questions = min(MIN_QUESTION_LIMIT, total)
    default_questions = max(min_questions, min(DEFAULT_QUESTION_LIMIT, total))

    return {
        "min_questions": min_questions,
        "default_questions": default_questions,
        "max_questions": total,
    }


def normalize_target_questions(target_questions: int | None, total_scenarios: int) -> int:
    """Validate and normalize a requested question limit."""
    settings = build_question_limit_settings(total_scenarios)
    if settings["max_questions"] == 0:
        raise ValueError("No scenarios are available yet.")

    if target_questions is None:
        return settings["default_questions"]

    try:
        normalized = int(target_questions)
    except (TypeError, ValueError):
        raise ValueError("target_questions must be an integer.")

    if normalized < settings["min_questions"] or normalized > settings["max_questions"]:
        raise ValueError(
            f"target_questions must be between {settings['min_questions']} and {settings['max_questions']}."
        )

    return normalized
