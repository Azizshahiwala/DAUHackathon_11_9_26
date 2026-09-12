import React from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Telemetry Connection Error",
  message = "Unable to connect to the sensor data stream or AI prediction engine.",
  onRetry,
  isRetrying = false,
}) => {
  return (
    <div className="bg-rose-50 border border-rose-300 p-6 text-center select-none">
      <div className="w-12 h-12 mx-auto mb-3 bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600">
        <AlertOctagon className="w-6 h-6" />
      </div>

      <h3 className="text-sm font-bold uppercase tracking-wider text-rose-900 font-mono">
        {title}
      </h3>

      <p className="text-xs text-rose-700 mt-1 max-w-md mx-auto leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="mt-4 px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center gap-2 border border-rose-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Reconnecting...' : 'Retry Ingestion'}</span>
        </button>
      )}
    </div>
  );
};
