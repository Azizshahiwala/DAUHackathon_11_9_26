"""maths.py – Renewable-energy calculation endpoints and Open-Meteo forecast integration.

All routes return structured JSON.
Success:  { ...result fields... }
Error:    { "error": { "code": "...", "message": "...", "details": {...} } }
"""

from flask import Blueprint, request, jsonify
import math
import requests
from flask_jwt_extended import jwt_required
from app.config import Config

maths_bp = Blueprint("maths", __name__, url_prefix="/api/maths")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def error_response(code: str, message: str, details: dict = None, status: int = 400):
    """Return a structured JSON error response.

    Args:
        code:    Machine-readable error code string.
        message: Human-readable description.
        details: Optional extra context dict.
        status:  HTTP status code (default 400).
    """
    payload = {"error": {"code": code, "message": message, "details": details or {}}}
    return jsonify(payload), status


def require_numeric(*args, names=None):
    """Validate that all values are int or float.

    Returns an error_response tuple if validation fails, otherwise None.
    """
    names = names or [f"arg{i}" for i in range(len(args))]
    for val, name in zip(args, names):
        if not isinstance(val, (int, float)):
            return error_response(
                "invalid_type",
                f"Field '{name}' must be a number.",
                {"field": name, "received": type(val).__name__},
            )
    return None


def require_fields(data: dict, *fields):
    """Check all field names are present and not None in data.

    Returns an error_response tuple if any field is missing, otherwise None.
    """
    missing = [f for f in fields if data.get(f) is None]
    if missing:
        return error_response(
            "missing_fields",
            f"Required field(s) missing: {', '.join(missing)}",
            {"fields": missing},
        )
    return None


# ---------------------------------------------------------------------------
# 1. Solar Expected Power
# ---------------------------------------------------------------------------

@maths_bp.route("/solar_expected", methods=["POST"])
@jwt_required()
def solar_expected():
    """Calculate expected solar power output (kW).

    Body (JSON):
        rated_capacity_kW (float): Panel rated capacity in kilowatts.
        GTI              (float): Global Tilted Irradiance in W/m².
        eta_system       (float): System efficiency (0–1).
        eta_temp         (float): Temperature derating factor (0–1).

    Returns:
        expected_power_kW, plus all input parameters echoed back.
    """
    data = request.get_json() or {}
    err = require_fields(data, "rated_capacity_kW", "GTI", "eta_system", "eta_temp")
    if err:
        return err

    rated_capacity_kW = data["rated_capacity_kW"]
    GTI = data["GTI"]
    eta_system = data["eta_system"]
    eta_temp = data["eta_temp"]

    type_err = require_numeric(
        rated_capacity_kW, GTI, eta_system, eta_temp,
        names=["rated_capacity_kW", "GTI", "eta_system", "eta_temp"],
    )
    if type_err:
        return type_err

    expected_power_kW = rated_capacity_kW * (GTI / 1000.0) * eta_system * eta_temp
    return jsonify({
        "expected_power_kW": round(expected_power_kW, 3),
        "rated_capacity_kW": rated_capacity_kW,
        "GTI_W_m2": GTI,
        "eta_system": eta_system,
        "eta_temp": eta_temp,
    }), 200


# ---------------------------------------------------------------------------
# 2. Temperature Derating Factor (η_temp)
# ---------------------------------------------------------------------------

@maths_bp.route("/temp_derate", methods=["POST"])
@jwt_required()
def temp_derate():
    """Calculate cell temperature and temperature derating factor.

    Body (JSON):
        ambient_temp (float): Ambient temperature in °C.
        NOCT         (float): Nominal Operating Cell Temperature in °C.
        GTI          (float): Global Tilted Irradiance in W/m².
        gamma        (float): Temperature coefficient per °C (e.g. 0.004).

    Returns:
        cell_temp_C (float): Estimated cell temperature.
        eta_temp    (float): Derating factor (η_temp).
    """
    data = request.get_json() or {}
    err = require_fields(data, "ambient_temp", "NOCT", "GTI", "gamma")
    if err:
        return err

    ambient_temp = data["ambient_temp"]
    NOCT = data["NOCT"]
    GTI = data["GTI"]
    gamma = data["gamma"]

    type_err = require_numeric(
        ambient_temp, NOCT, GTI, gamma,
        names=["ambient_temp", "NOCT", "GTI", "gamma"],
    )
    if type_err:
        return type_err

    cell_temp = ambient_temp + (NOCT - 20) * (GTI / 800.0)
    eta_temp = 1 - gamma * (cell_temp - 25)
    return jsonify({
        "cell_temp_C": round(cell_temp, 2),
        "eta_temp": round(eta_temp, 4),
    }), 200


# ---------------------------------------------------------------------------
# 3. Solar Deviation %
# ---------------------------------------------------------------------------

@maths_bp.route("/solar_deviation", methods=["POST"])
@jwt_required()
def solar_deviation():
    """Calculate deviation (%) between expected and actual solar power.

    Body (JSON):
        expected_power_kW (float): Expected power in kW.
        actual_power_kW   (float): Measured power in kW.

    Returns:
        deviation_pct (float): Positive means under-performance.
    """
    data = request.get_json() or {}
    err = require_fields(data, "expected_power_kW", "actual_power_kW")
    if err:
        return err

    expected_power_kW = data["expected_power_kW"]
    actual_power_kW = data["actual_power_kW"]

    type_err = require_numeric(
        expected_power_kW, actual_power_kW,
        names=["expected_power_kW", "actual_power_kW"],
    )
    if type_err:
        return type_err

    if expected_power_kW == 0:
        return error_response(
            "division_by_zero",
            "expected_power_kW cannot be zero.",
            {"field": "expected_power_kW"},
        )

    deviation_pct = (expected_power_kW - actual_power_kW) / expected_power_kW * 100.0
    return jsonify({
        "deviation_pct": round(deviation_pct, 2),
        "expected_power_kW": expected_power_kW,
        "actual_power_kW": actual_power_kW,
    }), 200


# ---------------------------------------------------------------------------
# 4. Wind Expected Power (physics-based)
# ---------------------------------------------------------------------------

@maths_bp.route("/wind_expected", methods=["POST"])
@jwt_required()
def wind_expected():
    """Calculate expected wind turbine power output (kW).

    Body (JSON):
        rho              (float): Air density in kg/m³.
        rotor_radius     (float): Rotor blade radius in metres.
        wind_speed       (float): Wind speed in m/s.
        Cp               (float): Power coefficient (0–0.593).
        eta_gen          (float): Generator efficiency (0–1).
        rated_capacity_kW (float): Turbine rated capacity in kW (hard cap).

    Returns:
        expected_power_kW (float): Calculated output, capped at rated capacity.
        capped            (bool):  True if output was capped.
        wind_speed_ms     (float): Wind speed echoed back.
    """
    data = request.get_json() or {}
    err = require_fields(data, "rho", "rotor_radius", "wind_speed", "Cp", "eta_gen", "rated_capacity_kW")
    if err:
        return err

    rho = data["rho"]
    rotor_radius = data["rotor_radius"]
    wind_speed = data["wind_speed"]
    Cp = data["Cp"]
    eta_gen = data["eta_gen"]
    rated_capacity_kW = data["rated_capacity_kW"]

    type_err = require_numeric(
        rho, rotor_radius, wind_speed, Cp, eta_gen, rated_capacity_kW,
        names=["rho", "rotor_radius", "wind_speed", "Cp", "eta_gen", "rated_capacity_kW"],
    )
    if type_err:
        return type_err

    area = math.pi * rotor_radius ** 2
    power_w = 0.5 * rho * area * (wind_speed ** 3) * Cp * eta_gen
    power_kW = power_w / 1000.0
    capped = False
    if power_kW > rated_capacity_kW:
        power_kW = rated_capacity_kW
        capped = True
    return jsonify({
        "expected_power_kW": round(power_kW, 3),
        "capped": capped,
        "wind_speed_ms": wind_speed,
    }), 200


# ---------------------------------------------------------------------------
# 5. Wind Speed State (cut-in / rated / cut-out)
# ---------------------------------------------------------------------------

@maths_bp.route("/wind_limits", methods=["POST"])
@jwt_required()
def wind_limits():
    """Classify wind speed into an operational state.

    Body (JSON):
        wind_speed       (float): Current wind speed in m/s.
        rated_wind_speed (float): Rated wind speed in m/s.

    Returns:
        wind_speed_ms     (float): Input wind speed.
        state             (str):   Operational state label.
        expected_power_kW (float|None): 0 outside operational range, None otherwise
                                         (use wind_expected for the numeric value).
    """
    data = request.get_json() or {}
    err = require_fields(data, "wind_speed", "rated_wind_speed")
    if err:
        return err

    wind_speed = data["wind_speed"]
    rated_wind_speed = data["rated_wind_speed"]

    type_err = require_numeric(
        wind_speed, rated_wind_speed,
        names=["wind_speed", "rated_wind_speed"],
    )
    if type_err:
        return type_err

    if wind_speed < 3:
        state = "below_cut_in"
        expected_power = 0
    elif wind_speed > 25:
        state = "cut_out_shutdown"
        expected_power = 0
    elif wind_speed > rated_wind_speed:
        state = "above_rated_speed"
        expected_power = None
    else:
        state = "normal_operation"
        expected_power = None

    return jsonify({
        "wind_speed_ms": wind_speed,
        "state": state,
        "expected_power_kW": expected_power,
    }), 200


# ---------------------------------------------------------------------------
# 6. Air Density Correction
# ---------------------------------------------------------------------------

@maths_bp.route("/air_density", methods=["POST"])
@jwt_required()
def air_density():
    """Calculate air density using the ideal-gas law.

    Body (JSON):
        pressure_pa   (float): Atmospheric pressure in Pascals.
        temperature_c (float): Air temperature in °C.

    Returns:
        air_density_kg_m3 (float): Air density in kg/m³.
        temperature_k     (float): Temperature converted to Kelvin.
    """
    data = request.get_json() or {}
    err = require_fields(data, "pressure_pa", "temperature_c")
    if err:
        return err

    pressure_pa = data["pressure_pa"]
    temperature_c = data["temperature_c"]

    type_err = require_numeric(
        pressure_pa, temperature_c,
        names=["pressure_pa", "temperature_c"],
    )
    if type_err:
        return type_err

    R = 287.05  # Specific gas constant for dry air, J/(kg·K)
    temperature_k = temperature_c + 273.15
    rho = pressure_pa / (R * temperature_k)
    return jsonify({
        "air_density_kg_m3": round(rho, 4),
        "pressure_pa": pressure_pa,
        "temperature_k": round(temperature_k, 2),
    }), 200


# ---------------------------------------------------------------------------
# 7. Soiling Derate (solar)
# ---------------------------------------------------------------------------

@maths_bp.route("/soiling_derate", methods=["POST"])
@jwt_required()
def soiling_derate():
    """Apply soiling derate to expected solar power.

    Body (JSON):
        expected_power_kW       (float): Expected power before soiling in kW.
        soiling_accumulation_rate (float): Rate of soiling accumulation (dimensionless).
        k_factor                (float): Soiling sensitivity factor.
        max_soiling_loss        (float): Maximum allowable soiling loss fraction (0–1).

    Returns:
        soiling_derate           (float): Derate factor applied.
        soiled_expected_power_kW (float): Adjusted expected power in kW.
    """
    data = request.get_json() or {}
    err = require_fields(data, "expected_power_kW", "soiling_accumulation_rate", "k_factor", "max_soiling_loss")
    if err:
        return err

    expected_power_kW = data["expected_power_kW"]
    soiling_accumulation_rate = data["soiling_accumulation_rate"]
    k_factor = data["k_factor"]
    max_soiling_loss = data["max_soiling_loss"]

    type_err = require_numeric(
        expected_power_kW, soiling_accumulation_rate, k_factor, max_soiling_loss,
        names=["expected_power_kW", "soiling_accumulation_rate", "k_factor", "max_soiling_loss"],
    )
    if type_err:
        return type_err

    soiling_derate_val = 1 - min(soiling_accumulation_rate * k_factor, max_soiling_loss)
    soiled_expected = expected_power_kW * soiling_derate_val
    return jsonify({
        "soiling_derate": round(soiling_derate_val, 4),
        "soiled_expected_power_kW": round(soiled_expected, 3),
    }), 200


# ---------------------------------------------------------------------------
# 8. Persistence Score
# ---------------------------------------------------------------------------

@maths_bp.route("/persistence", methods=["POST"])
@jwt_required()
def persistence():
    """Calculate persistence score: fraction of time windows exceeding threshold.

    Body (JSON):
        deviation_pct_list (list[float]): List of deviation percentages.
        threshold          (float):       Threshold in % above which deviation is flagged (default 15).

    Returns:
        persist_score   (float): Fraction of windows exceeding threshold.
        windows_checked (int):   Total number of deviation windows.
        exceeding       (int):   Number of windows exceeding the threshold.
    """
    data = request.get_json() or {}
    deviations = data.get("deviation_pct_list")
    threshold = data.get("threshold", 15)

    if not isinstance(deviations, list) or len(deviations) == 0:
        return error_response(
            "invalid_input",
            "deviation_pct_list must be a non-empty list of numbers.",
            {"field": "deviation_pct_list"},
        )
    if not all(isinstance(d, (int, float)) for d in deviations):
        return error_response(
            "invalid_type",
            "All values in deviation_pct_list must be numbers.",
            {"field": "deviation_pct_list"},
        )
    if not isinstance(threshold, (int, float)):
        return error_response(
            "invalid_type",
            "threshold must be a number.",
            {"field": "threshold"},
        )

    exceed = sum(1 for d in deviations if abs(d) > threshold)
    score = exceed / len(deviations)
    return jsonify({
        "persist_score": round(score, 4),
        "windows_checked": len(deviations),
        "exceeding": exceed,
    }), 200


# ---------------------------------------------------------------------------
# 9. Risk Score (weighted sum)
# ---------------------------------------------------------------------------

@maths_bp.route("/risk_score", methods=["POST"])
@jwt_required()
def risk_score():
    """Compute a weighted risk score (0–100) and classify risk level.

    Weights:
        anomaly_severity  × 0.40
        performance_loss  × 0.25
        persistence       × 0.20
        asset_criticality × 0.15

    Body (JSON):
        anomaly_severity  (float): 0–100 score.
        performance_loss  (float): 0–100 score.
        persistence       (float): 0–100 score.
        asset_criticality (float): 0–100 score.

    Returns:
        risk_score (float): Weighted sum.
        risk_level (str):   "Low" | "Medium" | "High" | "Critical".
    """
    data = request.get_json() or {}
    err = require_fields(data, "anomaly_severity", "performance_loss", "persistence", "asset_criticality")
    if err:
        return err

    anomaly_severity = data["anomaly_severity"]
    performance_loss = data["performance_loss"]
    persist = data["persistence"]
    asset_criticality = data["asset_criticality"]

    type_err = require_numeric(
        anomaly_severity, performance_loss, persist, asset_criticality,
        names=["anomaly_severity", "performance_loss", "persistence", "asset_criticality"],
    )
    if type_err:
        return type_err

    score = (
        0.40 * anomaly_severity
        + 0.25 * performance_loss
        + 0.20 * persist
        + 0.15 * asset_criticality
    )

    if score <= 20:
        level = "Low"
    elif score <= 60:
        level = "Medium"
    elif score <= 80:
        level = "High"
    else:
        level = "Critical"

    return jsonify({
        "risk_score": round(score, 2),
        "risk_level": level,
    }), 200


# ---------------------------------------------------------------------------
# 10. Energy & Revenue Loss
# ---------------------------------------------------------------------------

@maths_bp.route("/energy_revenue_loss", methods=["POST"])
@jwt_required()
def energy_revenue_loss():
    """Estimate energy loss (kWh) and associated revenue loss.

    Body (JSON):
        expected_power_kW (float): Expected power in kW.
        loss_fraction     (float): Fraction of power lost (0–1).
        affected_hours    (float): Duration of the loss event in hours.
        tariff            (float): Electricity tariff (currency unit per kWh).

    Returns:
        energy_loss_kWh (float): Total energy lost.
        revenue_loss    (float): Revenue impact in the tariff currency.
    """
    data = request.get_json() or {}
    err = require_fields(data, "expected_power_kW", "loss_fraction", "affected_hours", "tariff")
    if err:
        return err

    expected_power_kW = data["expected_power_kW"]
    loss_fraction = data["loss_fraction"]
    affected_hours = data["affected_hours"]
    tariff = data["tariff"]

    type_err = require_numeric(
        expected_power_kW, loss_fraction, affected_hours, tariff,
        names=["expected_power_kW", "loss_fraction", "affected_hours", "tariff"],
    )
    if type_err:
        return type_err

    energy_loss_kWh = expected_power_kW * loss_fraction * affected_hours
    revenue_loss = energy_loss_kWh * tariff
    return jsonify({
        "energy_loss_kWh": round(energy_loss_kWh, 3),
        "revenue_loss": round(revenue_loss, 3),
    }), 200


# ---------------------------------------------------------------------------
# 11. Open-Meteo ECMWF Weather Forecast
# ---------------------------------------------------------------------------

@maths_bp.route("/weather_forecast", methods=["POST"])
@jwt_required()
def weather_forecast():
    """Fetch an ECMWF weather forecast from Open-Meteo for a given location.

    Body (JSON):
        latitude  (float):      Location latitude (-90 to 90).
        longitude (float):      Location longitude (-180 to 180).
        hourly    (list[str]):  List of Open-Meteo hourly variable names,
                                e.g. ["temperature_2m", "shortwave_radiation"].

    Returns:
        Full Open-Meteo JSON response (hourly time-series data).

    Errors:
        400 – missing or invalid fields.
        502 – could not reach Open-Meteo API.
    """
    data = request.get_json() or {}
    lat = data.get("latitude")
    lon = data.get("longitude")
    hourly = data.get("hourly")

    # Presence checks
    if lat is None or lon is None:
        return error_response(
            "missing_fields",
            "latitude and longitude are required.",
            {"fields": ["latitude", "longitude"]},
        )
    if not hourly:
        return error_response(
            "missing_fields",
            "hourly must be a non-empty list of variable names.",
            {"fields": ["hourly"]},
        )

    # Type checks
    type_err = require_numeric(lat, lon, names=["latitude", "longitude"])
    if type_err:
        return type_err
    if not isinstance(hourly, list) or not all(isinstance(v, str) for v in hourly):
        return error_response(
            "invalid_type",
            "hourly must be a list of strings.",
            {"field": "hourly"},
        )

    # Range checks
    if not (-90 <= lat <= 90):
        return error_response("invalid_value", "latitude must be between -90 and 90.", {"field": "latitude"})
    if not (-180 <= lon <= 180):
        return error_response("invalid_value", "longitude must be between -180 and 180.", {"field": "longitude"})

    base_url = Config.load_openmeteo()
    params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": ",".join(hourly),
        "timezone": "UTC",
    }

    try:
        resp = requests.get(base_url, params=params, timeout=10)
        resp.raise_for_status()
    except requests.Timeout:
        return error_response(
            "external_timeout",
            "Request to Open-Meteo timed out.",
            {},
            status=502,
        )
    except requests.HTTPError as exc:
        return error_response(
            "external_http_error",
            "Open-Meteo returned an error response.",
            {"http_status": resp.status_code, "details": str(exc)},
            status=502,
        )
    except requests.RequestException as exc:
        return error_response(
            "external_service_error",
            "Failed to connect to Open-Meteo.",
            {"details": str(exc)},
            status=502,
        )

    return jsonify(resp.json()), 200
