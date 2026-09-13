import os
import sys
import random
import math
from datetime import datetime, timedelta, UTC

# Ensure we can import from backend
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from wsgi import app
from app.models.Database import db, Asset, SensorReading, Alert

def seed_database():
    with app.app_context():
        print("Clearing old data...")
        db.session.query(Alert).delete()
        db.session.query(SensorReading).delete()
        db.session.query(Asset).delete()
        db.session.commit()

        print("Seeding Assets...")
        assets_data = [
            {"name": "P999-Critical", "type": "solar", "status": "CRITICAL", "lat": 23.0, "lon": 72.5},
            {"name": "P102-Warning", "type": "solar", "status": "WARNING", "lat": 23.0, "lon": 72.5},
            {"name": "W045-Wind", "type": "wind", "status": "HEALTHY", "lat": 23.1, "lon": 72.6}
        ]
        
        # Add normal solar assets
        for i in range(1, 9):
            assets_data.append({
                "name": f"P00{i}-Normal", "type": "solar", "status": "HEALTHY", "lat": 23.0, "lon": 72.5
            })

        db_assets = []
        for a_data in assets_data:
            a = Asset(
                name=a_data["name"],
                plant_name="SolePulse Main Farm",
                type=a_data["type"],
                location="Sector 1",
                latitude=a_data["lat"],
                longitude=a_data["lon"],
                rated_power_kw=0.40 if a_data["type"] == "solar" else 1500.0,
                status=a_data["status"]
            )
            db.session.add(a)
            db_assets.append(a)
        
        db.session.commit()
        
        print("Seeding 24 hours of SensorReadings & Alerts...")
        now = datetime.now(UTC)
        
        for asset in db_assets:
            is_critical = asset.status == "CRITICAL"
            is_warning = asset.status == "WARNING"
            
            # Generate 24 hours of data
            for i in range(24, -1, -1):
                t = now - timedelta(hours=i)
                hour = (t.hour + 5.5) % 24  # IST approx
                
                # Ambient baseline
                is_day = 6 <= hour <= 18
                sun = math.sin(math.pi * (hour - 6) / 12) if is_day else 0.0
                ambient_temp = 28.0 + 5.0 * sun + random.gauss(0, 1)
                gti = max(0.0, 900.0 * sun + random.gauss(0, 20))
                
                # Physics calculation
                jitter = random.gauss(0, 0.2)
                if asset.type == "solar":
                    cell_temp = ambient_temp + 10.0 * sun + jitter
                    volt = 38.0 + jitter
                    soiling = 25.0 if is_warning else (45.0 if is_critical else random.uniform(3, 6))
                    
                    # Apply faults
                    if is_critical:
                        cell_temp += 15.0  # Overheating
                        volt -= 12.0
                    
                    curr = max(0.1, (gti / 750.0) * 8.5 * (1.0 - soiling / 100.0) + jitter)
                    power_kw = (volt * curr) / 1000.0
                    
                else: # Wind
                    cell_temp = ambient_temp + 5.0
                    volt = 690.0 + jitter*5
                    curr = 35.0 + jitter
                    power_kw = 1.2
                    gti = 0.0
                    soiling = 0.0

                reading = SensorReading(
                    asset_id=asset.id,
                    timestamp=t,
                    temperature=round(cell_temp, 1),
                    voltage=round(volt, 1),
                    current=round(curr, 2),
                    vibration_rms=round(gti, 1), # Reusing for irradiance
                    soiling_level=round(soiling, 1),
                    power_output_kw=round(power_kw, 3),
                    wind_speed=round(3.5 + random.gauss(0, 1), 1)
                )
                db.session.add(reading)
                
            # Create Alert if anomalous
            if is_critical or is_warning:
                alert = Alert(
                    asset_id=asset.id,
                    timestamp=now,
                    anomaly_score=round(95.5 if is_critical else 65.2, 1),
                    risk_level="Critical" if is_critical else "Medium",
                    estimated_energy_loss=round(6.5 if is_critical else 2.1, 2),
                    estimated_revenue_loss=round(52.0 if is_critical else 16.8, 2),
                    status="ACTIVE"
                )
                db.session.add(alert)
                
        db.session.commit()
        print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
