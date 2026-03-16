"""
Scenario use case: get next unseen scenario for a session (or signal game over).
Uses infrastructure (Scenario, GameRound, db).
"""

import random
from models import Scenario, GameRound, db


class ScenarioError(Exception):
    """Raised when scenario request is invalid or no scenarios left."""
    def __init__(self, message: str, status_code: int = 400, game_over: bool = False):
        self.message = message
        self.status_code = status_code
        self.game_over = game_over
        super().__init__(message)


def scenario_get_next(session_id: int) -> dict | None:
    """
    Return one random scenario not yet played in this session.
    Returns None (and caller should treat as game over) when no scenarios remain.
    Returns dict with scenario_id, scenario_text, decision_a, decision_b.
    """
    if not session_id:
        raise ScenarioError("session_id is required", 400)

    seen_ids = [
        row[0]
        for row in db.session.query(GameRound.scenario_id).filter_by(session_id=session_id).all()
    ]

    query = Scenario.query
    if seen_ids:
        query = query.filter(~Scenario.id.in_(seen_ids))
    available = query.all()

    if not available:
        return None  # game over

    scenario = random.choice(available)
    return {
        "scenario_id": scenario.id,
        "scenario_text": scenario.scenario_text,
        "decision_a": scenario.decision_a,
        "decision_b": scenario.decision_b,
    }
