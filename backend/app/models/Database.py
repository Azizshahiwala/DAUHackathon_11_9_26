from app.extensions import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'Users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    role = db.Column(db.String(20), default='operator')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'role': self.role
        }

class Asset(db.Model):
    __tablename__ = 'Assets'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    type = db.Column(db.String(50)) # 'solar', 'wind'
    location = db.Column(db.String(255))
    rated_power = db.Column(db.Float)
    status = db.Column(db.String(50), default='Active')

class SensorReading(db.Model):
    __tablename__ = 'SensorReadings'
    
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    temperature = db.Column(db.Float)
    vibration_rms = db.Column(db.Float)
    current = db.Column(db.Float)
    voltage = db.Column(db.Float)
    power_output = db.Column(db.Float)
    wind_speed = db.Column(db.Float)
    soiling_level = db.Column(db.Float)

class Alert(db.Model):
    __tablename__ = 'Alerts'
    
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    anomaly_score = db.Column(db.Float)
    risk_level = db.Column(db.String(20)) # Low, Medium, High, Critical
    estimated_energy_loss = db.Column(db.Float)
    estimated_revenue_loss = db.Column(db.Float)
    status = db.Column(db.String(50), default='Open')

class MaintenanceLog(db.Model):
    __tablename__ = 'MaintenanceLogs'
    
    id = db.Column(db.Integer, primary_key=True)
    asset_id = db.Column(db.Integer, db.ForeignKey('assets.id'), nullable=False)
    alert_id = db.Column(db.Integer, db.ForeignKey('alerts.id'), nullable=True)
    technician_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action_taken = db.Column(db.Text)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.Text)