import pytest
from models import db, Player
from application.auth_service import auth_signup, AuthError
from app import ph

def test_auth_signup_missing_username(app):
    with pytest.raises(AuthError) as exc:
        auth_signup("", "secret123", "secret123", ph.hash)

    assert exc.value.status_code == 400
    assert "Username and password are required" in str(exc.value)

    user = Player.query.filter_by(username="").first()
    assert user is None

def test_auth_signup_success(app):

    result = auth_signup("John", "secret123", "secret123", ph.hash)

    user = Player.query.filter_by(username="John").first()

    assert result["username"] == "John"
    assert user is not None
    assert ph.verify(user.password_hash, "secret123")


