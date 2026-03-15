from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Player(db.Model):
    __tablename__ = 'players'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False) 
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    sessions = db.relationship('GameSession', backref='player', lazy=True)

    def __repr__(self):
        return f'<Player {self.username}>'


class GameSession(db.Model):
    __tablename__ = 'game_sessions'

    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)

    # Metrics
    biosphere = db.Column(db.Integer, default=50, nullable=False)
    society = db.Column(db.Integer, default=50, nullable=False)
    economy = db.Column(db.Integer, default=50, nullable=False)

    # Game state
    status = db.Column(db.String(50), default='active', nullable=False)  # 'active', 'ended'
    final_score = db.Column(db.Integer, nullable=True)  # calculated on game end

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    ended_at = db.Column(db.DateTime, nullable=True)  # set when status -> 'ended'

    # Relationships
    rounds = db.relationship('GameRound', backref='session', lazy=True)

    def __repr__(self):
        return f'<GameSession {self.id} - Player {self.player_id} - Status {self.status}>'


class Card(db.Model):
    __tablename__ = 'cards'

    id = db.Column(db.Integer, primary_key=True)
    scenario_text = db.Column(db.Text, nullable=False)

    # Decision text
    decision_a = db.Column(db.Text, nullable=False)
    decision_b = db.Column(db.Text, nullable=False)

    # Metric impacts for decision A
    a_biosphere = db.Column(db.Integer, default=0, nullable=False)
    a_society = db.Column(db.Integer, default=0, nullable=False)
    a_economy = db.Column(db.Integer, default=0, nullable=False)

    # Metric impacts for decision B
    b_biosphere = db.Column(db.Integer, default=0, nullable=False)
    b_society = db.Column(db.Integer, default=0, nullable=False)
    b_economy = db.Column(db.Integer, default=0, nullable=False)

    # Card metadata
    role_type = db.Column(db.String(100), nullable=True)   # 'National Leader', 'NGO Director', 'UN Official', 'Corporate', or None for all roles
    phase = db.Column(db.String(20), default='early', nullable=False)  # 'early' or 'late' - for future two-phase system

    def __repr__(self):
        return f'<Card {self.id} - {self.role_type} - Phase {self.phase}>'


class GameRound(db.Model):
    """
    Tracks each individual card played within a session.
    Replaces the old Choice model - stores both what was chosen
    and the resulting metric state after the choice.
    """
    __tablename__ = 'game_rounds'

    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('game_sessions.id'), nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=False)

    # Which decision the player made
    choice_made = db.Column(db.String(1), nullable=False)  # 'a' or 'b'

    # Metric values AFTER this choice was applied 
    biosphere_after = db.Column(db.Integer, nullable=False)
    society_after = db.Column(db.Integer, nullable=False)
    economy_after = db.Column(db.Integer, nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationship back to card
    card = db.relationship('Card', backref='rounds', lazy=True)

    def __repr__(self):
        return f'<GameRound {self.id} - Session {self.session_id} - Card {self.card_id} - Choice {self.choice_made}>'