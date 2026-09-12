from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.Database import Alert, Asset, db

alerts_bp = Blueprint("alerts", __name__, url_prefix="/api/alerts")


def error_response(code, message, details=None, status=400):
    return jsonify({"error": {"code": code, "message": message, "details": details or {}}}), status


SEVERITY_MAP = {"Low": "LOW", "Medium": "MEDIUM", "High": "HIGH", "Critical": "CRITICAL"}


def alert_to_frontend(a):
    asset = Asset.query.get(a.asset_id)
    return {
        "id": str(a.id),
        "asset_id": str(a.asset_id),
        "severity": SEVERITY_MAP.get(a.risk_level, "MEDIUM"),
        "title": f"{a.risk_level or 'Unknown'} risk anomaly on {asset.name if asset else a.asset_id}",
        "message": f"Anomaly score: {a.anomaly_score}. Estimated revenue loss: {a.estimated_revenue_loss}",
        "risk": a.anomaly_score or 0,
        "status": a.status.upper() if a.status else "ACTIVE",
        "created_at": a.timestamp.isoformat() if a.timestamp else None,
    }


@alerts_bp.route("/", methods=["GET"])
@jwt_required()
def list_alerts():
    alerts = Alert.query.order_by(Alert.timestamp.desc()).all()
    return jsonify({"success": True, "data": [alert_to_frontend(a) for a in alerts]}), 200


@alerts_bp.route("/<int:alert_id>", methods=["PATCH"])
@jwt_required()
def update_alert(alert_id):
    a = Alert.query.get(alert_id)
    if not a:
        return error_response("not_found", f"Alert {alert_id} not found.", status=404)
    data = request.get_json() or {}
    new_status = data.get("status")
    allowed = {"ACTIVE", "ACKNOWLEDGED", "RESOLVED"}
    if not new_status or new_status.upper() not in allowed:
        return error_response("invalid_status",
                              f"status must be one of: {', '.join(allowed)}.",
                              {"field": "status", "received": new_status})
    a.status = new_status.upper()
    db.session.commit()
    return jsonify({"success": True, "data": alert_to_frontend(a)}), 200
