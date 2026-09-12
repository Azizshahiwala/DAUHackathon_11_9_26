import React from 'react';

interface WindmillLoaderProps {
  message?: string;
  subMessage?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const WindmillLoader: React.FC<WindmillLoaderProps> = ({
  message = "Loading Renewable Telemetry...",
  subMessage = "Synchronizing 100 assets with PyTorch Autoencoder",
  size = 'md',
}) => {
  const sizeClass = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }[size];

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white border border-slate-300 text-center select-none">
      {/* 
        ANIMATED WINDMILL CONCEPT 
        Modeled after the LottieFiles Windmill Concept (https://lottiefiles.com/free-animation/windmill-concept-MebjamPtjs)
        Features:
        - Structural tapered turbine tower
        - Continuously spinning 3-blade aerodynamic rotor
        - Floating breeze vectors
      */}
      <div className={`relative ${sizeClass} mb-3`}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Base Ground Mound */}
          <path
            d="M15 88 Q 50 82 85 88 L 85 92 L 15 92 Z"
            fill="#e2e8f0"
          />
          <path
            d="M25 88 Q 50 85 75 88"
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeLinecap="square"
          />

          {/* Turbine Structural Mast / Tower */}
          <polygon
            points="46,88 54,88 52,38 48,38"
            fill="#334155"
          />
          <polygon
            points="48,38 52,38 51,88 49,88"
            fill="#475569"
          />

          {/* Nacelle Generator Housing (Stationary) */}
          <rect
            x="45"
            y="35"
            width="10"
            height="6"
            fill="#1e293b"
          />

          {/* ROTATING 3-BLADE ASSEMBLY */}
          <g
            className="origin-[50px_38px] animate-[spin_0.8s_linear_infinite]"
            style={{ transformOrigin: '50px 38px' }}
          >
            {/* Central Rotor Hub */}
            <circle cx="50" cy="38" r="4.5" fill="#f26522" />
            <circle cx="50" cy="38" r="2" fill="#ffffff" />

            {/* Blade 1 (0 deg - Upward) */}
            <g transform="rotate(0 50 38)">
              <path
                d="M48.5 38 L47.5 12 C47.5 8 52.5 8 52.5 12 L51.5 38 Z"
                fill="#f26522"
              />
              <path
                d="M50 38 L50 10"
                stroke="#ffffff"
                strokeWidth="0.8"
                opacity="0.8"
              />
            </g>

            {/* Blade 2 (120 deg) */}
            <g transform="rotate(120 50 38)">
              <path
                d="M48.5 38 L47.5 12 C47.5 8 52.5 8 52.5 12 L51.5 38 Z"
                fill="#ea580c"
              />
              <path
                d="M50 38 L50 10"
                stroke="#ffffff"
                strokeWidth="0.8"
                opacity="0.8"
              />
            </g>

            {/* Blade 3 (240 deg) */}
            <g transform="rotate(240 50 38)">
              <path
                d="M48.5 38 L47.5 12 C47.5 8 52.5 8 52.5 12 L51.5 38 Z"
                fill="#fb923c"
              />
              <path
                d="M50 38 L50 10"
                stroke="#ffffff"
                strokeWidth="0.8"
                opacity="0.8"
              />
            </g>
          </g>

          {/* Animated Wind Breeze Streamlines */}
          <path
            d="M10 28 Q 22 24 34 28"
            stroke="#f26522"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            strokeLinecap="square"
            className="animate-pulse"
          />
          <path
            d="M66 48 Q 78 44 90 48"
            stroke="#f97316"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            strokeLinecap="square"
            className="animate-pulse"
          />
        </svg>
      </div>

      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-mono">
        {message}
      </h4>
      {subMessage && (
        <p className="text-[11px] text-slate-500 font-mono mt-0.5">
          {subMessage}
        </p>
      )}
    </div>
  );
};
