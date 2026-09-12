from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
import requests as http_requests
from app.models.Database import Asset, Alert, db
from app.config import Config

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api")


def error_response(code, message, details=None, status=400):
    return jsonify({"error": {"code": code, "message": message, "details": details or {}}}), status


@analytics_bp.route("/analytics/kpi", methods=["GET"])
@jwt_required()
def kpi():
    total = Asset.query.count()
    healthy = Asset.query.filter_by(status="HEALTHY").count()
    warning = Asset.query.filter_by(status="WARNING").count()
    critical = Asset.query.filter_by(status="CRITICAL").count()
    active_alerts = Alert.query.filter_by(status="ACTIVE").count()
    from sqlalchemy import func
    loss_row = db.session.query(
        func.sum(Alert.estimated_energy_loss),
        func.sum(Alert.estimated_revenue_loss)
    ).filter(Alert.status == "ACTIVE").one()
    energy_loss = float(loss_row[0] or 0)
    revenue_loss = float(loss_row[1] or 0)
    return jsonify({
        "success": True,
        "data": {
            "total_assets": total,
            "healthy_assets": healthy,
            "warning_assets": warning,
            "critical_assets": critical,
            "active_alerts": active_alerts,
            "total_energy_loss_kwh": round(energy_loss, 2),
            "total_revenue_loss": round(revenue_loss, 2),
            "fleet_efficiency": round((healthy / total * 100) if total else 0, 1),
            "open_meteo_ambient": None,
        }
    }), 200


@analytics_bp.route("/weather", methods=["GET"])
@jwt_required()
def weather():
    try:
        base_url = Config.load_openmeteo()
        params = {
            "latitude": 23.0225,
            "longitude": 72.5714,
            "hourly": "temperature_2m,shortwave_radiation,cloud_cover,wind_speed_10m,wind_direction_10m",
            "timezone": "UTC",
            "forecast_days": 1,
        }
        resp = http_requests.get(base_url, params=params, timeout=10)
        resp.raise_for_status()
        raw = resp.json()
        hourly = raw.get("hourly", {})
        idx = 0
        data = {
            "ambient_temperature": (hourly.get("temperature_2m") or [None])[idx],
            "solar_radiation":     (hourly.get("shortwave_radiation") or [None])[idx],
            "cloud_cover":         (hourly.get("cloud_cover") or [None])[idx],
            "wind_speed":          (hourly.get("wind_speed_10m") or [None])[idx],
            "wind_direction":      (hourly.get("wind_direction_10m") or [None])[idx],
            "last_fetched":        (hourly.get("time") or [None])[idx],
        }
        return jsonify({"success": True, "data": data}), 200
    except Exception as exc:
        return error_response("weather_fetch_failed", str(exc), status=502)


@analytics_bp.route("/model-performance", methods=["GET"])
@jwt_required()
def model_performance():
    data = {
        "model_name": "SolePulse Autoencoder v1",
        "architecture": "PyTorch Autoencoder – 6-feature input vector",
        "anomaly_threshold": 1.033187,
        "evaluation_dataset_size": 20000,
        "accuracy": 95.27,
        "precision": 87.45,
        "recall": 94.69,
        "f1_score": 90.93,
        "confusion_matrix": {
            "actual_normal":   {"correctly_classified": 14307, "false_anomalies": 681},
            "actual_abnormal": {"correctly_detected": 4746,   "missed": 266},
        },
        "fault_detection_rates": {
            "combined": 100.0, "low_current": 100.0, "low_voltage": 100.0,
            "overheating": 100.0, "soiling": 100.0,
            "power_degradation": 95.99, "partial_shading": 89.55,
            "gradual_degradation": 66.41,
        },
        "notes": "Evaluated on held-out synthetic dataset. Gradual degradation detection is intentionally lower due to subtle signal drift.",
    }
    return jsonify({"success": True, "data": data}), 200


@analytics_bp.route("/predict", methods=["POST"])
@jwt_required()
def predict():
    data = request.get_json() or {}
    # Stub heuristic – replace with real model call when AI/ML module is ready
    temperature = data.get("temperature", 35)
    soiling = data.get("soiling", 0)
    voltage = data.get("voltage", 38)
    is_anomaly = temperature > 60 or soiling > 30 or voltage < 28
    result = {
        "asset_id": data.get("asset_id", "UNKNOWN"),
        "anomaly": is_anomaly,
        "reconstruction_error": 38.42 if is_anomaly else 0.42,
        "risk_score": 95 if is_anomaly else 12,
        "risk_level": "CRITICAL" if is_anomaly else "NORMAL",
        "failure_risk": 92 if is_anomaly else 8,
        "fault_type": "overheating" if temperature > 60 else ("soiling" if soiling > 30 else "none"),
        "maintenance_priority": "URGENT" if is_anomaly else "ROUTINE",
        "recommended_action": ("Immediate on-site technical inspection required."
                               if is_anomaly else "Asset operating within nominal range."),
        "energy_loss_kwh": 5.2 if is_anomaly else 0,
        "revenue_loss": 41.6 if is_anomaly else 0,
    }
    return jsonify({"success": True, "data": result}), 200
