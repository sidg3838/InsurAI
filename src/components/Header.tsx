import React from 'react';
import { ShieldCheck, Cpu, AlertTriangle, FileText, Settings, BarChart2, CheckCircle2, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'dashboard' | 'new-claim' | 'rules' | 'analytics';
  setActiveTab: (tab: 'dashboard' | 'new-claim' | 'rules' | 'analytics') => void;
  stats: {
    total: number;
    approved: number;
    escalated: number;
    avgRisk: number;
  };
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, stats }) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-3">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20 shrink-0">
              <ShieldCheck className="h-5 w-5 text-white stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900">
                  InsurAI <span className="text-blue-600">Claims Copilot</span>
                </h1>
                <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Agent Status: Analyzing</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Automated Claim Assessment • Fraud Risk Scoring • Instant Decision Engine
              </p>
            </div>
          </div>

          {/* Quick Metrics Header Bar */}
          <div className="hidden lg:flex items-center space-x-4 bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium">
            <div className="flex items-center space-x-2">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Claims:</span>
              <span className="font-bold text-slate-900">{stats.total}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-200" />
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-slate-500">Instant Approved:</span>
              <span className="font-bold text-emerald-700">{stats.approved}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-200" />
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-slate-500">Escalated:</span>
              <span className="font-bold text-amber-700">{stats.escalated}</span>
            </div>
            <div className="h-3.5 w-px bg-slate-200" />
            <div className="flex items-center space-x-2">
              <Cpu className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-slate-500">Avg Risk:</span>
              <span className="font-bold text-slate-900">{stats.avgRisk}%</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 bg-slate-100/80 p-1 rounded-xl border border-slate-200/80">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Claims Queue</span>
            </button>

            <button
              onClick={() => setActiveTab('new-claim')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'new-claim'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Evaluate New Claim</span>
            </button>

            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Rule Engine</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === 'analytics'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Analytics</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
