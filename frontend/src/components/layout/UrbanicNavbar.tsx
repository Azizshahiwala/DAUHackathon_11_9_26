import React, { useEffect, useState } from 'react';
import { Phone, Mail, Sun, Wind, Thermometer, Activity } from 'lucide-react';
import { api } from '../../services/api';
import { WeatherData } from '../../types';

interface UrbanicNavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  activeAlertsCount: number;
}

export const UrbanicNavbar: React.FC<UrbanicNavbarProps> = ({
  currentView,
  onNavigate,
  activeAlertsCount,
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    api.getWeather().then(setWeather).catch(console.error);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm transition-all">
      {/* 1. TOP BAR (Exact layout from Urbanic Template Image) */}
      <div className="border-b border-slate-100 bg-[#fafafa] px-4 lg:px-12 py-2 text-xs text-slate-600 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Phone */}
        <div className="flex items-center gap-2">
          <Phone className="w-3.5 h-3.5 text-urbanic-orange fill-current" />
          <span className="font-semibold text-urbanic-orange tracking-wide">
            010-020-0340
          </span>
          <span className="hidden sm:inline text-slate-400">|</span>
          <span className="hidden sm:inline text-slate-500 font-mono">
            Sole Pulse Renewable Ops Center
          </span>
        </div>

        {/* Center: Live Open-Meteo Ambient Snapshot */}
        {weather && (
          <div className="hidden md:flex items-center gap-4 text-[11px] font-mono text-slate-500">
            <div className="flex items-center gap-1 text-amber-600">
              <Sun className="w-3.5 h-3.5" />
              <span>Solar: <strong>{weather.solar_radiation} W/m²</strong></span>
            </div>
            <div className="flex items-center gap-1 text-cyan-600">
              <Thermometer className="w-3.5 h-3.5" />
              <span>Ambient: <strong>{weather.ambient_temperature}°C</strong></span>
            </div>
            <div className="flex items-center gap-1 text-indigo-600">
              <Wind className="w-3.5 h-3.5" />
              <span>Wind: <strong>{weather.wind_speed} km/h</strong></span>
            </div>
          </div>
        )}

        {/* Right: Email (Orange mail icon & text from template image) */}
        <div className="flex items-center gap-2">
          <Mail className="w-3.5 h-3.5 text-urbanic-orange" />
          <a
            href="mailto:contact@solepulse.energy"
            className="text-urbanic-orange hover:underline font-medium"
          >
            contact@solepulse.energy
          </a>
        </div>
      </div>

      {/* 2. MAIN NAVIGATION (Urbanic Brand & Nav Links) */}
      <div className="px-4 lg:px-12 py-4 flex items-center justify-between gap-6">
        {/* Brand Logo: Sun/Wind geometric icon + "Sole Pulse" */}
        <div
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative flex items-center justify-center w-10 h-10">
            <svg
              className="w-10 h-10 text-urbanic-orange"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="24" cy="24" r="8" stroke="#f26522" strokeWidth="3" />
              <path d="M24 4V12" stroke="#f26522" strokeWidth="3" strokeLinecap="round" />
              <path d="M24 36V44" stroke="#f26522" strokeWidth="3" strokeLinecap="round" />
              <path d="M4 24H12" stroke="#f26522" strokeWidth="3" strokeLinecap="round" />
              <path d="M36 24H44" stroke="#f26522" strokeWidth="3" strokeLinecap="round" />
              <path d="M9.85 9.85L15.5 15.5" stroke="#f26522" strokeWidth="3" strokeLinecap="round" />
              <path d="M32.5 32.5L38.15 38.15" stroke="#f26522" strokeWidth="3" strokeLinecap="round" />
              <path d="M9.85 38.15L15.5 32.5" stroke="#f26522" strokeWidth="3" strokeLinecap="round" />
              <path d="M32.5 15.5L38.15 9.85" stroke="#f26522" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </div>

          <div className="flex flex-col">
            <div className="flex items-baseline font-heading">
              <span className="text-2xl font-black tracking-tight text-slate-800 uppercase">
                Sole
              </span>
              <span className="text-2xl font-light tracking-tight text-urbanic-orange uppercase ml-1">
                Pulse
              </span>
            </div>
            <span className="text-[9px] uppercase tracking-widest text-slate-500 font-mono -mt-1 font-semibold">
              Predictive Maintenance
            </span>
          </div>
        </div>

        {/* Navigation Menu Buttons */}
        <nav className="hidden lg:flex items-center gap-1 font-heading">
          <button
            onClick={() => onNavigate('home')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              currentView === 'home'
                ? 'bg-urbanic-orange text-white shadow-sm'
                : 'text-slate-600 hover:text-urbanic-orange'
            }`}
          >
            HOME
          </button>

          <button
            onClick={() => onNavigate('about')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              currentView === 'about'
                ? 'bg-urbanic-orange text-white shadow-sm'
                : 'text-slate-600 hover:text-urbanic-orange'
            }`}
          >
            ABOUT SOLE PULSE
          </button>

          <button
            onClick={() => onNavigate('solutions')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              currentView === 'solutions'
                ? 'bg-urbanic-orange text-white shadow-sm'
                : 'text-slate-600 hover:text-urbanic-orange'
            }`}
          >
            SOLUTIONS
          </button>

          <button
            onClick={() => onNavigate('dashboard')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              currentView === 'dashboard'
                ? 'bg-urbanic-orange text-white shadow-sm'
                : 'text-slate-600 hover:text-urbanic-orange'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>PREDICTIVE FLEET</span>
          </button>

          <button
            onClick={() => onNavigate('contact')}
            className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              currentView === 'contact'
                ? 'bg-urbanic-orange text-white shadow-sm'
                : 'text-slate-600 hover:text-urbanic-orange'
            }`}
          >
            CONTACT
          </button>
        </nav>

        {/* Right CTA / Alert Counter */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('dashboard')}
            className="hidden sm:flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-urbanic-orange hover:bg-urbanic-orangeHover transition-colors shadow-sm uppercase tracking-wider"
          >
            <span>Live Fleet</span>
            {activeAlertsCount > 0 && (
              <span className="min-w-4 h-4 px-1 flex items-center justify-center rounded-none bg-white text-urbanic-orange font-bold text-[10px]">
                {activeAlertsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
