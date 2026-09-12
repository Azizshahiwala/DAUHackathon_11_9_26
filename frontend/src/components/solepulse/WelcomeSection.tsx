import React from 'react';
import { Sun, Wind, Zap } from 'lucide-react';

interface WelcomeSectionProps {
  onLearnMoreAI: () => void;
  onLearnMoreIoT: () => void;
  onLearnMoreYield: () => void;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  onLearnMoreAI,
  onLearnMoreIoT,
  onLearnMoreYield,
}) => {
  return (
    <section className="py-10 px-6 lg:px-12 max-w-7xl mx-auto bg-white">
      {/* 
        HEADER: "Welcome to Sole Pulse"
        Matches the exact title structure & orange accent from the Urbanic template!
      */}
      <div className="text-center max-w-3xl mx-auto mb-8">
        <h2 className="text-2xl lg:text-3xl font-light text-slate-800 tracking-tight font-heading">
          Welcome to <span className="font-bold text-urbanic-orange">Sole Pulse</span>
        </h2>
        <p className="mt-1.5 text-xs lg:text-sm text-slate-500 font-sans">
          Pioneering the future of clean energy reliability with deep neural autoencoder telemetry and real-time loss mitigation.
        </p>
      </div>

      {/* 
        3 FEATURE COLUMNS:
        - Sharp 90° rectangular corners (rounded-none)
        - Solid opaque background (bg-slate-50)
        - Solid dark square icon box (bg-urbanic-dark, rounded-none)
        - Solid orange rectangular "READ MORE" button
      */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: NEURAL ANOMALY AI */}
        <div className="flex flex-col justify-between p-5 bg-slate-50 border border-slate-300 rounded-none hover:border-urbanic-orange transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {/* Dark square icon box from Urbanic template */}
              <div className="w-10 h-10 bg-urbanic-dark flex items-center justify-center rounded-none text-white shrink-0">
                <Sun className="w-5 h-5 text-urbanic-orange" />
              </div>
              <h3 className="text-xs font-black tracking-wider text-slate-900 uppercase font-heading">
                NEURAL ANOMALY AI
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sole Pulse's 6-feature PyTorch autoencoder continuously evaluates sensor physics (voltage, current, irradiance, soiling, temp). If reconstruction error exceeds 1.033187, anomalies are isolated before equipment failure.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={onLearnMoreAI}
              className="w-full sm:w-auto px-5 py-2 bg-urbanic-orange hover:bg-urbanic-orangeHover text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-none"
            >
              READ MORE
            </button>
          </div>
        </div>

        {/* Card 2: REAL-TIME FLEET IOT */}
        <div className="flex flex-col justify-between p-5 bg-slate-50 border border-slate-300 rounded-none hover:border-urbanic-orange transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {/* Dark square icon box from Urbanic template */}
              <div className="w-10 h-10 bg-urbanic-dark flex items-center justify-center rounded-none text-white shrink-0">
                <Wind className="w-5 h-5 text-cyan-400" />
              </div>
              <h3 className="text-xs font-black tracking-wider text-slate-900 uppercase font-heading">
                REAL-TIME FLEET IOT
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Continuous telemetry monitoring across 100+ renewable assets. Integrated with Open-Meteo for real-time solar shortwave radiation, ambient temperatures, and atmospheric wind vectors to eliminate false alarms.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={onLearnMoreIoT}
              className="w-full sm:w-auto px-5 py-2 bg-urbanic-orange hover:bg-urbanic-orangeHover text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-none"
            >
              READ MORE
            </button>
          </div>
        </div>

        {/* Card 3: HIGH EFFICIENCY YIELD */}
        <div className="flex flex-col justify-between p-5 bg-slate-50 border border-slate-300 rounded-none hover:border-urbanic-orange transition-all">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {/* Dark square icon box from Urbanic template */}
              <div className="w-10 h-10 bg-urbanic-dark flex items-center justify-center rounded-none text-white shrink-0">
                <Zap className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-xs font-black tracking-wider text-slate-900 uppercase font-heading">
                HIGH EFFICIENCY YIELD
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Translating raw diagnostics into financial impact: estimated energy loss (kWh) and revenue drag ($/day). Our prioritized maintenance engine dispatches field crews to highest-impact repairs first.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200">
            <button
              onClick={onLearnMoreYield}
              className="w-full sm:w-auto px-5 py-2 bg-urbanic-orange hover:bg-urbanic-orangeHover text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-none"
            >
              READ MORE
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
