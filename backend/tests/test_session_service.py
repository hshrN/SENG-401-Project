import pytest
from models import db, GameSession, Player, Scenario
from application.session_service import session_create, SessionError
from app import ph

def create_test_scenarios(count: int):
    scenarios = []

    for i in range(count):
        scenario = Scenario(
            scenario_text=f"Scenario {i}",
            decision_a="Do A",
            decision_b="Do B",
            a_biosphere=5,
            a_society=3,
            a_economy=-2,
            b_biosphere=-3,
            b_society=2,
            b_economy=4,
        )
        scenarios.append(scenario)

    db.session.add_all(scenarios)
    db.session.commit()

    return scenarios

def test_create_session_missing_username(app):
    with pytest.raises(SessionError) as exc:
        session_create("", 5)

    assert exc.value.status_code == 400
    assert str(exc.value) == "username is required"

def test_create_session_whitespace_only_username(app):
    with pytest.raises(SessionError) as exc:
        session_create("       ", 5)

    assert exc.value.status_code == 400
    assert str(exc.value) == "username is required"

def test_create_session_invalid_username(app):
    user = Player(username="John", password_hash=ph.hash("secret123"))
    db.session.add(user)
    db.session.commit()

    with pytest.raises(SessionError) as exc:
        session_create("Todd", 5)

    assert exc.value.status_code == 404
    assert str(exc.value) == "Player not found. Please sign up first."

def test_create_session_strips_username(app):
    user = Player(username="John", password_hash=ph.hash("secret123"))
    db.session.add(user)
    db.session.commit()

    create_test_scenarios(20)

    result = session_create("   John   ")

    session = GameSession.query.get(result["session_id"])

    assert session is not None
    assert session.player_id == user.id

def test_session_create_no_scenarios(app):
    user = Player(username="John", password_hash=ph.hash("secret123"))
    db.session.add(user)
    db.session.commit()

    with pytest.raises(SessionError) as exc:
        session_create("John")

    assert exc.value.status_code == 400
    assert str(exc.value) == "No scenarios are available yet."

def test_session_create_success(app):
    user = Player(username="John", password_hash=ph.hash("secret123"))
    db.session.add(user)
    db.session.commit()

    create_test_scenarios(20)

    result = session_create("John")

    session = GameSession.query.get(result["session_id"])

    assert session is not None
    assert session.player_id == user.id
    assert result["session_id"] == session.id
    assert result["target_questions"] == 20

def test_session_create_valid_target_questions(app):
    user = Player(username="John", password_hash=ph.hash("secret123"))
    db.session.add(user)
    db.session.commit()

    create_test_scenarios(30)

    result = session_create("John", 18)

    assert result["target_questions"] == 18

def test_session_create_target_questions_below_min(app):
    user = Player(username="John", password_hash=ph.hash("secret123"))
    db.session.add(user)
    db.session.commit()

    create_test_scenarios(30)

    with pytest.raises(SessionError) as exc:
        session_create("John", 10)

    assert exc.value.status_code == 400
    assert str(exc.value) == "target_questions must be between 15 and 30."

def test_session_create_target_questions_above_max(app):
    user = Player(username="John", password_hash=ph.hash("secret123"))
    db.session.add(user)
    db.session.commit()

    create_test_scenarios(20)

    with pytest.raises(SessionError) as exc:
        session_create("John", 25)

    assert exc.value.status_code == 400
    assert str(exc.value) == "target_questions must be between 15 and 20."
