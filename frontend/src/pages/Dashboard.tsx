import React, { useEffect, useState } from 'react';
import { 
  Zap, 
  DollarSign, 
  ShieldCheck, 
  AlertTriangle, 
  Cpu, 
  Bell, 
  ArrowRight,
  Sun
} from 'lucide-react';
import { DashboardKPI, Asset, Alert } from '../types';
import { api } from '../services/api';
import { StatCard } from '../components/dashboard/StatCard';
import { AssetHealthCard } from '../components/dashboard/AssetHealthCard';
import { AlertSummary } from '../components/dashboard/AlertSummary';
import { RiskBadge } from '../components/assets/RiskBadge';
import { WindmillLoader } from '../components/common/WindmillLoader';
import { ErrorState } from '../components/common/ErrorState';

interface DashboardProps {
  onNavigateTab: (tab: any, filter?: string) => void;
  onSelectAsset: (assetId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateTab, onSelectAsset }) => {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [criticalAssets, setCriticalAssets] = useState<Asset[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [kpiData, assetsData, alertsData] = await Promise.all([
        api.getDashboardKPI(),
        api.getAssets(),
        api.getAlerts(),
      ]);

      setKpi(kpiData);
      const atRisk = assetsData
        .filter(a => a.status === 'CRITICAL' || (a.prediction?.risk_score || 0) > 70)
        .sort((a, b) => (b.prediction?.risk_score || 0) - (a.prediction?.risk_score || 0))
        .slice(0, 5);

      setCriticalAssets(atRisk);
      setAlerts(alertsData);
    } catch (err: any) {
      console.error(err);
      setError('Unable to load fleet telemetry metrics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <WindmillLoader
          message="Streaming Fleet Metrics..."
          subMessage="Fetching 20,000 operational cycles and Open-Meteo ambient vectors"
        />
      </div>
    );
  }

  if (error || !kpi) {
    return (
      <div className="py-8 max-w-2xl mx-auto">
        <ErrorState
          title="Telemetry Feed Disconnected"
          message={error || "Failed to load real-time metrics."}
          onRetry={loadDashboardData}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner: Tomorrow.io Ambient Conditions */}
      <div className="bg-white p-3.5 border-l-4 border-l-urbanic-orange border-t border-r border-b border-slate-300 rounded-none flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-orange-100 text-urbanic-orange rounded-none">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-slate-900 uppercase">
                Ambient Conditions (Tomorrow.io 72h Engine)
              </h2>
              <span className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Socket
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Real-time synchronization with PyTorch autoencoder pipeline
            </p>
          </div>
        </div>

        {kpi.open_meteo_ambient && (
          <div className="flex items-center gap-4 font-mono text-xs">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Solar Radiation</span>
              <span className="font-bold text-amber-700">{kpi.open_meteo_ambient.solar_radiation} W/m²</span>
            </div>
            <div className="w-px h-5 bg-slate-300"></div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Ambient Temp</span>
              <span className="font-bold text-cyan-700">{kpi.open_meteo_ambient.ambient_temperature}°C</span>
            </div>
            <div className="w-px h-5 bg-slate-300"></div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Wind Vectors</span>
              <span className="font-bold text-indigo-700">{kpi.open_meteo_ambient.wind_speed} km/h</span>
            </div>
          </div>
        )}
      </div>

      {/* 7 KPI Cards (Sharp Rectangular) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        <StatCard
          title="Total Assets"
          value={kpi.total_assets}
          subtitle="Monitored Fleet"
          icon={Cpu}
          color="cyan"
          onClick={() => onNavigateTab('assets', 'ALL')}
        />
        <StatCard
          title="Healthy"
          value={kpi.healthy_assets}
          subtitle="Nominal Operations"
          icon={ShieldCheck}
          color="emerald"
          onClick={() => onNavigateTab('assets', 'HEALTHY')}
        />
        <StatCard
          title="Warning"
          value={kpi.warning_assets}
          subtitle="Early Degradation"
          icon={AlertTriangle}
          color="amber"
          onClick={() => onNavigateTab('assets', 'WARNING')}
        />
        <StatCard
          title="Critical"
          value={kpi.critical_assets}
          subtitle="Urgent Intervention"
          icon={AlertTriangle}
          color="rose"
          onClick={() => onNavigateTab('assets', 'CRITICAL')}
        />
        <StatCard
          title="Active Alerts"
          value={kpi.active_alerts}
          subtitle="Unresolved Triggers"
          icon={Bell}
          color="rose"
          onClick={() => onNavigateTab('alerts')}
        />
        <StatCard
          title="Energy Loss"
          value={`${kpi.total_energy_loss_kwh} kWh`}
          subtitle="Estimated Lost Yield"
          icon={Zap}
          color="amber"
          onClick={() => onNavigateTab('analytics')}
        />
        <StatCard
          title="Revenue Loss"
          value={`$${kpi.total_revenue_loss}`}
          subtitle="Est. Financial Drag"
          icon={DollarSign}
          color="rose"
          onClick={() => onNavigateTab('maintenance')}
        />
      </div>

      {/* Main Grid: Fleet Health + Active Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="lg:col-span-7">
          <AssetHealthCard 
            kpi={kpi} 
            onFilterByStatus={(status) => onNavigateTab('assets', status)}
          />
        </div>
        <div className="lg:col-span-5">
          <AlertSummary
            alerts={alerts}
            onViewAll={() => onNavigateTab('alerts')}
            onSelectAlert={(a) => onSelectAsset(a.asset_id)}
          />
        </div>
      </div>

      {/* Priority At-Risk Assets Table (Sharp Rectangular) */}
      <div className="bg-white p-4 border border-slate-300 rounded-none">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Top At-Risk Renewable Assets
            </h3>
            <p className="text-xs text-slate-500">
              Ranked dynamically by reconstruction loss and failure risk
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('assets', 'CRITICAL')}
            className="text-xs font-bold text-urbanic-orange hover:underline flex items-center gap-1 transition-colors uppercase tracking-wider"
          >
            <span>View All Fleet</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-[10px] uppercase text-slate-600 tracking-wider">
                <th className="py-2 px-2.5">Asset</th>
                <th className="py-2 px-2.5">Type</th>
                <th className="py-2 px-2.5">Reconstruction Loss</th>
                <th className="py-2 px-2.5">Risk Score</th>
                <th className="py-2 px-2.5">Diagnosed Fault</th>
                <th className="py-2 px-2.5">Daily Drag ($)</th>
                <th className="py-2 px-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {criticalAssets.map((asset) => (
                <tr key={asset.asset_id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-2.5 font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-rose-600 rounded-none"></span>
                    <span>{asset.asset_id}</span>
                  </td>
                  <td className="py-2.5 px-2.5 text-slate-700 capitalize font-sans text-xs">
                    {asset.asset_type === 'solar_panel' ? 'Solar String' : 'Wind Turbine'}
                  </td>
                  <td className="py-2.5 px-2.5">
                    <span className="text-rose-700 font-bold">
                      {asset.prediction?.reconstruction_error.toFixed(4)}
                    </span>
                    <span className="text-[10px] text-slate-500 ml-1">(&gt;1.033)</span>
                  </td>
                  <td className="py-2.5 px-2.5">
                    <RiskBadge level={asset.prediction?.risk_level || 'CRITICAL'} score={asset.prediction?.risk_score} size="sm" />
                  </td>
                  <td className="py-2.5 px-2.5 text-amber-700 capitalize">
                    {asset.prediction?.fault_type.replace('_', ' ')}
                  </td>
                  <td className="py-2.5 px-2.5 text-rose-700 font-bold">
                    ${asset.prediction?.revenue_loss} / day
                  </td>
                  <td className="py-2.5 px-2.5 text-right">
                    <button
                      onClick={() => onSelectAsset(asset.asset_id)}
                      className="px-2.5 py-1 bg-urbanic-orange hover:bg-urbanic-orangeHover text-white text-[10px] font-bold uppercase tracking-wider rounded-none transition-colors"
                    >
                      Diagnostic
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
