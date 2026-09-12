import React from 'react';
import { Alert, AlertStatus } from '../../types';
import { Clock, CheckCircle2, AlertTriangle, Eye } from 'lucide-react';
import { RiskBadge } from '../assets/RiskBadge';

interface AlertCardProps {
  alert: Alert;
  onStatusChange: (id: string, newStatus: AlertStatus) => void;
  onInspectAsset?: (assetId: string) => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  onStatusChange,
  onInspectAsset,
}) => {
  const getSeverityBorder = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'border-l-4 border-l-rose-600 border-slate-300 bg-white';
      case 'HIGH':
        return 'border-l-4 border-l-amber-500 border-slate-300 bg-white';
      case 'MEDIUM':
        return 'border-l-4 border-l-cyan-600 border-slate-300 bg-white';
      default:
        return 'border-l-4 border-l-slate-400 border-slate-300 bg-white';
    }
  };

  return (
    <div
      className={`p-3.5 border rounded-none transition-all ${getSeverityBorder(
        alert.severity
      )}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <RiskBadge level={alert.severity} size="sm" />
          <span className="font-mono text-sm font-bold text-slate-900">
            Asset {alert.asset_id}
          </span>
          <span className="text-[11px] font-mono text-slate-500">
            • {alert.id}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            <Clock className="w-3 h-3" />
            <span>{alert.created_at}</span>
          </div>

          <span
            className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-none border ${
              alert.status === 'ACTIVE'
                ? 'bg-rose-100 text-rose-800 border-rose-400'
                : alert.status === 'ACKNOWLEDGED'
                ? 'bg-amber-100 text-amber-800 border-amber-400'
                : 'bg-emerald-100 text-emerald-800 border-emerald-400'
            }`}
          >
            {alert.status}
          </span>
        </div>
      </div>

      <h4 className="text-xs font-bold text-slate-900 mt-2 font-heading">
        {alert.title}
      </h4>

      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
        {alert.message}
      </p>

      {/* Action Footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] font-mono text-slate-600 flex items-center gap-1">
          <span>AI Risk Score:</span>
          <strong className="text-rose-700">{alert.risk} / 100</strong>
        </div>

        <div className="flex items-center gap-1.5">
          {onInspectAsset && (
            <button
              onClick={() => onInspectAsset(alert.asset_id)}
              className="px-2 py-1 text-[11px] font-bold rounded-none bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center gap-1 border border-slate-300 uppercase tracking-wider"
            >
              <Eye className="w-3 h-3" />
              <span>Inspect</span>
            </button>
          )}

          {alert.status === 'ACTIVE' && (
            <button
              onClick={() => onStatusChange(alert.id, 'ACKNOWLEDGED')}
              className="px-2 py-1 text-[11px] font-bold rounded-none bg-amber-100 hover:bg-amber-200 text-amber-900 transition-colors border border-amber-400 flex items-center gap-1 uppercase tracking-wider"
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Acknowledge</span>
            </button>
          )}

          {alert.status !== 'RESOLVED' && (
            <button
              onClick={() => onStatusChange(alert.id, 'RESOLVED')}
              className="px-2 py-1 text-[11px] font-bold rounded-none bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition-colors border border-emerald-400 flex items-center gap-1 uppercase tracking-wider"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>Resolve</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
