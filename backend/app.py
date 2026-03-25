"""
Presentation layer (API): Flask routes only.
Parses request, calls application layer, returns JSON. No business logic here.
"""

import os
from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
from dotenv import load_dotenv
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError

from models import db, Player, GameSession, Scenario, GameRound
from application.auth_service import auth_login, auth_signup, AuthError
from application.session_service import session_create, SessionError
from application.scenario_service import scenario_get_next, ScenarioError
from application.round_service import round_submit, RoundError
from application.leaderboard_service import get_leaderboard, LeaderboardError
from application.ai_service import generate_scenarios, AIServiceError

load_dotenv()

# --- Infrastructure: password hashing (used by application via injection) ---
ph = PasswordHasher()


def _verify_password(hashed: str, plain: str) -> None:
    try:
        ph.verify(hashed, plain)
    except (VerifyMismatchError, VerificationError):
        raise Exception("Invalid username or password")


# --- App and DB setup ---
app = Flask(__name__)
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "postgresql://localhost/401GameDB")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
migrate = Migrate(app, db)
CORS(app)


# --- Health ---
@app.route("/api/health", methods=["GET"])
def health():
    return {"status": "ok"}


# --- Auth (presentation: parse JSON → application → JSON response) ---
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    try:
        user = auth_login(username, password, _verify_password)
        return jsonify({"user": user}), 200
    except AuthError as e:
        return jsonify({"message": e.message}), e.status_code


@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    confirm_password = data.get("confirmPassword") or ""

    try:
        user = auth_signup(username, password, confirm_password, ph.hash)
        return jsonify({"user": user}), 201
    except AuthError as e:
        return jsonify({"message": e.message}), e.status_code


# --- Sessions ---
@app.route("/api/sessions", methods=["POST"])
def create_session():
    data = request.get_json(silent=True) or {}
    username = (data.get("username") or "").strip()

    try:
        result = session_create(username)
        return jsonify(result), 201
    except SessionError as e:
        return jsonify({"error": e.message}), e.status_code


# --- Scenarios ---
@app.route("/api/scenarios/next", methods=["GET"])
def next_scenario():
    session_id = request.args.get("session_id", type=int)

    try:
        result = scenario_get_next(session_id)
        if result is None:
            return jsonify({"game_over": True}), 404
        return jsonify(result), 200
    except ScenarioError as e:
        return jsonify({"error": e.message}), e.status_code


@app.route("/api/scenarios/generate", methods=["POST"])
def generate_ai_scenarios():
    data = request.get_json(silent=True) or {}
    count = data.get("count", 5)
    try:
        created = generate_scenarios(count)
        return jsonify({"created": len(created), "scenarios": created}), 201
    except AIServiceError as e:
        return jsonify({"error": e.message}), e.status_code


# --- Rounds ---
@app.route("/api/rounds", methods=["POST"])
def submit_round():
    data = request.get_json() or {}
    session_id = data.get("session_id")
    scenario_id = data.get("scenario_id")
    choice_made = (data.get("choice_made") or "").strip().lower()

    try:
        result = round_submit(session_id, scenario_id, choice_made)
        return jsonify(result), 200
    except RoundError as e:
        return jsonify({"error": e.message}), e.status_code

@app.route("/api/leaderboard", methods = ["GET"])
def leaderboard():
    limit = request.args.get("limit", default=10, type=int)
    offset = request.args.get("offset", default=0, type=int)
    period = request.args.get("period", default="all-time", type=str)
    user_id = request.args.get("user_id", default=-1, type=int)

    try: 
        result = get_leaderboard(limit, offset, period, user_id)
        return jsonify(result), 200
    except LeaderboardError as e:
        return jsonify({"error": e.message}), e.status_code

if __name__ == "__main__":
    app.run(debug=True, port=5001)
