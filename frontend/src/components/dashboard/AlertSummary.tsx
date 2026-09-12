import React from 'react';
import { Clock, ArrowRight, ShieldAlert } from 'lucide-react';
import { Alert } from '../../types';

interface AlertSummaryProps {
  alerts: Alert[];
  onViewAll: () => void;
  onSelectAlert?: (alert: Alert) => void;
}

export const AlertSummary: React.FC<AlertSummaryProps> = ({ alerts, onViewAll, onSelectAlert }) => {
  const activeAlerts = alerts.filter(a => a.status === 'ACTIVE').slice(0, 4);

  const severityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-100 text-rose-800 border-rose-400';
      case 'HIGH':
        return 'bg-amber-100 text-amber-800 border-amber-400';
      case 'MEDIUM':
        return 'bg-cyan-100 text-cyan-800 border-cyan-400';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-400';
    }
  };

  return (
    <div className="bg-white p-4 border border-slate-300 rounded-none flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-heading">
              Active Fleet Alerts
            </h3>
          </div>
          <button
            onClick={onViewAll}
            className="text-xs font-bold text-urbanic-orange hover:underline flex items-center gap-1 transition-colors uppercase tracking-wider"
          >
            <span>View All ({alerts.length})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {activeAlerts.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">
              No active critical alerts. Fleet nominal.
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <div
                key={alert.id}
                onClick={() => onSelectAlert && onSelectAlert(alert)}
                className="p-2.5 bg-slate-50 border border-slate-300 hover:border-urbanic-orange transition-all cursor-pointer group rounded-none"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 rounded-none border ${severityBadge(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </span>
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {alert.asset_id}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500">
                    <Clock className="w-3 h-3" />
                    <span>{alert.created_at}</span>
                  </div>
                </div>

                <p className="text-xs font-bold text-slate-800 mt-1 group-hover:text-urbanic-orange transition-colors">
                  {alert.title}
                </p>

                <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">
                  {alert.message}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
        <span>Anomaly Ingestion Stream</span>
        <span className="font-mono text-rose-700 font-bold">
          {activeAlerts.length} Unresolved
        </span>
      </div>
    </div>
  );
};
