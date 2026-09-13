import React, { useEffect, useState } from 'react';
import { Phone, Mail, Sun, Wind, Thermometer, Activity, LogOut, User as UserIcon, Lock } from 'lucide-react';
import { api } from '../../services/api';
import { WeatherData, UserInfo } from '../../types';
import { WeatherForecastModal } from '../weather/WeatherForecastModal';

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
  const [user, setUser] = useState<UserInfo | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isForecastOpen, setIsForecastOpen] = useState(false);

  useEffect(() => {
    // Load weather
    api.getWeather().then(setWeather).catch(console.error);
    
    // Load current user
    api.getCurrentUser().then(u => setUser(u)).catch(console.error);

    // Listen for unauthorized events to clear user state
    const handleUnauth = () => setUser(null);
    window.addEventListener('solepulse:unauthorized', handleUnauth);
    return () => window.removeEventListener('solepulse:unauthorized', handleUnauth);
  }, []);

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    onNavigate('login');
  };

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

        {/* Center: Live Tomorrow.io Ambient Snapshot (Clickable for 72h forecast) */}
        {weather && (
          <div 
            onClick={() => setIsForecastOpen(true)}
            title="Click to view Tomorrow.io 72-Hour Atmospheric Forecast"
            className="hidden md:flex items-center gap-3 text-[11px] font-mono text-slate-600 bg-white px-3 py-1 border border-slate-200 hover:border-urbanic-orange cursor-pointer transition-all shadow-2xs"
          >
            <div className="flex items-center gap-1 text-amber-600 font-semibold">
              <Sun className="w-3.5 h-3.5" />
              <span>Solar: <strong>{weather.solar_radiation} W/m²</strong></span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-cyan-700">
              <Thermometer className="w-3.5 h-3.5" />
              <span>Ambient: <strong>{weather.ambient_temperature}°C</strong></span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1 text-indigo-700">
              <Wind className="w-3.5 h-3.5" />
              <span>Wind: <strong>{weather.wind_speed} km/h</strong></span>
            </div>
            <span className="ml-1 px-1.5 py-0.2 bg-urbanic-orange text-white text-[9px] font-sans font-bold uppercase tracking-wider">
              72h Forecast
            </span>
          </div>
        )}

        {/* Right: Email and Inject Fault Button */}
        <div className="flex items-center gap-3">
          <button 
            onClick={async () => {
              await api.injectMockFaultAsset();
              window.location.reload();
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-sm font-bold text-[10px] transition-colors uppercase border border-rose-200"
            title="Inject a critical simulated asset dynamically"
          >
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inject Anomaly</span>
          </button>
          
          <span className="hidden sm:inline text-slate-400">|</span>
          
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

        {/* Right CTA / Auth Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {user ? (
            <>
              {/* Authenticated user pill */}
              <div className="hidden sm:flex items-center gap-2 pl-2 pr-3 py-1 bg-slate-100 border border-slate-200">
                <div className="w-6 h-6 bg-white border border-slate-300 flex items-center justify-center text-slate-700">
                  <UserIcon className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                    {user.email || 'User'}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase font-bold tracking-wider ${
                      user.role === 'manager'
                        ? 'text-indigo-600'
                        : user.role === 'technician'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    {user.role}
                  </span>
                </div>
              </div>

              {/* Live Fleet Button */}
              <button
                onClick={() => onNavigate('dashboard')}
                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-urbanic-orange hover:bg-urbanic-orangeHover transition-colors shadow-sm uppercase tracking-wider"
              >
                <span>{user.role === 'technician' ? 'Work Orders' : 'Fleet Ops'}</span>
                {activeAlertsCount > 0 && (
                  <span className="min-w-4 h-4 px-1 flex items-center justify-center rounded-none bg-white text-urbanic-orange font-bold text-[10px]">
                    {activeAlertsCount}
                  </span>
                )}
              </button>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition-colors"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              {/* Unauthenticated CTA */}
              <button
                onClick={() => onNavigate('login')}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 hover:text-urbanic-orange border border-slate-300 bg-white hover:bg-slate-50 transition-colors"
              >
                <Lock className="w-3.5 h-3.5 text-urbanic-orange" />
                <span>Sign In</span>
              </button>

              <button
                onClick={() => onNavigate('register')}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-urbanic-orange hover:bg-urbanic-orangeHover transition-colors shadow-sm"
              >
                <span>Register</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tomorrow.io 72-Hour Weather Forecast Modal */}
      <WeatherForecastModal
        isOpen={isForecastOpen}
        onClose={() => setIsForecastOpen(false)}
        currentWeather={weather}
      />
    </header>
  );
};
