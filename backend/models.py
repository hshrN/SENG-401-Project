from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Player(db.Model):
    __tablename__ = 'players'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Player {self.username}>'

class GameSession(db.Model):
    __tablename__ = 'game_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    player_id = db.Column(db.Integer, db.ForeignKey('players.id'), nullable=False)
    biosphere = db.Column(db.Integer, default=50)
    society = db.Column(db.Integer, default=50)
    economy = db.Column(db.Integer, default=50)
    status = db.Column(db.String(50), default='active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<GameSession {self.id} - Player {self.player_id}>'

class Card(db.Model):
    __tablename__ = 'cards'
    
    id = db.Column(db.Integer, primary_key=True)
    scenario_text = db.Column(db.Text, nullable=False)
    decision_a = db.Column(db.Text, nullable=False)
    decision_b = db.Column(db.Text, nullable=False)
    
    def __repr__(self):
        return f'<Card {self.id}>'

class Choice(db.Model):
    __tablename__ = 'choices'
    
    id = db.Column(db.Integer, primary_key=True)
    session_id = db.Column(db.Integer, db.ForeignKey('game_sessions.id'), nullable=False)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id'), nullable=False)
    choice_made = db.Column(db.String(1))
    biosphere_impact = db.Column(db.Integer)
    society_impact = db.Column(db.Integer)
    economy_impact = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f'<Choice {self.id} - Session {self.session_id}>'