import React, { useEffect, useState } from 'react';
import { MaintenanceTask, MaintenanceStatus } from '../types';
import { api } from '../services/api';
import { RiskBadge } from '../components/assets/RiskBadge';
import { WindmillLoader } from '../components/common/WindmillLoader';
import { ErrorState } from '../components/common/ErrorState';
import { 
  Wrench, 
  UserCheck, 
  Eye,
  RefreshCw
} from 'lucide-react';

interface MaintenanceProps {
  onInspectAsset: (assetId: string) => void;
}

export const Maintenance: React.FC<MaintenanceProps> = ({ onInspectAsset }) => {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFiltering, setIsFiltering] = useState<boolean>(false);

  useEffect(() => {
    loadTasks();
  }, []);

  const handlePriorityChange = (priority: string) => {
    if (priority === selectedPriority) return;
    setIsFiltering(true);
    setSelectedPriority(priority);
    setTimeout(() => {
      setIsFiltering(false);
    }, 600);
  };

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMaintenanceTasks();
      setTasks(data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load maintenance queue from task dispatcher.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: MaintenanceStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, maintenance_status: newStatus } : t));
    await api.updateMaintenanceStatus(id, newStatus);
  };

  const priorityWeight: Record<string, number> = {
    URGENT: 4,
    HIGH: 3,
    MEDIUM: 2,
    ROUTINE: 1,
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    const weightDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (weightDiff !== 0) return weightDiff;
    return b.estimated_revenue_loss - a.estimated_revenue_loss;
  });

  const filteredTasks = sortedTasks.filter(t => 
    selectedPriority === 'ALL' || t.priority === selectedPriority
  );

  const totalLoss = tasks.reduce((sum, t) => sum + t.estimated_revenue_loss, 0);
  const urgentCount = tasks.filter(t => t.priority === 'URGENT').length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 pb-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-urbanic-orange" />
            <span>Prioritized Maintenance Dispatch Queue</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ranked by safety urgency and daily financial yield drag
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-none bg-white border border-slate-300">
            <span className="text-slate-500">Urgent:</span>{' '}
            <strong className="text-rose-600 font-bold">{urgentCount}</strong>
          </div>
          <div className="px-3 py-1.5 rounded-none bg-white border border-slate-300">
            <span className="text-slate-500">Total Drag:</span>{' '}
            <strong className="text-rose-600 font-bold">${totalLoss.toFixed(2)}/day</strong>
          </div>
          <button
            onClick={loadTasks}
            className="p-1.5 rounded-none bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 transition-colors"
            title="Refresh work orders"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-urbanic-orange' : ''}`} />
          </button>
        </div>
      </div>

      {/* Priority Filter Buttons */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['ALL', 'URGENT', 'HIGH', 'MEDIUM', 'ROUTINE'].map(p => (
          <button
            key={p}
            onClick={() => handlePriorityChange(p)}
            className={`px-3 py-1.5 rounded-none text-xs font-mono font-bold uppercase transition-all ${
              selectedPriority === p
                ? 'bg-urbanic-orange text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            {p === 'ALL' ? 'All Priorities' : p}
          </button>
        ))}
      </div>

      {/* Loading State with WindmillLoader */}
      {loading && (
        <WindmillLoader
          message="Loading Maintenance Dispatch Schedule..."
          subMessage="Correlating PyTorch fault diagnoses with field technician assignments"
        />
      )}

      {/* Priority Filter Switching Loader */}
      {!loading && isFiltering && (
        <div className="py-16 bg-white border border-slate-300">
          <WindmillLoader
            message={`Sorting Priority Queue: ${selectedPriority}...`}
            subMessage="Recomputing revenue impact and dispatch sequence"
          />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <ErrorState
          title="Maintenance Dispatch Offline"
          message={error}
          onRetry={loadTasks}
          isRetrying={loading}
        />
      )}

      {/* Maintenance Tasks List */}
      {!loading && !error && !isFiltering && (
        <div className="space-y-3">
          {filteredTasks.map((task, index) => {
            const isUrgent = task.priority === 'URGENT';

            return (
              <div
                key={task.id}
                className={`p-4 rounded-none border transition-all bg-white ${
                  isUrgent ? 'border-l-4 border-l-rose-600 border-slate-300' : 'border-slate-300'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-7 h-7 rounded-none bg-slate-100 text-xs font-mono font-bold text-slate-800 border border-slate-300">
                      #{index + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-slate-900">
                          Asset {task.asset_id}
                        </span>
                        <RiskBadge level={task.priority} size="sm" />
                        <span className="text-xs font-mono text-slate-500">
                          &bull; {task.fault_type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {task.issue}
                      </p>
                    </div>
                  </div>

                  {/* Financial and Yield impact */}
                  <div className="flex items-center gap-5 font-mono text-xs">
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Est. Yield Loss</span>
                      <span className="text-amber-700 font-bold">{task.estimated_energy_loss_kwh} kWh/day</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase text-slate-400 block font-bold">Est. Revenue Loss</span>
                      <span className="text-rose-600 font-black text-sm">${task.estimated_revenue_loss} / day</span>
                    </div>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="mt-3 p-2.5 rounded-none bg-slate-50 border border-slate-300 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-800">
                    <Wrench className="w-3.5 h-3.5 text-urbanic-orange shrink-0" />
                    <span>
                      <strong>Action Required:</strong> {task.recommended_action}
                    </span>
                  </div>

                  {task.assigned_to && (
                    <div className="flex items-center gap-1.5 text-slate-600 font-mono text-[11px]">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Assigned: {task.assigned_to}</span>
                    </div>
                  )}
                </div>

                {/* Action Bar */}
                <div className="mt-3 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-600 font-bold">Status:</span>
                    <select
                      value={task.maintenance_status}
                      onChange={(e) => handleStatusChange(task.id, e.target.value as MaintenanceStatus)}
                      className="bg-white border border-slate-300 rounded-none px-2 py-1 text-xs text-slate-800 font-mono focus:outline-none focus:border-urbanic-orange"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="SCHEDULED">SCHEDULED</option>
                      <option value="IN_PROGRESS">IN PROGRESS</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>

                  <button
                    onClick={() => onInspectAsset(task.asset_id)}
                    className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-800 rounded-none text-xs font-bold uppercase tracking-wider border border-slate-300 transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Inspect Diagnostics</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
