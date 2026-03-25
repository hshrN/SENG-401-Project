"""
Session use cases: create a new game session for a player.
Uses infrastructure (Player, GameSession, Scenario, db).
"""

from application.game_settings import normalize_target_questions
from models import Player, GameSession, Scenario, db


class SessionError(Exception):
    """Raised when session creation fails."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def session_create(username: str, target_questions: int | None = None) -> dict:
    """
    Create a new game session for the given username.
    Returns dict with session_id, biosphere, society, economy.
    """
    uname = (username or "").strip()
    if not uname:
        raise SessionError("username is required", 400)

    player = Player.query.filter_by(username=uname).first()
    if not player:
        raise SessionError("Player not found. Please sign up first.", 404)

    total_scenarios = Scenario.query.count()
    try:
        normalized_target_questions = normalize_target_questions(target_questions, total_scenarios)
    except ValueError as e:
        raise SessionError(str(e), 400)

    session = GameSession(player_id=player.id)
    db.session.add(session)
    db.session.commit()

    return {
        "session_id": session.id,
        "biosphere": session.biosphere,
        "society": session.society,
        "economy": session.economy,
        "target_questions": normalized_target_questions,
    }
