from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
import os
from dotenv import load_dotenv
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError
from datetime import datetime
import random

load_dotenv()

ph = PasswordHasher()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://localhost/401GameDB')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from models import db, Player, GameSession, Scenario, GameRound
db.init_app(app)

migrate = Migrate(app, db)

#enabling CORS
CORS(app)

#health check endpoint
@app.route('/api/health', methods=['GET'])
def health():
    return {'status': 'ok'}

#Login endpoint
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get("username").strip()
    password = data.get("password")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 401
    
    database_player = Player.query.filter_by(username=username).first()

    if not database_player:
        return jsonify({"message": "Invalid username or password"}), 401
    
    try:
        ph.verify(database_player.password_hash, password)

    except (VerifyMismatchError, VerificationError):
        return jsonify({"message": "Invalid username or password"}), 401
    
    return {
        "user": {
            "id": database_player.id,
            "username": database_player.username
        }
    }, 200
    
#Sign up endpoint
@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    username = data.get("username").strip()
    password = data.get("password")
    confirm_password = data.get("confirmPassword")

    if not username or not password:
        return jsonify({"message": "Username and password are required"}), 400
    
    if password != confirm_password:
        return jsonify({"message": "Passwords do not match"}), 400
    
    database_player = Player.query.filter_by(username = username).first()
    if database_player:
        return jsonify({"message": "Username already exists"}), 409
    
    password_hash = ph.hash(password)
    new_player = Player(
        username=username,
        password_hash=password_hash
    )

    db.session.add(new_player)
    db.session.commit()

    return {
        "user": {
            "id": new_player.id,
            "username": new_player.username
        }
    }, 201


# --- POST /api/sessions ---
@app.route('/api/sessions', methods=['POST'])
def create_session():
    data = request.get_json(silent=True) or {}
    username = (data.get('username') or '').strip()

    if not username:
        return jsonify({"error": "username is required"}), 400

    player = Player.query.filter_by(username=username).first()
    if not player:
        return jsonify({"error": "Player not found. Please sign up first."}), 404

    session = GameSession(player_id=player.id)
    db.session.add(session)
    db.session.commit()

    return jsonify({
        "session_id": session.id,
        "biosphere": session.biosphere,
        "society": session.society,
        "economy": session.economy
    }), 201


# --- GET /api/scenarios/next?session_id=<id> ---
@app.route('/api/scenarios/next', methods=['GET'])
def next_scenario():
    session_id = request.args.get('session_id', type=int)
    if not session_id:
        return jsonify({"error": "session_id is required"}), 400

    seen_ids = db.session.query(GameRound.scenario_id).filter_by(session_id=session_id).all()
    seen_ids = [row[0] for row in seen_ids]

    query = Scenario.query
    if seen_ids:
        query = query.filter(~Scenario.id.in_(seen_ids))

    available = query.all()
    if not available:
        return jsonify({"game_over": True}), 404

    scenario = random.choice(available)
    return jsonify({
        "scenario_id": scenario.id,
        "scenario_text": scenario.scenario_text,
        "decision_a": scenario.decision_a,
        "decision_b": scenario.decision_b
    }), 200


# --- POST /api/rounds ---
@app.route('/api/rounds', methods=['POST'])
def submit_round():
    data = request.get_json()
    session_id = data.get('session_id')
    scenario_id = data.get('scenario_id')
    choice_made = data.get('choice_made', '').lower()

    if not session_id or not scenario_id or choice_made not in ('a', 'b'):
        return jsonify({"error": "session_id, scenario_id, and choice_made (a or b) are required"}), 400

    session = GameSession.query.get(session_id)
    scenario = Scenario.query.get(scenario_id)

    if not session or not scenario:
        return jsonify({"error": "Session or scenario not found"}), 404

    # Apply deltas
    if choice_made == 'a':
        session.biosphere += scenario.a_biosphere
        session.society   += scenario.a_society
        session.economy   += scenario.a_economy
    else:
        session.biosphere += scenario.b_biosphere
        session.society   += scenario.b_society
        session.economy   += scenario.b_economy

    # Clamp 0–100
    session.biosphere = max(0, min(100, session.biosphere))
    session.society   = max(0, min(100, session.society))
    session.economy   = max(0, min(100, session.economy))

    # Save the round
    round_count = GameRound.query.filter_by(session_id=session_id).count() + 1
    game_round = GameRound(
        session_id=session_id,
        scenario_id=scenario_id,
        choice_made=choice_made,
        biosphere_after=session.biosphere,
        society_after=session.society,
        economy_after=session.economy
    )
    db.session.add(game_round)

    # Check game over
    game_over = any(m <= 0 for m in [session.biosphere, session.society, session.economy])

    response = {
        "biosphere": session.biosphere,
        "society":   session.society,
        "economy":   session.economy,
        "game_over": game_over
    }

    if game_over:
        session.status = 'ended'
        session.ended_at = datetime.utcnow()
        session.final_score = session.biosphere + session.society + session.economy + (round_count * 5)
        response["final_score"] = session.final_score

    db.session.commit()
    return jsonify(response), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001)
