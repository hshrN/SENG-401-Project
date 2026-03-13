from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from flask_migrate import Migrate
import os
from dotenv import load_dotenv
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError

load_dotenv()

ph = PasswordHasher()

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://localhost/401GameDB'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

from models import db
db.init_app(app)

migrate = Migrate(app, db)

#enabling CORS
CORS(app)

from models import Player, GameSession, Card, Choice

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

if __name__ == '__main__':
    app.run(debug=True, port=5001)
