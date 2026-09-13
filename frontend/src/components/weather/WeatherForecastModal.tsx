import React, { useState, useEffect } from 'react';
import {
  X,
  Sun,
  Wind,
  Thermometer,
  Cloud,
  Droplets,
  Calendar,
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';
import { WeatherData, WeatherHour } from '../../types';
import { api } from '../../services/api';

interface WeatherForecastModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentWeather?: WeatherData | null;
}

export const WeatherForecastModal: React.FC<WeatherForecastModalProps> = ({
  isOpen,
  onClose,
  currentWeather
}) => {
  const [forecast, setForecast] = useState<WeatherHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('ALL');
  const [activeMetric, setActiveMetric] = useState<'solar' | 'wind' | 'temp'>('solar');

  useEffect(() => {
    if (isOpen) {
      loadForecast();
    }
  }, [isOpen]);

  const loadForecast = async () => {
    try {
      setLoading(true);
      const data = await api.getWeatherForecast();
      setForecast(data);
    } catch (err) {
      console.error('Failed to load forecast', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Group hours by day (e.g., "Sep 12", "Sep 13")
  const days = Array.from(new Set(forecast.map(f => f.display_time?.slice(0, 6) || 'Today')));
  
  const filteredForecast = selectedDay === 'ALL' 
    ? forecast 
    : forecast.filter(f => f.display_time?.startsWith(selectedDay));

  const peakSolar = forecast.length > 0 ? Math.max(...forecast.map(f => f.solar_radiation)) : 950;
  const peakWind = forecast.length > 0 ? Math.max(...forecast.map(f => f.wind_speed)) : 45;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border-2 border-slate-900 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col rounded-none overflow-hidden">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-urbanic-orange text-white">
              <Sun className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-wider">
                  Tomorrow.io Atmospheric Intelligence
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-urbanic-orange/20 text-urbanic-orange border border-urbanic-orange/40">
                  72-Hour Fleet Forecast
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Predictive ambient vectors driving neural autoencoder generation curves
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadForecast}
              disabled={loading}
              title="Refresh Tomorrow.io forecast"
              className="p-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-urbanic-orange' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* Current Live Ambient Overview */}
          {currentWeather && (
            <div className="bg-white border border-slate-300 p-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-urbanic-orange" />
                  Live Operational Snapshot (Now)
                </span>
                <span className="text-[11px] font-mono text-slate-500">
                  Provider: {currentWeather.source || 'Tomorrow.io V4 Timelines'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Ambient Temp</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <Thermometer className="w-4 h-4 text-cyan-600 self-center" />
                    <span className="text-xl font-black text-slate-900">{currentWeather.ambient_temperature}°C</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Solar GTI Irradiance</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <Sun className="w-4 h-4 text-amber-600 self-center" />
                    <span className="text-xl font-black text-amber-700">{currentWeather.solar_radiation}</span>
                    <span className="text-[10px] text-slate-500 font-mono">W/m²</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Wind Velocity</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <Wind className="w-4 h-4 text-indigo-600 self-center" />
                    <span className="text-xl font-black text-slate-900">{currentWeather.wind_speed}</span>
                    <span className="text-[10px] text-slate-500 font-mono">km/h</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Cloud Cover</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <Cloud className="w-4 h-4 text-slate-600 self-center" />
                    <span className="text-xl font-black text-slate-900">{currentWeather.cloud_cover ?? 0}%</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Relative Humidity</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <Droplets className="w-4 h-4 text-blue-600 self-center" />
                    <span className="text-xl font-black text-slate-900">{currentWeather.humidity ?? 45}%</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">UV Index</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <Sun className="w-4 h-4 text-orange-600 self-center" />
                    <span className="text-xl font-black text-slate-900">{currentWeather.uv_index ?? 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Forecast Controls & Filter */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-slate-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold uppercase text-slate-700">Filter Day:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedDay('ALL')}
                  className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border ${
                    selectedDay === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  All 72 Hours
                </button>
                {days.map(d => (
                  <button
                    key={d}
                    onClick={() => setSelectedDay(d)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border ${
                      selectedDay === d
                        ? 'bg-urbanic-orange text-white border-urbanic-orange'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-xs font-bold uppercase text-slate-700 mr-1">Primary Curve:</span>
              <button
                onClick={() => setActiveMetric('solar')}
                className={`px-2 py-1 text-xs font-bold uppercase border ${
                  activeMetric === 'solar'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Solar (W/m²)
              </button>
              <button
                onClick={() => setActiveMetric('wind')}
                className={`px-2 py-1 text-xs font-bold uppercase border ${
                  activeMetric === 'wind'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Wind (km/h)
              </button>
              <button
                onClick={() => setActiveMetric('temp')}
                className={`px-2 py-1 text-xs font-bold uppercase border ${
                  activeMetric === 'temp'
                    ? 'bg-cyan-600 text-white border-cyan-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Temp (°C)
              </button>
            </div>
          </div>

          {/* Forecast Visual Bar Curve */}
          <div className="bg-white border border-slate-300 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {activeMetric === 'solar' && `Solar GTI Profile (Peak: ${peakSolar} W/m²)`}
                {activeMetric === 'wind' && `Wind Velocity Profile (Peak: ${peakWind} km/h)`}
                {activeMetric === 'temp' && 'Thermal Profile (Ambient Temp)'}
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Displaying {filteredForecast.length} forecast steps
              </span>
            </div>

            <div className="h-28 flex items-end gap-1 overflow-x-auto pt-4 pb-1">
              {filteredForecast.map((f, i) => {
                let heightPct = 0;
                let barColor = 'bg-amber-500';
                let label = `${f.solar_radiation} W/m²`;

                if (activeMetric === 'solar') {
                  heightPct = peakSolar > 0 ? (f.solar_radiation / peakSolar) * 100 : 0;
                  barColor = f.solar_radiation > 200 ? 'bg-amber-500' : 'bg-slate-300';
                  label = `${f.solar_radiation} W/m²`;
                } else if (activeMetric === 'wind') {
                  heightPct = peakWind > 0 ? (f.wind_speed / peakWind) * 100 : 0;
                  barColor = f.wind_speed > 20 ? 'bg-indigo-600' : 'bg-indigo-300';
                  label = `${f.wind_speed} km/h`;
                } else {
                  const maxTemp = 45;
                  heightPct = Math.min(100, Math.max(10, (f.temperature / maxTemp) * 100));
                  barColor = f.temperature > 30 ? 'bg-rose-500' : 'bg-cyan-500';
                  label = `${f.temperature}°C`;
                }

                return (
                  <div
                    key={f.time || i}
                    className="flex-1 min-w-[20px] flex flex-col items-center group relative cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                      <div className="bg-slate-900 text-white text-[10px] font-mono px-2 py-1 whitespace-nowrap shadow-lg">
                        <div>{f.display_time}</div>
                        <div className="font-bold text-amber-400">{label}</div>
                        <div>Wind: {f.wind_speed} km/h</div>
                        <div>Clouds: {f.cloud_cover}%</div>
                      </div>
                    </div>

                    <div
                      style={{ height: `${Math.max(4, heightPct)}%` }}
                      className={`w-full transition-all group-hover:brightness-110 ${barColor}`}
                    ></div>
                    <span className="text-[9px] font-mono text-slate-400 mt-1 truncate w-full text-center">
                      {f.display_time?.slice(7, 12)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hourly Timeline Cards */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Detailed Hourly Breakdown ({filteredForecast.length} Timelines)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-72 overflow-y-auto p-1">
              {filteredForecast.map((hour, idx) => {
                const isDaylight = hour.solar_radiation > 20;
                return (
                  <div
                    key={hour.time || idx}
                    className="p-3 bg-white border border-slate-300 hover:border-urbanic-orange transition-colors"
                  >
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                      <span className="text-xs font-mono font-bold text-slate-800">
                        {hour.display_time}
                      </span>
                      {isDaylight ? (
                        <Sun className="w-4 h-4 text-amber-500" />
                      ) : (
                        <Cloud className="w-4 h-4 text-slate-400" />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-xs">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block">Solar Irradiance</span>
                        <span className={`font-bold ${isDaylight ? 'text-amber-700' : 'text-slate-500'}`}>
                          {hour.solar_radiation} W/m²
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block">Ambient Temp</span>
                        <span className="font-bold text-cyan-700">
                          {hour.temperature}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block">Wind Velocity</span>
                        <span className="font-bold text-indigo-700">
                          {hour.wind_speed} km/h
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase block">Cloud Cover</span>
                        <span className="font-bold text-slate-700">
                          {hour.cloud_cover}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 px-6 py-3 border-t border-slate-300 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Info className="w-4 h-4 text-urbanic-orange" />
            <span>
              Real-time Tomorrow.io atmospheric data mapped to 100-asset PyTorch autoencoder simulation.
            </span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-colors"
          >
            Close Forecast
          </button>
        </div>
      </div>
    </div>
  );
};
