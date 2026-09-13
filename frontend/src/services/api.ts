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
  User,
  AuthResponse,
  LoginCredentials,
  RegisterPayload,
  CreateAssetPayload
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

const resolveBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  if (apiUrl) {
    const cleanUrl = apiUrl.replace('localhost', '127.0.0.1');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl.replace(/\/$/, '')}/api`;
  }
  return 'http://127.0.0.1:5000/api';
};

let BASE_URL = resolveBaseUrl();
const USE_MOCK = import.meta.env.VITE_USE_MOCK_API === 'true';

// Helper to simulate network latency for smoother UX transitions
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

class ApiService {
  private isMockMode: boolean = USE_MOCK;
  private tokenKey = 'sole_pulse_token';

  public setMockMode(active: boolean) {
    this.isMockMode = active;
  }

  public getIsMockMode(): boolean {
    return this.isMockMode;
  }

  public setBaseUrl(url: string) {
    BASE_URL = url;
  }

  public getBaseUrl(): string {
    return BASE_URL;
  }

  public getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  public setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  public removeToken(): void {
    localStorage.removeItem(this.tokenKey);
  }

  public getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private handleUnauthorized(): void {
    this.removeToken();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('solepulse:unauthorized'));
    }
  }

  // --- Authentication Endpoints ---

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email.trim().toLowerCase(),
          password: credentials.password
        })
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.access_token) {
        this.setToken(json.access_token);
        return {
          success: true,
          access_token: json.access_token,
          user: json.user,
          message: json.message
        };
      } else if (res.ok && json.token) {
        this.setToken(json.token);
        return {
          success: true,
          access_token: json.token,
          user: json.user,
          message: json.message
        };
      }
      return {
        success: false,
        error: json.error || 'Authentication Failed',
        message: json.message || 'Invalid email or password.'
      };
    } catch (err: any) {
      console.error('[API Service] Login error:', err);
      return {
        success: false,
        error: 'Network Error',
        message: err.message || 'Unable to connect to auth server.'
      };
    }
  }

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    try {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const json = await res.json();
      if (res.ok && json.success) {
        if (json.access_token) {
          this.setToken(json.access_token);
        }
        return {
          success: true,
          access_token: json.access_token,
          user: json.user,
          message: json.message
        };
      }
      return {
        success: false,
        error: json.error || 'Registration Failed',
        message: json.message || 'Could not register account.'
      };
    } catch (err: any) {
      return {
        success: false,
        error: 'Network Error',
        message: err.message || 'Unable to connect to auth server.'
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: this.getAuthHeaders()
      });
      if (res.status === 401) {
        this.handleUnauthorized();
        return null;
      }
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        return json.data;
      } else if (res.ok && json.user) {
        return json.user;
      }
      return null;
    } catch (err) {
      console.warn('[API Service] Failed to retrieve current user session:', err);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await fetch(`${BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: this.getAuthHeaders()
        });
      }
    } catch (err) {
      console.warn('[API Service] Logout warning:', err);
    } finally {
      this.removeToken();
    }
  }

  // --- Asset Management (Create / Delete) ---

  async createAsset(payload: CreateAssetPayload): Promise<{ success: boolean; data?: Asset; error?: string; message?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/assets/`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        this.handleUnauthorized();
        return { success: false, error: 'Unauthorized', message: 'Session expired. Please log in.' };
      }
      const json = await res.json();
      if (res.status === 201 && json.success) {
        return { success: true, data: json.data };
      }
      return {
        success: false,
        error: json.error || 'Operation Failed',
        message: json.message || 'Could not create new asset.'
      };
    } catch (err: any) {
      return { success: false, error: 'Network Error', message: err.message };
    }
  }

  // --- Dynamic Mock Asset Injection ---
  async injectMockFaultAsset(): Promise<boolean> {
    const newId = `SIM-${Math.floor(Math.random() * 9000) + 1000}`;
    const base = MOCK_ASSETS.find(a => a.asset_id === "P999") || MOCK_ASSETS[0];
    
    // Create random readings that trip the anomaly logic
    const temp = 65 + Math.random() * 15;
    const soiling = 35 + Math.random() * 20;
    const recError = 40 + Math.random() * 20;
    const riskScore = 90 + Math.floor(Math.random() * 10);
    const revenueLoss = (40 + Math.random() * 30).toFixed(2);
    
    const newAsset: Asset = {
      ...base,
      asset_id: newId,
      location: `Sector ${Math.floor(Math.random() * 9) + 1} - Array ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
      string_group: `String-${String.fromCharCode(65 + Math.floor(Math.random() * 5))}${Math.floor(Math.random() * 9)}`,
      last_updated: new Date().toISOString(),
      current_readings: {
        ...base.current_readings,
        asset_id: newId,
        timestamp: new Date().toISOString(),
        temperature: parseFloat(temp.toFixed(1)),
        soiling: parseFloat(soiling.toFixed(1)),
        voltage: 24.0,
      },
      prediction: {
        ...base.prediction!,
        asset_id: newId,
        anomaly: true,
        risk_level: "CRITICAL",
        reconstruction_error: parseFloat(recError.toFixed(4)),
        risk_score: riskScore,
        revenue_loss: parseFloat(revenueLoss),
        fault_type: temp > 75 ? "overheating" : "combined",
        maintenance_priority: "URGENT",
        recommended_action: "Immediate technical inspection required for injected anomaly.",
      }
    };
    
    const newAlert: Alert = {
      id: `ALT-${newId}`,
      asset_id: newId,
      severity: "CRITICAL",
      title: "Simulated Incident: Deep Neural Degradation",
      message: `PyTorch Autoencoder error (${recError.toFixed(2)}) exceeded threshold. Cell temperature ${temp.toFixed(1)}°C. Est. loss: $${revenueLoss}/day.`,
      risk: riskScore,
      status: "ACTIVE",
      created_at: new Date().toISOString()
    };
    
    MOCK_ASSETS.unshift(newAsset);
    MOCK_ALERTS.unshift(newAlert);
    
    // Dispatch an event so the app can refresh its state without a hard reload
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('solepulse:refresh'));
    }
    
    return true;
  }

  async deleteAsset(assetId: string): Promise<{ success: boolean; error?: string; message?: string }> {
    try {
      const res = await fetch(`${BASE_URL}/assets/${assetId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders()
      });
      if (res.status === 401) {
        this.handleUnauthorized();
        return { success: false, error: 'Unauthorized', message: 'Session expired. Please log in.' };
      }
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, message: json.message };
      }
      return {
        success: false,
        error: json.error || 'Delete Failed',
        message: json.message || `Could not delete asset ${assetId}.`
      };
    } catch (err: any) {
      return { success: false, error: 'Network Error', message: err.message };
    }
  }

  // 1. Get fleet KPI summary
  async getDashboardKPI(): Promise<DashboardKPI> {
    if (this.isMockMode) {
      await delay(120);
      return getDashboardKPI();
    }

    try {
      const res = await fetch(`${BASE_URL}/analytics/kpi`, {
        headers: this.getAuthHeaders()
      });
      if (res.status === 401) {
        this.handleUnauthorized();
      }
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
      const res = await fetch(`${BASE_URL}/assets/`, {
        headers: this.getAuthHeaders()
      });
      if (res.status === 401) {
        this.handleUnauthorized();
      }
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
      const res = await fetch(`${BASE_URL}/assets/${id}`, {
        headers: this.getAuthHeaders()
      });
      if (res.status === 401) {
        this.handleUnauthorized();
      }
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
      const res = await fetch(`${BASE_URL}/assets/${id}/readings`, {
        headers: this.getAuthHeaders()
      });
      if (res.status === 401) {
        this.handleUnauthorized();
      }
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
      const res = await fetch(`${BASE_URL}/alerts/`, {
        headers: this.getAuthHeaders()
      });
      if (res.status === 401) {
        this.handleUnauthorized();
      }
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
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.status === 401) {
        this.handleUnauthorized();
      }
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
      const res = await fetch(`${BASE_URL}/maintenance/`, {
        headers: this.getAuthHeaders()
      });
      if (res.status === 401) {
        this.handleUnauthorized();
      }
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
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ maintenance_status: status })
      });
      if (res.status === 401) {
        this.handleUnauthorized();
      }
      const json = await res.json();
      return json.success === true;
    } catch (err) {
      console.warn(`[API Service] Backend unreachable to update maintenance ${id}. Local update applied.`, err);
      const task = MOCK_MAINTENANCE_TASKS.find(t => t.id === id);
      if (task) task.maintenance_status = status;
      return true;
    }
  }

  // 8b. Get fleet analytics summary (Manager role)
  async getAnalyticsSummary(): Promise<any> {
    try {
      const res = await fetch(`${BASE_URL}/analytics/summary`, {
        headers: this.getAuthHeaders()
      });
      if (res.status === 401) {
        this.handleUnauthorized();
      }
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return null;
    } catch (err) {
      console.warn('[API Service] Backend analytics unreachable.', err);
      return null;
    }
  }

  // 9. Get Tomorrow.io ambient weather (current + 72-hour forecast)
  async getWeather(): Promise<WeatherData> {
    if (this.isMockMode) {
      return MOCK_WEATHER;
    }

    try {
      const res = await fetch(`${BASE_URL}/weather`, {
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return MOCK_WEATHER;
    } catch (err) {
      console.warn('[API Service] Backend weather endpoint unreachable, using mock.', err);
      return MOCK_WEATHER;
    }
  }

  // 9b. Get 72-hour hourly forecast timeline from Tomorrow.io
  async getWeatherForecast(): Promise<any[]> {
    try {
      const res = await fetch(`${BASE_URL}/weather/72h`, {
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      if (json.success && json.data) return json.data;
      return [];
    } catch (err) {
      console.warn('[API Service] Backend weather 72h forecast unreachable.', err);
      return [];
    }
  }

  // 9c. Advance live IoT sensor simulator cycle
  async stepSimulator(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE_URL}/simulator/step`, { 
        method: 'POST',
        headers: this.getAuthHeaders()
      });
      const json = await res.json();
      return json.success === true;
    } catch (err) {
      console.warn('[API Service] Backend simulator step failed.', err);
      return false;
    }
  }

  // 10. Get verified AI Model Performance evaluation metrics
  async getModelPerformance(): Promise<ModelPerformance> {
    if (this.isMockMode) {
      await delay(100);
      return MOCK_MODEL_PERFORMANCE;
    }

    try {
      const res = await fetch(`${BASE_URL}/model-performance`, {
        headers: this.getAuthHeaders()
      });
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
        headers: this.getAuthHeaders(),
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
