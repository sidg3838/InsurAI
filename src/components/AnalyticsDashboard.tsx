import React from 'react';
import { ClaimData, ClaimAssessmentResult } from '../types';
import { BarChart2, ShieldCheck, AlertTriangle, CheckCircle2, TrendingUp, DollarSign, Cpu, FileText, PieChart } from 'lucide-react';

interface AnalyticsDashboardProps {
  claims: ClaimData[];
  assessments: Record<string, ClaimAssessmentResult>;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ claims, assessments }) => {
  const totalClaims = claims.length;
  const evaluatedList = claims.map(c => assessments[c.id]).filter(Boolean);
  
  const approvedList = evaluatedList.filter(a => {
    const eff = a.humanOverride ? a.humanOverride.newDecision : a.decision;
    return eff === 'Instant Payout Approved' || eff === 'Approved by Adjuster';
  });

  const escalatedList = evaluatedList.filter(a => {
    const eff = a.humanOverride ? a.humanOverride.newDecision : a.decision;
    return eff === 'Escalated to Human Adjuster';
  });

  const totalClaimedValue = claims.reduce((acc, c) => acc + c.estimatedDamage, 0);
  
  const approvedValue = claims.reduce((acc, c) => {
    const a = assessments[c.id];
    if (a) {
      const eff = a.humanOverride ? a.humanOverride.newDecision : a.decision;
      if (eff === 'Instant Payout Approved' || eff === 'Approved by Adjuster') {
        return acc + Math.max(0, c.estimatedDamage - c.deductible);
      }
    }
    return acc;
  }, 0);

  const avgRiskScore = evaluatedList.length > 0
    ? Math.round(evaluatedList.reduce((acc, a) => acc + a.fraudRiskScore, 0) / evaluatedList.length)
    : 0;

  // Policy type breakdown
  const policyTypeCounts: Record<string, number> = {};
  claims.forEach(c => {
    policyTypeCounts[c.policyType] = (policyTypeCounts[c.policyType] || 0) + 1;
  });

  // Anomaly frequencies
  const anomalyCounts: Record<string, number> = {};
  evaluatedList.forEach(a => {
    a.flaggedAnomalies.forEach(anom => {
      anomalyCounts[anom.label] = (anomalyCounts[anom.label] || 0) + 1;
    });
  });

  return (
    <div className="space-y-6">
      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Claims Intake</span>
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{totalClaims}</p>
          <p className="text-xs text-slate-500 mt-1">
            Total Claimed Value: <span className="font-bold text-slate-800">${totalClaimedValue.toLocaleString()}</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-700">
            <span className="text-xs font-bold uppercase tracking-wider">Instant Auto-Approved</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">
            {approvedList.length}{' '}
            <span className="text-xs font-medium text-slate-500">
              ({evaluatedList.length > 0 ? Math.round((approvedList.length / evaluatedList.length) * 100) : 0}%)
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Payout Volume: <span className="font-bold text-emerald-700">${approvedValue.toLocaleString()}</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between text-amber-800">
            <span className="text-xs font-bold uppercase tracking-wider">Escalated to Adjuster</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <p className="text-2xl font-black text-amber-800 mt-2">
            {escalatedList.length}{' '}
            <span className="text-xs font-medium text-slate-500">
              ({evaluatedList.length > 0 ? Math.round((escalatedList.length / evaluatedList.length) * 100) : 0}%)
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Flagged for high damage or anomalies</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-indigo-200 shadow-2xs">
          <div className="flex items-center justify-between text-indigo-700">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Fraud Risk Score</span>
            <Cpu className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-2xl font-black text-indigo-900 mt-2">{avgRiskScore}%</p>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${avgRiskScore}%` }} />
          </div>
        </div>
      </div>

      {/* Grid: Policy Type & Anomaly Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Policy Type Distribution */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 mb-4">
            <PieChart className="w-4 h-4 text-blue-600" />
            <span>Claims Volume by Policy Type</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(policyTypeCounts).map(([type, count]) => {
              const pct = Math.round((count / totalClaims) * 100);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>{type} Policy</span>
                    <span>{count} claim(s) ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flagged Anomaly Types */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Detected Anomaly Indicators Breakdown</span>
          </h3>

          {Object.keys(anomalyCounts).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(anomalyCounts).map(([label, count]) => (
                <div key={label} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">{label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-bold">
                    {count} incident(s)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              No anomalies detected yet. Run AI evaluations on queue.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
