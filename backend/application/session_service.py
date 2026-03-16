"""
Session use cases: create a new game session for a player.
Uses infrastructure (Player, GameSession, db).
"""

from models import Player, GameSession, db


class SessionError(Exception):
    """Raised when session creation fails."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def session_create(username: str) -> dict:
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

    session = GameSession(player_id=player.id)
    db.session.add(session)
    db.session.commit()

    return {
        "session_id": session.id,
        "biosphere": session.biosphere,
        "society": session.society,
        "economy": session.economy,
    }
