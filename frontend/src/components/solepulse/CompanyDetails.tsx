import React from 'react';
import { 
  Building2, 
  Target, 
  ShieldCheck, 
  Globe2, 
  MapPin, 
  Phone, 
  Mail
} from 'lucide-react';

export const CompanyDetails: React.FC = () => {
  return (
    <div className="space-y-8 py-8 px-6 lg:px-12 max-w-7xl mx-auto bg-white">
      {/* 1. COMPANY STORY & MISSION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-urbanic-orange text-white text-[11px] font-bold uppercase tracking-wider rounded-none">
            <Building2 className="w-3.5 h-3.5" />
            <span>About Sole Pulse Energy Systems</span>
          </div>

          <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-800 tracking-tight leading-tight font-heading">
            Eliminating Unplanned Downtime Across <span className="text-urbanic-orange">Solar & Wind Fleets</span>
          </h2>

          <p className="text-xs lg:text-sm text-slate-600 leading-relaxed">
            Founded with the conviction that clean energy must be as reliable as it is sustainable, <strong>Sole Pulse</strong> is an industrial intelligence platform pioneering deep-learning predictive maintenance for commercial and utility-scale solar farms and wind turbine arrays.
          </p>

          <p className="text-xs lg:text-sm text-slate-600 leading-relaxed">
            Every hour an inverter trips or a solar string soils, farm operators lose clean kilowatt-hours and critical revenue. Sole Pulse integrates 24/7 IoT sensor streams with advanced neural anomaly detection, translating physical telemetry into immediate financial insights and prioritized work orders.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-300 rounded-none">
              <div className="p-1.5 bg-orange-100 text-urbanic-orange mt-0.5 rounded-none">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase">Core Mission</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Protect every kilowatt-hour generated through physics-informed intelligence.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 p-3 bg-slate-50 border border-slate-300 rounded-none">
              <div className="p-1.5 bg-orange-100 text-urbanic-orange mt-0.5 rounded-none">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase">Reliability Standard</h4>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                  Sub-second detection of soiling, overheating, and low voltage before physical breakdown.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Company Stats Grid (Sharp Rectangular) */}
        <div className="lg:col-span-5 bg-slate-100 p-6 border border-slate-300 rounded-none space-y-4">
          <div className="border-b border-slate-300 pb-2.5">
            <span className="text-[10px] uppercase font-mono tracking-widest text-urbanic-orange font-bold">
              Operational Scale
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5 font-heading">Sole Pulse by the Numbers</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <div className="p-2.5 bg-white border border-slate-300 rounded-none">
              <span className="text-2xl font-black text-slate-900">150+</span>
              <span className="text-[10px] text-slate-500 block mt-0.5 uppercase">MW Monitored</span>
            </div>
            <div className="p-2.5 bg-white border border-slate-300 rounded-none">
              <span className="text-2xl font-black text-urbanic-orange">100+</span>
              <span className="text-[10px] text-slate-500 block mt-0.5 uppercase">Live Assets</span>
            </div>
            <div className="p-2.5 bg-white border border-slate-300 rounded-none">
              <span className="text-2xl font-black text-emerald-700">95.27%</span>
              <span className="text-[10px] text-slate-500 block mt-0.5 uppercase">Model Accuracy</span>
            </div>
            <div className="p-2.5 bg-white border border-slate-300 rounded-none">
              <span className="text-2xl font-black text-amber-700">$240k+</span>
              <span className="text-[10px] text-slate-500 block mt-0.5 uppercase">Downtime Saved</span>
            </div>
          </div>

          <div className="pt-2 text-[11px] text-slate-600 flex items-center gap-1.5 border-t border-slate-200">
            <Globe2 className="w-3.5 h-3.5 text-urbanic-orange shrink-0" />
            <span>Synchronized with Open-Meteo atmospheric radiation nodes</span>
          </div>
        </div>
      </div>

      {/* 2. CONTACT & DISPATCH CENTER (Sharp Rectangular) */}
      <div className="bg-slate-100 p-6 lg:p-8 border border-slate-300 rounded-none">
        <div className="max-w-2xl mb-5">
          <span className="text-[11px] font-mono font-bold text-urbanic-orange uppercase">
            Global Support & Dispatch
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-0.5">Connect with Sole Pulse</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            24/7 technical hotline and dispatch support for renewable solar farms and wind turbine arrays.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 border border-slate-300 rounded-none flex items-start gap-3">
            <div className="p-2 bg-orange-100 text-urbanic-orange shrink-0 rounded-none">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900 text-xs block">Operations Center</strong>
              <span className="text-slate-600 mt-0.5 block text-[11px]">
                Sole Pulse Renewable Intelligence Hub<br />Clean Energy Grid Sector 7
              </span>
            </div>
          </div>

          <div className="bg-white p-4 border border-slate-300 rounded-none flex items-start gap-3">
            <div className="p-2 bg-orange-100 text-urbanic-orange shrink-0 rounded-none">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900 text-xs block">Operations Hotline</strong>
              <span className="text-urbanic-orange font-mono font-bold text-sm block mt-0.5">
                010-020-0340
              </span>
              <span className="text-slate-500 text-[10px]">Toll-Free Dispatch Support</span>
            </div>
          </div>

          <div className="bg-white p-4 border border-slate-300 rounded-none flex items-start gap-3">
            <div className="p-2 bg-orange-100 text-urbanic-orange shrink-0 rounded-none">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <strong className="text-slate-900 text-xs block">Official Inquiries</strong>
              <a 
                href="mailto:contact@solepulse.energy" 
                className="text-urbanic-orange hover:underline font-semibold block mt-0.5 text-xs"
              >
                contact@solepulse.energy
              </a>
              <span className="text-slate-500 text-[10px]">24/7 Engineering Desk</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
