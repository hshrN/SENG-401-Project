"""
Domain logic for the SDG game: metric rules, choice application, game-over conditions.
No Flask, SQLAlchemy, or I/O — pure domain rules.
"""

import random

MIN_METRIC = 0
MAX_METRIC = 100
INITIAL_METRIC = 50
VARIANCE_MAGNITUDE = 2  # each delta gets +/- this amount of random jitter
PRESSURE_WINDOW = 4


def clamp_metrics(biosphere: int, society: int, economy: int) -> tuple[int, int, int]:
    """Clamp all metrics to the allowed [MIN_METRIC, MAX_METRIC] range."""
    b = max(MIN_METRIC, min(MAX_METRIC, biosphere))
    s = max(MIN_METRIC, min(MAX_METRIC, society))
    e = max(MIN_METRIC, min(MAX_METRIC, economy))
    return (b, s, e)


def random_variance(delta: int, magnitude: int = VARIANCE_MAGNITUDE) -> int:
    """Add small random jitter to a metric delta so outcomes feel different each run."""
    return delta + random.randint(-magnitude, magnitude)


def compute_lingering_pressure(recent_deltas: list[int]) -> int:
    """
    Convert the last few realized deltas for one metric into a pressure penalty.
    Repeated neglect causes future choices to underperform until the player stabilizes it.
    """
    if not recent_deltas:
        return 0

    negative_total = sum(delta for delta in recent_deltas if delta < 0)
    pressure = 0

    if negative_total <= -6:
        pressure += 1
    if negative_total <= -12:
        pressure += 1

    trailing_losses = 0
    for delta in reversed(recent_deltas):
        if delta < 0:
            trailing_losses += 1
        else:
            break

    if trailing_losses >= 2:
        pressure += 1

    return min(3, pressure)


def apply_lingering_pressure(delta: int, pressure: int) -> int:
    """
    Long-term strain drags on every future outcome for that metric.
    Neglected systems keep bleeding, and even attempted recoveries are partially absorbed.
    """
    if pressure <= 0:
        return delta
    return delta - pressure


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
    lingering_pressure: tuple[int, int, int] = (0, 0, 0),
) -> tuple[int, int, int]:
    """
    Apply the impact of a scenario choice ('a' or 'b') to current metrics.
    Each delta receives a small random variance so repeated playthroughs feel different.
    Lingering pressure makes repeated neglect matter for several turns.
    Returns new (biosphere, society, economy) after applying deltas and clamping.
    """
    if choice == "a":
        delta_b = random_variance(a_biosphere)
        delta_s = random_variance(a_society)
        delta_e = random_variance(a_economy)
    else:
        delta_b = random_variance(b_biosphere)
        delta_s = random_variance(b_society)
        delta_e = random_variance(b_economy)

    new_b = biosphere + apply_lingering_pressure(delta_b, lingering_pressure[0])
    new_s = society + apply_lingering_pressure(delta_s, lingering_pressure[1])
    new_e = economy + apply_lingering_pressure(delta_e, lingering_pressure[2])
    return clamp_metrics(new_b, new_s, new_e)


def is_game_over(biosphere: int, society: int, economy: int) -> bool:
    """True if any metric has dropped to or below zero (game-over condition)."""
    return any(m <= MIN_METRIC for m in (biosphere, society, economy))


def compute_final_score(biosphere: int, society: int, economy: int, round_count: int) -> int:
    """Compute final score when the game ends: sum of metrics plus bonus per round."""
    return biosphere + society + economy + (round_count * 5)
