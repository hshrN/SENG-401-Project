import pytest
from domain.game import clamp_metrics, random_variance, apply_choice_impacts, is_game_over, compute_final_score

def test_clamp_metrics_all_over_100(app):
    biosphere, society, economy = clamp_metrics(101, 101, 101)
    assert biosphere == 100
    assert society == 100
    assert economy == 100