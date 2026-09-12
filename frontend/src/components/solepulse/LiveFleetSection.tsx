import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Cpu, 
  AlertTriangle, 
  Wrench, 
  BarChart3, 
  Zap, 
  DollarSign, 
  ShieldCheck, 
  Bell, 
  RefreshCw 
} from 'lucide-react';
import { DashboardKPI, Asset, Alert, UserInfo, ROLE_CAN_VIEW_KPI, ROLE_CAN_VIEW_MAINTENANCE, ROLE_CAN_VIEW_ANALYTICS } from '../../types';
import { api } from '../../services/api';
import { StatCard } from '../dashboard/StatCard';
import { AssetHealthCard } from '../dashboard/AssetHealthCard';
import { AlertSummary } from '../dashboard/AlertSummary';
import { AssetTable } from '../assets/AssetTable';
import { AssetDetails } from '../../pages/AssetDetails';
import { Alerts } from '../../pages/Alerts';
import { Maintenance } from '../../pages/Maintenance';
import { Analytics } from '../../pages/Analytics';
import { WindmillLoader } from '../common/WindmillLoader';
import { ErrorState } from '../common/ErrorState';

export const LiveFleetSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'kpi' | 'table' | 'details' | 'alerts' | 'maintenance' | 'analytics'>('kpi');
  const [selectedAssetId, setSelectedAssetId] = useState<string>('P999');
  
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTabSwitching, setIsTabSwitching] = useState(false);
  const [tabSwitchInfo, setTabSwitchInfo] = useState({
    msg: 'Switching Telemetry Function...',
    sub: 'Synchronizing sensor streams'
  });

  const tabMeta: Record<string, { msg: string; sub: string }> = {
    kpi: {
      msg: 'Loading Fleet Overview & Core KPIs...',
      sub: 'Aggregating nominal yield and total active capacity'
    },
    table: {
      msg: 'Accessing 100-Asset Operating Directory...',
      sub: 'Querying electrical, thermal, and irradiance telemetry records'
    },
    details: {
      msg: `Loading Diagnostic Profile: Asset ${selectedAssetId}...`,
      sub: 'Evaluating 24-hour neural autoencoder reconstruction loss curves'
    },
    alerts: {
      msg: 'Connecting to Real-Time Anomaly Alert Stream...',
      sub: 'Fetching threshold violation notifications across inverters'
    },
    maintenance: {
      msg: 'Optimizing Prioritized Maintenance Dispatch...',
      sub: 'Ranking work orders by estimated financial drag & safety risk'
    },
    analytics: {
      msg: 'Aggregating Fleet Anomaly & Yield Distributions...',
      sub: 'Computing sector loss patterns and failure mode frequencies'
    },
  };

  const handleTabChange = (newTab: 'kpi' | 'table' | 'details' | 'alerts' | 'maintenance' | 'analytics') => {
    if (newTab === activeTab && !isTabSwitching) return;
    const info = tabMeta[newTab] || { msg: 'Switching Fleet Function...', sub: 'Synchronizing telemetry' };
    setTabSwitchInfo(info);
    setIsTabSwitching(true);
    setTimeout(() => {
      setActiveTab(newTab);
      setIsTabSwitching(false);
    }, 600);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [kpiData, assetsData, alertsData, user] = await Promise.all([
        api.getDashboardKPI(),
        api.getAssets(),
        api.getAlerts(),
        api.getCurrentUser(),
      ]);
      setKpi(kpiData);
      setAssets(assetsData);
      setAlerts(alertsData);
      setCurrentUser(user);
      
      // Default routing based on role if they can't view KPI
      if (user && !ROLE_CAN_VIEW_KPI.includes(user.role) && activeTab === 'kpi') {
         setActiveTab('maintenance');
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to stream live telemetry from farm gateway.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setTimeout(() => setIsRefreshing(false), 300);
  };

  const handleInspectAsset = (assetId: string) => {
    setSelectedAssetId(assetId);
    setTabSwitchInfo({
      msg: `Loading Telemetry Diagnostics for Asset ${assetId}...`,
      sub: 'Correlating sensor vectors with neural autoencoder anomaly thresholds'
    });
    setIsTabSwitching(true);
    setTimeout(() => {
      setActiveTab('details');
      setIsTabSwitching(false);
    }, 600);
  };

  return (
    <section id="fleet-dashboard" className="py-8 px-4 lg:px-12 bg-slate-100 border-t border-b border-slate-300">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Section Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-600 rounded-none"></span>
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-urbanic-orange">
                Live Operation Center
              </span>
            </div>
            <h2 className="text-xl lg:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              Sole Pulse <span className="text-urbanic-orange">Predictive Fleet Monitoring</span>
            </h2>
            <p className="text-xs text-slate-500">
              Real-time IoT telemetry and deep neural autoencoder diagnostics across 100 renewable solar & wind assets.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 border border-slate-300 shadow-sm transition-colors uppercase tracking-wider"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-urbanic-orange' : ''}`} />
              <span>Sync Telemetry</span>
            </button>
          </div>
        </div>

        {/* Dashboard Sub-Tabs (Sharp Rectangular) */}
        <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-300 pb-0">
          {[
            { id: 'kpi', label: 'Fleet Overview', icon: Activity, show: !currentUser || ROLE_CAN_VIEW_KPI.includes(currentUser.role) },
            { id: 'table', label: 'Asset Directory (100)', icon: Cpu, show: true },
            { id: 'details', label: `Diagnostics: ${selectedAssetId}`, icon: Zap, show: true },
            { id: 'alerts', label: `Active Alerts (${alerts.filter(a => a.status === 'ACTIVE').length})`, icon: Bell, show: true },
            { id: 'maintenance', label: 'Urgent Work Orders', icon: Wrench, show: !currentUser || ROLE_CAN_VIEW_MAINTENANCE.includes(currentUser.role) },
            { id: 'analytics', label: 'Fleet Analytics', icon: BarChart3, show: !currentUser || ROLE_CAN_VIEW_ANALYTICS.includes(currentUser.role) },
          ].filter(t => t.show).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id as any)}
                className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider transition-all shrink-0 rounded-none ${
                  isActive
                    ? 'bg-urbanic-orange text-white'
                    : 'bg-white text-slate-700 hover:text-urbanic-orange hover:bg-slate-50 border-t border-l border-r border-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* LOADING STATE WITH ANIMATED WINDMILL CONCEPT */}
        {loading && (
          <WindmillLoader
            message="Streaming Renewable Asset Telemetry..."
            subMessage="Evaluating 100 solar & wind assets against 1.033187 reconstruction threshold"
          />
        )}

        {/* TAB SWITCHING LOADER */}
        {!loading && isTabSwitching && (
          <div className="py-16 bg-white border border-slate-300">
            <WindmillLoader
              message={tabSwitchInfo.msg}
              subMessage={tabSwitchInfo.sub}
            />
          </div>
        )}

        {/* ERROR STATE */}
        {!loading && error && (
          <ErrorState
            title="Farm Gateway Offline"
            message={error}
            onRetry={loadData}
            isRetrying={isRefreshing}
          />
        )}

        {/* Tab 1: KPI Fleet Overview */}
        {!loading && !error && !isTabSwitching && activeTab === 'kpi' && kpi && (
          <div className="space-y-4">
            {/* 7 KPI Boxes (Sharp Rectangular) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
              <StatCard
                title="Total Assets"
                value={kpi.total_assets}
                subtitle="Monitored Fleet"
                icon={Cpu}
                color="cyan"
                onClick={() => setActiveTab('table')}
              />
              <StatCard
                title="Healthy"
                value={kpi.healthy_assets}
                subtitle="Nominal Operations"
                icon={ShieldCheck}
                color="emerald"
                onClick={() => setActiveTab('table')}
              />
              <StatCard
                title="Warning"
                value={kpi.warning_assets}
                subtitle="Early Degradation"
                icon={AlertTriangle}
                color="amber"
                onClick={() => setActiveTab('table')}
              />
              <StatCard
                title="Critical"
                value={kpi.critical_assets}
                subtitle="Urgent Intervention"
                icon={AlertTriangle}
                color="rose"
                onClick={() => setActiveTab('table')}
              />
              <StatCard
                title="Active Alerts"
                value={kpi.active_alerts}
                subtitle="Unresolved Triggers"
                icon={Bell}
                color="rose"
                onClick={() => setActiveTab('alerts')}
              />
              <StatCard
                title="Energy Loss"
                value={`${kpi.total_energy_loss_kwh} kWh`}
                subtitle="Est. Daily Drag"
                icon={Zap}
                color="amber"
                onClick={() => setActiveTab('maintenance')}
              />
              <StatCard
                title="Revenue Drag"
                value={`$${kpi.total_revenue_loss}`}
                subtitle="Est. Financial Lost"
                icon={DollarSign}
                color="rose"
                onClick={() => setActiveTab('maintenance')}
              />
            </div>

            {/* Health Bar + Active Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              <div className="lg:col-span-7">
                <AssetHealthCard kpi={kpi} onFilterByStatus={() => setActiveTab('table')} />
              </div>
              <div className="lg:col-span-5">
                <AlertSummary
                  alerts={alerts}
                  onViewAll={() => setActiveTab('alerts')}
                  onSelectAlert={(a) => handleInspectAsset(a.asset_id)}
                />
              </div>
            </div>

            {/* Quick At-Risk Triage Banner */}
            <div className="p-3.5 bg-white border border-slate-300 rounded-none flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-rose-700 border border-rose-300 rounded-none">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 uppercase">
                    Priority Incident: Solar String P999
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Reconstruction error 50.293 (threshold: 1.033). Losing $52.99 / day due to combined soiling and diode hotspot.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleInspectAsset('P999')}
                className="px-4 py-2 bg-urbanic-orange hover:bg-urbanic-orangeHover text-white text-xs font-bold uppercase tracking-wider rounded-none shadow-none transition-colors"
              >
                Inspect Telemetry Diagnostics
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Asset Directory Table */}
        {!loading && !error && !isTabSwitching && activeTab === 'table' && (
          <div className="space-y-3">
            <AssetTable
              assets={assets}
              onSelectAsset={handleInspectAsset}
              initialStatusFilter="ALL"
            />
          </div>
        )}

        {/* Tab 3: Detailed Telemetry & Anomaly Analysis */}
        {!loading && !error && !isTabSwitching && activeTab === 'details' && (
          <div className="space-y-3">
            <AssetDetails
              assetId={selectedAssetId}
              onBack={() => handleTabChange('table')}
            />
          </div>
        )}

        {/* Tab 4: Alerts Management */}
        {!loading && !error && !isTabSwitching && activeTab === 'alerts' && (
          <div className="space-y-3">
            <Alerts onInspectAsset={handleInspectAsset} />
          </div>
        )}

        {/* Tab 5: Prioritized Maintenance Queue */}
        {!loading && !error && !isTabSwitching && activeTab === 'maintenance' && (
          <div className="space-y-3">
            <Maintenance onInspectAsset={handleInspectAsset} />
          </div>
        )}

        {/* Tab 6: Fleet Analytics */}
        {!loading && !error && !isTabSwitching && activeTab === 'analytics' && (
          <div className="space-y-3">
            <Analytics />
          </div>
        )}
      </div>
    </section>
  );
};
