// client/src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Factory, Lock, Mail, AlertCircle, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      navigate('/rfqs');
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoAccountSelect = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-800 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-slate-950 p-6 text-center border-b border-slate-800">
          <div className="inline-flex w-12 h-12 rounded-xl bg-blue-600 items-center justify-center text-white mb-3 shadow-lg shadow-blue-500/20">
            <Factory className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">ForgeQuote</h1>
          <p className="text-xs text-slate-400 mt-1">
            Precision Machining & Forging Quotation System
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300">
            Company A • Chakan, Pune
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="estimator@forgequote.demo"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-md shadow transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Demonstration Quick Selectors for All 4 Personas */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Select Persona (Problem Statement)
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Company A Roles</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {/* 1. Estimator */}
              <button
                type="button"
                onClick={() => handleDemoAccountSelect('estimator@forgequote.demo', 'Estimator@123')}
                className="p-2.5 text-left border border-slate-200 hover:border-blue-400 rounded-lg hover:bg-blue-50/50 transition group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-blue-700">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Estimator</span>
                </div>
                <div className="text-[10px] text-blue-600 font-medium mt-0.5">Costs parts & cycle times</div>
                <div className="text-[9px] text-slate-400 font-mono truncate">
                  estimator@forgequote.demo
                </div>
              </button>

              {/* 2. Plant Head */}
              <button
                type="button"
                onClick={() => handleDemoAccountSelect('planthead@forgequote.demo', 'PlantHead@123')}
                className="p-2.5 text-left border border-slate-200 hover:border-emerald-400 rounded-lg hover:bg-emerald-50/50 transition group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-emerald-700">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Plant Head</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Checks routings & machines</div>
                <div className="text-[9px] text-slate-400 font-mono truncate">
                  planthead@forgequote.demo
                </div>
              </button>

              {/* 3. Sales Head */}
              <button
                type="button"
                onClick={() => handleDemoAccountSelect('sales@forgequote.demo', 'Sales@123')}
                className="p-2.5 text-left border border-slate-200 hover:border-purple-400 rounded-lg hover:bg-purple-50/50 transition group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-purple-700">
                  <UserCheck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Sales Head</span>
                </div>
                <div className="text-[10px] text-purple-600 font-medium mt-0.5">Approves & sends quotes</div>
                <div className="text-[9px] text-slate-400 font-mono truncate">
                  sales@forgequote.demo
                </div>
              </button>

              {/* 4. Managing Director */}
              <button
                type="button"
                onClick={() => handleDemoAccountSelect('md@forgequote.demo', 'MD@123')}
                className="p-2.5 text-left border border-slate-200 hover:border-amber-400 rounded-lg hover:bg-amber-50/50 transition group"
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 group-hover:text-amber-700">
                  <UserCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Managing Director</span>
                </div>
                <div className="text-[10px] text-amber-600 font-medium mt-0.5">Signs the final deal</div>
                <div className="text-[9px] text-slate-400 font-mono truncate">
                  md@forgequote.demo
                </div>
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-2.5 text-center">
              Argon2id cryptographic hash verification • 24hr server-side session
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
