"""
Authentication use cases: login and signup.
Uses infrastructure (Player model, password hasher); no HTTP/request details.
"""

from models import Player, db


class AuthError(Exception):
    """Raised when authentication or registration fails."""
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def auth_login(username: str, password: str, password_verify_fn, password_hash_fn=None):
    """
    Authenticate a user by username and password.
    password_verify_fn(hashed, plain) raises on mismatch.
    Returns dict with user id and username.
    """
    if not username.strip() or not password.strip():
        raise AuthError("Username and password are required", 401)

    player = Player.query.filter_by(username=username.strip()).first()
    if not player:
        raise AuthError("Invalid username or password", 401)

    try:
        password_verify_fn(player.password_hash, password)
    except Exception:
        raise AuthError("Invalid username or password", 401)

    return {"id": player.id, "username": player.username}


def auth_signup(username: str, password: str, confirm_password: str, password_hash_fn):
    """
    Register a new player. Validates input and hashes password.
    Returns dict with user id and username.
    """
    if not username.strip() or not password.strip():
        raise AuthError("Username and password are required", 400)

    if password != confirm_password:
        raise AuthError("Passwords do not match", 400)

    existing = Player.query.filter_by(username=username.strip()).first()
    if existing:
        raise AuthError("Username already exists", 409)

    password_hash = password_hash_fn(password)
    new_player = Player(username=username.strip(), password_hash=password_hash)
    db.session.add(new_player)
    db.session.commit()

    return {"id": new_player.id, "username": new_player.username}
