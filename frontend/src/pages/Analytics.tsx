import React, { useEffect, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  CartesianGrid
} from 'recharts';
import { Asset, DashboardKPI } from '../types';
import { api } from '../services/api';
import { WindmillLoader } from '../components/common/WindmillLoader';
import { ErrorState } from '../components/common/ErrorState';
import { BarChart3, TrendingUp, PieChart as PieIcon, Zap, DollarSign, RefreshCw } from 'lucide-react';

export const Analytics: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [kpi, setKpi] = useState<DashboardKPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    Promise.all([api.getAssets(), api.getDashboardKPI()])
      .then(([assetsData, kpiData]) => {
        setAssets(assetsData);
        setKpi(kpiData);
      })
      .catch((err: any) => {
        console.error(err);
        setError("Failed to stream analytics aggregations from data warehouse.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <WindmillLoader
        message="Aggregating Fleet Telemetry Analytics..."
        subMessage="Computing cross-sector distributions and neural reconstruction loss patterns across 100 assets"
      />
    );
  }

  if (error) {
    return (
      <ErrorState
        title="Fleet Analytics Offline"
        message={error}
        onRetry={loadData}
        isRetrying={loading}
      />
    );
  }

  // 1. Fault Distribution Data
  const faultCounts: Record<string, number> = {};
  assets.forEach(a => {
    const f = a.prediction?.fault_type || 'none';
    if (f !== 'none') {
      faultCounts[f] = (faultCounts[f] || 0) + 1;
    }
  });

  const faultChartData = Object.entries(faultCounts).map(([fault, count]) => ({
    fault: fault.replace('_', ' '),
    count,
  }));

  // 2. Health Distribution (Pie)
  const healthData = [
    { name: 'Healthy', value: kpi?.healthy_assets || 90, color: '#10b981' },
    { name: 'Warning', value: kpi?.warning_assets || 6, color: '#f59e0b' },
    { name: 'Critical', value: kpi?.critical_assets || 4, color: '#ef4444' },
  ];

  // 3. Maintenance Priority Breakdown
  const priorityCounts: Record<string, number> = { URGENT: 0, HIGH: 0, MEDIUM: 0, ROUTINE: 0 };
  assets.forEach(a => {
    const p = a.prediction?.maintenance_priority || 'ROUTINE';
    priorityCounts[p] = (priorityCounts[p] || 0) + 1;
  });

  const priorityChartData = [
    { priority: 'Urgent', count: priorityCounts.URGENT, color: '#ef4444' },
    { priority: 'High', count: priorityCounts.HIGH, color: '#f59e0b' },
    { priority: 'Medium', count: priorityCounts.MEDIUM, color: '#06b6d4' },
    { priority: 'Routine', count: priorityCounts.ROUTINE, color: '#10b981' },
  ];

  // 4. Financial Drag by Sector/Array
  const sectorLoss: Record<string, { loss: number; kwh: number }> = {};
  assets.forEach(a => {
    const sector = a.location.split(' - ')[0] || 'Sector 1';
    if (!sectorLoss[sector]) sectorLoss[sector] = { loss: 0, kwh: 0 };
    sectorLoss[sector].loss += (a.prediction?.revenue_loss || 0);
    sectorLoss[sector].kwh += (a.prediction?.energy_loss_kwh || 0);
  });

  const sectorChartData = Object.entries(sectorLoss).map(([sector, val]) => ({
    sector,
    revenueLoss: Number(val.loss.toFixed(2)),
    energyLoss: Number(val.kwh.toFixed(2)),
  }));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-urbanic-orange" />
            <span>Fleet Analytics & Anomaly Patterns</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical breakdown across 100 monitored renewable assets
          </p>
        </div>

        <button
          onClick={loadData}
          className="p-1.5 rounded-none bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-urbanic-orange' : ''}`} />
        </button>
      </div>

      {/* Row 1: Health Distribution Pie & Fault Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Pie Chart: Fleet Condition */}
        <div className="lg:col-span-5 bg-white p-4 rounded-none border border-slate-300">
          <div className="flex items-center gap-2 mb-3">
            <PieIcon className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Fleet Health Distribution
            </h3>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {healthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px', color: '#1e293b' }} />
                <Legend formatter={(value) => <span className="text-xs text-slate-700 font-bold">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 text-center text-[11px] text-slate-600 font-mono">
            {kpi?.healthy_assets} Healthy ({Math.round(((kpi?.healthy_assets || 90) / 100) * 100)}%) &bull; {kpi?.critical_assets} Critical &bull; {kpi?.warning_assets} Warning
          </div>
        </div>

        {/* Bar Chart: Diagnosed Fault Frequency */}
        <div className="lg:col-span-7 bg-white p-4 rounded-none border border-slate-300">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-urbanic-orange" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Identified Anomaly Categories
            </h3>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={faultChartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="fault" type="category" stroke="#475569" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px', color: '#1e293b' }} />
                <Bar dataKey="count" fill="#f26522" radius={[0, 0, 0, 0]} name="Affected Assets" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 text-center text-[11px] text-slate-600 font-mono">
            Soiling, overheating, and partial shading represent observed maintenance issues
          </div>
        </div>
      </div>

      {/* Row 2: Financial Drag by Sector & Maintenance Priority */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Sector Financial Drag */}
        <div className="lg:col-span-7 bg-white p-4 rounded-none border border-slate-300">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="w-4 h-4 text-rose-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Financial Drag by Sector ($ / day)
            </h3>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sectorChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="sector" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px', color: '#1e293b' }} />
                <Legend formatter={(value) => <span className="text-xs text-slate-700 font-bold">{value}</span>} />
                <Bar dataKey="revenueLoss" fill="#ef4444" radius={[0, 0, 0, 0]} name="Est Revenue Loss ($)" />
                <Bar dataKey="energyLoss" fill="#f59e0b" radius={[0, 0, 0, 0]} name="Est Yield Loss (kWh)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Priority Distribution */}
        <div className="lg:col-span-5 bg-white p-4 rounded-none border border-slate-300">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-cyan-600" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Fleet Maintenance Urgency Profile
            </h3>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="priority" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px', color: '#1e293b' }} />
                <Bar dataKey="count" radius={[0, 0, 0, 0]}>
                  {priorityChartData.map((entry, index) => (
                    <Cell key={`cell-priority-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200 text-center text-[11px] text-slate-600 font-mono">
            {priorityCounts.URGENT} Urgent Dispatches required immediately
          </div>
        </div>
      </div>
    </div>
  );
};
