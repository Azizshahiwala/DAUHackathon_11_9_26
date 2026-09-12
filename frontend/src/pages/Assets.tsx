import React, { useEffect, useState } from 'react';
import { Asset, UserInfo } from '../types';
import { api } from '../services/api';
import { AssetTable } from '../components/assets/AssetTable';
import { Cpu, RefreshCw, Plus, X, AlertCircle, CheckCircle2, MapPin, Zap } from 'lucide-react';
import { WindmillLoader } from '../components/common/WindmillLoader';
import { ErrorState } from '../components/common/ErrorState';

interface AssetsProps {
  onSelectAsset: (assetId: string) => void;
  initialFilter?: string;
}

// ── Add Asset Form ────────────────────────────────────────────────────────────
interface AddAssetFormProps {
  onSuccess: (asset: Asset) => void;
  onClose: () => void;
}

const AddAssetForm: React.FC<AddAssetFormProps> = ({ onSuccess, onClose }) => {
  const [form, setForm] = useState({
    name: '', plant_name: '', type: 'solar' as 'solar' | 'wind',
    location: '', latitude: '', longitude: '',
    rated_power_kw: '', string_group: '', commissioned_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.plant_name || !form.location || !form.latitude || !form.longitude) {
      setError('Name, plant name, location, latitude and longitude are required.');
      return;
    }
    setLoading(true);
    try {
      const asset = await api.createAsset({
        name:              form.name,
        plant_name:        form.plant_name,
        type:              form.type,
        location:          form.location,
        latitude:          parseFloat(form.latitude),
        longitude:         parseFloat(form.longitude),
        rated_power_kw:    form.rated_power_kw ? parseFloat(form.rated_power_kw) : undefined,
        string_group:      form.string_group   || undefined,
        commissioned_date: form.commissioned_date || undefined,
      });
      onSuccess(asset);
    } catch (err: any) {
      setError(err.message || 'Failed to register asset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400 px-3 py-2.5 text-sm focus:outline-none focus:border-urbanic-orange transition-colors rounded-none";
  const labelCls = "block text-slate-600 text-[11px] font-mono uppercase tracking-wider mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-xl max-h-[90vh] overflow-y-auto border border-slate-200 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between bg-urbanic-dark px-5 py-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-urbanic-orange" />
            <h3 className="text-white font-bold uppercase text-sm tracking-wide">Register New Power-Plant Unit</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 p-3 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row: Unit name + Plant name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Unit Name *</label>
              <input className={inputCls} placeholder="e.g. SP-101" value={form.name} onChange={e => set('name', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Power Plant / Farm *</label>
              <input className={inputCls} placeholder="e.g. Gujarat Solar Park" value={form.plant_name} onChange={e => set('plant_name', e.target.value)} />
            </div>
          </div>

          {/* Type */}
          <div>
            <label className={labelCls}>Asset Type *</label>
            <div className="grid grid-cols-2 gap-2">
              {(['solar', 'wind'] as const).map(t => (
                <button key={t} type="button" onClick={() => set('type', t)}
                  className={`py-2.5 text-sm font-bold uppercase tracking-wide border transition-colors ${
                    form.type === t
                      ? 'bg-urbanic-orange text-white border-urbanic-orange'
                      : 'bg-white text-slate-600 border-slate-300 hover:border-urbanic-orange'
                  }`}>
                  {t === 'solar' ? '☀ Solar Panel' : '💨 Wind Turbine'}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelCls}>Location / Address *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input className={`${inputCls} pl-9`} placeholder="e.g. Sector 4, Kutch, Gujarat" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
          </div>

          {/* Lat / Long */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Latitude *</label>
              <input type="number" step="any" className={inputCls} placeholder="23.0225" value={form.latitude} onChange={e => set('latitude', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Longitude *</label>
              <input type="number" step="any" className={inputCls} placeholder="72.5714" value={form.longitude} onChange={e => set('longitude', e.target.value)} />
            </div>
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Rated Power (kW)</label>
              <input type="number" step="any" className={inputCls} placeholder="5.0" value={form.rated_power_kw} onChange={e => set('rated_power_kw', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>String Group</label>
              <input className={inputCls} placeholder="String-A1" value={form.string_group} onChange={e => set('string_group', e.target.value)} />
            </div>
            <div>
              <label className={labelCls}>Commissioned Date</label>
              <input type="date" className={inputCls} value={form.commissioned_date} onChange={e => set('commissioned_date', e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-slate-300 text-slate-600 text-sm font-bold uppercase hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-urbanic-orange hover:bg-urbanic-orangeHover disabled:opacity-50 text-white text-sm font-bold uppercase tracking-wide transition-colors flex items-center justify-center gap-2">
              {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Registering...</> : 'Register Asset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Role badge component ───────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const map: Record<string, { label: string; cls: string }> = {
    manager:    { label: 'Asset Manager',          cls: 'bg-purple-100 text-purple-700 border-purple-200' },
    operator:   { label: 'Farm Operator',          cls: 'bg-blue-100 text-blue-700 border-blue-200' },
    technician: { label: 'Maintenance Technician', cls: 'bg-green-100 text-green-700 border-green-200' },
  };
  const { label, cls } = map[role] || { label: role, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
  return <span className={`inline-flex items-center px-2.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${cls}`}>{label}</span>;
};

// ── Main page ─────────────────────────────────────────────────────────────────
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
    setAddSuccess(`Asset "${(asset as any).name || asset.asset_id}" registered successfully.`);
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

  return (
    <div className="space-y-4">
      {showForm && (
        <AddAssetForm onSuccess={handleAssetCreated} onClose={() => setShowForm(false)} />
      )}

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
              ⚙ Technician view — asset registration is restricted to operators and managers.
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
        <AssetTable assets={assets} onSelectAsset={onSelectAsset} initialStatusFilter={initialFilter} />
      )}
    </div>
  );
};
