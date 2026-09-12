import React, { useState } from 'react';
import { api } from '../services/api';
import { Zap, Mail, Lock, Eye, EyeOff, User, AlertCircle, CheckCircle2 } from 'lucide-react';

interface RegisterProps {
  onGoLogin: () => void;
}

const ROLES = [
  { value: 'operator',    label: 'Farm Operator',          desc: 'Monitor assets and fleet health' },
  { value: 'technician',  label: 'Maintenance Technician', desc: 'View and manage maintenance tasks' },
  { value: 'manager',     label: 'Asset Manager',          desc: 'Full fleet and analytics access' },
];

export const Register: React.FC<RegisterProps> = ({ onGoLogin }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [role, setRole]         = useState('operator');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  const passwordStrength = (): { label: string; color: string; width: string } => {
    if (password.length === 0) return { label: '', color: '', width: '0%' };
    if (password.length < 6)  return { label: 'Weak',   color: 'bg-red-500',   width: '25%' };
    if (password.length < 10) return { label: 'Fair',   color: 'bg-amber-500', width: '50%' };
    if (!/[A-Z]/.test(password) || !/[0-9]/.test(password))
                              return { label: 'Good',   color: 'bg-brand-cyan', width: '75%' };
    return                         { label: 'Strong', color: 'bg-brand-green', width: '100%' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !confirm) { setError('All fields are required.'); return; }
    if (password !== confirm)            { setError('Passwords do not match.');  return; }
    if (password.length < 6)            { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await api.register(email, password, role);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength();

  if (success) {
    return (
      <div className="min-h-screen bg-industrial-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-industrial-900 border border-brand-green/30 p-10">
            <CheckCircle2 className="w-14 h-14 text-brand-green mx-auto mb-4" />
            <h2 className="text-white text-xl font-bold uppercase mb-2">Access Granted</h2>
            <p className="text-industrial-400 text-sm mb-6">
              Your operator account has been created successfully.
            </p>
            <button
              onClick={onGoLogin}
              className="w-full bg-urbanic-orange hover:bg-urbanic-orangeHover text-white font-bold uppercase tracking-widest text-sm py-3 transition-colors"
            >
              Proceed to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-industrial-950 flex items-center justify-center px-4 py-12">
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
            Operator Registration
          </p>
        </div>

        <div className="bg-industrial-900 border border-industrial-700 p-8">
          <h2 className="text-white text-xl font-bold uppercase tracking-wide mb-1">
            Request Access
          </h2>
          <p className="text-industrial-400 text-xs mb-6">
            Create your Sole Pulse operator account
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
                Work Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@solepulse.energy"
                  autoComplete="email"
                  className="w-full bg-industrial-800 border border-industrial-600 text-white placeholder-industrial-600 pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-urbanic-orange transition-colors"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-industrial-300 text-xs font-mono uppercase tracking-wider mb-1.5">
                Role / Access Level
              </label>
              <div className="grid grid-cols-1 gap-2">
                {ROLES.map(r => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex items-start gap-3 p-3 border text-left transition-colors ${
                      role === r.value
                        ? 'border-urbanic-orange bg-urbanic-orange/10 text-white'
                        : 'border-industrial-600 bg-industrial-800 text-industrial-400 hover:border-industrial-500'
                    }`}
                  >
                    <User className={`w-4 h-4 mt-0.5 flex-shrink-0 ${role === r.value ? 'text-urbanic-orange' : 'text-industrial-500'}`} />
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide">{r.label}</p>
                      <p className="text-[10px] text-industrial-500 mt-0.5">{r.desc}</p>
                    </div>
                  </button>
                ))}
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
                  placeholder="Min. 6 characters"
                  autoComplete="new-password"
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
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="h-1 bg-industrial-700 rounded-full overflow-hidden">
                    <div className={`h-full ${strength.color} transition-all duration-300`} style={{ width: strength.width }} />
                  </div>
                  <p className="text-[10px] text-industrial-500 mt-1 font-mono">
                    Strength: <span className="text-industrial-300">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-industrial-300 text-xs font-mono uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-industrial-500" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  className={`w-full bg-industrial-800 border text-white placeholder-industrial-600 pl-10 pr-4 py-3 text-sm focus:outline-none transition-colors ${
                    confirm && confirm !== password ? 'border-red-500' : 'border-industrial-600 focus:border-urbanic-orange'
                  }`}
                />
              </div>
              {confirm && confirm !== password && (
                <p className="text-red-400 text-[10px] font-mono mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-urbanic-orange hover:bg-urbanic-orangeHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase tracking-widest text-sm py-3 transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Operator Account'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-industrial-700 text-center">
            <p className="text-industrial-500 text-xs">
              Already have access?{' '}
              <button
                onClick={onGoLogin}
                className="text-urbanic-orange hover:text-urbanic-orangeHover font-semibold transition-colors"
              >
                Login Here
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
