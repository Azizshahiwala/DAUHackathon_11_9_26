import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Sun, 
  Wind,
  AlertCircle,
  Filter
} from 'lucide-react';
import { Asset } from '../../types';
import { RiskBadge } from './RiskBadge';
import { WindmillLoader } from '../common/WindmillLoader';

interface AssetTableProps {
  assets: Asset[];
  onSelectAsset: (assetId: string) => void;
  initialStatusFilter?: string;
}

export const AssetTable: React.FC<AssetTableProps> = ({
  assets,
  onSelectAsset,
  initialStatusFilter = 'ALL',
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [faultFilter, setFaultFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof Asset | 'risk_score' | 'power' | 'temp'>('risk_score');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterMessage, setFilterMessage] = useState('Querying Telemetry Records...');
  const itemsPerPage = 10;

  // Trigger 0.7s loader whenever user searches or changes any anomaly/status filter
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsFiltering(true);
    setCurrentPage(1);

    if (faultFilter !== 'ALL') {
      setFilterMessage(`Filtering Anomaly Signature: ${faultFilter.replace('_', ' ').toUpperCase()}...`);
    } else if (searchTerm.trim()) {
      setFilterMessage(`Searching Telemetry Query: "${searchTerm}"...`);
    } else if (statusFilter !== 'ALL') {
      setFilterMessage(`Filtering Fleet by Status: ${statusFilter}...`);
    } else if (typeFilter !== 'ALL') {
      setFilterMessage(`Filtering Asset Classification: ${typeFilter === 'solar_panel' ? 'Solar Strings' : 'Wind Turbines'}...`);
    } else {
      setFilterMessage('Synchronizing Fleet Telemetry Filters...');
    }

    const timer = setTimeout(() => {
      setIsFiltering(false);
    }, 700);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, typeFilter, faultFilter]);

  // Filter & Search
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesSearch =
        asset.asset_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.prediction?.fault_type || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' || asset.status === statusFilter;

      const matchesType =
        typeFilter === 'ALL' || asset.asset_type === typeFilter;

      const currentFault = asset.prediction?.fault_type || 'none';
      const matchesFault =
        faultFilter === 'ALL' || currentFault === faultFilter;

      return matchesSearch && matchesStatus && matchesType && matchesFault;
    });
  }, [assets, searchTerm, statusFilter, typeFilter, faultFilter]);

  // Sorting
  const sortedAssets = useMemo(() => {
    return [...filteredAssets].sort((a, b) => {
      let valA: any = 0;
      let valB: any = 0;

      if (sortField === 'risk_score') {
        valA = a.prediction?.risk_score ?? 0;
        valB = b.prediction?.risk_score ?? 0;
      } else if (sortField === 'power') {
        valA = a.current_readings?.power_output ?? 0;
        valB = b.current_readings?.power_output ?? 0;
      } else if (sortField === 'temp') {
        valA = a.current_readings?.temperature ?? 0;
        valB = b.current_readings?.temperature ?? 0;
      } else if (sortField === 'asset_id') {
        valA = a.asset_id;
        valB = b.asset_id;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredAssets, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedAssets.length / itemsPerPage) || 1;
  const paginatedAssets = sortedAssets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const formatFault = (fault?: string) => {
    if (!fault || fault === 'none') return <span className="text-slate-400 font-sans">None (Normal)</span>;
    return (
      <span className="font-mono text-xs font-bold text-rose-700 capitalize">
        {fault.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="bg-white border border-slate-300 rounded-none shadow-none">
      {/* Controls Bar */}
      <div className="p-3 border-b border-slate-300 flex flex-wrap items-center justify-between gap-2.5 bg-slate-100">
        <div className="flex items-center gap-2 flex-1 min-w-[280px] flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Asset ID, Sector or Anomaly..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-none pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-urbanic-orange font-sans"
            />
          </div>

          {/* Anomaly / Fault Filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-300 px-2 py-0.5 rounded-none">
            <Filter className="w-3 h-3 text-urbanic-orange shrink-0" />
            <select
              value={faultFilter}
              onChange={(e) => setFaultFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-800 font-medium focus:outline-none py-1 cursor-pointer font-sans"
              title="Filter by Specific Anomaly"
            >
              <option value="ALL">All Anomaly Types</option>
              <option value="inverter_overheating">Inverter Overheating</option>
              <option value="soiling">Soiling Degradation</option>
              <option value="partial_shading">Partial Shading</option>
              <option value="pid_degradation">PID Degradation</option>
              <option value="sensor_drift">Sensor Calibration Drift</option>
              <option value="bearing_wear">Mechanical Bearing Wear</option>
              <option value="yaw_misalignment">Yaw Misalignment</option>
              <option value="none">Nominal (No Fault)</option>
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-none px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-urbanic-orange font-sans"
          >
            <option value="ALL">All Statuses</option>
            <option value="HEALTHY">Healthy Only</option>
            <option value="WARNING">Warning Only</option>
            <option value="CRITICAL">Critical Only</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-none px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-urbanic-orange font-sans"
          >
            <option value="ALL">All Asset Types</option>
            <option value="solar_panel">Solar Strings</option>
            <option value="wind_turbine">Wind Turbines</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-600">
          Showing <strong>{paginatedAssets.length}</strong> of <strong>{sortedAssets.length}</strong> assets
        </div>
      </div>

      {/* Loader during Search/Filter or Table Results */}
      {isFiltering ? (
        <div className="py-16 bg-white flex flex-col items-center justify-center">
          <WindmillLoader
            message={filterMessage}
            subMessage="Evaluating 6-feature sensor telemetry against 1.033187 reconstruction threshold"
          />
        </div>
      ) : (
        <>
          {/* Table Element */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-300 bg-slate-200 text-[11px] font-heading font-bold uppercase text-slate-700 tracking-wider">
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('asset_id')}>
                    <div className="flex items-center gap-1">
                      <span>Asset ID</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('risk_score')}>
                    <div className="flex items-center gap-1">
                      <span>Risk Score</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Detected Anomaly</th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('power')}>
                    <div className="flex items-center gap-1">
                      <span>Power Output</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3 cursor-pointer" onClick={() => handleSort('temp')}>
                    <div className="flex items-center gap-1">
                      <span>Temp</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-500" />
                    </div>
                  </th>
                  <th className="py-2.5 px-3">Priority</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {paginatedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <AlertCircle className="w-6 h-6 text-slate-400" />
                        <span className="font-heading font-bold text-sm text-slate-700">No matching assets found</span>
                        <span className="text-xs text-slate-500 font-sans">Try selecting a different anomaly filter or resetting your search term.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedAssets.map((asset) => {
                    const isSolar = asset.asset_type === 'solar_panel';
                    return (
                      <tr
                        key={asset.asset_id}
                        className="hover:bg-slate-100 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900 flex items-center gap-2">
                          {isSolar ? (
                            <Sun className="w-3.5 h-3.5 text-amber-600" />
                          ) : (
                            <Wind className="w-3.5 h-3.5 text-cyan-700" />
                          )}
                          <span>{asset.asset_id}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 capitalize font-sans">
                          {isSolar ? 'Solar Array' : 'Wind Turbine'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono text-[11px]">
                          {asset.location}
                        </td>
                        <td className="py-2.5 px-3">
                          <RiskBadge level={asset.status} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 font-mono">
                          <span className={`font-bold ${
                            asset.prediction?.risk_score > 75 
                              ? 'text-rose-700' 
                              : asset.prediction?.risk_score > 40 
                              ? 'text-amber-700' 
                              : 'text-emerald-700'
                          }`}>
                            {asset.prediction?.risk_score ?? 0}
                          </span>
                          <span className="text-[10px] text-slate-500"> / 100</span>
                        </td>
                        <td className="py-2.5 px-3">
                          {formatFault(asset.prediction?.fault_type)}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                          {asset.current_readings?.power_output.toFixed(2)} kW
                        </td>
                        <td className="py-2.5 px-3 font-mono font-medium text-slate-900">
                          {asset.current_readings?.temperature}°C
                        </td>
                        <td className="py-2.5 px-3">
                          <RiskBadge 
                            level={asset.prediction?.maintenance_priority || 'ROUTINE'} 
                            size="sm" 
                          />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => onSelectAsset(asset.asset_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-urbanic-orange text-white text-[11px] font-bold uppercase tracking-wider rounded-none hover:bg-urbanic-orangeHover transition-colors font-sans"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="p-2.5 border-t border-slate-300 flex items-center justify-between bg-slate-100 text-xs text-slate-600">
            <div className="font-mono text-xs">
              Page <strong className="text-slate-900 font-mono">{currentPage}</strong> of <strong className="text-slate-900 font-mono">{totalPages}</strong>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1 border border-slate-300 bg-white hover:bg-slate-200 text-slate-800 disabled:opacity-40 transition-colors rounded-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1 border border-slate-300 bg-white hover:bg-slate-200 text-slate-800 disabled:opacity-40 transition-colors rounded-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
