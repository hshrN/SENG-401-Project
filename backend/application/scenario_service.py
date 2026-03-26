"""
Scenario use case: get next unseen scenario for a session (or signal game over).
Uses infrastructure (Scenario, GameRound, db).
"""

import random
from application.game_settings import build_question_limit_settings
from application.pressure_service import get_session_lingering_pressure
from models import Scenario, GameRound, GameSession, db
from domain.game import compute_final_score, apply_choice_impacts
from datetime import datetime

class ScenarioError(Exception):
    """Raised when scenario request is invalid or no scenarios left."""
    def __init__(self, message: str, status_code: int = 400, game_over: bool = False):
        self.message = message
        self.status_code = status_code
        self.game_over = game_over
        super().__init__(message)


def scenario_get_settings() -> dict:
    """Return current question-limit bounds from the scenario pool."""
    total_scenarios = Scenario.query.count()
    return {
        "total_scenarios": total_scenarios,
        **build_question_limit_settings(total_scenarios),
    }


def scenario_get_next(session_id: int) -> dict:
    """
    Return one random scenario not yet played in this session.
    Returns a completion payload when no scenarios remain.
    Returns dict with scenario_id, scenario_text, decision_a, decision_b.
    """
    if not session_id:
        raise ScenarioError("session_id is required", 400)

    seen_ids = [
        row[0]
        for row in db.session.query(GameRound.scenario_id).filter_by(session_id=session_id).all()
    ]
    seen_count = len(seen_ids)

    query = Scenario.query
    if seen_ids:
        query = query.filter(~Scenario.id.in_(seen_ids))
    available = query.all()

    preferred_phase = None
    if seen_count < 5:
        preferred_phase = "early"
    elif seen_count >= 8:
        preferred_phase = "late"

    if preferred_phase:
        phased_available = [scenario for scenario in available if scenario.phase == preferred_phase]
        if phased_available:
            available = phased_available

    if not available:
        session = GameSession.query.get(session_id)
        if session is None:
            raise ScenarioError("session not found", 404)

        round_count = GameRound.query.filter_by(session_id=session_id).count()

        session.status = "ended"
        session.ended_at = datetime.utcnow()
        session.final_score = compute_final_score(session.biosphere, session.society, session.economy, round_count)

        db.session.commit()

        return {
            "error": "Mission complete",
            "game_over": True,
            "game_result": "completed",
            "final_score": session.final_score,
            "completed_questions": round_count,
            "target_questions": round_count,
        }

    scenario = random.choice(available)

    # Compute predicted post-choice metrics for hover previews.
    # These are based on current session metrics plus the scenario's A/B impacts.
    session = GameSession.query.get(session_id)
    if session is None:
        raise ScenarioError("session not found", 404)

    lingering_pressure = get_session_lingering_pressure(session_id)

    a_biosphere_after, a_society_after, a_economy_after = apply_choice_impacts(
        session.biosphere,
        session.society,
        session.economy,
        "a",
        scenario.a_biosphere,
        scenario.a_society,
        scenario.a_economy,
        scenario.b_biosphere,
        scenario.b_society,
        scenario.b_economy,
        lingering_pressure=lingering_pressure,
    )

    b_biosphere_after, b_society_after, b_economy_after = apply_choice_impacts(
        session.biosphere,
        session.society,
        session.economy,
        "b",
        scenario.a_biosphere,
        scenario.a_society,
        scenario.a_economy,
        scenario.b_biosphere,
        scenario.b_society,
        scenario.b_economy,
        lingering_pressure=lingering_pressure,
    )

    return {
        "scenario_id": scenario.id,
        "scenario_text": scenario.scenario_text,
        "decision_a": scenario.decision_a,
        "decision_b": scenario.decision_b,
        # Predicted metrics (used for "ghost" hover preview)
        "a_biosphere_after": a_biosphere_after,
        "a_society_after": a_society_after,
        "a_economy_after": a_economy_after,
        "b_biosphere_after": b_biosphere_after,
        "b_society_after": b_society_after,
        "b_economy_after": b_economy_after,
    }
