import React, { useState } from 'react';
import { X, Plus, Cpu, MapPin, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { CreateAssetPayload, Asset } from '../../types';

interface AddAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated?: (newAsset: Asset) => void;
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  isOpen,
  onClose,
  onAssetCreated
}) => {
  const [assetId, setAssetId] = useState('');
  const [assetType, setAssetType] = useState<'solar_panel' | 'wind_turbine'>('solar_panel');
  const [location, setLocation] = useState('');
  const [ratedCapacityKw, setRatedCapacityKw] = useState('0.40');
  const [stringGroup, setStringGroup] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = assetId.trim().toUpperCase();
    const cleanLocation = location.trim();

    if (!cleanId) {
      setError('Asset ID is required.');
      return;
    }
    if (!cleanLocation) {
      setError('Location / Sector is required.');
      return;
    }

    const capacity = parseFloat(ratedCapacityKw);
    if (isNaN(capacity) || capacity <= 0) {
      setError('Rated capacity must be a positive number (kW).');
      return;
    }

    const payload: CreateAssetPayload = {
      asset_id: cleanId,
      asset_type: assetType,
      location: cleanLocation,
      rated_capacity_kw: capacity,
      string_group: stringGroup.trim() || undefined
    };

    setLoading(true);
    try {
      const res = await api.createAsset(payload);
      if (res.success && res.data) {
        setSuccess(true);
        if (onAssetCreated) {
          onAssetCreated(res.data);
        }
        setTimeout(() => {
          setSuccess(false);
          setAssetId('');
          setLocation('');
          onClose();
        }, 1000);
      } else {
        setError(res.message || res.error || 'Failed to provision new asset.');
      }
    } catch (err: any) {
      setError(err.message || 'Network error while adding asset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white border-2 border-slate-300 shadow-2xl max-w-md w-full p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-200 mb-5">
          <div className="p-2 bg-amber-50 text-urbanic-orange border border-amber-200">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold uppercase tracking-wider text-slate-900 font-heading">
              Commission New Fleet Asset
            </h3>
            <p className="text-[11px] text-slate-500 font-mono">
              Enrolls asset in 24/7 telemetry monitoring & autoencoder scoring
            </p>
          </div>
        </div>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 uppercase">Asset Successfully Commissioned</h4>
            <p className="text-xs text-slate-500 font-mono">{assetId} is now active in fleet registry.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 font-mono">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Asset ID */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                Asset Identifier (Unique)
              </label>
              <div className="relative">
                <Cpu className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="e.g. SOL-ARR-101 or WND-TRB-42"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-urbanic-orange focus:bg-white focus:outline-none uppercase font-mono rounded-none"
                />
              </div>
            </div>

            {/* Asset Type */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                Generation Technology
              </label>
              <select
                value={assetType}
                onChange={(e) => {
                  const t = e.target.value as 'solar_panel' | 'wind_turbine';
                  setAssetType(t);
                  setRatedCapacityKw(t === 'solar_panel' ? '0.40' : '2.5');
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-urbanic-orange focus:bg-white focus:outline-none font-mono rounded-none"
              >
                <option value="solar_panel">Solar Photovoltaic Panel (PV)</option>
                <option value="wind_turbine">Utility Wind Turbine Generator</option>
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                Farm Location / Sector
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Sector 5 - Array West"
                  required
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-urbanic-orange focus:bg-white focus:outline-none font-mono rounded-none"
                />
              </div>
            </div>

            {/* Grid 2 cols: Capacity + String Group */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                  Rated Capacity (kW)
                </label>
                <div className="relative">
                  <Zap className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={ratedCapacityKw}
                    onChange={(e) => setRatedCapacityKw(e.target.value)}
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-urbanic-orange focus:bg-white focus:outline-none font-mono rounded-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 font-mono">
                  String / Group (Opt.)
                </label>
                <input
                  type="text"
                  value={stringGroup}
                  onChange={(e) => setStringGroup(e.target.value)}
                  placeholder="e.g. STR-04"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 focus:border-urbanic-orange focus:bg-white focus:outline-none uppercase font-mono rounded-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider bg-urbanic-orange hover:bg-urbanic-orangeHover text-white shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{loading ? 'Registering...' : 'Provision Asset'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
