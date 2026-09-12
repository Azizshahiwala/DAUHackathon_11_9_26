from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required
from app.models.Database import Asset, SensorReading, db

assets_bp = Blueprint("assets", __name__, url_prefix="/api/assets")


def error_response(code, message, details=None, status=400):
    return jsonify({"error": {"code": code, "message": message, "details": details or {}}}), status


def asset_to_frontend(a):
    latest = (SensorReading.query
              .filter_by(asset_id=a.id)
              .order_by(SensorReading.timestamp.desc())
              .first())
    reading = {}
    if latest:
        reading = {
            "reading_id": str(latest.id),
            "asset_id": str(a.id),
            "timestamp": latest.timestamp.isoformat() if latest.timestamp else None,
            "temperature": latest.temperature or 0,
            "voltage": latest.voltage or 0,
            "current": latest.current or 0,
            "irradiance": latest.vibration_rms or 0,
            "soiling": latest.soiling_level or 0,
            "power_output": latest.power_output_kw or 0,
        }
    return {
        "asset_id": str(a.id),
        "asset_type": "solar_panel" if a.type == "solar" else "wind_turbine",
        "location": a.location or "Unknown",
        "status": a.status or "HEALTHY",
        "current_readings": reading,
        "prediction": {
            "asset_id": str(a.id),
            "anomaly": False,
            "reconstruction_error": 0,
            "risk_score": 0,
            "risk_level": "NORMAL",
            "failure_risk": 0,
            "fault_type": "none",
            "maintenance_priority": "ROUTINE",
            "recommended_action": "Asset operating within nominal range.",
            "energy_loss_kwh": 0,
            "revenue_loss": 0,
        },
        "last_updated": latest.timestamp.isoformat() if latest and latest.timestamp else None,
    }


@assets_bp.route("/", methods=["GET"])
@jwt_required()
def list_assets():
    assets = Asset.query.all()
    return jsonify({"success": True, "data": [asset_to_frontend(a) for a in assets]}), 200


@assets_bp.route("/<int:asset_id>", methods=["GET"])
@jwt_required()
def get_asset(asset_id):
    a = Asset.query.get(asset_id)
    if not a:
        return error_response("not_found", f"Asset {asset_id} not found.", status=404)
    return jsonify({"success": True, "data": asset_to_frontend(a)}), 200


@assets_bp.route("/<int:asset_id>/readings", methods=["GET"])
@jwt_required()
def get_readings(asset_id):
    rows = (SensorReading.query
            .filter_by(asset_id=asset_id)
            .order_by(SensorReading.timestamp.desc())
            .limit(100)
            .all())
    data = [{
        "reading_id": str(r.id),
        "asset_id": str(r.asset_id),
        "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        "temperature": r.temperature,
        "voltage": r.voltage,
        "current": r.current,
        "irradiance": r.vibration_rms,
        "soiling": r.soiling_level,
        "power_output": r.power_output_kw,
        "wind_speed": r.wind_speed,
    } for r in rows]
    return jsonify({"success": True, "data": data}), 200
