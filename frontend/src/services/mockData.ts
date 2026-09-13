import {
  Asset,
  Alert,
  MaintenanceTask,
  DashboardKPI,
  ModelPerformance,
  WeatherData,
  SensorReading
} from '../types';

export const MOCK_WEATHER: WeatherData = {
  ambient_temperature: 28.1,
  solar_radiation: 820.0,
  cloud_cover: 15.0,
  wind_speed: 12.5,
  wind_direction: 180,
  last_fetched: new Date().toISOString(),
  source: "Tomorrow.io (https://api.tomorrow.io/v4/timelines)",
  model: "Tomorrow.io Global Environmental Intelligence",
};

export const MOCK_MODEL_PERFORMANCE: ModelPerformance = {
  model_name: "solar_autoencoder.pth",
  architecture: "6 -> 4 -> 2 -> 4 -> 6 Deep Symmetric Autoencoder",
  anomaly_threshold: 1.033187,
  evaluation_dataset_size: 20000,
  accuracy: 95.27,
  precision: 87.45,
  recall: 94.69,
  f1_score: 90.93,
  confusion_matrix: {
    actual_normal: {
      correctly_classified: 14307,
      false_anomalies: 681,
    },
    actual_abnormal: {
      correctly_detected: 4746,
      missed: 266,
    },
  },
  fault_detection_rates: {
    combined: 100.0,
    low_current: 100.0,
    low_voltage: 100.0,
    overheating: 100.0,
    soiling: 100.0,
    power_degradation: 95.99,
    partial_shading: 89.55,
    gradual_degradation: 66.41,
  },
  notes: "Evaluation performed on simulated 20,000 readings sensor dataset (14,988 normal, 5,012 abnormal).",
};

export const MOCK_ASSETS: Asset[] = [
  {
    asset_id: "P999",
    asset_type: "solar_panel",
    location: "Sector 7 - Array D",
    string_group: "String-D4",
    status: "CRITICAL",
    current_readings: {
      asset_id: "P999",
      timestamp: new Date().toISOString(),
      temperature: 68.4,
      voltage: 24.2,
      current: 3.1,
      irradiance: 880.0,
      soiling: 45.0,
      power_output: 0.075,
      condition: "abnormal",
      fault_type: "combined",
    },
    prediction: {
      asset_id: "P999",
      anomaly: true,
      reconstruction_error: 44.3142,
      risk_score: 100,
      risk_level: "CRITICAL",
      failure_risk: 95,
      fault_type: "combined",
      maintenance_priority: "URGENT",
      recommended_action: "Immediate on-site panel washing and bypass diode thermal replacement.",
      energy_loss_kwh: 6.65,
      revenue_loss: 53.18,
    },
    last_updated: "Just now",
  },
  {
    asset_id: "P102",
    asset_type: "solar_panel",
    location: "Sector 2 - Array A",
    string_group: "String-A2",
    status: "CRITICAL",
    current_readings: {
      asset_id: "P102",
      timestamp: new Date().toISOString(),
      temperature: 72.1,
      voltage: 31.0,
      current: 6.8,
      irradiance: 870.0,
      soiling: 12.0,
      power_output: 0.211,
      condition: "abnormal",
      fault_type: "overheating",
    },
    prediction: {
      asset_id: "P102",
      anomaly: true,
      reconstruction_error: 24.1843,
      risk_score: 92,
      risk_level: "CRITICAL",
      failure_risk: 88,
      fault_type: "overheating",
      maintenance_priority: "URGENT",
      recommended_action: "Check inverter thermal dissipation and junction box contact resistance.",
      energy_loss_kwh: 4.80,
      revenue_loss: 38.40,
    },
    last_updated: "Just now",
  },
  {
    asset_id: "W045",
    asset_type: "wind_turbine",
    location: "North Ridge Ridge-B",
    string_group: "Turbine-B3",
    status: "CRITICAL",
    current_readings: {
      asset_id: "W045",
      timestamp: new Date().toISOString(),
      temperature: 55.3,
      voltage: 410.0,
      current: 12.5,
      irradiance: 0,
      soiling: 5.0,
      power_output: 5.12,
      condition: "abnormal",
      fault_type: "low_voltage",
    },
    prediction: {
      asset_id: "W045",
      anomaly: true,
      reconstruction_error: 31.502,
      risk_score: 95,
      risk_level: "CRITICAL",
      failure_risk: 90,
      fault_type: "low_voltage",
      maintenance_priority: "URGENT",
      recommended_action: "Inspect wind generator phase busbar contactors and pitch control bearings.",
      energy_loss_kwh: 12.5,
      revenue_loss: 100.0,
    },
    last_updated: "Just now",
  },
  {
    asset_id: "P078",
    asset_type: "solar_panel",
    location: "Sector 5 - Array C",
    string_group: "String-C3",
    status: "WARNING",
    current_readings: {
      asset_id: "P078",
      timestamp: new Date().toISOString(),
      temperature: 42.0,
      voltage: 36.5,
      current: 4.5,
      irradiance: 840.0,
      soiling: 6.0,
      power_output: 0.164,
      condition: "abnormal",
      fault_type: "partial_shading",
    },
    prediction: {
      asset_id: "P078",
      anomaly: true,
      reconstruction_error: 2.15,
      risk_score: 62,
      risk_level: "HIGH",
      failure_risk: 45,
      fault_type: "partial_shading",
      maintenance_priority: "HIGH",
      recommended_action: "Investigate vegetation clearance and localized module obstruction.",
      energy_loss_kwh: 1.85,
      revenue_loss: 14.80,
    },
    last_updated: "Just now",
  },
  {
    asset_id: "P044",
    asset_type: "solar_panel",
    location: "Sector 3 - Array B",
    string_group: "String-B2",
    status: "WARNING",
    current_readings: {
      asset_id: "P044",
      timestamp: new Date().toISOString(),
      temperature: 39.5,
      voltage: 37.0,
      current: 5.8,
      irradiance: 850.0,
      soiling: 34.5,
      power_output: 0.215,
      condition: "abnormal",
      fault_type: "soiling",
    },
    prediction: {
      asset_id: "P044",
      anomaly: true,
      reconstruction_error: 1.88,
      risk_score: 58,
      risk_level: "MEDIUM",
      failure_risk: 40,
      fault_type: "soiling",
      maintenance_priority: "MEDIUM",
      recommended_action: "Schedule automated or manual array surface washing cycle.",
      energy_loss_kwh: 1.62,
      revenue_loss: 12.96,
    },
    last_updated: "Just now",
  },
  {
    asset_id: "P001",
    asset_type: "solar_panel",
    location: "Sector 1 - Array A",
    string_group: "String-A1",
    status: "HEALTHY",
    current_readings: {
      asset_id: "P001",
      timestamp: new Date().toISOString(),
      temperature: 36.2,
      voltage: 39.8,
      current: 8.9,
      irradiance: 850.0,
      soiling: 3.5,
      power_output: 0.354,
      condition: "normal",
      fault_type: "none",
    },
    prediction: {
      asset_id: "P001",
      anomaly: false,
      reconstruction_error: 0.12,
      risk_score: 8,
      risk_level: "NORMAL",
      failure_risk: 5,
      fault_type: "none",
      maintenance_priority: "ROUTINE",
      recommended_action: "Asset operating within nominal range. Continue routine monitoring.",
      energy_loss_kwh: 0,
      revenue_loss: 0,
    },
    last_updated: "Just now",
  }
];

export const MOCK_ALERTS: Alert[] = [
  {
    id: "ALT-P999",
    asset_id: "P999",
    severity: "CRITICAL",
    title: "Critical Incident: Combined Bypass Diode & Soiling Failure",
    message: "PyTorch Autoencoder error (44.31) exceeded threshold 1.033. Cell temperature 68.4°C and 45% soiling. Est. loss: $53.18/cycle.",
    risk: 100,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  },
  {
    id: "ALT-P102",
    asset_id: "P102",
    severity: "CRITICAL",
    title: "Thermal Runaway Alert: Inverter Overheating",
    message: "Junction box temperature 72.1°C exceeded critical safety threshold. Risk score 92. Immediate inspection required.",
    risk: 92,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  },
  {
    id: "ALT-W045",
    asset_id: "W045",
    severity: "CRITICAL",
    title: "Turbine Alert: Generator Voltage Sag",
    message: "Busbar voltage dropped to 410V under active generation. Power output depressed by 66%. Daily drag: $100.00.",
    risk: 95,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  },
  {
    id: "ALT-P078",
    asset_id: "P078",
    severity: "HIGH",
    title: "Performance Warning: Partial Shading Detected",
    message: "Available irradiance 840 W/m² but generated power suppressed below nominal baseline. Possible obstacle obscuration.",
    risk: 62,
    status: "ACTIVE",
    created_at: new Date().toISOString(),
  }
];

export const MOCK_MAINTENANCE_TASKS: MaintenanceTask[] = [
  {
    id: "TASK-P999",
    asset_id: "P999",
    issue: "Autoencoder Trigger: Combined Diode Failure + Extreme Soiling",
    fault_type: "combined",
    risk: 100,
    priority: "URGENT",
    recommended_action: "Immediate on-site panel washing and bypass diode thermal replacement.",
    estimated_energy_loss_kwh: 6.65,
    estimated_revenue_loss: 53.18,
    maintenance_status: "PENDING",
    created_at: new Date().toISOString(),
    assigned_to: "Field Dispatch Alpha",
  },
  {
    id: "TASK-P102",
    asset_id: "P102",
    issue: "Autoencoder Trigger: Inverter Overheating (72.1°C)",
    fault_type: "overheating",
    risk: 92,
    priority: "URGENT",
    recommended_action: "Check inverter thermal dissipation and junction box contact resistance.",
    estimated_energy_loss_kwh: 4.80,
    estimated_revenue_loss: 38.40,
    maintenance_status: "PENDING",
    created_at: new Date().toISOString(),
    assigned_to: "Field Dispatch Bravo",
  },
  {
    id: "TASK-W045",
    asset_id: "W045",
    issue: "Autoencoder Trigger: Turbine Generator Busbar Collapse",
    fault_type: "low_voltage",
    risk: 95,
    priority: "URGENT",
    recommended_action: "Inspect wind generator phase busbar contactors and pitch control bearings.",
    estimated_energy_loss_kwh: 12.50,
    estimated_revenue_loss: 100.00,
    maintenance_status: "SCHEDULED",
    created_at: new Date().toISOString(),
    assigned_to: "Turbine Tech Team",
  }
];

export const generateAssetHistory = (assetId: string) => {
  const asset = MOCK_ASSETS.find(a => a.asset_id === assetId);
  const isCritical = asset?.status === 'CRITICAL' || asset?.prediction?.anomaly === true;
  const points = [];
  const now = Date.now();

  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isCritical && i <= 8) {
      points.push({
        time,
        temperature: Number((50 + (8 - i) * 2.3).toFixed(1)),
        voltage: Number((34 - (8 - i) * 1.2).toFixed(1)),
        current: Number((7.5 - (8 - i) * 0.55).toFixed(2)),
        irradiance: 840 + (i % 5) * 10,
        soiling: Number((20 + (8 - i) * 3.1).toFixed(1)),
        power_output: Number((0.26 - (8 - i) * 0.023).toFixed(3)),
        reconstruction_error: Number((1.2 + (8 - i) * 6.1).toFixed(3)),
        threshold: 1.033187,
      });
    } else {
      points.push({
        time,
        temperature: Number((37.5 + Math.sin(i) * 3).toFixed(1)),
        voltage: Number((38.0 + Math.cos(i) * 0.8).toFixed(1)),
        current: Number((9.2 + Math.sin(i) * 0.4).toFixed(2)),
        irradiance: Math.max(0, 850 - i * 15),
        soiling: 5.2,
        power_output: Number((0.35 + Math.cos(i) * 0.02).toFixed(3)),
        reconstruction_error: Number((0.25 + Math.sin(i * 0.5) * 0.15).toFixed(3)),
        threshold: 1.033187,
      });
    }
  }

  return points;
};

export const getDashboardKPI = (): DashboardKPI => {
  const healthy = MOCK_ASSETS.filter(a => a.status === 'HEALTHY').length;
  const warning = MOCK_ASSETS.filter(a => a.status === 'WARNING').length;
  const critical = MOCK_ASSETS.filter(a => a.status === 'CRITICAL').length;
  const total = MOCK_ASSETS.length;

  return {
    total_assets: total,
    healthy_assets: healthy,
    warning_assets: warning,
    critical_assets: critical,
    active_alerts: MOCK_ALERTS.filter(a => a.status === 'ACTIVE').length,
    total_energy_loss_kwh: 25.4,
    total_revenue_loss: 204.38,
    fleet_efficiency: 92.4,
    open_meteo_ambient: MOCK_WEATHER
  };
};
