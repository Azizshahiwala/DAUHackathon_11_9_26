import React, { useEffect, useState, useMemo } from 'react';
import { Alert, AlertStatus } from '../types';
import { api } from '../services/api';
import { AlertCard } from '../components/alerts/AlertCard';
import { WindmillLoader } from '../components/common/WindmillLoader';
import { ErrorState } from '../components/common/ErrorState';
import { Bell, Filter, RefreshCw, CheckCircle2 } from 'lucide-react';

interface AlertsProps {
  onInspectAsset: (assetId: string) => void;
}

export const Alerts: React.FC<AlertsProps> = ({ onInspectAsset }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);

  const isFirstAlertRender = React.useRef(true);
  useEffect(() => {
    if (isFirstAlertRender.current) {
      isFirstAlertRender.current = false;
      return;
    }
    setIsFiltering(true);
    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 650);
    return () => clearTimeout(timer);
  }, [severityFilter, statusFilter]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAlerts();
      setAlerts(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to stream real-time alert feed from telemetry bus.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: AlertStatus) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
    await api.updateAlertStatus(id, newStatus);
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchSev = severityFilter === 'ALL' || alert.severity === severityFilter;
      const matchStatus = statusFilter === 'ALL' || alert.status === statusFilter;
      return matchSev && matchStatus;
    });
  }, [alerts, severityFilter, statusFilter]);

  const activeCount = alerts.filter(a => a.status === 'ACTIVE').length;
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'ACTIVE').length;

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-rose-600" />
            <span>Alerts & Incident Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time notifications triggered when reconstruction error exceeds threshold 1.033187
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-none bg-white border border-slate-300 text-xs font-mono">
            <span className="text-slate-500">Active:</span>
            <strong className="text-rose-600">{activeCount}</strong>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">Critical:</span>
            <strong className="text-rose-600 font-bold">{criticalCount}</strong>
          </div>

          <button
            onClick={loadAlerts}
            className="p-1.5 rounded-none bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors"
            title="Refresh alerts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-urbanic-orange' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3 rounded-none flex flex-wrap items-center justify-between gap-3 border border-slate-300">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-mono font-bold">
            <Filter className="w-3.5 h-3.5 text-urbanic-orange" />
            <span>FILTERS:</span>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-none px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-urbanic-orange"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Only</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="RESOLVED">Resolved</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-none px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-urbanic-orange"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-500">
          Showing <strong>{filteredAlerts.length}</strong> alerts
        </span>
      </div>

      {/* Loading State with WindmillLoader */}
      {loading && (
        <WindmillLoader
          message="Syncing Live Alert Stream..."
          subMessage="Evaluating threshold violations across solar arrays & wind turbine inverters"
        />
      )}

      {/* Filtering Loader */}
      {!loading && isFiltering && (
        <div className="py-16 bg-white border border-slate-300">
          <WindmillLoader
            message="Filtering Real-Time Incident Stream..."
            subMessage={`Applying criteria: Status [${statusFilter}] & Severity [${severityFilter}]`}
          />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Alert Telemetry Stream Error"
          message={error}
          onRetry={loadAlerts}
          isRetrying={loading}
        />
      )}

      {/* Alerts Grid */}
      {!loading && !error && !isFiltering && filteredAlerts.length === 0 && (
        <div className="bg-white p-10 rounded-none text-center border border-slate-300">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-800 uppercase font-heading">No Matching Alerts</h4>
          <p className="text-xs text-slate-500 mt-1 font-sans">All incidents in this category are nominal or resolved.</p>
        </div>
      )}

      {!loading && !error && !isFiltering && filteredAlerts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredAlerts.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              onStatusChange={handleStatusChange}
              onInspectAsset={onInspectAsset}
            />
          ))}
        </div>
      )}
    </div>
  );
};
