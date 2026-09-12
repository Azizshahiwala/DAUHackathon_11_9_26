from flask import Blueprint, request, jsonify
import math

def error_response(code, message, details=None, status=400):
    payload = {"error": {"code": code, "message": message, "details": details or {}}}
    return jsonify(payload), status

maths_bp = Blueprint('maths', __name__, url_prefix='/api/maths')

# 1. Solar Expected Power
@maths_bp.route('/solar_expected', methods=['POST'])
def solar_expected():
    data = request.get_json() or {}
    rated_capacity_kW = data.get('rated_capacity_kW')
    GTI = data.get('GTI')  # W/m^2
    eta_system = data.get('eta_system')
    eta_temp = data.get('eta_temp')
    if None in (rated_capacity_kW, GTI, eta_system, eta_temp):
        return jsonify({'error': 'missing required fields'}), 400
    expected_power_kW = rated_capacity_kW * (GTI / 1000.0) * eta_system * eta_temp
    return jsonify({
        'expected_power_kW': round(expected_power_kW, 3),
        'rated_capacity_kW': rated_capacity_kW,
        'GTI': GTI,
        'eta_system': eta_system,
        'eta_temp': eta_temp
    }), 200

# 2. Temperature Derating Factor (η_temp)
@maths_bp.route('/temp_derate', methods=['POST'])
def temp_derate():
    data = request.get_json() or {}
    ambient_temp = data.get('ambient_temp')  # °C
    NOCT = data.get('NOCT')
    GTI = data.get('GTI')
    gamma = data.get('gamma')  # per °C
    if None in (ambient_temp, NOCT, GTI, gamma):
        return jsonify({'error': 'missing required fields'}), 400
    cell_temp = ambient_temp + (NOCT - 20) * (GTI / 800.0)
    eta_temp = 1 - gamma * (cell_temp - 25)
    return jsonify({
        'cell_temp_C': round(cell_temp, 2),
        'eta_temp': round(eta_temp, 3)
    }), 200

# 3. Solar Deviation %
@maths_bp.route('/solar_deviation', methods=['POST'])
def solar_deviation():
    data = request.get_json() or {}
    expected_power_kW = data.get('expected_power_kW')
    actual_power_kW = data.get('actual_power_kW')
    if None in (expected_power_kW, actual_power_kW):
        return jsonify({'error': 'missing required fields'}), 400
    deviation_pct = (expected_power_kW - actual_power_kW) / expected_power_kW * 100.0
    return jsonify({
        'deviation_pct': round(deviation_pct, 2),
        'expected_power_kW': expected_power_kW,
        'actual_power_kW': actual_power_kW
    }), 200

# 4. Wind Expected Power (physics based)
@maths_bp.route('/wind_expected', methods=['POST'])
def wind_expected():
    data = request.get_json() or {}
    rho = data.get('rho')  # air density kg/m^3
    rotor_radius = data.get('rotor_radius')  # meters
    wind_speed = data.get('wind_speed')  # m/s
    Cp = data.get('Cp')
    eta_gen = data.get('eta_gen')
    rated_capacity_kW = data.get('rated_capacity_kW')
    if None in (rho, rotor_radius, wind_speed, Cp, eta_gen, rated_capacity_kW):
        return jsonify({'error': 'missing required fields'}), 400
    area = math.pi * rotor_radius ** 2
    power_w = 0.5 * rho * area * (wind_speed ** 3) * Cp * eta_gen
    power_kW = power_w / 1000.0
    capped = False
    if power_kW > rated_capacity_kW:
        power_kW = rated_capacity_kW
        capped = True
    return jsonify({
        'expected_power_kW': round(power_kW, 2),
        'capped': capped,
        'wind_speed_ms': wind_speed
    }), 200

# 5. Cut‑in / Rated / Cut‑out Limits for wind
@maths_bp.route('/wind_limits', methods=['POST'])
def wind_limits():
    data = request.get_json() or {}
    wind_speed = data.get('wind_speed')
    rated_wind_speed = data.get('rated_wind_speed')
    if wind_speed is None or rated_wind_speed is None:
        return jsonify({'error': 'missing required fields'}), 400
    if wind_speed < 3:
        expected_power = 0
        state = 'below_cut_in'
    elif wind_speed > 25:
        expected_power = 0
        state = 'cut_out_shutdown'
    elif wind_speed > rated_wind_speed:
        expected_power = None
        state = 'above_rated_speed'
    else:
        expected_power = None
        state = 'normal_operation'
    return jsonify({
        'wind_speed_ms': wind_speed,
        'state': state,
        'expected_power_kW': expected_power
    }), 200

# 6. Air Density Correction
@maths_bp.route('/air_density', methods=['POST'])
def air_density():
    data = request.get_json() or {}
    pressure_pa = data.get('pressure_pa')
    temperature_c = data.get('temperature_c')
    if None in (pressure_pa, temperature_c):
        return jsonify({'error': 'missing required fields'}), 400
    R = 287.05  # J/(kg·K)
    temperature_k = temperature_c + 273.15
    rho = pressure_pa / (R * temperature_k)
    return jsonify({
        'air_density_kg_m3': round(rho, 3),
        'pressure_pa': pressure_pa,
        'temperature_k': round(temperature_k, 2)
    }), 200

# 7. Soiling Derate (solar)
@maths_bp.route('/soiling_derate', methods=['POST'])
def soiling_derate():
    data = request.get_json() or {}
    expected_power_kW = data.get('expected_power_kW')
    soiling_accumulation_rate = data.get('soiling_accumulation_rate')
    k_factor = data.get('k_factor')
    max_soiling_loss = data.get('max_soiling_loss')
    if None in (expected_power_kW, soiling_accumulation_rate, k_factor, max_soiling_loss):
        return jsonify({'error': 'missing required fields'}), 400
    soiling_derate_val = 1 - min(soiling_accumulation_rate * k_factor, max_soiling_loss)
    soiled_expected = expected_power_kW * soiling_derate_val
    return jsonify({
        'soiling_derate': round(soiling_derate_val, 3),
        'soiled_expected_power_kW': round(soiled_expected, 3)
    }), 200

# 8. Persistence Score
@maths_bp.route('/persistence', methods=['POST'])
def persistence():
    data = request.get_json() or {}
    deviations = data.get('deviation_pct_list')  # list of numbers
    threshold = data.get('threshold', 15)
    if not isinstance(deviations, list) or len(deviations) == 0:
        return jsonify({'error': 'deviation_pct_list must be a non‑empty list'}), 400
    exceed = sum(1 for d in deviations if abs(d) > threshold)
    score = exceed / len(deviations)
    return jsonify({
        'persist_score': round(score, 3),
        'windows_checked': len(deviations),
        'exceeding': exceed
    }), 200

# 9. Risk Score (weighted sum)
@maths_bp.route('/risk_score', methods=['POST'])
def risk_score():
    data = request.get_json() or {}
    anomaly_severity = data.get('anomaly_severity')
    performance_loss = data.get('performance_loss')
    persistence = data.get('persistence')
    asset_criticality = data.get('asset_criticality')
    if None in (anomaly_severity, performance_loss, persistence, asset_criticality):
        return jsonify({'error': 'missing required fields'}), 400
    score = (0.40 * anomaly_severity +
             0.25 * performance_loss +
             0.20 * persistence +
             0.15 * asset_criticality)
    if score <= 20:
        level = 'Low'
    elif score <= 60:
        level = 'Medium'
    elif score <= 80:
        level = 'High'
    else:
        level = 'Critical'
    return jsonify({
        'risk_score': round(score, 2),
        'risk_level': level
    }), 200

# 10. Energy & Revenue Loss
@maths_bp.route('/energy_revenue_loss', methods=['POST'])
def energy_revenue_loss():
    data = request.get_json() or {}
    expected_power_kW = data.get('expected_power_kW')
    loss_fraction = data.get('loss_fraction')
    affected_hours = data.get('affected_hours')
    tariff = data.get('tariff')
    if None in (expected_power_kW, loss_fraction, affected_hours, tariff):
        return jsonify({'error': 'missing required fields'}), 400
    energy_loss_kWh = expected_power_kW * loss_fraction * affected_hours
    revenue_loss = energy_loss_kWh * tariff
    return jsonify({
        'energy_loss_kWh': round(energy_loss_kWh, 2),
        'revenue_loss': round(revenue_loss, 2)
    }), 200
