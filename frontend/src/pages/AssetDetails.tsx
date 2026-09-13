import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Thermometer, 
  Zap, 
  Activity, 
  Sun, 
  DollarSign, 
  AlertTriangle, 
  Wrench, 
  CheckCircle2, 
  TrendingUp, 
  Gauge, 
  Layers 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  ReferenceLine,
  AreaChart,
  Area
} from 'recharts';
import { Asset } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/assets/RiskBadge';
import { WindmillLoader } from '../components/common/WindmillLoader';
import { ErrorState } from '../components/common/ErrorState';

interface AssetDetailsProps {
  assetId: string;
  onBack: () => void;
}

export const AssetDetails: React.FC<AssetDetailsProps> = ({ assetId, onBack }) => {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeChartTab, setActiveChartTab] = useState<'reconstruction' | 'power' | 'electrical' | 'thermal'>('reconstruction');
  const [isChartSwitching, setIsChartSwitching] = useState(false);
  const [chartSwitchMessage, setChartSwitchMessage] = useState('Rendering Neural Reconstruction Error Curves...');

  const chartMeta = {
    reconstruction: 'Computing 24-Hour Neural Reconstruction Error Progression...',
    power: 'Streaming Power Output vs Ambient Irradiance Curves...',
    electrical: 'Mapping Voltage vs Current Characteristic Plane...',
    thermal: 'Analyzing Inverter Temperature vs Dust Soiling Ratios...',
  };

  const handleChartTabChange = (tab: 'reconstruction' | 'power' | 'electrical' | 'thermal') => {
    if (tab === activeChartTab && !isChartSwitching) return;
    setChartSwitchMessage(chartMeta[tab]);
    setIsChartSwitching(true);
    setActiveChartTab(tab);
    setTimeout(() => {
      setIsChartSwitching(false);
    }, 500);
  };

  useEffect(() => {
    loadAssetData();
  }, [assetId]);

  const loadAssetData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [assetData, historyData] = await Promise.all([
        api.getAsset(assetId),
        api.getAssetReadings(assetId),
      ]);
      setAsset(assetData);
      setHistory(historyData);
    } catch (err) {
      console.error(err);
      setError(`Failed to retrieve telemetry profile for ${assetId}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-6">
        <WindmillLoader
          message={`Streaming Diagnostic Telemetry for ${assetId}...`}
          subMessage="Evaluating 24-hour neural reconstruction curve vs 1.033 threshold"
        />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="py-6">
        <ErrorState
          title={`Asset ${assetId} Offline`}
          message={error || "Diagnostic telemetry could not be loaded."}
          onRetry={loadAssetData}
        />
      </div>
    );
  }

  const readings = asset.current_readings;
  const pred = asset.prediction;
  const isAnomaly = pred?.anomaly;

  return (
    <div className="space-y-4">
      {/* Header Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBack}
            className="p-1.5 rounded-none bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900 tracking-tight font-mono">
                Asset {asset.asset_id}
              </h2>
              <RiskBadge level={asset.status} size="sm" />
              <span className="text-xs text-slate-500 font-mono">
                ({asset.asset_type === 'solar_panel' ? 'Solar String' : 'Wind Turbine'})
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Location: <span className="text-slate-800 font-medium">{asset.location}</span> • String: <span className="text-slate-800 font-medium">{asset.string_group || 'N/A'}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-white border border-slate-300 text-xs font-mono rounded-none">
            <span className="text-slate-500">Last Telemetry:</span>{' '}
            <strong className="text-slate-900">{asset.last_updated}</strong>
          </div>
        </div>
      </div>

      {/* AI Diagnostic Banner (Sharp Rectangular) */}
      <div
        className={`p-4 rounded-none border ${
          isAnomaly
            ? 'border-rose-400 bg-white border-l-4 border-l-rose-600'
            : 'border-emerald-400 bg-white border-l-4 border-l-emerald-600'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-none ${
                isAnomaly
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isAnomaly ? (
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                  Neural Anomaly Diagnostic
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-none border ${
                    isAnomaly
                      ? 'bg-rose-100 text-rose-800 border-rose-400'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-400'
                  }`}
                >
                  {isAnomaly ? 'ANOMALY DETECTED' : 'NOMINAL CONDITION'}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {isAnomaly
                  ? `Diagnosed Issue: ${pred?.fault_type.toUpperCase().replace('_', ' ')}`
                  : 'Operating in Optimal Nominal State'}
              </h3>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 font-mono text-xs">
            <div className="p-2 bg-slate-50 border border-slate-300 rounded-none">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Reconstruction Loss</span>
              <strong className={`text-sm font-black ${isAnomaly ? 'text-rose-700' : 'text-emerald-700'}`}>
                {pred?.reconstruction_error.toFixed(4)}
              </strong>
              <span className="text-[9px] text-slate-500 block">Threshold: 1.033187</span>
            </div>

            <div className="p-2 bg-slate-50 border border-slate-300 rounded-none">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Risk Score</span>
              <strong className="text-sm font-black text-amber-700">
                {pred?.risk_score} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </strong>
              <span className="text-[9px] text-slate-500 block">Heuristic Rating</span>
            </div>

            <div className="p-2 bg-slate-50 border border-slate-300 rounded-none">
              <span className="text-slate-500 block text-[9px] uppercase font-bold">Failure Risk</span>
              <strong className="text-sm font-black text-rose-700">
                {pred?.failure_risk}%
              </strong>
              <span className="text-[9px] text-slate-500 block">Urgency Index</span>
            </div>
          </div>
        </div>

        {/* Actionable Recommendation */}
        {pred?.recommended_action && (
          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs">
              <Wrench className="w-4 h-4 text-urbanic-orange shrink-0" />
              <span className="text-slate-800">
                <strong className="text-slate-900">Recommended Action:</strong> {pred.recommended_action}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <RiskBadge level={pred.maintenance_priority} labelPrefix="Priority" size="sm" />
              {(asset.status === 'CRITICAL' || asset.status === 'WARNING') && (
                <button 
                  onClick={() => alert(`Generating Maintenance Work Order TASK-${asset.asset_id}...`)}
                  className="px-3 py-1.5 bg-urbanic-orange hover:bg-urbanic-orangeHover text-white text-[10px] font-bold uppercase tracking-wider transition-colors rounded-none shadow-sm"
                >
                  Dispatch Technician
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6 Sensor Telemetry Gauges (Sharp Rectangular) */}
      <div>
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-2 font-mono">
          Current Sensor Telemetry (6 Monitored Features)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 font-mono">
          <div className="bg-white p-3 border border-slate-300 rounded-none">
            <div className="text-[9px] uppercase text-slate-500 flex items-center justify-between font-bold">
              <span>Temperature</span>
              <Thermometer className="w-3 h-3 text-rose-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {readings.temperature}°C
            </p>
            <span className="text-[9px] text-slate-500">Max limit: 75°C</span>
          </div>

          <div className="bg-white p-3 border border-slate-300 rounded-none">
            <div className="text-[9px] uppercase text-slate-500 flex items-center justify-between font-bold">
              <span>Voltage</span>
              <Zap className="w-3 h-3 text-amber-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {readings.voltage} V
            </p>
            <span className="text-[9px] text-slate-500">Nominal: ~38 V</span>
          </div>

          <div className="bg-white p-3 border border-slate-300 rounded-none">
            <div className="text-[9px] uppercase text-slate-500 flex items-center justify-between font-bold">
              <span>Current</span>
              <Activity className="w-3 h-3 text-cyan-700" />
            </div>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {readings.current} A
            </p>
            <span className="text-[9px] text-slate-500">Nominal: ~9.5 A</span>
          </div>

          <div className="bg-white p-3 border border-slate-300 rounded-none">
            <div className="text-[9px] uppercase text-slate-500 flex items-center justify-between font-bold">
              <span>Irradiance</span>
              <Sun className="w-3 h-3 text-amber-600" />
            </div>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {readings.irradiance} <span className="text-[10px] text-slate-500 font-normal">W/m²</span>
            </p>
            <span className="text-[9px] text-slate-500">Peak sun</span>
          </div>

          <div className="bg-white p-3 border border-slate-300 rounded-none">
            <div className="text-[9px] uppercase text-slate-500 flex items-center justify-between font-bold">
              <span>Soiling</span>
              <Layers className="w-3 h-3 text-indigo-700" />
            </div>
            <p className="text-lg font-bold text-slate-900 mt-0.5">
              {readings.soiling}%
            </p>
            <span className="text-[9px] text-slate-500">Target: &lt; 8%</span>
          </div>

          <div className="bg-white p-3 border border-slate-300 rounded-none relative">
            <div className="text-[9px] uppercase text-slate-500 flex items-center justify-between font-bold">
              <span>Power Output</span>
              <Gauge className="w-3 h-3 text-emerald-700" />
            </div>
            <p className={`text-lg font-bold mt-0.5 ${isAnomaly ? 'text-rose-600' : 'text-emerald-700'}`}>
              {readings.power_output} kW
            </p>
            {isAnomaly && pred?.energy_loss_kwh ? (
              <span className="text-[9px] text-rose-600 font-bold block">
                Exp: {(readings.power_output + (pred.energy_loss_kwh / 24)).toFixed(3)} kW
              </span>
            ) : (
              <span className="text-[9px] text-slate-500">Rating: 0.36 kW</span>
            )}
          </div>
        </div>
      </div>

      {/* Financial Drag (Sharp Rectangular) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        <div className="bg-white p-3.5 border border-amber-300 rounded-none flex items-center gap-3">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-none border border-amber-300">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Estimated Energy Loss</span>
            <p className="text-base font-black text-slate-900 font-mono">
              {pred?.energy_loss_kwh} <span className="text-xs font-normal text-slate-500">kWh / day</span>
            </p>
            <p className="text-[10px] text-slate-500">Deficit compared to healthy peer arrays under matching sunlight</p>
          </div>
        </div>

        <div className="bg-white p-3.5 border border-rose-300 rounded-none flex items-center gap-3">
          <div className="p-2 bg-rose-100 text-rose-800 rounded-none border border-rose-300">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Estimated Revenue Drag</span>
            <p className="text-base font-black text-rose-700 font-mono">
              ${pred?.revenue_loss} <span className="text-xs font-normal text-slate-500">/ day</span>
            </p>
            <p className="text-[10px] text-slate-500">Financial consequence of unmaintained degradation</p>
          </div>
        </div>
      </div>

      {/* Historical Time Series Charts (Sharp Rectangular) */}
      <div className="bg-white p-4 border border-slate-300 rounded-none">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-urbanic-orange" />
              <span>24-Hour Diagnostic Time Series</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Historical sensor trends & neural reconstruction loss evolution
            </p>
          </div>

          {/* Chart selector tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 border border-slate-300 rounded-none text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => handleChartTabChange('reconstruction')}
              className={`px-2.5 py-1 transition-colors rounded-none ${
                activeChartTab === 'reconstruction'
                  ? 'bg-urbanic-orange text-white'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Reconstruction
            </button>
            <button
              onClick={() => handleChartTabChange('power')}
              className={`px-2.5 py-1 transition-colors rounded-none ${
                activeChartTab === 'power'
                  ? 'bg-urbanic-orange text-white'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Power & Sun
            </button>
            <button
              onClick={() => handleChartTabChange('electrical')}
              className={`px-2.5 py-1 transition-colors rounded-none ${
                activeChartTab === 'electrical'
                  ? 'bg-urbanic-orange text-white'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Volt & Current
            </button>
            <button
              onClick={() => handleChartTabChange('thermal')}
              className={`px-2.5 py-1 transition-colors rounded-none ${
                activeChartTab === 'thermal'
                  ? 'bg-urbanic-orange text-white'
                  : 'text-slate-700 hover:text-slate-950'
              }`}
            >
              Temp & Soiling
            </button>
          </div>
        </div>

        {/* Chart View Area (Solid Colors) */}
        {isChartSwitching ? (
          <div className="h-64 w-full flex items-center justify-center bg-slate-50 border border-slate-200">
            <WindmillLoader
              message={chartSwitchMessage}
              subMessage="Calculating multi-variable sensor correlation vectors"
            />
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === 'reconstruction' ? (
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="recGradSharp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f26522" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#f26522" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px' }} />
                <ReferenceLine y={1.033187} stroke="#ea580c" strokeDasharray="4 4" label={{ value: 'Threshold 1.033', fill: '#ea580c', fontSize: 10 }} />
                <Area type="monotone" dataKey="reconstruction_error" stroke="#f26522" strokeWidth={2} fill="url(#recGradSharp)" name="Reconstruction Error" />
              </AreaChart>
            ) : activeChartTab === 'power' ? (
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="left" stroke="#059669" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#d97706" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="power_output" stroke="#059669" strokeWidth={2} name="Power Output (kW)" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="irradiance" stroke="#d97706" strokeWidth={2} name="Irradiance (W/m²)" dot={false} />
              </LineChart>
            ) : activeChartTab === 'electrical' ? (
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="left" stroke="#0284c7" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#4f46e5" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="voltage" stroke="#0284c7" strokeWidth={2} name="Voltage (V)" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="current" stroke="#4f46e5" strokeWidth={2} name="Current (A)" dot={false} />
              </LineChart>
            ) : (
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis yAxisId="left" stroke="#e11d48" fontSize={11} />
                <YAxis yAxisId="right" orientation="right" stroke="#7c3aed" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '0px', fontSize: '11px' }} />
                <Line yAxisId="left" type="monotone" dataKey="temperature" stroke="#e11d48" strokeWidth={2} name="Temperature (°C)" dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="soiling" stroke="#7c3aed" strokeWidth={2} name="Soiling (%)" dot={false} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        )}
      </div>
    </div>
  );
};
