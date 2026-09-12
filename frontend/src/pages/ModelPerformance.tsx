import React, { useEffect, useState } from 'react';
import { ModelPerformance as IModelPerformance } from '../types';
import { api } from '../services/api';
import { 
  BrainCircuit, 
  CheckCircle, 
  Target, 
  Repeat, 
  Award, 
  Layers, 
  Sliders, 
  ShieldCheck, 
  AlertCircle 
} from 'lucide-react';
import { StatCard } from '../components/dashboard/StatCard';

export const ModelPerformance: React.FC = () => {
  const [perf, setPerf] = useState<IModelPerformance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getModelPerformance()
      .then(setPerf)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !perf) {
    return (
      <div className="glass-panel p-16 rounded-2xl text-center text-xs font-mono text-slate-400">
        Loading AI model benchmark telemetry...
      </div>
    );
  }

  const cm = perf.confusion_matrix;
  const tn = cm.actual_normal.correctly_classified;
  const fp = cm.actual_normal.false_anomalies;
  const fn = cm.actual_abnormal.missed;
  const tp = cm.actual_abnormal.correctly_detected;

  return (
    <div className="space-y-6">
      {/* Header with Evaluation Note */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-white tracking-tight">
              AI Autoencoder Model Performance
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
              PyTorch AI
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official benchmark evaluation on <strong>{perf.evaluation_dataset_size.toLocaleString()} readings</strong> ({perf.model_name})
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Evaluation on simulated sensor dataset (14,988 Normal / 5,012 Abnormal)</span>
        </div>
      </div>

      {/* 4 Core Verified Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Overall Accuracy"
          value={`${perf.accuracy}%`}
          subtitle="Correct classification rate"
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="Precision"
          value={`${perf.precision}%`}
          subtitle="Positive predictive value"
          icon={Target}
          color="cyan"
        />
        <StatCard
          title="Recall (Sensitivity)"
          value={`${perf.recall}%`}
          subtitle="Anomaly detection coverage"
          icon={Repeat}
          color="indigo"
        />
        <StatCard
          title="F1-Score"
          value={`${perf.f1_score}%`}
          subtitle="Harmonic precision/recall mean"
          icon={Award}
          color="amber"
        />
      </div>

      {/* Deep Architecture & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Architecture & Decision Rule */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-industrial-800 space-y-4">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Layers className="w-4 h-4 text-emerald-400" />
            <h3>Neural Autoencoder Architecture</h3>
          </div>

          <div className="p-3.5 rounded-xl bg-industrial-900/80 border border-industrial-800 font-mono text-xs space-y-2">
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Model File:</span>
              <strong className="text-emerald-400">{perf.model_name}</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Architecture:</span>
              <span className="text-slate-200">{perf.architecture}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Input Vector:</span>
              <span className="text-slate-200">6 Telemetry Features</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Latent Bottleneck:</span>
              <span className="text-indigo-400 font-bold">2 Dimensions</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-500">Calibrated Threshold:</span>
              <span className="text-amber-400 font-bold">{perf.anomaly_threshold}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-industrial-850/50 border border-industrial-800 text-xs text-slate-300 space-y-1.5">
            <h4 className="font-bold text-slate-200">Reconstruction Loss Principle:</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Trained on 14,988 normal operational cycles. When input telemetry obeys solar physics, reconstruction MSE stays &le; 1.033. Abnormal soiling, diode failure, or thermal hotspots cause high reconstruction error, immediately triggering an anomaly flag.
            </p>
          </div>
        </div>

        {/* Confusion Matrix Table */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-industrial-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <h3>Confusion Matrix (20,000 Verified Readings)</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Total: 20,000 Samples</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse font-mono text-xs">
              <thead>
                <tr className="border-b border-industrial-800 text-slate-400">
                  <th className="py-2.5 px-3 text-left">Actual Class</th>
                  <th className="py-2.5 px-3 bg-industrial-900/60 text-slate-300">Predicted Normal</th>
                  <th className="py-2.5 px-3 bg-industrial-900/60 text-slate-300">Predicted Anomaly</th>
                  <th className="py-2.5 px-3 text-right">Class Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-industrial-800/60">
                <tr>
                  <td className="py-3 px-3 text-left font-bold text-slate-300">Actual Normal</td>
                  <td className="py-3 px-3 bg-emerald-500/10 text-emerald-400 font-bold border-r border-industrial-800">
                    {tn.toLocaleString()} <span className="text-[10px] text-emerald-600 block">True Negative (95.5%)</span>
                  </td>
                  <td className="py-3 px-3 bg-rose-500/10 text-rose-400 font-bold">
                    {fp.toLocaleString()} <span className="text-[10px] text-rose-600 block">False Alarm (4.5%)</span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400 font-bold">
                    {(tn + fp).toLocaleString()}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-3 text-left font-bold text-slate-300">Actual Abnormal</td>
                  <td className="py-3 px-3 bg-rose-500/10 text-rose-400 font-bold border-r border-industrial-800">
                    {fn.toLocaleString()} <span className="text-[10px] text-rose-600 block">Missed / False Neg (5.3%)</span>
                  </td>
                  <td className="py-3 px-3 bg-emerald-500/10 text-emerald-400 font-bold">
                    {tp.toLocaleString()} <span className="text-[10px] text-emerald-600 block">True Positive (94.7%)</span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-400 font-bold">
                    {(fn + tp).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-3 border-t border-industrial-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Accuracy: (14,307 + 4,746) / 20,000 = <strong>95.27%</strong></span>
            <span className="text-emerald-400">Recall: 4,746 / 5,012 = <strong>94.69%</strong></span>
          </div>
        </div>
      </div>

      {/* Fault Detection Rates Breakdown */}
      <div className="glass-panel p-6 rounded-2xl border border-industrial-800">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            Fault-Specific Detection Rates
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
          {Object.entries(perf.fault_detection_rates).map(([fault, rate]) => {
            const isPerfect = rate === 100;
            const isHigh = rate >= 90;

            return (
              <div
                key={fault}
                className="p-4 rounded-xl bg-industrial-850/60 border border-industrial-800"
              >
                <span className="text-xs text-slate-400 capitalize block">
                  {fault.replace('_', ' ')}
                </span>
                <div className="mt-2 flex items-baseline justify-between">
                  <span
                    className={`text-xl font-bold ${
                      isPerfect
                        ? 'text-emerald-400'
                        : isHigh
                        ? 'text-cyan-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {rate}%
                  </span>
                  <span className="text-[10px] text-slate-500">Detection</span>
                </div>

                <div className="w-full bg-industrial-800 h-1.5 rounded-full mt-2 overflow-hidden">
                  <div
                    style={{ width: `${rate}%` }}
                    className={`h-full rounded-full ${
                      isPerfect ? 'bg-emerald-500' : isHigh ? 'bg-cyan-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
