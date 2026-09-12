import React from 'react';
import { RiskLevel } from '../../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  score?: number;
  labelPrefix?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({
  level,
  score,
  labelPrefix,
  size = 'md',
}) => {
  const normLevel = (level || 'NORMAL').toUpperCase();

  const getStyle = () => {
    switch (normLevel) {
      case 'CRITICAL':
      case 'URGENT':
        return 'bg-rose-50 text-rose-800 border-rose-400';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-400';
      case 'MEDIUM':
        return 'bg-cyan-50 text-cyan-800 border-cyan-400';
      case 'LOW':
        return 'bg-blue-50 text-blue-800 border-blue-400';
      case 'NORMAL':
      case 'ROUTINE':
      case 'HEALTHY':
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-400';
    }
  };

  const sizeStyle = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-0.5',
    lg: 'text-sm px-2.5 py-1 font-bold',
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-none font-mono font-bold border ${getStyle()} ${sizeStyle}`}
    >
      {labelPrefix && <span className="opacity-80 font-normal">{labelPrefix}:</span>}
      <span>{normLevel}</span>
      {score !== undefined && (
        <span className="opacity-90">({score})</span>
      )}
    </span>
  );
};
