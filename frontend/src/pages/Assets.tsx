import React, { useEffect, useState } from 'react';
import { Asset } from '../types';
import { api } from '../services/api';
import { AssetTable } from '../components/assets/AssetTable';
import { Cpu, RefreshCw } from 'lucide-react';
import { WindmillLoader } from '../components/common/WindmillLoader';
import { ErrorState } from '../components/common/ErrorState';

interface AssetsProps {
  onSelectAsset: (assetId: string) => void;
  initialFilter?: string;
}

export const Assets: React.FC<AssetsProps> = ({ onSelectAsset, initialFilter = 'ALL' }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAssets();
      setAssets(data);
    } catch (err) {
      setError('Unable to load asset directory from farm gateway.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-urbanic-orange" />
            <span>Asset Fleet Directory</span>
          </h2>
          <p className="text-xs text-slate-500">
            Real-time operating conditions across 100 monitored solar arrays and wind turbines
          </p>
        </div>

        <button
          onClick={loadAssets}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-none bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold uppercase tracking-wider text-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-urbanic-orange' : ''}`} />
          <span>Refresh Fleet</span>
        </button>
      </div>

      {loading ? (
        <WindmillLoader
          message="Loading 100 Asset Telemetry Records..."
          subMessage="Fetching physical voltage, current, and irradiance vectors"
        />
      ) : error ? (
        <ErrorState
          title="Fleet Directory Inaccessible"
          message={error}
          onRetry={loadAssets}
        />
      ) : (
        <AssetTable
          assets={assets}
          onSelectAsset={onSelectAsset}
          initialStatusFilter={initialFilter}
        />
      )}
    </div>
  );
};
