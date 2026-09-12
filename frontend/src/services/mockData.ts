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
  ambient_temperature: 32.4,
  solar_radiation: 875.0,
  cloud_cover: 12.0,
  wind_speed: 18.5,
  wind_direction: 240,
  last_fetched: new Date().toISOString(),
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

// Generate 100 realistic assets (90 Healthy, 6 Warning, 4 Critical)
export const MOCK_ASSETS: Asset[] = [];

// 1. Critical Asset P999 (from problem statement example)
MOCK_ASSETS.push({
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
    irradiance: 880,
    soiling: 45.0,
    power_output: 0.075,
    condition: "abnormal",
    fault_type: "combined",
  },
  prediction: {
    asset_id: "P999",
    anomaly: true,
    reconstruction_error: 50.293289,
    risk_score: 100,
    risk_level: "CRITICAL",
    failure_risk: 95,
    fault_type: "combined",
    maintenance_priority: "URGENT",
    recommended_action: "Immediate on-site panel washing and bypass diode thermal inspection.",
    energy_loss_kwh: 6.62,
    revenue_loss: 52.99,
  },
  last_updated: "2 mins ago",
});

// 2. Critical Asset P102 (Overheating)
MOCK_ASSETS.push({
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
    irradiance: 870,
    soiling: 12.0,
    power_output: 0.21,
    condition: "abnormal",
    fault_type: "overheating",
  },
  prediction: {
    asset_id: "P102",
    anomaly: true,
    reconstruction_error: 24.18432,
    risk_score: 92,
    risk_level: "CRITICAL",
    failure_risk: 88,
    fault_type: "overheating",
    maintenance_priority: "URGENT",
    recommended_action: "Check inverter thermal dissipation and junction box contact resistance.",
    energy_loss_kwh: 4.80,
    revenue_loss: 38.40,
  },
  last_updated: "5 mins ago",
});

// 3. Critical Asset W045 (Wind Turbine Low Voltage)
MOCK_ASSETS.push({
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
    recommended_action: "Inspect slip ring generator brush assembly and transformer busbar.",
    energy_loss_kwh: 18.20,
    revenue_loss: 145.60,
  },
  last_updated: "8 mins ago",
});

// 4. Critical Asset P314 (Low Current)
MOCK_ASSETS.push({
  asset_id: "P314",
  asset_type: "solar_panel",
  location: "Sector 4 - Array C",
  string_group: "String-C1",
  status: "CRITICAL",
  current_readings: {
    asset_id: "P314",
    timestamp: new Date().toISOString(),
    temperature: 42.0,
    voltage: 36.5,
    current: 2.1,
    irradiance: 860,
    soiling: 18.0,
    power_output: 0.076,
    condition: "abnormal",
    fault_type: "low_current",
  },
  prediction: {
    asset_id: "P314",
    anomaly: true,
    reconstruction_error: 18.91,
    risk_score: 86,
    risk_level: "HIGH",
    failure_risk: 82,
    fault_type: "low_current",
    maintenance_priority: "HIGH",
    recommended_action: "Trace string MC4 connectors for loose crimping or microcracks.",
    energy_loss_kwh: 3.90,
    revenue_loss: 31.20,
  },
  last_updated: "10 mins ago",
});

// 5-10: Warning Assets
const warningFaults: Array<{ fault: any; action: string; lossKwh: number; lossRev: number }> = [
  { fault: "soiling", action: "Schedule scheduled automated surface rinse.", lossKwh: 2.1, lossRev: 16.80 },
  { fault: "partial_shading", action: "Trim adjacent vegetation obstructing low angle sun.", lossKwh: 1.8, lossRev: 14.40 },
  { fault: "power_degradation", action: "Perform IV curve tracer diagnostics.", lossKwh: 2.5, lossRev: 20.00 },
  { fault: "gradual_degradation", action: "Monitor monthly degradation slope.", lossKwh: 1.2, lossRev: 9.60 },
  { fault: "soiling", action: "Deploy anti-reflective coating inspection team.", lossKwh: 2.0, lossRev: 16.00 },
  { fault: "partial_shading", action: "Verify tracker angle calibration.", lossKwh: 1.7, lossRev: 13.60 },
];

for (let i = 0; i < 6; i++) {
  const idNum = 201 + i;
  const wf = warningFaults[i];
  MOCK_ASSETS.push({
    asset_id: `P${idNum}`,
    asset_type: "solar_panel",
    location: `Sector ${(i % 4) + 1} - Array ${String.fromCharCode(65 + (i % 3))}`,
    string_group: `String-${String.fromCharCode(65 + (i % 3))}${i + 1}`,
    status: "WARNING",
    current_readings: {
      asset_id: `P${idNum}`,
      timestamp: new Date().toISOString(),
      temperature: 44.5 + i * 1.5,
      voltage: 34.2 - i * 0.4,
      current: 7.2 - i * 0.3,
      irradiance: 850,
      soiling: 22.0 + i * 2.5,
      power_output: 0.24 - i * 0.015,
      condition: "abnormal",
      fault_type: wf.fault,
    },
    prediction: {
      asset_id: `P${idNum}`,
      anomaly: true,
      reconstruction_error: 2.15 + i * 0.85,
      risk_score: 55 + i * 4,
      risk_level: "MEDIUM",
      failure_risk: 48 + i * 5,
      fault_type: wf.fault,
      maintenance_priority: "MEDIUM",
      recommended_action: wf.action,
      energy_loss_kwh: wf.lossKwh,
      revenue_loss: wf.lossRev,
    },
    last_updated: `${12 + i * 3} mins ago`,
  });
}

// 11-100: Healthy Assets (90 total healthy)
for (let i = 11; i <= 100; i++) {
  const isTurbine = i % 15 === 0;
  const assetId = isTurbine ? `W${String(i).padStart(3, '0')}` : `P${String(i).padStart(3, '0')}`;
  const baseTemp = 36.0 + (i % 8) * 1.1;
  const baseVolt = isTurbine ? 690.0 : 38.2;
  const baseCurr = isTurbine ? 24.5 : 9.3;
  const basePower = isTurbine ? 16.9 : 0.355;
  const recError = 0.12 + ((i * 17) % 45) / 100; // Well below 1.033187

  MOCK_ASSETS.push({
    asset_id: assetId,
    asset_type: isTurbine ? "wind_turbine" : "solar_panel",
    location: `Sector ${(i % 6) + 1} - Array ${String.fromCharCode(65 + (i % 4))}`,
    string_group: `String-${String.fromCharCode(65 + (i % 4))}${(i % 5) + 1}`,
    status: "HEALTHY",
    current_readings: {
      asset_id: assetId,
      timestamp: new Date().toISOString(),
      temperature: Number(baseTemp.toFixed(1)),
      voltage: Number(baseVolt.toFixed(1)),
      current: Number(baseCurr.toFixed(2)),
      irradiance: isTurbine ? 0 : 865,
      soiling: Number((3.0 + (i % 5)).toFixed(1)),
      power_output: Number(basePower.toFixed(3)),
      condition: "normal",
      fault_type: "none",
    },
    prediction: {
      asset_id: assetId,
      anomaly: false,
      reconstruction_error: Number(recError.toFixed(4)),
      risk_score: Math.floor(5 + ((i * 7) % 15)),
      risk_level: "NORMAL",
      failure_risk: Math.floor(3 + ((i * 5) % 10)),
      fault_type: "none",
      maintenance_priority: "ROUTINE",
      recommended_action: "Standard telemetry monitoring. Next inspection in 6 months.",
      energy_loss_kwh: 0,
      revenue_loss: 0,
    },
    last_updated: "Just now",
  });
}

// Active Alerts
export const MOCK_ALERTS: Alert[] = [
  {
    id: "ALT-9001",
    asset_id: "P999",
    severity: "CRITICAL",
    title: "Critical Combined Soiling & Voltage Anomaly",
    message: "Reconstruction error (50.29) exceeded threshold (1.033). Extreme output drop with high thermal buildup.",
    risk: 100,
    status: "ACTIVE",
    created_at: "10 mins ago",
  },
  {
    id: "ALT-9002",
    asset_id: "W045",
    severity: "CRITICAL",
    title: "Turbine Busbar Voltage Collapse",
    message: "Generator phase voltage down to 410V under 18.5 km/h wind. Risk score 95.",
    risk: 95,
    status: "ACTIVE",
    created_at: "18 mins ago",
  },
  {
    id: "ALT-9003",
    asset_id: "P102",
    severity: "HIGH",
    title: "Junction Box Overheating Warning",
    message: "Core temperature spiked to 72.1°C under normal ambient conditions.",
    risk: 92,
    status: "ACTIVE",
    created_at: "25 mins ago",
  },
  {
    id: "ALT-9004",
    asset_id: "P314",
    severity: "HIGH",
    title: "String Under-Current Divergence",
    message: "Current collapsed to 2.1A despite 860 W/m² solar irradiance.",
    risk: 86,
    status: "ACKNOWLEDGED",
    created_at: "45 mins ago",
  },
  {
    id: "ALT-9005",
    asset_id: "P201",
    severity: "MEDIUM",
    title: "Progressive Surface Soiling Build-up",
    message: "22% surface obscuration detected. Power output dropped by 14%.",
    risk: 55,
    status: "ACTIVE",
    created_at: "1 hour ago",
  },
  {
    id: "ALT-9006",
    asset_id: "P202",
    severity: "MEDIUM",
    title: "Partial Obstruction Shadowing",
    message: "Asymmetric string current profile during peak irradiance.",
    risk: 59,
    status: "RESOLVED",
    created_at: "2 hours ago",
  },
];

// Maintenance Queue Tasks
export const MOCK_MAINTENANCE_TASKS: MaintenanceTask[] = [
  {
    id: "MT-001",
    asset_id: "P999",
    issue: "Combined multi-fault: Soiling + Thermal hotspot",
    fault_type: "combined",
    risk: 100,
    priority: "URGENT",
    recommended_action: "Immediate on-site panel washing and bypass diode thermal inspection.",
    estimated_energy_loss_kwh: 6.62,
    estimated_revenue_loss: 52.99,
    maintenance_status: "PENDING",
    created_at: "Today, 10:45 AM",
    assigned_to: "Field Crew Alpha",
  },
  {
    id: "MT-002",
    asset_id: "W045",
    issue: "Low voltage generator phase imbalance",
    fault_type: "low_voltage",
    risk: 95,
    priority: "URGENT",
    recommended_action: "Inspect slip ring generator brush assembly and transformer busbar.",
    estimated_energy_loss_kwh: 18.20,
    estimated_revenue_loss: 145.60,
    maintenance_status: "IN_PROGRESS",
    created_at: "Today, 09:30 AM",
    assigned_to: "Turbine Specialist Dave",
  },
  {
    id: "MT-003",
    asset_id: "P102",
    issue: "Overheating junction box (72.1°C)",
    fault_type: "overheating",
    risk: 92,
    priority: "URGENT",
    recommended_action: "Check inverter thermal dissipation and junction box contact resistance.",
    estimated_energy_loss_kwh: 4.80,
    estimated_revenue_loss: 38.40,
    maintenance_status: "PENDING",
    created_at: "Today, 08:15 AM",
  },
  {
    id: "MT-004",
    asset_id: "P314",
    issue: "Low string current (2.1A vs 9.5A baseline)",
    fault_type: "low_current",
    risk: 86,
    priority: "HIGH",
    recommended_action: "Trace string MC4 connectors for loose crimping or microcracks.",
    estimated_energy_loss_kwh: 3.90,
    estimated_revenue_loss: 31.20,
    maintenance_status: "SCHEDULED",
    created_at: "Yesterday, 16:20 PM",
  },
  {
    id: "MT-005",
    asset_id: "P201",
    issue: "Surface soiling causing 14% yield suppression",
    fault_type: "soiling",
    risk: 55,
    priority: "MEDIUM",
    recommended_action: "Schedule scheduled automated surface rinse.",
    estimated_energy_loss_kwh: 2.10,
    estimated_revenue_loss: 16.80,
    maintenance_status: "SCHEDULED",
    created_at: "Yesterday, 14:00 PM",
  },
  {
    id: "MT-006",
    asset_id: "P203",
    issue: "Accelerated cell power degradation curve",
    fault_type: "power_degradation",
    risk: 63,
    priority: "MEDIUM",
    recommended_action: "Perform IV curve tracer diagnostics.",
    estimated_energy_loss_kwh: 2.50,
    estimated_revenue_loss: 20.00,
    maintenance_status: "PENDING",
    created_at: "2 days ago",
  },
];

// 24-point historical sensor readings for Asset Details view (Asset P999 failure timeline)
export const generateAssetHistory = (assetId: string) => {
  const isP999 = assetId === "P999";
  const points = [];
  const now = Date.now();

  for (let i = 24; i >= 0; i--) {
    const time = new Date(now - i * 3600 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isP999 && i <= 8) {
      // Degraded state on P999 in the last 8 hours
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
      // Normal nominal conditions
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

// Summary KPI calculations
export const getDashboardKPI = (): DashboardKPI => {
  const healthy = MOCK_ASSETS.filter(a => a.status === 'HEALTHY').length;
  const warning = MOCK_ASSETS.filter(a => a.status === 'WARNING').length;
  const critical = MOCK_ASSETS.filter(a => a.status === 'CRITICAL').length;
  const activeAlerts = MOCK_ALERTS.filter(a => a.status === 'ACTIVE').length;
  
  const totalEnergyLoss = MOCK_ASSETS.reduce((sum, a) => sum + (a.prediction?.energy_loss_kwh || 0), 0);
  const totalRevenueLoss = MOCK_ASSETS.reduce((sum, a) => sum + (a.prediction?.revenue_loss || 0), 0);

  return {
    total_assets: MOCK_ASSETS.length,
    healthy_assets: healthy,
    warning_assets: warning,
    critical_assets: critical,
    active_alerts: activeAlerts,
    total_energy_loss_kwh: Number(totalEnergyLoss.toFixed(2)),
    total_revenue_loss: Number(totalRevenueLoss.toFixed(2)),
    fleet_efficiency: 91.4,
    open_meteo_ambient: MOCK_WEATHER,
  };
};
