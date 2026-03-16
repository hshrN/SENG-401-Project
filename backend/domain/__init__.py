# Domain layer: core rules, entities, and domain logic.
# No framework or I/O — pure Python.

from domain.game import (
    clamp_metrics,
    apply_choice_impacts,
    is_game_over,
    compute_final_score,
)

__all__ = [
    "clamp_metrics",
    "apply_choice_impacts",
    "is_game_over",
    "compute_final_score",
]
