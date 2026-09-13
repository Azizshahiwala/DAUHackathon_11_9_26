import React, { useEffect, useState } from 'react';
import { 
  Sun, 
  Wind, 
  Thermometer, 
  Bell, 
  Server, 
  Radio, 
  Activity, 
  RefreshCw 
} from 'lucide-react';
import { api } from '../../services/api';
import { WeatherData } from '../../types';

interface NavbarProps {
  activeAlertsCount: number;
  onNavigateAlerts: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeAlertsCount, 
  onNavigateAlerts,
  onRefresh,
  isRefreshing = false 
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const isMock = api.getIsMockMode();

  useEffect(() => {
    api.getWeather().then(setWeather).catch(console.error);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-industrial-900/90 backdrop-blur-md border-b border-industrial-800 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
      {/* Left: Branding & Sub-status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-industrial-950 font-bold shadow-lg shadow-emerald-500/20">
          <Activity className="w-5 h-5 text-industrial-950" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base lg:text-lg font-bold tracking-tight text-white">
              AeroSolar AI
            </h1>
            <span className="hidden sm:inline-block px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              v1.0 • HackOut'26
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">
            Predictive Maintenance for Solar & Wind Assets
          </p>
        </div>
      </div>

      {/* Center: Tomorrow.io Real-time Ambient Telemetry */}
      {weather && (
        <div className="hidden xl:flex items-center gap-4 px-4 py-1.5 rounded-lg bg-industrial-850/80 border border-industrial-800 text-xs text-slate-300">
          <div className="flex items-center gap-1.5 text-amber-400">
            <Sun className="w-3.5 h-3.5" />
            <span>Solar: <strong>{weather.solar_radiation} W/m²</strong></span>
          </div>
          <div className="w-px h-3.5 bg-industrial-700"></div>
          <div className="flex items-center gap-1.5 text-cyan-400">
            <Thermometer className="w-3.5 h-3.5" />
            <span>Ambient: <strong>{weather.ambient_temperature}°C</strong></span>
          </div>
          <div className="w-px h-3.5 bg-industrial-700"></div>
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Wind className="w-3.5 h-3.5" />
            <span>Wind: <strong>{weather.wind_speed} km/h</strong></span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">(Tomorrow.io)</span>
        </div>
      )}

      {/* Right: Mode & Actions */}
      <div className="flex items-center gap-3">
        {/* Inject Anomaly Button */}
        <button 
          onClick={async () => {
            await api.injectMockFaultAsset();
            window.location.reload();
          }}
          title="Inject a critical simulated asset dynamically"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase transition-all"
        >
          <Activity className="w-3.5 h-3.5" />
          Inject Anomaly
        </button>

        {/* Backend Connectivity Pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-industrial-800 border border-industrial-700">
          <Radio className={`w-3 h-3 ${isMock ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`} />
          <span className="text-slate-300 hidden md:inline">
            {isMock ? 'Mock API Engine' : 'Flask Live REST'}
          </span>
          <span className="md:hidden">
            {isMock ? 'Mock' : 'Flask'}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh telemetry & predictions"
          className="p-2 rounded-lg bg-industrial-800 hover:bg-industrial-700 border border-industrial-700 text-slate-300 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        {/* Active Alerts Button */}
        <button 
          onClick={onNavigateAlerts}
          className="relative p-2 rounded-lg bg-industrial-800 hover:bg-industrial-700 border border-industrial-700 text-slate-300 hover:text-white transition-all"
        >
          <Bell className="w-4 h-4" />
          {activeAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-lg shadow-rose-500/50 animate-pulse">
              {activeAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
