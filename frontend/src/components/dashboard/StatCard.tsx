import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: 'emerald' | 'amber' | 'rose' | 'cyan' | 'indigo' | 'orange';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'neutral',
  color = 'orange',
  onClick,
}) => {
  const colorMap = {
    orange: {
      bg: 'bg-white',
      border: 'border-urbanic-orange',
      text: 'text-urbanic-orange',
    },
    emerald: {
      bg: 'bg-white',
      border: 'border-emerald-500',
      text: 'text-emerald-700',
    },
    amber: {
      bg: 'bg-white',
      border: 'border-amber-500',
      text: 'text-amber-700',
    },
    rose: {
      bg: 'bg-white',
      border: 'border-rose-500',
      text: 'text-rose-700',
    },
    cyan: {
      bg: 'bg-white',
      border: 'border-cyan-600',
      text: 'text-cyan-700',
    },
    indigo: {
      bg: 'bg-white',
      border: 'border-indigo-600',
      text: 'text-indigo-700',
    },
  };

  const scheme = colorMap[color] || colorMap.orange;

  return (
    <div
      onClick={onClick}
      className={`bg-white p-3.5 border border-slate-300 rounded-none transition-all ${
        onClick ? 'cursor-pointer hover:border-urbanic-orange' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
          {title}
        </span>
        <div className={`p-1.5 bg-slate-100 border ${scheme.border} rounded-none`}>
          <Icon className={`w-4 h-4 ${scheme.text}`} />
        </div>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-black tracking-tight text-slate-900 font-mono">
          {value}
        </span>
        {trend && (
          <span
            className={`text-xs font-bold ${
              trendType === 'positive'
                ? 'text-emerald-700'
                : trendType === 'negative'
                ? 'text-rose-700'
                : 'text-slate-600'
            }`}
          >
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-0.5 text-[11px] text-slate-500 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};
