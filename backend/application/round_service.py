"""
Round use case: record a player's choice, apply domain logic, persist and return new state.
Uses domain (apply_choice_impacts, is_game_over, compute_final_score) and infrastructure (models, db).
"""

from datetime import datetime
from domain.game import apply_choice_impacts, is_game_over, compute_final_score
from models import GameSession, Scenario, GameRound, db


class RoundError(Exception):
    """Raised when round submission is invalid."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def round_submit(session_id: int, scenario_id: int, choice_made: str) -> dict:
    """
    Apply the player's choice to the session metrics, persist the round, and optionally end the game.
    choice_made must be 'a' or 'b'.
    Returns dict with biosphere, society, economy, game_over, and optionally final_score.
    """
    if not session_id or not scenario_id or choice_made not in ("a", "b"):
        raise RoundError("session_id, scenario_id, and choice_made (a or b) are required", 400)

    session = GameSession.query.get(session_id)
    scenario = Scenario.query.get(scenario_id)
    if not session or not scenario:
        raise RoundError("Session or scenario not found", 404)

    biosphere, society, economy = apply_choice_impacts(
        session.biosphere,
        session.society,
        session.economy,
        choice_made,
        scenario.a_biosphere,
        scenario.a_society,
        scenario.a_economy,
        scenario.b_biosphere,
        scenario.b_society,
        scenario.b_economy,
    )

    session.biosphere = biosphere
    session.society = society
    session.economy = economy

    round_count = GameRound.query.filter_by(session_id=session_id).count() + 1
    game_round = GameRound(
        session_id=session_id,
        scenario_id=scenario_id,
        choice_made=choice_made,
        biosphere_after=biosphere,
        society_after=society,
        economy_after=economy,
    )
    db.session.add(game_round)

    game_over = is_game_over(biosphere, society, economy)
    response = {
        "biosphere": biosphere,
        "society": society,
        "economy": economy,
        "game_over": game_over,
    }

    if game_over:
        session.status = "ended"
        session.ended_at = datetime.utcnow()
        session.final_score = compute_final_score(biosphere, society, economy, round_count)
        response["final_score"] = session.final_score

    db.session.commit()
    return response
