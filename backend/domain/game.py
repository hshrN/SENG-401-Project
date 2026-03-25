"""
Domain logic for the SDG game: metric rules, choice application, game-over conditions.
No Flask, SQLAlchemy, or I/O — pure domain rules.
"""

import random

MIN_METRIC = 0
MAX_METRIC = 100
VARIANCE_MAGNITUDE = 2  # each delta gets +/- this amount of random jitter


def clamp_metrics(biosphere: int, society: int, economy: int) -> tuple[int, int, int]:
    """Clamp all metrics to the allowed [MIN_METRIC, MAX_METRIC] range."""
    b = max(MIN_METRIC, min(MAX_METRIC, biosphere))
    s = max(MIN_METRIC, min(MAX_METRIC, society))
    e = max(MIN_METRIC, min(MAX_METRIC, economy))
    return (b, s, e)


def random_variance(delta: int, magnitude: int = VARIANCE_MAGNITUDE) -> int:
    """Add small random jitter to a metric delta so outcomes feel different each run."""
    return delta + random.randint(-magnitude, magnitude)


def apply_choice_impacts(
    biosphere: int,
    society: int,
    economy: int,
    choice: str,
    a_biosphere: int,
    a_society: int,
    a_economy: int,
    b_biosphere: int,
    b_society: int,
    b_economy: int,
) -> tuple[int, int, int]:
    """
    Apply the impact of a scenario choice ('a' or 'b') to current metrics.
    Each delta receives a small random variance so repeated playthroughs feel different.
    Returns new (biosphere, society, economy) after applying deltas and clamping.
    """
    if choice == "a":
        new_b = biosphere + random_variance(a_biosphere)
        new_s = society + random_variance(a_society)
        new_e = economy + random_variance(a_economy)
    else:
        new_b = biosphere + random_variance(b_biosphere)
        new_s = society + random_variance(b_society)
        new_e = economy + random_variance(b_economy)
    return clamp_metrics(new_b, new_s, new_e)


def is_game_over(biosphere: int, society: int, economy: int) -> bool:
    """True if any metric has dropped to or below zero (game-over condition)."""
    return any(m <= MIN_METRIC for m in (biosphere, society, economy))


def compute_final_score(biosphere: int, society: int, economy: int, round_count: int) -> int:
    """Compute final score when the game ends: sum of metrics plus bonus per round."""
    return biosphere + society + economy + (round_count * 5)
