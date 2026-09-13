import React, { useState } from 'react';
import { api } from '../services/api';
import { Zap, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
  onGoRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onGoRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }
    setLoading(true);
    try {
      await api.login({ email, password });
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-industrial-950 flex items-center justify-center px-4">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-5"
        style={{ backgroundImage: 'linear-gradient(#f26522 1px, transparent 1px), linear-gradient(90deg, #f26522 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

      <div className="relative w-full max-w-md">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-urbanic-orange flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-black text-white uppercase tracking-tight">Sole</span>
            <span className="text-3xl font-light text-urbanic-orange uppercase tracking-tight">Pulse</span>
          </div>
          <p className="text-industrial-400 text-sm uppercase tracking-widest font-mono">
            Renewable Asset Intelligence
          </p>
        </div>

        {/* Card */}
        <div className="bg-industrial-900 border border-industrial-700 p-8">
          <h2 className="text-white text-xl font-bold uppercase tracking-wide mb-1">
            Operator Login
          </h2>
          <p className="text-industrial-400 text-xs mb-6">
            Access your fleet monitoring dashboard
          </p>

          {error && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 p-3 mb-5 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-industrial-300 text-xs font-mono uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="operator@solepulse.energy"
                  autoComplete="email"
                  className="w-full bg-industrial-800 border border-industrial-600 text-white placeholder-industrial-600 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-urbanic-orange transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-industrial-300 text-xs font-mono uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full bg-industrial-800 border border-industrial-600 text-white placeholder-industrial-600 pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-urbanic-orange transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-industrial-500 hover:text-industrial-300 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-urbanic-orange hover:bg-urbanic-orangeHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-sm py-3 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Login to Dashboard'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-industrial-700 text-center">
            <p className="text-industrial-500 text-xs">
              New operator?{' '}
              <button
                onClick={onGoRegister}
                className="text-urbanic-orange hover:text-urbanic-orangeHover font-semibold transition-colors"
              >
                Request Access
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-industrial-600 text-[10px] font-mono mt-6 uppercase tracking-widest">
          © 2026 Sole Pulse Energy Systems — Secure Operations Portal
        </p>
      </div>
    </div>
  );
};
