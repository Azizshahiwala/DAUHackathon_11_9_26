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
  AIOutput,
  LoginResponse,
  UserInfo,
} from '../types';

import {
  MOCK_ASSETS,
  MOCK_ALERTS,
  MOCK_MAINTENANCE_TASKS,
  MOCK_MODEL_PERFORMANCE,
  MOCK_WEATHER,
  generateAssetHistory,
  getDashboardKPI,
} from './mockData';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';

/** Simulate network latency for smoother UX transitions in mock mode */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

// ---------------------------------------------------------------------------
// Token storage helpers (localStorage)
// ---------------------------------------------------------------------------
const TOKEN_KEY = 'solepulse_jwt';

function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

function loadToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// ApiService
// ---------------------------------------------------------------------------
class ApiService {
  private isMockMode: boolean = USE_MOCK;

  public setMockMode(active: boolean) { this.isMockMode = active; }
  public getIsMockMode(): boolean { return this.isMockMode; }

  /** Return current JWT, or null if not logged in. */
  public getToken(): string | null { return loadToken(); }

  /** Authenticated fetch wrapper – injects Authorization header automatically. */
  private async authFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const token = loadToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(url, { ...options, headers });
    
    // Auto-logout if token is invalid or expired
    if (response.status === 401) {
      clearToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    
    return response;
  }

  // ── Auth ──────────────────────────────────────────────────────────────────

  /** POST /api/auth/login – stores token in localStorage, returns LoginResponse */
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || 'Login failed');
    }
    saveToken(json.token);
    return json as LoginResponse;
  }

  /** POST /api/auth/logout – clears local token */
  async logout(): Promise<void> {
    try {
      await this.authFetch(`${BASE_URL}/auth/logout`, { method: 'POST' });
    } finally {
      clearToken();
    }
  }

  /** POST /api/auth/register – register a new user */
  async register(email: string, password: string, role = 'operator'): Promise<void> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json?.error?.message || 'Registration failed');
    }
  }

  // ── Dashboard KPI ─────────────────────────────────────────────────────────

  async getDashboardKPI(): Promise<DashboardKPI> {
    if (this.isMockMode) { await delay(120); return getDashboardKPI(); }
    try {
      const res = await this.authFetch(`${BASE_URL}/analytics/kpi`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      throw new Error(json?.error?.message || 'Failed to fetch KPI');
    } catch (err) {
      console.warn('[API] getDashboardKPI – backend unreachable, using mock.', err);
      return getDashboardKPI();
    }
  }

  // ── Assets ────────────────────────────────────────────────────────────────

  async getAssets(): Promise<Asset[]> {
    if (this.isMockMode) { await delay(150); return [...MOCK_ASSETS]; }
    try {
      const res = await this.authFetch(`${BASE_URL}/assets/`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      throw new Error(json?.error?.message || 'Failed to fetch assets');
    } catch (err) {
      console.warn('[API] getAssets – backend unreachable, using mock.', err);
      return [...MOCK_ASSETS];
    }
  }

  async getAsset(id: string): Promise<Asset | null> {
    if (this.isMockMode) {
      await delay(100);
      return MOCK_ASSETS.find(a => a.asset_id.toLowerCase() === id.toLowerCase()) || null;
    }
    try {
      const res = await this.authFetch(`${BASE_URL}/assets/${id}`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return null;
    } catch (err) {
      console.warn(`[API] getAsset(${id}) – backend unreachable, using mock.`, err);
      return MOCK_ASSETS.find(a => a.asset_id.toLowerCase() === id.toLowerCase()) || null;
    }
  }

  async getAssetReadings(id: string): Promise<any[]> {
    if (this.isMockMode) { await delay(120); return generateAssetHistory(id); }
    try {
      const res = await this.authFetch(`${BASE_URL}/assets/${id}/readings`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return generateAssetHistory(id);
    } catch (err) {
      console.warn(`[API] getAssetReadings(${id}) – backend unreachable, using mock.`, err);
      return generateAssetHistory(id);
    }
  }

  // ── Alerts ────────────────────────────────────────────────────────────────

  async getAlerts(): Promise<Alert[]> {
    if (this.isMockMode) { await delay(100); return [...MOCK_ALERTS]; }
    try {
      const res = await this.authFetch(`${BASE_URL}/alerts/`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return [...MOCK_ALERTS];
    } catch (err) {
      console.warn('[API] getAlerts – backend unreachable, using mock.', err);
      return [...MOCK_ALERTS];
    }
  }

  async updateAlertStatus(id: string, status: AlertStatus): Promise<boolean> {
    if (this.isMockMode) {
      const alert = MOCK_ALERTS.find(a => a.id === id);
      if (alert) alert.status = status;
      return true;
    }
    try {
      const res = await this.authFetch(`${BASE_URL}/alerts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      return json.success === true;
    } catch (err) {
      console.warn(`[API] updateAlertStatus(${id}) – backend unreachable. Local update applied.`, err);
      const alert = MOCK_ALERTS.find(a => a.id === id);
      if (alert) alert.status = status;
      return true;
    }
  }

  // ── Maintenance ───────────────────────────────────────────────────────────

  async getMaintenanceTasks(): Promise<MaintenanceTask[]> {
    if (this.isMockMode) { await delay(120); return [...MOCK_MAINTENANCE_TASKS]; }
    try {
      const res = await this.authFetch(`${BASE_URL}/maintenance/`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return [...MOCK_MAINTENANCE_TASKS];
    } catch (err) {
      console.warn('[API] getMaintenanceTasks – backend unreachable, using mock.', err);
      return [...MOCK_MAINTENANCE_TASKS];
    }
  }

  async updateMaintenanceStatus(id: string, status: MaintenanceStatus): Promise<boolean> {
    if (this.isMockMode) {
      const task = MOCK_MAINTENANCE_TASKS.find(t => t.id === id);
      if (task) task.maintenance_status = status;
      return true;
    }
    try {
      const res = await this.authFetch(`${BASE_URL}/maintenance/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ maintenance_status: status }),
      });
      const json = await res.json();
      return json.success === true;
    } catch (err) {
      console.warn(`[API] updateMaintenanceStatus(${id}) – backend unreachable. Local update applied.`, err);
      const task = MOCK_MAINTENANCE_TASKS.find(t => t.id === id);
      if (task) task.maintenance_status = status;
      return true;
    }
  }

  // ── Weather ───────────────────────────────────────────────────────────────

  async getWeather(): Promise<WeatherData> {
    if (this.isMockMode) return MOCK_WEATHER;
    try {
      const res = await this.authFetch(`${BASE_URL}/weather`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return MOCK_WEATHER;
    } catch (err) {
      console.warn('[API] getWeather – backend unreachable, using mock.', err);
      return MOCK_WEATHER;
    }
  }

  // ── Model Performance ─────────────────────────────────────────────────────

  async getModelPerformance(): Promise<ModelPerformance> {
    if (this.isMockMode) { await delay(100); return MOCK_MODEL_PERFORMANCE; }
    try {
      const res = await this.authFetch(`${BASE_URL}/model-performance`);
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return MOCK_MODEL_PERFORMANCE;
    } catch (err) {
      console.warn('[API] getModelPerformance – backend unreachable, using mock.', err);
      return MOCK_MODEL_PERFORMANCE;
    }
  }

  // ── AI Predict ────────────────────────────────────────────────────────────

  async predictAsset(reading: Partial<SensorReading>): Promise<AIOutput> {
    if (this.isMockMode) {
      await delay(200);
      const isOverheated = (reading.temperature || 35) > 60;
      const isSoiled = (reading.soiling || 0) > 30;
      const isLowVolt = (reading.voltage || 38) < 28;
      const isAnomaly = isOverheated || isSoiled || isLowVolt;
      return {
        asset_id: reading.asset_id || 'CUSTOM',
        anomaly: isAnomaly,
        reconstruction_error: isAnomaly ? 38.42 : 0.42,
        risk_score: isAnomaly ? 95 : 12,
        risk_level: isAnomaly ? 'CRITICAL' : 'NORMAL',
        failure_risk: isAnomaly ? 92 : 8,
        fault_type: isAnomaly ? (isOverheated ? 'overheating' : 'soiling') : 'none',
        maintenance_priority: isAnomaly ? 'URGENT' : 'ROUTINE',
        recommended_action: isAnomaly
          ? 'Immediate on-site technical inspection required.'
          : 'Asset operating within nominal range.',
        energy_loss_kwh: isAnomaly ? 5.2 : 0,
        revenue_loss: isAnomaly ? 41.6 : 0,
      };
    }
    const res = await this.authFetch(`${BASE_URL}/predict`, {
      method: 'POST',
      body: JSON.stringify(reading),
    });
    const json = await res.json();
    if (json.success && json.data) return json.data;
    throw new Error(json?.error?.message || 'Prediction failed');
  }

  // ── Current user ──────────────────────────────────────────────────────────

  /** GET /api/auth/me – returns the logged-in user's profile and role */
  async getCurrentUser(): Promise<UserInfo | null> {
    if (this.isMockMode) {
      return { id: 1, email: 'operator@solepulse.energy', role: 'manager' };
    }
    try {
      const res = await this.authFetch(`${BASE_URL}/auth/me`);
      const json = await res.json();
      if (json.success && json.data) return json.data as UserInfo;
      return null;
    } catch {
      return null;
    }
  }

  // ── Create asset ──────────────────────────────────────────────────────────

  /** POST /api/assets/ – register a new power-plant unit (operator/manager only) */
  async createAsset(payload: {
    name: string;
    plant_name: string;
    type: 'solar' | 'wind';
    location: string;
    latitude: number;
    longitude: number;
    rated_power_kw?: number;
    string_group?: string;
    commissioned_date?: string;
  }): Promise<Asset> {
    if (this.isMockMode) {
      const mockAsset: Asset = {
        asset_id: `MOCK-${Date.now()}`,
        asset_type: payload.type === 'solar' ? 'solar_panel' : 'wind_turbine',
        location: payload.location,
        status: 'HEALTHY',
        current_readings: {} as any,
        prediction: {} as any,
        last_updated: new Date().toISOString(),
      };
      MOCK_ASSETS.unshift(mockAsset);
      return mockAsset;
    }
    const res = await this.authFetch(`${BASE_URL}/assets/`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (json.success && json.data) return json.data;
    throw new Error(json?.error?.message || 'Failed to create asset');
  }
}

export const api = new ApiService();

