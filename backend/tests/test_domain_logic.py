import pytest
from domain.game import clamp_metrics, random_variance, apply_choice_impacts, is_game_over, compute_final_score, MIN_METRIC, MAX_METRIC, VARIANCE_MAGNITUDE

def test_clamp_metrics_all_over_max(app):
    value = MAX_METRIC + 1
    biosphere, society, economy = clamp_metrics(value, value, value)
    assert biosphere == MAX_METRIC
    assert society == MAX_METRIC
    assert economy == MAX_METRIC

def test_clamp_metrics_all_below_min(app):
    value = MIN_METRIC - 1
    biosphere, society, economy = clamp_metrics(value, value, value)
    assert biosphere == MIN_METRIC
    assert society == MIN_METRIC
    assert economy == MIN_METRIC

def test_clamp_metrics_all_valid_values(app):
    value = (MAX_METRIC - MIN_METRIC) / 2
    biosphere, society, economy = clamp_metrics(value, value, value)
    assert biosphere == value
    assert society == value
    assert economy == value

def test_clamp_metrics_mixed_values(app):
    above = MAX_METRIC * 2
    below = MIN_METRIC - MAX_METRIC
    biosphere, society, economy = clamp_metrics(above, below, above)
    assert biosphere == MAX_METRIC
    assert society == MIN_METRIC
    assert economy == MAX_METRIC   

def test_clamp_metrics_at_boundaries(app):
    biosphere, society, economy = clamp_metrics(MAX_METRIC, MIN_METRIC, MIN_METRIC)
    assert biosphere == MAX_METRIC
    assert society == MIN_METRIC
    assert economy == MIN_METRIC   

def test_random_variance_range():
    delta = 10
    magnitude = VARIANCE_MAGNITUDE

    result = random_variance(delta, magnitude)

    assert delta - magnitude <= result <= delta + magnitude

def test_random_variance_range_multiple_runs():
    delta = 10
    magnitude = VARIANCE_MAGNITUDE

    for _ in range(100):
        result = random_variance(delta, magnitude)
        assert delta - magnitude <= result <= delta + magnitude

def test_apply_choice_impacts_choice_a(app):
    bio, soc, econ = 30, 50, 70
    a_bio, a_soc, a_econ = 5, 10, -10
    b_bio, b_soc, b_econ = 5, 0, 5
    choice = "a"

    new_bio, new_soc, new_econ = apply_choice_impacts(
        bio, soc, econ, choice,
        a_bio, a_soc, a_econ,
        b_bio, b_soc, b_econ
    )

    bio_low = bio + a_bio - VARIANCE_MAGNITUDE
    bio_high = bio + a_bio + VARIANCE_MAGNITUDE
    soc_low = soc + a_soc - VARIANCE_MAGNITUDE
    soc_high = soc + a_soc + VARIANCE_MAGNITUDE
    econ_low = econ + a_econ - VARIANCE_MAGNITUDE
    econ_high = econ + a_econ + VARIANCE_MAGNITUDE

    assert new_bio >= bio_low and new_bio <= bio_high
    assert new_soc >= soc_low and new_soc <= soc_high
    assert new_econ >= econ_low and new_econ <= econ_high

def test_apply_choice_impacts_choice_b(app):
    bio, soc, econ = 30, 50, 70
    a_bio, a_soc, a_econ = 5, 10, -10
    b_bio, b_soc, b_econ = 5, 0, 5
    choice = "b"

    new_bio, new_soc, new_econ = apply_choice_impacts(
        bio, soc, econ, choice,
        a_bio, a_soc, a_econ,
        b_bio, b_soc, b_econ
    )

    bio_low = bio + b_bio - VARIANCE_MAGNITUDE
    bio_high = bio + b_bio + VARIANCE_MAGNITUDE
    soc_low = soc + b_soc - VARIANCE_MAGNITUDE
    soc_high = soc + b_soc + VARIANCE_MAGNITUDE
    econ_low = econ + b_econ - VARIANCE_MAGNITUDE
    econ_high = econ + b_econ + VARIANCE_MAGNITUDE

    assert new_bio >= bio_low and new_bio <= bio_high
    assert new_soc >= soc_low and new_soc <= soc_high
    assert new_econ >= econ_low and new_econ <= econ_high

def test_is_game_over_all_positive():
    assert is_game_over(10, 20, 30) is False


def test_is_game_over_biosphere_zero():
    assert is_game_over(MIN_METRIC, 20, 30) is True


def test_is_game_over_society_zero():
    assert is_game_over(10, MIN_METRIC, 30) is True


def test_is_game_over_economy_zero():
    assert is_game_over(10, 20, MIN_METRIC) is True


def test_is_game_over_negative_value():
    assert is_game_over(-5, 20, 30) is True


def test_is_game_over_multiple_failures():
    assert is_game_over(0, 10, 0) is True

def test_compute_final_score_basic():
    result = compute_final_score(10, 20, 30, 2)

    assert result == 10 + 20 + 30 + 10


def test_compute_final_score_zero_rounds():
    result = compute_final_score(10, 20, 30, 0)

    assert result == 10 + 20 + 30


def test_compute_final_score_large_rounds():
    result = compute_final_score(10, 20, 30, 25)

    assert result == 10 + 20 + 30 + 125


def test_compute_final_score_zero_values():
    result = compute_final_score(0, 20, 0, 2)

    assert result == 20 + 10