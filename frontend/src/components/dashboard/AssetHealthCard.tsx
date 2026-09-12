import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, DollarSign, Zap } from 'lucide-react';
import { DashboardKPI } from '../../types';

interface AssetHealthCardProps {
  kpi: DashboardKPI;
  onFilterByStatus?: (status: 'HEALTHY' | 'WARNING' | 'CRITICAL') => void;
}

export const AssetHealthCard: React.FC<AssetHealthCardProps> = ({ kpi, onFilterByStatus }) => {
  const healthyPct = Math.round((kpi.healthy_assets / kpi.total_assets) * 100) || 0;
  const warningPct = Math.round((kpi.warning_assets / kpi.total_assets) * 100) || 0;
  const criticalPct = Math.round((kpi.critical_assets / kpi.total_assets) * 100) || 0;

  return (
    <div className="bg-white p-4 border border-slate-300 rounded-none">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-heading">
            Fleet Operational Condition
          </h3>
          <p className="text-xs text-slate-500 font-sans">
            Real-time status across all {kpi.total_assets} monitored renewable assets
          </p>
        </div>
        <div className="text-right font-mono">
          <span className="text-[11px] text-slate-500 uppercase font-bold">Availability</span>
          <p className="text-base font-black text-emerald-700 font-mono">{healthyPct}%</p>
        </div>
      </div>

      {/* Segmented Progress Bar (Sharp Rectangular) */}
      <div className="w-full h-3 bg-slate-200 flex gap-0.5 p-0.5 border border-slate-300 rounded-none">
        <div 
          style={{ width: `${healthyPct}%` }} 
          className="bg-emerald-600 h-full rounded-none transition-all duration-500" 
          title={`Healthy: ${kpi.healthy_assets} (${healthyPct}%)`}
        />
        <div 
          style={{ width: `${warningPct}%` }} 
          className="bg-amber-500 h-full rounded-none transition-all duration-500" 
          title={`Warning: ${kpi.warning_assets} (${warningPct}%)`}
        />
        <div 
          style={{ width: `${criticalPct}%` }} 
          className="bg-rose-600 h-full rounded-none transition-all duration-500" 
          title={`Critical: ${kpi.critical_assets} (${criticalPct}%)`}
        />
      </div>

      {/* Grid of 3 Health Counters (Sharp Rectangular Buttons) */}
      <div className="grid grid-cols-3 gap-2.5 mt-3">
        <button
          onClick={() => onFilterByStatus && onFilterByStatus('HEALTHY')}
          className="p-3 bg-slate-50 border border-slate-300 hover:border-emerald-600 text-left transition-all rounded-none"
        >
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 font-bold uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Healthy</span>
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900 font-mono">
            {kpi.healthy_assets}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {healthyPct}% of fleet
          </div>
        </button>

        <button
          onClick={() => onFilterByStatus && onFilterByStatus('WARNING')}
          className="p-3 bg-slate-50 border border-slate-300 hover:border-amber-600 text-left transition-all rounded-none"
        >
          <div className="flex items-center gap-1.5 text-xs text-amber-800 font-bold uppercase">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Warning</span>
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900 font-mono">
            {kpi.warning_assets}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            {warningPct}% at risk
          </div>
        </button>

        <button
          onClick={() => onFilterByStatus && onFilterByStatus('CRITICAL')}
          className="p-3 bg-slate-50 border border-slate-300 hover:border-rose-600 text-left transition-all rounded-none"
        >
          <div className="flex items-center gap-1.5 text-xs text-rose-800 font-bold uppercase">
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Critical</span>
          </div>
          <div className="mt-1 text-2xl font-black text-slate-900 font-mono">
            {kpi.critical_assets}
          </div>
          <div className="text-[11px] text-slate-500 font-medium">
            Action required
          </div>
        </button>
      </div>

      {/* Financial & Yield Quantifier (Sharp Rectangular) */}
      <div className="mt-3 pt-3 border-t border-slate-200 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-none">
          <div className="p-2 bg-amber-100 text-amber-800 border border-amber-300 rounded-none">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Est. Energy Loss</span>
            <p className="text-sm font-black text-slate-900 font-mono">
              {kpi.total_energy_loss_kwh} <span className="text-[11px] font-normal text-slate-500">kWh/day</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-2 bg-slate-50 border border-slate-200 rounded-none">
          <div className="p-2 bg-rose-100 text-rose-800 border border-rose-300 rounded-none">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">Est. Revenue Drag</span>
            <p className="text-sm font-black text-rose-700 font-mono">
              ${kpi.total_revenue_loss} <span className="text-[11px] font-normal text-slate-500">/ day</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
