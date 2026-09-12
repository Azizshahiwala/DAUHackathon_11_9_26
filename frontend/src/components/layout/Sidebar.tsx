import React from 'react';
import { 
  LayoutDashboard, 
  Cpu, 
  AlertTriangle, 
  Wrench, 
  BarChart3, 
  BrainCircuit, 
  Settings,
  ChevronRight
} from 'lucide-react';

export type NavTab = 
  | 'dashboard'
  | 'assets'
  | 'asset-details'
  | 'alerts'
  | 'maintenance'
  | 'analytics'
  | 'model-performance'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  activeAlertsCount: number;
  urgentMaintenanceCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  activeAlertsCount,
  urgentMaintenanceCount,
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'assets' as NavTab, label: 'Asset Fleet', icon: Cpu },
    { 
      id: 'alerts' as NavTab, 
      label: 'Alerts', 
      icon: AlertTriangle, 
      badge: activeAlertsCount, 
      badgeColor: 'bg-rose-500 text-white' 
    },
    { 
      id: 'maintenance' as NavTab, 
      label: 'Maintenance', 
      icon: Wrench, 
      badge: urgentMaintenanceCount, 
      badgeColor: 'bg-amber-500 text-industrial-950 font-bold' 
    },
    { id: 'analytics' as NavTab, label: 'Analytics', icon: BarChart3 },
    { id: 'model-performance' as NavTab, label: 'AI Performance', icon: BrainCircuit },
    { id: 'settings' as NavTab, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-full lg:w-64 bg-industrial-900 border-r border-industrial-800 flex flex-col shrink-0">
      <div className="p-4 border-b border-industrial-800/80">
        <div className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold px-2">
          Platform Navigation
        </div>
      </div>

      <nav className="p-3 space-y-1.5 flex-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id || (item.id === 'assets' && currentTab === 'asset-details');

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-industrial-850 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              <div className="flex items-center gap-1.5">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer info pill */}
      <div className="p-4 m-3 rounded-xl bg-industrial-850 border border-industrial-800 text-xs text-slate-400">
        <div className="font-semibold text-slate-200 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          Autoencoder Online
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          Reconstruction threshold calibrated at <code className="font-mono text-emerald-400">1.033187</code>.
        </p>
      </div>
    </aside>
  );
};
