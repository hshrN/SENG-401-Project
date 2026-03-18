from datetime import datetime, timedelta
from models import GameSession, Player, db

class LeaderboardError(Exception):
    """Raised when leaderboard request is invalid."""
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)

def get_leaderboard(limit, offset, period, user_id):
    """
    Returns a list of leaderboard entries 
    Returns dict with metadata and a list of dictionary entries.
    Each entry contains rank, username, score, achieved_at, and is_user_score
    Return metadata with empty entries list when no scores can be found matching the params
    """
    if not period:
        raise LeaderboardError("period is required", 400)
    
    if limit < 1:
        raise LeaderboardError("limit must be at least 1", 400)
    
    if offset < 0:
        raise LeaderboardError("offset can not be negative", 400)
    
    if period not in ["all-time", "weekly", "daily"]: 
        raise LeaderboardError("period must be all-time, weekly, or daily", 400)
    
    query = db.session.query(GameSession, Player).join(
        Player, GameSession.player_id == Player.id
    )

    query = query.filter(GameSession.status == "ended")
    query = query.order_by(GameSession.final_score.desc(), GameSession.ended_at.asc())

    now = datetime.utcnow()

    if period == "weekly":
        week_ago = now - timedelta(days=7)
        query = query.filter(GameSession.ended_at >= week_ago)

    elif period == "daily":
        day_ago = now - timedelta(days=1)
        query = query.filter(GameSession.ended_at >= day_ago)

    total_entries = query.count()

    results = query.offset(offset).limit(limit).all()

    entries = []
    for i, (session, player) in enumerate(results):
        entries.append({
            "rank": offset + i + 1,
            "username": player.username,
            "score": session.final_score,
            "achieved_at": session.ended_at.isoformat() + "Z",
            "is_user_score": player.id == user_id
        })
    return {
        "metadata": {
            "total_entries": total_entries,
            "limit": limit,
            "offset": offset
        },
        "entries": entries
    }