from models import db, GameSession, Player, Scenario
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

def create_player_and_session(biosphere=50, society=50, economy=50):
    user = create_player()

    session = GameSession(
        player_id=user.id,
        biosphere=biosphere,
        society=society,
        economy=economy,
        )
    db.session.add(session)
    db.session.commit()

    return user, session

def create_player(username="John"):
    user = Player(username= username, password_hash=ph.hash("secret123"))
    db.session.add(user)
    db.session.commit()
    return user


def create_ended_session(player_id, final_score, ended_at, biosphere=50, society=50, economy=50):
    session = GameSession(
        player_id=player_id,
        status="ended",
        final_score=final_score,
        ended_at=ended_at,
        biosphere=biosphere,
        society=society,
        economy=economy,
    )
    db.session.add(session)
    db.session.commit()
    return session
