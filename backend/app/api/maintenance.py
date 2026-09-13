from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models.Database import MaintenanceLog, Alert, Asset, db

maintenance_bp = Blueprint("maintenance", __name__, url_prefix="/api/maintenance")


def error_response(code, message, details=None, status=400):
    return jsonify({"error": {"code": code, "message": message, "details": details or {}}}), status


def task_to_frontend(m):
    asset = Asset.query.get(m.asset_id)
    alert = Alert.query.get(m.alert_id) if m.alert_id else None
    return {
        "id": str(m.id),
        "asset_id": str(m.asset_id),
        "issue": m.action_taken or "Maintenance required",
        "fault_type": "none",
        "risk": alert.anomaly_score if alert else 0,
        "priority": "ROUTINE",
        "recommended_action": m.notes or m.action_taken or "Inspect asset.",
        "estimated_energy_loss_kwh": alert.estimated_energy_loss if alert else 0,
        "estimated_revenue_loss": alert.estimated_revenue_loss if alert else 0,
        "maintenance_status": "PENDING",
        "created_at": m.timestamp.isoformat() if m.timestamp else None,
        "assigned_to": str(m.technician_id) if m.technician_id else None,
    }

def alert_to_task(alert):
    return {
        "id": f"TASK-{alert.asset_id}",
        "asset_id": str(alert.asset_id),
        "issue": f"Autoencoder Trigger: {alert.risk_level} Anomaly",
        "fault_type": "combined" if alert.anomaly_score > 90 else "soiling",
        "risk": alert.anomaly_score,
        "priority": "URGENT" if alert.risk_level == "Critical" else "HIGH",
        "recommended_action": "Immediate on-site technical inspection required.",
        "estimated_energy_loss_kwh": alert.estimated_energy_loss,
        "estimated_revenue_loss": alert.estimated_revenue_loss,
        "maintenance_status": "PENDING",
        "created_at": alert.timestamp.isoformat() if alert.timestamp else None,
        "assigned_to": "Field Dispatch",
    }

@maintenance_bp.route("/", methods=["GET"])
@jwt_required()
def list_tasks():
    # Fetch actual logs
    logs = MaintenanceLog.query.order_by(MaintenanceLog.timestamp.desc()).all()
    tasks = [task_to_frontend(m) for m in logs]
    
    # Also inject active alerts as pending maintenance tasks for the board
    active_alerts = Alert.query.filter_by(status="ACTIVE").all()
    for alert in active_alerts:
        tasks.append(alert_to_task(alert))
        
    return jsonify({"success": True, "data": tasks}), 200


@maintenance_bp.route("/<int:task_id>", methods=["PATCH"])
@jwt_required()
def update_task(task_id):
    m = MaintenanceLog.query.get(task_id)
    if not m:
        return error_response("not_found", f"Maintenance task {task_id} not found.", status=404)
    data = request.get_json() or {}
    new_status = data.get("maintenance_status")
    allowed = {"PENDING", "SCHEDULED", "IN_PROGRESS", "COMPLETED"}
    if new_status and new_status.upper() not in allowed:
        return error_response("invalid_status",
                              f"maintenance_status must be one of: {', '.join(allowed)}.",
                              {"field": "maintenance_status", "received": new_status})
    if new_status:
        m.notes = (m.notes or "") + f" [Status updated to {new_status.upper()}]"
        db.session.commit()
    return jsonify({"success": True, "data": task_to_frontend(m)}), 200
