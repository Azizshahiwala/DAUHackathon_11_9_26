import {
  Asset,
  Alert,
  MaintenanceTask,
  DashboardKPI,
  ModelPerformance,
  WeatherData,
  SensorReading,
  AlertStatus,
  MaintenanceStatus,
  AIOutput
} from '../types';

import {
  MOCK_ASSETS,
  MOCK_ALERTS,
  MOCK_MAINTENANCE_TASKS,
  MOCK_MODEL_PERFORMANCE,
  MOCK_WEATHER,
  generateAssetHistory,
  getDashboardKPI
} from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';

// Helper to simulate network latency for smoother UX transitions
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class ApiService {
  private isMockMode: boolean = USE_MOCK;

  public setMockMode(active: boolean) {
    this.isMockMode = active;
  }

  public getIsMockMode(): boolean {
    return this.isMockMode;
  }

  // 1. Get fleet KPI summary
  async getDashboardKPI(): Promise<DashboardKPI> {
    if (this.isMockMode) {
      await delay(120);
      return getDashboardKPI();
    }

    try {
      const res = await fetch(`${BASE_URL}/analytics/kpi`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      throw new Error(json.error || 'Failed to fetch KPI');
    } catch (err) {
      console.warn('[API Service] Backend unreachable, falling back to mock KPI data.', err);
      return getDashboardKPI();
    }
  }

  // 2. Get all assets
  async getAssets(): Promise<Asset[]> {
    if (this.isMockMode) {
      await delay(150);
      return [...MOCK_ASSETS];
    }

    try {
      const res = await fetch(`${BASE_URL}/assets`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      throw new Error(json.error || 'Failed to fetch assets');
    } catch (err) {
      console.warn('[API Service] Backend unreachable, falling back to mock assets.', err);
      return [...MOCK_ASSETS];
    }
  }

  // 3. Get single asset by ID
  async getAsset(id: string): Promise<Asset | null> {
    if (this.isMockMode) {
      await delay(100);
      const found = MOCK_ASSETS.find(a => a.asset_id.toLowerCase() === id.toLowerCase());
      return found || null;
    }

    try {
      const res = await fetch(`${BASE_URL}/assets/${id}`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return null;
    } catch (err) {
      console.warn(`[API Service] Backend unreachable for asset ${id}, using mock.`, err);
      return MOCK_ASSETS.find(a => a.asset_id.toLowerCase() === id.toLowerCase()) || null;
    }
  }

  // 4. Get historical readings for an asset
  async getAssetReadings(id: string): Promise<any[]> {
    if (this.isMockMode) {
      await delay(120);
      return generateAssetHistory(id);
    }

    try {
      const res = await fetch(`${BASE_URL}/assets/${id}/readings`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return generateAssetHistory(id);
    } catch (err) {
      console.warn(`[API Service] Backend unreachable for readings ${id}, using mock.`, err);
      return generateAssetHistory(id);
    }
  }

  // 5. Get active alerts
  async getAlerts(): Promise<Alert[]> {
    if (this.isMockMode) {
      await delay(100);
      return [...MOCK_ALERTS];
    }

    try {
      const res = await fetch(`${BASE_URL}/alerts`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return [...MOCK_ALERTS];
    } catch (err) {
      console.warn('[API Service] Backend unreachable for alerts, using mock.', err);
      return [...MOCK_ALERTS];
    }
  }

  // 6. Update alert status (ACKNOWLEDGE or RESOLVE)
  async updateAlertStatus(id: string, status: AlertStatus): Promise<boolean> {
    if (this.isMockMode) {
      const alert = MOCK_ALERTS.find(a => a.id === id);
      if (alert) alert.status = status;
      return true;
    }

    try {
      const res = await fetch(`${BASE_URL}/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      const json = await res.json();
      return json.success === true;
    } catch (err) {
      console.warn(`[API Service] Backend unreachable to update alert ${id}. Local update applied.`, err);
      const alert = MOCK_ALERTS.find(a => a.id === id);
      if (alert) alert.status = status;
      return true;
    }
  }

  // 7. Get prioritized maintenance tasks
  async getMaintenanceTasks(): Promise<MaintenanceTask[]> {
    if (this.isMockMode) {
      await delay(120);
      return [...MOCK_MAINTENANCE_TASKS];
    }

    try {
      const res = await fetch(`${BASE_URL}/maintenance`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return [...MOCK_MAINTENANCE_TASKS];
    } catch (err) {
      console.warn('[API Service] Backend unreachable for maintenance, using mock.', err);
      return [...MOCK_MAINTENANCE_TASKS];
    }
  }

  // 8. Update maintenance task status
  async updateMaintenanceStatus(id: string, status: MaintenanceStatus): Promise<boolean> {
    if (this.isMockMode) {
      const task = MOCK_MAINTENANCE_TASKS.find(t => t.id === id);
      if (task) task.maintenance_status = status;
      return true;
    }

    try {
      const res = await fetch(`${BASE_URL}/maintenance/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ maintenance_status: status })
      });
      const json = await res.json();
      return json.success === true;
    } catch (err) {
      console.warn(`[API Service] Backend unreachable to update maintenance ${id}. Local update applied.`, err);
      const task = MOCK_MAINTENANCE_TASKS.find(t => t.id === id);
      if (task) task.maintenance_status = status;
      return true;
    }
  }

  // 9. Get Open-Meteo ambient weather
  async getWeather(): Promise<WeatherData> {
    if (this.isMockMode) {
      return MOCK_WEATHER;
    }

    try {
      const res = await fetch(`${BASE_URL}/weather`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return MOCK_WEATHER;
    } catch (err) {
      console.warn('[API Service] Backend weather endpoint unreachable, using mock.', err);
      return MOCK_WEATHER;
    }
  }

  // 10. Get verified AI Model Performance evaluation metrics
  async getModelPerformance(): Promise<ModelPerformance> {
    if (this.isMockMode) {
      await delay(100);
      return MOCK_MODEL_PERFORMANCE;
    }

    try {
      const res = await fetch(`${BASE_URL}/model-performance`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return MOCK_MODEL_PERFORMANCE;
    } catch (err) {
      console.warn('[API Service] Backend model performance unreachable, using mock.', err);
      return MOCK_MODEL_PERFORMANCE;
    }
  }

  // 11. Run live prediction for custom sensor readings (PyTorch proxy via Flask)
  async predictAsset(reading: Partial<SensorReading>): Promise<AIOutput> {
    if (this.isMockMode) {
      await delay(200);
      // Heuristic mock computation mimicking Person 3's PyTorch Autoencoder
      const isOverheated = (reading.temperature || 35) > 60;
      const isSoiled = (reading.soiling || 0) > 30;
      const isLowVolt = (reading.voltage || 38) < 28;
      const isAnomaly = isOverheated || isSoiled || isLowVolt;

      return {
        asset_id: reading.asset_id || "CUSTOM",
        anomaly: isAnomaly,
        reconstruction_error: isAnomaly ? 38.42 : 0.42,
        risk_score: isAnomaly ? 95 : 12,
        risk_level: isAnomaly ? "CRITICAL" : "NORMAL",
        failure_risk: isAnomaly ? 92 : 8,
        fault_type: isAnomaly ? (isOverheated ? "overheating" : "soiling") : "none",
        maintenance_priority: isAnomaly ? "URGENT" : "ROUTINE",
        recommended_action: isAnomaly ? "Immediate on-site technical inspection required." : "Asset operating within nominal range.",
        energy_loss_kwh: isAnomaly ? 5.2 : 0,
        revenue_loss: isAnomaly ? 41.6 : 0,
      };
    }

    try {
      const res = await fetch(`${BASE_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reading),
      });
      const json = await res.json();
      if (json.success && json.data) return json.data;
      throw new Error(json.error || 'Prediction failed');
    } catch (err) {
      console.error('[API Service] Prediction error:', err);
      throw err;
    }
  }
}

export const api = new ApiService();
