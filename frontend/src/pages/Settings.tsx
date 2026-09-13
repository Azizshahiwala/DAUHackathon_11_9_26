import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Settings as SettingsIcon, 
  Server, 
  Cpu, 
  Play, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  Users,
  ShieldAlert
} from 'lucide-react';
import { AIOutput } from '../types';

export const Settings: React.FC = () => {
  const [isMockMode, setIsMockMode] = useState<boolean>(api.getIsMockMode());
  const [flaskUrl, setFlaskUrl] = useState<string>('http://localhost:5000/api');
  
  // Custom Inference Sandbox
  const [testTemp, setTestTemp] = useState<number>(68.4);
  const [testVolt, setTestVolt] = useState<number>(24.2);
  const [testCurr, setTestCurr] = useState<number>(3.1);
  const [testIrrad, setTestIrrad] = useState<number>(880);
  const [testSoiling, setTestSoiling] = useState<number>(45.0);
  const [testPower, setTestPower] = useState<number>(0.075);
  
  const [inferenceResult, setInferenceResult] = useState<AIOutput | null>(null);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  const handleToggleMock = (active: boolean) => {
    setIsMockMode(active);
    api.setMockMode(active);
  };

  const handleRunTest = async () => {
    try {
      setIsTesting(true);
      const res = await api.predictAsset({
        asset_id: "SANDBOX-01",
        temperature: testTemp,
        voltage: testVolt,
        current: testCurr,
        irradiance: testIrrad,
        soiling: testSoiling,
        power_output: testPower,
      });
      setInferenceResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-400" />
          <span>System Settings & AI Testing Sandbox</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure API endpoints, switch between Mock API and live Flask backend, and run live inference checks
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: API & Backend Integration Configuration */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-industrial-800 space-y-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Server className="w-4 h-4 text-emerald-400" />
              <h3>Backend Integration Mode</h3>
            </div>

            <div className="p-4 rounded-xl bg-industrial-900/80 border border-industrial-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-white block">Mock Simulation Mode</span>
                  <span className="text-[11px] text-slate-400">
                    Runs 100% in-browser with zero backend requirement
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isMockMode}
                  onChange={(e) => handleToggleMock(e.target.checked)}
                  className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
                />
              </div>

              <div className="pt-2 border-t border-industrial-800">
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Flask Backend REST Endpoint
                </label>
                <input
                  type="text"
                  value={flaskUrl}
                  onChange={(e) => {
                    setFlaskUrl(e.target.value);
                    api.setBaseUrl(e.target.value);
                  }}
                  disabled={isMockMode}
                  className="w-full bg-industrial-850 border border-industrial-700/80 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="text-[11px] text-slate-400 leading-relaxed space-y-1 bg-industrial-850/40 p-3 rounded-xl border border-industrial-800">
              <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                <span>Team Sync Note</span>
              </div>
              <p>
                When Person 2 launches the Flask backend on port 5000, uncheck Mock Simulation Mode. The frontend will communicate directly with Flask endpoints.
              </p>
            </div>
          </div>

          {/* Team Roles Dossier */}
          <div className="glass-panel p-6 rounded-2xl border border-industrial-800 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3>HackOut'26 Team Roster</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-industrial-900/60 border border-industrial-800 flex justify-between items-center">
                <div>
                  <strong className="text-white">Person 1 (You)</strong>
                  <span className="text-[11px] text-slate-400 block">Frontend & UI/UX</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  React + TS + Tailwind
                </span>
              </div>

              <div className="p-3 rounded-xl bg-industrial-900/60 border border-industrial-800 flex justify-between items-center">
                <div>
                  <strong className="text-white">Person 2</strong>
                  <span className="text-[11px] text-slate-400 block">Backend & Database</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  Flask + PostgreSQL
                </span>
              </div>

              <div className="p-3 rounded-xl bg-industrial-900/60 border border-industrial-800 flex justify-between items-center">
                <div>
                  <strong className="text-white">Person 3</strong>
                  <span className="text-[11px] text-slate-400 block">AI & ML System</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                  PyTorch Autoencoder
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive AI Inference Sandbox */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-industrial-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Cpu className="w-4 h-4 text-amber-400" />
              <h3>Interactive PyTorch Inference Sandbox</h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Simulate Telemetry Ingestion
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Inject custom values for the 6 Autoencoder features to verify reconstruction loss, threshold tripping, and fault diagnostics.
          </p>

          {/* 6 Feature Input Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-industrial-900/70 border border-industrial-800">
              <label className="text-slate-400 block text-[10px]">Temperature (°C)</label>
              <input
                type="number"
                value={testTemp}
                onChange={(e) => setTestTemp(parseFloat(e.target.value))}
                className="w-full mt-1 bg-industrial-850 border border-industrial-700 rounded-lg px-2 py-1 text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-industrial-900/70 border border-industrial-800">
              <label className="text-slate-400 block text-[10px]">Voltage (V)</label>
              <input
                type="number"
                value={testVolt}
                onChange={(e) => setTestVolt(parseFloat(e.target.value))}
                className="w-full mt-1 bg-industrial-850 border border-industrial-700 rounded-lg px-2 py-1 text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-industrial-900/70 border border-industrial-800">
              <label className="text-slate-400 block text-[10px]">Current (A)</label>
              <input
                type="number"
                value={testCurr}
                onChange={(e) => setTestCurr(parseFloat(e.target.value))}
                className="w-full mt-1 bg-industrial-850 border border-industrial-700 rounded-lg px-2 py-1 text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-industrial-900/70 border border-industrial-800">
              <label className="text-slate-400 block text-[10px]">Irradiance (W/m²)</label>
              <input
                type="number"
                value={testIrrad}
                onChange={(e) => setTestIrrad(parseFloat(e.target.value))}
                className="w-full mt-1 bg-industrial-850 border border-industrial-700 rounded-lg px-2 py-1 text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-industrial-900/70 border border-industrial-800">
              <label className="text-slate-400 block text-[10px]">Soiling (%)</label>
              <input
                type="number"
                value={testSoiling}
                onChange={(e) => setTestSoiling(parseFloat(e.target.value))}
                className="w-full mt-1 bg-industrial-850 border border-industrial-700 rounded-lg px-2 py-1 text-white"
              />
            </div>

            <div className="p-3 rounded-xl bg-industrial-900/70 border border-industrial-800">
              <label className="text-slate-400 block text-[10px]">Power Output (kW)</label>
              <input
                type="number"
                value={testPower}
                onChange={(e) => setTestPower(parseFloat(e.target.value))}
                className="w-full mt-1 bg-industrial-850 border border-industrial-700 rounded-lg px-2 py-1 text-white"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRunTest}
              disabled={isTesting}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-industrial-950 font-bold rounded-xl text-xs transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isTesting ? 'Running PyTorch Inference...' : 'Evaluate Telemetry Vector'}</span>
            </button>

            <button
              onClick={() => {
                // Pre-fill with normal healthy values
                setTestTemp(36.5);
                setTestVolt(38.2);
                setTestCurr(9.2);
                setTestIrrad(865);
                setTestSoiling(4.5);
                setTestPower(0.355);
              }}
              className="px-3 py-2 bg-industrial-850 hover:bg-industrial-800 text-slate-300 border border-industrial-700 rounded-xl text-xs transition-all"
            >
              Reset to Healthy Baseline
            </button>
          </div>

          {/* Test Inference Output Result */}
          {inferenceResult && (
            <div
              className={`p-4 rounded-xl border font-mono text-xs space-y-2 mt-4 ${
                inferenceResult.anomaly
                  ? 'border-rose-500/40 bg-rose-500/10'
                  : 'border-emerald-500/40 bg-emerald-500/10'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase text-white flex items-center gap-2">
                  {inferenceResult.anomaly ? (
                    <>
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span className="text-rose-400">Anomaly Tripped (Loss &gt; 1.033)</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Nominal Operation Confirmed</span>
                    </>
                  )}
                </span>
                <span className="text-slate-300">
                  Reconstruction Error: <strong>{inferenceResult.reconstruction_error.toFixed(4)}</strong>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-industrial-800 text-[11px]">
                <div>
                  <span className="text-slate-400 block">Risk Score:</span>
                  <strong className="text-white">{inferenceResult.risk_score} / 100</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Failure Risk:</span>
                  <strong className="text-rose-400">{inferenceResult.failure_risk}%</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Fault Category:</span>
                  <strong className="text-amber-400 capitalize">{inferenceResult.fault_type}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block">Est. Revenue Loss:</span>
                  <strong className="text-rose-400">${inferenceResult.revenue_loss}/day</strong>
                </div>
              </div>

              <div className="pt-2 text-slate-300 text-[11px]">
                <strong>Recommended Action:</strong> {inferenceResult.recommended_action}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
