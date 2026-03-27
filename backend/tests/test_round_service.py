import pytest
from models import db, GameSession, GameRound
from application.round_service import round_submit, RoundError
from test_utils import create_test_scenarios, create_player_and_session


def test_round_submit_requires_valid_inputs(app):
    with pytest.raises(RoundError) as exc:
        round_submit(0, 1, "a")

    assert exc.value.status_code == 400
    assert str(exc.value) == "session_id, scenario_id, and choice_made (a or b) are required"

def test_round_submit_rejects_invalid_choice(app):
    with pytest.raises(RoundError) as exc:
        round_submit(1, 1, "c")

    assert exc.value.status_code == 400
    assert str(exc.value) == "session_id, scenario_id, and choice_made (a or b) are required"

def test_round_submit_session_or_scenario_not_found(app):
    with pytest.raises(RoundError) as exc:
        round_submit(999, 999, "a")

    assert exc.value.status_code == 404
    assert str(exc.value) == "Session or scenario not found"

def test_round_submit_choice_a_updates_metrics(app):
    _, session = create_player_and_session()
    scenarios = create_test_scenarios(20)
    scenario = scenarios[0]

    result = round_submit(session.id, scenario.id, "a")
    updated_session = GameSession.query.get(session.id)
    saved_round = GameRound.query.filter_by(session_id=session.id, scenario_id=scenario.id).first()

    assert 53 <= result["biosphere"] <= 57
    assert 51 <= result["society"] <= 55
    assert 46 <= result["economy"] <= 50

    assert result["game_over"] is False
    assert result["completed_questions"] == 1
    assert result["target_questions"] == 20

    assert 53 <= updated_session.biosphere <= 57
    assert 51 <= updated_session.society <= 55
    assert 46 <= updated_session.economy <= 50

    assert saved_round is not None
    assert saved_round.choice_made == "a"
    assert 53 <= saved_round.biosphere_after <= 57
    assert 51 <= saved_round.society_after <= 55
    assert 46 <= saved_round.economy_after <= 50

def test_round_submit_choice_b_updates_metrics(app):
    _, session = create_player_and_session()
    scenarios = create_test_scenarios(20)
    scenario = scenarios[0]

    result = round_submit(session.id, scenario.id, "b")
    updated_session = GameSession.query.get(session.id)
    saved_round = GameRound.query.filter_by(session_id=session.id, scenario_id=scenario.id).first()

    assert 45 <= result["biosphere"] <= 49
    assert 50 <= result["society"] <= 54
    assert 52 <= result["economy"] <= 56

    assert result["game_over"] is False
    assert result["completed_questions"] == 1
    assert result["target_questions"] == 20

    assert 45 <= updated_session.biosphere <= 49
    assert 50 <= updated_session.society <= 54
    assert 52 <= updated_session.economy <= 56

    assert saved_round is not None
    assert saved_round.choice_made == "b"
    assert 45 <= saved_round.biosphere_after <= 49
    assert 50 <= saved_round.society_after <= 54
    assert 52 <= saved_round.economy_after <= 56

def test_round_submit_uses_custom_target_questions(app):
    _, session = create_player_and_session()
    scenarios = create_test_scenarios(30)
    scenario = scenarios[0]

    result = round_submit(session.id, scenario.id, "a", target_questions=18)

    assert result["completed_questions"] == 1
    assert result["target_questions"] == 18
    assert result["game_over"] is False

def test_round_submit_rejects_invalid_target_questions(app):
    _, session = create_player_and_session()
    scenarios = create_test_scenarios(30)
    scenario = scenarios[0]

    with pytest.raises(RoundError) as exc:
        round_submit(session.id, scenario.id, "a", target_questions=10)

    assert exc.value.status_code == 400
    assert str(exc.value) == "target_questions must be between 15 and 30."

def test_round_submit_game_over_when_metric_reaches_zero(app):
    _, session = create_player_and_session(economy=0)
    scenarios = create_test_scenarios(20)
    scenario = scenarios[0]

    result = round_submit(session.id, scenario.id, "a")
    updated_session = GameSession.query.get(session.id)

    assert 53 <= result["biosphere"] <= 57
    assert 51 <= result["society"] <= 55
    assert result["economy"] == 0

    assert result["game_over"] is True
    assert result["game_result"] == "failed"
    assert "final_score" in result

    assert updated_session.status == "ended"
    assert updated_session.ended_at is not None
    assert updated_session.final_score == result["final_score"]

def test_round_submit_failure_final_score(app):
    _, session = create_player_and_session(economy=0)
    scenarios = create_test_scenarios(20)
    scenario = scenarios[0]

    result = round_submit(session.id, scenario.id, "a")

    assert result["game_over"] is True
    assert result["game_result"] == "failed"
    assert 109 <= result["final_score"] <= 117

def test_round_submit_completes_game_when_target_questions_reached(app):
    _, session = create_player_and_session()
    scenarios = create_test_scenarios(20)

    for i in range(14):
        db.session.add(GameRound(
            session_id=session.id,
            scenario_id=scenarios[i].id,
            choice_made="a",
            biosphere_after=50,
            society_after=50,
            economy_after=50,
        ))
    db.session.commit()

    scenario = scenarios[14]

    result = round_submit(session.id, scenario.id, "b", target_questions=15)
    updated_session = GameSession.query.get(session.id)

    assert 45 <= result["biosphere"] <= 49
    assert 50 <= result["society"] <= 54
    assert 52 <= result["economy"] <= 56

    assert result["completed_questions"] == 15
    assert result["target_questions"] == 15
    assert result["game_over"] is True
    assert result["game_result"] == "completed"
    assert "final_score" in result

    assert updated_session.status == "ended"
    assert updated_session.ended_at is not None
    assert updated_session.final_score == result["final_score"]

def test_round_submit_completion_final_score(app):
    _, session = create_player_and_session()
    scenarios = create_test_scenarios(20)

    for i in range(14):
        db.session.add(GameRound(
            session_id=session.id,
            scenario_id=scenarios[i].id,
            choice_made="a",
            biosphere_after=50,
            society_after=50,
            economy_after=50,
        ))
    db.session.commit()

    scenario = scenarios[14]

    result = round_submit(session.id, scenario.id, "b", target_questions=15)

    assert result["game_over"] is True
    assert result["game_result"] == "completed"
    assert result["completed_questions"] == 15
    assert result["target_questions"] == 15
    assert 222 <= result["final_score"] <= 234