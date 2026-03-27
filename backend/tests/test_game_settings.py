import pytest
from application.game_settings import build_question_limit_settings, normalize_target_questions, MIN_QUESTION_LIMIT, DEFAULT_QUESTION_LIMIT

# build_question_limit_settings tests

def test_build_question_limit_zero():
    result = build_question_limit_settings(0)

    assert result == {
        "min_questions": 0,
        "default_questions": 0,
        "max_questions": 0,
    }

def test_build_question_limit_negative():
    result = build_question_limit_settings(-10)

    assert result == {
        "min_questions": 0,
        "default_questions": 0,
        "max_questions": 0,
    }

def test_build_question_below_min():
    total = (MIN_QUESTION_LIMIT - 0) // 2
    result = build_question_limit_settings(total)

    assert result == {
        "min_questions": total,
        "default_questions": total,
        "max_questions": total,
    }

def test_build_question_between_min_and_default():
    total = (DEFAULT_QUESTION_LIMIT + MIN_QUESTION_LIMIT) // 2
    result = build_question_limit_settings(total)

    assert result == {
        "min_questions": MIN_QUESTION_LIMIT,
        "default_questions": total,
        "max_questions": total,
    }

def test_build_question_above_default():
    total = DEFAULT_QUESTION_LIMIT + 20
    result = build_question_limit_settings(total)

    assert result == {
        "min_questions": MIN_QUESTION_LIMIT,
        "default_questions": DEFAULT_QUESTION_LIMIT,
        "max_questions": total,
    }

def test_build_question_at_min():
    total = MIN_QUESTION_LIMIT
    result = build_question_limit_settings(total)

    assert result == {
        "min_questions": MIN_QUESTION_LIMIT,
        "default_questions": MIN_QUESTION_LIMIT,
        "max_questions": MIN_QUESTION_LIMIT,
    }

def test_build_question_at_default():
    total = DEFAULT_QUESTION_LIMIT
    result = build_question_limit_settings(total)

    assert result == {
        "min_questions": MIN_QUESTION_LIMIT,
        "default_questions": DEFAULT_QUESTION_LIMIT,
        "max_questions": DEFAULT_QUESTION_LIMIT,
    }

def test_build_question_float_total():
    total = 16.2
    result = build_question_limit_settings(total)

    assert result == {
        "min_questions": MIN_QUESTION_LIMIT,
        "default_questions": 16,
        "max_questions": 16,
    }

# normalize_target_questions tests

def test_normalize_no_scenarios():
    with pytest.raises(ValueError) as exc:
        normalize_target_questions(10, 0)

    assert "No scenarios are available yet" in str(exc.value)

def test_normalize_none_returns_default():
    result = normalize_target_questions(None, DEFAULT_QUESTION_LIMIT + 20)

    assert result == DEFAULT_QUESTION_LIMIT

def test_normalize_valid_value():
    result = normalize_target_questions((DEFAULT_QUESTION_LIMIT + MIN_QUESTION_LIMIT) // 2, DEFAULT_QUESTION_LIMIT + 20)

    assert result == (DEFAULT_QUESTION_LIMIT + MIN_QUESTION_LIMIT) // 2

def test_normalize_below_min():
    with pytest.raises(ValueError) as exc:
        normalize_target_questions(10, 50)

    assert str(exc.value) == f"target_questions must be between {MIN_QUESTION_LIMIT} and 50." 

def test_normalize_above_max():
    with pytest.raises(ValueError) as exc:
        normalize_target_questions(100, 50)

    assert str(exc.value) == f"target_questions must be between {MIN_QUESTION_LIMIT} and 50." 

def test_normalize_invalid_string():
    with pytest.raises(ValueError) as exc:
        normalize_target_questions("test", 50)

    assert str(exc.value) == "target_questions must be an integer."

def test_normalize_string_number():
    result = normalize_target_questions("18", 50)

    assert result == 18

def test_normalize_float_input():
    result = normalize_target_questions(18.7, 50)

    assert result == 18

def test_normalize_at_min():
    result = normalize_target_questions(15, 50)

    assert result == 15

def test_normalize_at_max():
    result = normalize_target_questions(50, 50)

    assert result == 50