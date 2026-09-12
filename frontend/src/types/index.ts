// Core Sensor Features expected by PyTorch Autoencoder (6-feature input vector)
export interface SensorReading {
  reading_id?: string;
  asset_id: string;
  timestamp: string;
  temperature: number;      // °C
  voltage: number;          // Volts (V)
  current: number;          // Amperes (A)
  irradiance: number;       // Solar radiation (W/m²)
  soiling: number;          // Soiling accumulation ratio (%)
  power_output: number;     // Generated power (kW)
  condition?: 'normal' | 'abnormal';
  fault_type?: FaultType;
}

export type FaultType =
  | 'none'
  | 'partial_shading'
  | 'low_current'
  | 'power_degradation'
  | 'soiling'
  | 'overheating'
  | 'combined'
  | 'low_voltage'
  | 'gradual_degradation';

export type RiskLevel = 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type MaintenancePriority = 'ROUTINE' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type AssetStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AlertStatus = 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';

export type MaintenanceStatus = 'PENDING' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';

// AI Model Output produced by PyTorch Autoencoder + Backend Heuristics
export interface AIOutput {
  asset_id: string;
  anomaly: boolean;
  reconstruction_error: number; // Compared against threshold 1.033187
  risk_score: number;           // Heuristic value 0-100 (Do NOT display as probability)
  risk_level: RiskLevel;
  failure_risk: number;         // Heuristic value 0-100
  fault_type: FaultType;
  maintenance_priority: MaintenancePriority;
  recommended_action: string;
  energy_loss_kwh: number;      // Estimated energy lost per cycle
  revenue_loss: number;         // Estimated financial revenue loss ($)
}

// Full Asset record
export interface Asset {
  asset_id: string;
  asset_type: 'solar_panel' | 'wind_turbine';
  location: string;
  string_group?: string;
  status: AssetStatus;
  current_readings: SensorReading;
  prediction: AIOutput;
  last_updated: string;
}

// Alert Record
export interface Alert {
  id: string;
  asset_id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  risk: number;
  status: AlertStatus;
  created_at: string;
}

// Maintenance Task
export interface MaintenanceTask {
  id: string;
  asset_id: string;
  issue: string;
  fault_type: FaultType;
  risk: number;
  priority: MaintenancePriority;
  recommended_action: string;
  estimated_energy_loss_kwh: number;
  estimated_revenue_loss: number;
  maintenance_status: MaintenanceStatus;
  created_at: string;
  assigned_to?: string;
}

// Fleet KPI Summary
export interface DashboardKPI {
  total_assets: number;
  healthy_assets: number;
  warning_assets: number;
  critical_assets: number;
  active_alerts: number;
  total_energy_loss_kwh: number;
  total_revenue_loss: number;
  fleet_efficiency: number;
  open_meteo_ambient: WeatherData;
}

// Open-Meteo Environmental Weather Data
export interface WeatherData {
  ambient_temperature: number; // °C
  solar_radiation: number;     // W/m² (shortwave)
  cloud_cover: number;         // %
  wind_speed: number;          // km/h
  wind_direction: number;      // degrees
  last_fetched: string;
}

// AI Model Performance Benchmark Evaluation
export interface ModelPerformance {
  model_name: string;
  architecture: string;
  anomaly_threshold: number;
  evaluation_dataset_size: number;
  accuracy: number;            // 95.27%
  precision: number;           // 87.45%
  recall: number;              // 94.69%
  f1_score: number;            // 90.93%
  confusion_matrix: {
    actual_normal: {
      correctly_classified: number; // 14,307 (TN)
      false_anomalies: number;      // 681 (FP)
    };
    actual_abnormal: {
      correctly_detected: number;   // 4,746 (TP)
      missed: number;               // 266 (FN)
    };
  };
  fault_detection_rates: {
    combined: number;               // 100%
    low_current: number;            // 100%
    low_voltage: number;            // 100%
    overheating: number;            // 100%
    soiling: number;                // 100%
    power_degradation: number;      // 95.99%
    partial_shading: number;        // 89.55%
    gradual_degradation: number;    // 66.41%
  };
  notes: string;
}

// Standard API Response Wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
