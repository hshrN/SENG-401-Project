import pytest
from datetime import datetime, timedelta
from application.leaderboard_service import get_leaderboard, LeaderboardError
from test_utils import create_player, create_ended_session, create_player_and_session

def test_get_leaderboard_validation(app):
    with pytest.raises(LeaderboardError):
        get_leaderboard(0, 0, "all-time", 1)

    with pytest.raises(LeaderboardError):
        get_leaderboard(10, -1, "all-time", 1)

    with pytest.raises(LeaderboardError):
        get_leaderboard(10, 0, "", 1)

    with pytest.raises(LeaderboardError):
        get_leaderboard(10, 0, "monthly", 1)

def test_get_leaderboard_empty(app):
    result = get_leaderboard(10, 0, "all-time", 1)

    assert result["metadata"]["total_entries"] == 0
    assert result["entries"] == []

def test_get_leaderboard_only_ended(app):
    user,_ = create_player_and_session()

    create_ended_session(user.id, 100, datetime.utcnow())

    result = get_leaderboard(10, 0, "all-time", user.id)

    assert result["metadata"]["total_entries"] == 1
    assert result["entries"][0]["score"] == 100

def test_get_leaderboard_ordering(app):
    p1 = create_player("Alice")
    p2 = create_player("Bob")

    earlier = datetime.utcnow()
    later = earlier + timedelta(minutes=5)

    create_ended_session(p1.id, 100, earlier)
    create_ended_session(p2.id, 100, later)

    result = get_leaderboard(10, 0, "all-time", p1.id)

    assert result["entries"][0]["username"] == "Alice"
    assert result["entries"][1]["username"] == "Bob"

def test_get_leaderboard_weekly_filter(app):
    recent = create_player("Recent")
    old = create_player("Old")

    now = datetime.utcnow()

    create_ended_session(recent.id, 100, now - timedelta(days=2))
    create_ended_session(old.id, 200, now - timedelta(days=8))

    result = get_leaderboard(10, 0, "weekly", recent.id)

    assert result["metadata"]["total_entries"] == 1
    assert result["entries"][0]["username"] == "Recent"

def test_get_leaderboard_daily_filter(app):
    recent = create_player("Recent")
    old = create_player("Old")

    now = datetime.utcnow()

    create_ended_session(recent.id, 100, now - timedelta(hours=12))
    create_ended_session(old.id, 200, now - timedelta(days=2))

    result = get_leaderboard(10, 0, "daily", recent.id)

    assert result["metadata"]["total_entries"] == 1
    assert result["entries"][0]["username"] == "Recent"

def test_get_leaderboard_user_flag(app):
    p1 = create_player("Alice")
    p2 = create_player("Bob")

    now = datetime.utcnow()

    create_ended_session(p1.id, 120, now)
    create_ended_session(p2.id, 100, now)

    result = get_leaderboard(10, 0, "all-time", p2.id)

    assert result["entries"][1]["username"] == "Bob"
    assert result["entries"][1]["is_user_score"] is True