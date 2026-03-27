import pytest
from models import db, Player
from application.auth_service import auth_signup, auth_login, AuthError
from app import ph, _verify_password


# Auth Signup Tests

def test_auth_signup_missing_username(app):
    with pytest.raises(AuthError) as exc:
        auth_signup("", "secret123", "secret123", ph.hash)

    assert exc.value.status_code == 400
    assert str(exc.value) == "Username and password are required"

    user = Player.query.filter_by(username="").first()
    assert user is None

def test_auth_signup_missing_password(app):
    with pytest.raises(AuthError) as exc:
        auth_signup("John", "", "", ph.hash)

    assert exc.value.status_code == 400
    assert str(exc.value) == "Username and password are required"

    user = Player.query.filter_by(username="").first()
    assert user is None

def test_auth_signup_password_mismatch(app):
    with pytest.raises(AuthError) as exc:
        auth_signup("John", "secret123", "secret12", ph.hash)

    assert exc.value.status_code == 400
    assert str(exc.value) == "Passwords do not match"

    user = Player.query.filter_by(username="John").first()
    assert user is None

def test_auth_signup_duplicate_username(app):
    auth_signup("John", "secret123", "secret123", ph.hash)
    with pytest.raises(AuthError) as exc:
        auth_signup("John", "secret123", "secret123", ph.hash)

    assert exc.value.status_code == 409
    assert str(exc.value) == "Username already exists"

    users = Player.query.filter_by(username="John").count()
    assert users == 1

def test_auth_signup_duplicate_username_after_strip(app):
    auth_signup("John", "secret123", "secret123", ph.hash)
    with pytest.raises(AuthError) as exc:
        auth_signup("   John   ", "secret123", "secret123", ph.hash)

    assert exc.value.status_code == 409
    assert str(exc.value) == "Username already exists"

    users = Player.query.filter_by(username="John").count()
    assert users == 1

def test_auth_signup_success(app):

    result = auth_signup("John", "secret123", "secret123", ph.hash)

    user = Player.query.filter_by(username="John").first()

    assert result["username"] == "John"
    assert user is not None
    assert ph.verify(user.password_hash, "secret123")

def test_auth_signup_padded_username(app):
    result = auth_signup("   John   ", "secret123", "secret123", ph.hash)

    user = Player.query.filter_by(username="John").first()

    assert result["username"] == "John"
    assert user is not None
    assert user.username == "John"
    assert ph.verify(user.password_hash, "secret123")

def test_auth_signup_whitespace_only_username(app):
    with pytest.raises(AuthError) as exc:
        auth_signup("         ", "secret123", "secret123", ph.hash)

    assert exc.value.status_code == 400
    assert str(exc.value) == "Username and password are required"

    user = Player.query.filter_by(username="").first()
    assert user is None

def test_auth_signup_whitespace_only_password(app):
    with pytest.raises(AuthError) as exc:
        auth_signup("John", "         ", "secret123", ph.hash)

    assert exc.value.status_code == 400
    assert str(exc.value) == "Username and password are required"

    user = Player.query.filter_by(username="").first()
    assert user is None

# Auth Login Tests

def test_auth_login_missing_username(app):
    with pytest.raises(AuthError) as exc:
        auth_login("", "secret123", _verify_password)

    assert exc.value.status_code == 401
    assert str(exc.value) == "Username and password are required"

def test_auth_login_missing_password(app):
    with pytest.raises(AuthError) as exc:
        auth_login("John", "", _verify_password)

    assert exc.value.status_code == 401
    assert str(exc.value) == "Username and password are required"

def test_auth_login_invalid_username(app):
    with pytest.raises(AuthError) as exc:
        auth_login("John", "secret123", _verify_password)

    assert exc.value.status_code == 401
    assert str(exc.value) == "Invalid username or password"

def test_auth_login_wrong_password(app):
    user = Player(username="John", password_hash=ph.hash("secret1234"))
    db.session.add(user)
    db.session.commit()

    with pytest.raises(AuthError) as exc:
        auth_login("John", "secret123", _verify_password)

    assert exc.value.status_code == 401
    assert str(exc.value) == "Invalid username or password"

def test_auth_login_success(app):
    user = Player(username="John", password_hash=ph.hash("secret123"))
    db.session.add(user)
    db.session.commit()

    result = auth_login("John", "secret123", _verify_password)

    assert result["id"] == user.id
    assert result["username"] == "John"

def test_auth_login_strips_username(app):
    user = Player(username="John", password_hash=ph.hash("secret123"))
    db.session.add(user)
    db.session.commit()

    result = auth_login("   John   ", "secret123", _verify_password)

    assert result["id"] == user.id
    assert result["username"] == "John"

def test_auth_login_whitespace_only_username(app):
    with pytest.raises(AuthError) as exc:
        auth_login("    ", "secret123", _verify_password)

    assert exc.value.status_code == 401
    assert str(exc.value) == "Username and password are required"

def test_auth_login_whitespace_only_pasword(app):
    with pytest.raises(AuthError) as exc:
        auth_login("John", "    ", _verify_password)

    assert exc.value.status_code == 401
    assert str(exc.value) == "Username and password are required"
