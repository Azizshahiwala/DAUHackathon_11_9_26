from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models.Database import Asset, SensorReading, User, db
from datetime import datetime

assets_bp = Blueprint("assets", __name__, url_prefix="/api/assets")

# ── Role constants ─────────────────────────────────────────────────────────────
ROLE_MANAGER    = "manager"
ROLE_OPERATOR   = "operator"
ROLE_TECHNICIAN = "technician"

# Roles allowed to CREATE assets (plant managers and operators)
CAN_ADD_ASSETS  = {ROLE_MANAGER, ROLE_OPERATOR}

# ── Helpers ────────────────────────────────────────────────────────────────────
def error_response(code, message, details=None, status=400):
    return jsonify({"error": {"code": code, "message": message, "details": details or {}}}), status


def get_current_user():
    """Return the User object for the JWT identity, or None."""
    identity = get_jwt_identity()
    if not identity:
        return None
    return User.query.get(int(identity))


def asset_to_frontend(a):
    latest = (SensorReading.query
              .filter_by(asset_id=a.id)
              .order_by(SensorReading.timestamp.desc())
              .first())
    reading = {}
    if latest:
        reading = {
            "reading_id": str(latest.id),
            "asset_id":   str(a.id),
            "timestamp":  latest.timestamp.isoformat() if latest.timestamp else None,
            "temperature": latest.temperature  or 0,
            "voltage":     latest.voltage      or 0,
            "current":     latest.current      or 0,
            "irradiance":  latest.vibration_rms or 0,
            "soiling":     latest.soiling_level or 0,
            "power_output":latest.power_output_kw or 0,
        }
    return {
        "asset_id":    str(a.id),
        "name":        a.name,
        "plant_name":  a.plant_name or a.name,
        "asset_type":  "solar_panel" if a.type == "solar" else "wind_turbine",
        "location":    a.location or "Unknown",
        "latitude":    a.latitude,
        "longitude":   a.longitude,
        "rated_power_kw": a.rated_power_kw,
        "string_group":   a.string_group,
        "commissioned_date": a.commissioned_date.isoformat() if a.commissioned_date else None,
        "status":      a.status or "HEALTHY",
        # Audit trail
        "added_by_user_id": a.added_by_user_id,
        "added_by_email":   a.added_by_email,
        "added_at":         a.added_at.isoformat() if a.added_at else None,
        "current_readings": reading,
        "prediction": {
            "asset_id": str(a.id),
            "anomaly": False, "reconstruction_error": 0,
            "risk_score": 0, "risk_level": "NORMAL",
            "failure_risk": 0, "fault_type": "none",
            "maintenance_priority": "ROUTINE",
            "recommended_action": "Asset operating within nominal range.",
            "energy_loss_kwh": 0, "revenue_loss": 0,
        },
        "last_updated": latest.timestamp.isoformat() if latest and latest.timestamp else None,
    }


# ── Routes ─────────────────────────────────────────────────────────────────────

@assets_bp.route("/", methods=["GET"])
@jwt_required(optional=True)
def list_assets():
    """List all assets. Public (optional JWT)."""
    assets = Asset.query.order_by(Asset.added_at.desc()).all()
    return jsonify({"success": True, "data": [asset_to_frontend(a) for a in assets]}), 200


@assets_bp.route("/<int:asset_id>", methods=["GET"])
@jwt_required(optional=True)
def get_asset(asset_id):
    """Get a single asset by ID."""
    a = Asset.query.get(asset_id)
    if not a:
        return error_response("not_found", f"Asset {asset_id} not found.", status=404)
    return jsonify({"success": True, "data": asset_to_frontend(a)}), 200


@assets_bp.route("/<int:asset_id>/readings", methods=["GET"])
@jwt_required(optional=True)
def get_readings(asset_id):
    """Get the last 100 sensor readings for an asset."""
    rows = (SensorReading.query
            .filter_by(asset_id=asset_id)
            .order_by(SensorReading.timestamp.desc())
            .limit(100).all())
    data = [{
        "reading_id":   str(r.id),
        "asset_id":     str(r.asset_id),
        "timestamp":    r.timestamp.isoformat() if r.timestamp else None,
        "temperature":  r.temperature,
        "voltage":      r.voltage,
        "current":      r.current,
        "irradiance":   r.vibration_rms,
        "soiling":      r.soiling_level,
        "power_output": r.power_output_kw,
        "wind_speed":   r.wind_speed,
    } for r in rows]
    return jsonify({"success": True, "data": data}), 200


@assets_bp.route("/", methods=["POST"])
@jwt_required()
def create_asset():
    """Create a new asset (power plant unit).

    Roles allowed: manager, operator.
    The requesting user is automatically recorded as added_by.

    Body (JSON):
        name             (str, required): Unit name, e.g. "SP-101"
        plant_name       (str, required): Power plant / farm name
        type             (str, required): "solar" | "wind"
        location         (str, required): Human-readable address / sector
        latitude         (float, required)
        longitude        (float, required)
        rated_power_kw   (float, optional)
        string_group     (str, optional):  e.g. "String-A1"
        commissioned_date (str, optional): ISO date "YYYY-MM-DD"
    """
    user = get_current_user()
    if not user:
        return error_response("unauthorized", "Valid authentication required.", status=401)
    if user.role not in CAN_ADD_ASSETS:
        return error_response(
            "forbidden",
            f"Your role '{user.role}' cannot add assets. "
            "Only managers and operators may register new power-plant units.",
            {"required_roles": list(CAN_ADD_ASSETS), "your_role": user.role},
            status=403,
        )

    data = request.get_json() or {}
    required = ["name", "plant_name", "type", "location", "latitude", "longitude"]
    missing  = [f for f in required if data.get(f) is None]
    if missing:
        return error_response("missing_fields",
                              f"Required field(s) missing: {', '.join(missing)}",
                              {"fields": missing})

    if data["type"] not in ("solar", "wind"):
        return error_response("invalid_value", "type must be 'solar' or 'wind'.", {"field": "type"})

    commissioned = None
    if data.get("commissioned_date"):
        try:
            commissioned = datetime.strptime(data["commissioned_date"], "%Y-%m-%d").date()
        except ValueError:
            return error_response("invalid_value",
                                  "commissioned_date must be in YYYY-MM-DD format.",
                                  {"field": "commissioned_date"})

    asset = Asset(
        name             = data["name"],
        plant_name       = data["plant_name"],
        type             = data["type"],
        location         = data["location"],
        latitude         = float(data["latitude"]),
        longitude        = float(data["longitude"]),
        rated_power_kw   = float(data["rated_power_kw"]) if data.get("rated_power_kw") else None,
        string_group     = data.get("string_group"),
        commissioned_date= commissioned,
        status           = "HEALTHY",
        added_by_user_id = user.id,
        added_by_email   = user.email,
    )
    db.session.add(asset)
    db.session.commit()
    return jsonify({"success": True, "data": asset_to_frontend(asset)}), 201
