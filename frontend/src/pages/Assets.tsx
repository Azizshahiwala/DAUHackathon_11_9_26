import React, { useEffect, useState } from 'react';
import { Asset, UserInfo } from '../types';
import { api } from '../services/api';
import { AssetTable } from '../components/assets/AssetTable';
import { AddAssetModal } from '../components/assets/AddAssetModal';
import { Cpu, RefreshCw, Plus, CheckCircle2 } from 'lucide-react';
import { WindmillLoader } from '../components/common/WindmillLoader';
import { ErrorState } from '../components/common/ErrorState';

interface AssetsProps {
  onSelectAsset: (assetId: string) => void;
  initialFilter?: string;
}

// ─── Role badge component ──────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const map: Record<string, { label: string; cls: string }> = {
    manager:    { label: 'Asset Manager',          cls: 'bg-purple-100 text-purple-700 border-purple-200' },
    operator:   { label: 'Farm Operator',          cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    technician: { label: 'Maintenance Technician', cls: 'bg-green-100 text-green-700 border-green-200' },
  };
  const { label, cls } = map[role] || { label: role, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${cls}`}>{label}</span>;
};

// ─── Main page ─────────────────────────────────────────────────────────────
export const Assets: React.FC<AssetsProps> = ({ onSelectAsset, initialFilter = 'ALL' }) => {
  const [assets,      setAssets]      = useState<Asset[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [showForm,    setShowForm]    = useState(false);
  const [addSuccess,  setAddSuccess]  = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
    api.getCurrentUser().then(setCurrentUser);
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAssets();
      setAssets(data);
    } catch {
      setError('Unable to load asset directory from farm gateway.');
    } finally {
      setLoading(false);
    }
  };

  const handleAssetCreated = (asset: Asset) => {
    setAssets(prev => [asset, ...prev]);
    setShowForm(false);
    setAddSuccess(`Asset "${asset.asset_id}" registered successfully.`);
    setTimeout(() => setAddSuccess(null), 5000);
  };

  // Explicit if-else for adding assets
  let canAddAssets = false;
  if (currentUser) {
    if (currentUser.role === 'manager' || currentUser.role === 'operator') {
      canAddAssets = true;
    } else if (currentUser.role === 'technician') {
      canAddAssets = false;
    }
  }

  const canDeleteAssets = currentUser?.role === 'manager';

  const handleDelete = async (id: string) => {
    const res = await api.deleteAsset(id);
    if (res.success) {
      setAssets(prev => prev.filter(x => x.asset_id !== id));
    } else {
      alert(`Decommissioning failed: ${res.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Replaces the inline AddAssetForm with the newly built AddAssetModal */}
      <AddAssetModal 
        isOpen={showForm} 
        onClose={() => setShowForm(false)} 
        onAssetCreated={handleAssetCreated} 
      />

      {/* Header row */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-urbanic-orange" />
            <span>Asset Fleet Directory</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-xs text-slate-500">
              Real-time operating conditions across monitored solar arrays and wind turbines
            </p>
            {currentUser && <RoleBadge role={currentUser.role} />}
          </div>

          {/* Role-based capability note */}
          {currentUser?.role === 'technician' && (
            <p className="text-xs text-amber-600 font-mono mt-1">
              ⚠️ Technician view — asset registration is restricted to operators and managers.
            </p>
          )}
        </div>

        <div className="flex gap-2">
          <button onClick={loadAssets}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-urbanic-orange' : ''}`} />
            Refresh
          </button>

          {canAddAssets && (
            <button onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-urbanic-orange hover:bg-urbanic-orangeHover text-white text-xs font-bold uppercase tracking-wider transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add Asset
            </button>
          )}
        </div>
      </div>

      {/* Success toast */}
      {addSuccess && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 p-3 text-green-700 text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          {addSuccess}
        </div>
      )}

      {loading ? (
        <WindmillLoader message="Loading Asset Telemetry Records..." subMessage="Fetching physical voltage, current, and irradiance vectors" />
      ) : error ? (
        <ErrorState title="Fleet Directory Inaccessible" message={error} onRetry={loadAssets} />
      ) : (
        <AssetTable 
          assets={assets} 
          onSelectAsset={onSelectAsset} 
          initialStatusFilter={initialFilter} 
          canDelete={canDeleteAssets}
          onDeleteAsset={handleDelete}
        />
      )}
    </div>
  );
};
