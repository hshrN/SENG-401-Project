import pytest
from models import db, GameRound, GameSession
from application.scenario_service import scenario_get_next, scenario_get_settings, ScenarioError
from test_utils import create_test_scenarios, create_player_and_session

def test_scenario_get_settings_no_scenarios(app):
    result = scenario_get_settings()

    assert result == {
        "total_scenarios": 0,
        "min_questions": 0,
        "default_questions": 0,
        "max_questions": 0,
    }

def test_scenario_get_settings_below_min(app):
    create_test_scenarios(10)

    result = scenario_get_settings()

    assert result == {
        "total_scenarios": 10,
        "min_questions": 10,
        "default_questions": 10,
        "max_questions": 10,
    }

def test_scenario_get_settings_above_default(app):
    create_test_scenarios(50)

    result = scenario_get_settings()

    assert result == {
        "total_scenarios": 50,
        "min_questions": 15,
        "default_questions": 20,
        "max_questions": 50,
    }

def test_scenario_get_settings_between_min_and_default(app):
    create_test_scenarios(18)

    result = scenario_get_settings()

    assert result == {
        "total_scenarios": 18,
        "min_questions": 15,
        "default_questions": 18,
        "max_questions": 18,
    }

def test_scenario_get_next_requires_session_id(app):
    with pytest.raises(ScenarioError) as exc:
        scenario_get_next(0)

    assert exc.value.status_code == 400
    assert str(exc.value) == "session_id is required"

def test_scenario_get_next_session_not_found(app):
    with pytest.raises(ScenarioError) as exc:
        scenario_get_next(999)

    assert exc.value.status_code == 404
    assert str(exc.value) == "session not found"

def test_scenario_get_next_returns_scenario(app):
    _, session = create_player_and_session()
    scenarios = create_test_scenarios(1)
    scenario = scenarios[0]

    result = scenario_get_next(session.id)

    assert result["scenario_id"] == scenario.id
    assert result["scenario_text"] == scenario.scenario_text
    assert result["decision_a"] == scenario.decision_a
    assert result["decision_b"] == scenario.decision_b

def test_scenario_get_next_returns_metrics(app):
    _, session = create_player_and_session()
    create_test_scenarios(1)

    result = scenario_get_next(session.id)

    assert 53 <= result["a_biosphere_after"] <= 57
    assert 51 <= result["a_society_after"] <= 55
    assert 46 <= result["a_economy_after"] <= 50

    assert 45 <= result["b_biosphere_after"] <= 49
    assert 50 <= result["b_society_after"] <= 54
    assert 52 <= result["b_economy_after"] <= 56

def test_scenario_get_next_skips_seen_scenarios(app):
    _, session = create_player_and_session()
    scenarios = create_test_scenarios(2)

    seen_scenario = scenarios[0]
    unseen_scenario = scenarios[1]

    db.session.add(GameRound(
        session_id=session.id,
        scenario_id=seen_scenario.id,
        choice_made="a",
        biosphere_after=50,
        society_after=50,
        economy_after=50,
    ))
    db.session.commit()

    result = scenario_get_next(session.id)

    assert result["scenario_id"] == unseen_scenario.id

def test_scenario_get_next_completes_when_no_scenarios_remain(app):
    _, session = create_player_and_session()
    scenarios = create_test_scenarios(2)

    for i in range(2):
        db.session.add(GameRound(
            session_id=session.id,
            scenario_id=scenarios[i].id,
            choice_made="a",
            biosphere_after=50,
            society_after=50,
            economy_after=50,
        ))
    db.session.commit()

    result = scenario_get_next(session.id)
    updated_session = GameSession.query.get(session.id)

    assert result["error"] == "Mission complete"
    assert result["game_over"] is True
    assert result["game_result"] == "completed"
    assert result["completed_questions"] == 2
    assert result["target_questions"] == 2

    assert updated_session.status == "ended"
    assert updated_session.ended_at is not None
    assert updated_session.final_score == result["final_score"]

def test_scenario_get_next_completion_final_score(app):
    _, session = create_player_and_session(biosphere=10, society=20, economy=30)
    scenarios = create_test_scenarios(1)

    db.session.add(GameRound(
        session_id=session.id,
        scenario_id=scenarios[0].id,
        choice_made="a",
        biosphere_after=10,
        society_after=20,
        economy_after=30,
    ))
    db.session.commit()

    result = scenario_get_next(session.id)

    assert result["final_score"] == 65
    assert result["completed_questions"] == 1
    assert result["target_questions"] == 1