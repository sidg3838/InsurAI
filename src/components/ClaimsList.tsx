import React, { useState } from 'react';
import { ClaimData, ClaimAssessmentResult, PolicyType, FraudRiskLevel } from '../types';
import { Search, Filter, ShieldCheck, AlertTriangle, CheckCircle2, ArrowUpRight, Zap, RefreshCw, Calendar, DollarSign, FileText } from 'lucide-react';

interface ClaimsListProps {
  claims: ClaimData[];
  assessments: Record<string, ClaimAssessmentResult>;
  onSelectClaim: (claim: ClaimData) => void;
  onEvaluateClaim: (claim: ClaimData) => void;
  onBatchEvaluateAll: () => void;
  isEvaluatingAny: boolean;
}

export const ClaimsList: React.FC<ClaimsListProps> = ({
  claims,
  assessments,
  onSelectClaim,
  onEvaluateClaim,
  onBatchEvaluateAll,
  isEvaluatingAny
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [policyTypeFilter, setPolicyTypeFilter] = useState<string>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [decisionFilter, setDecisionFilter] = useState<string>('ALL');

  const filteredClaims = claims.filter(c => {
    const assessment = assessments[c.id];
    const searchMatch = 
      c.claimNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.policyholderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.incidentDescription.toLowerCase().includes(searchTerm.toLowerCase());

    const policyMatch = policyTypeFilter === 'ALL' || c.policyType === policyTypeFilter;
    const riskMatch = riskFilter === 'ALL' || (assessment && assessment.fraudRiskLevel === riskFilter);
    
    let decisionMatch = true;
    if (decisionFilter !== 'ALL') {
      if (!assessment) {
        decisionMatch = decisionFilter === 'UNASSESSED';
      } else {
        const effDecision = assessment.humanOverride ? assessment.humanOverride.newDecision : assessment.decision;
        decisionMatch = effDecision === decisionFilter;
      }
    }

    return searchMatch && policyMatch && riskMatch && decisionMatch;
  });

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative grow max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search claim #, policy #, claimant name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onBatchEvaluateAll}
              disabled={isEvaluatingAny}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>{isEvaluatingAny ? 'Evaluating...' : 'Run All AI Evaluations'}</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center space-x-1.5 font-semibold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Policy Type Filter */}
          <select
            value={policyTypeFilter}
            onChange={(e) => setPolicyTypeFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Policy Types</option>
            <option value="Auto">Auto</option>
            <option value="Home">Home</option>
            <option value="Commercial">Commercial</option>
            <option value="Health">Health</option>
            <option value="Travel">Travel</option>
          </select>

          {/* Fraud Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Fraud Risk Levels</option>
            <option value="Low">Low Risk</option>
            <option value="Medium">Medium Risk</option>
            <option value="High">High Risk</option>
          </select>

          {/* Decision Status Filter */}
          <select
            value={decisionFilter}
            onChange={(e) => setDecisionFilter(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs focus:outline-none"
          >
            <option value="ALL">All Decision Statuses</option>
            <option value="Instant Payout Approved">Instant Payout Approved</option>
            <option value="Escalated to Human Adjuster">Escalated to Adjuster</option>
            <option value="Approved by Adjuster">Approved by Adjuster</option>
            <option value="Rejected by Adjuster">Rejected</option>
          </select>

          {(searchTerm || policyTypeFilter !== 'ALL' || riskFilter !== 'ALL' || decisionFilter !== 'ALL') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setPolicyTypeFilter('ALL');
                setRiskFilter('ALL');
                setDecisionFilter('ALL');
              }}
              className="text-blue-600 hover:underline font-medium text-xs ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Claims Queue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClaims.map((claim) => {
          const assessment = assessments[claim.id];
          const isEvaluated = !!assessment;

          const effectiveDecision = assessment?.humanOverride
            ? assessment.humanOverride.newDecision
            : assessment?.decision;

          return (
            <div
              key={claim.id}
              className={`bg-white rounded-xl border transition-all duration-200 hover:shadow-md flex flex-col justify-between overflow-hidden ${
                isEvaluated
                  ? effectiveDecision === 'Instant Payout Approved' || effectiveDecision === 'Approved by Adjuster'
                    ? 'border-emerald-200 ring-1 ring-emerald-500/20'
                    : 'border-amber-200 ring-1 ring-amber-500/20'
                  : 'border-slate-200'
              }`}
            >
              <div className="p-5 space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {claim.claimNumber}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {claim.policyholderName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {claim.policyNumber} • {claim.policyType}
                    </p>
                  </div>

                  {/* Decision or Pending Badge */}
                  <div>
                    {isEvaluated ? (
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          effectiveDecision === 'Instant Payout Approved' || effectiveDecision === 'Approved by Adjuster'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {effectiveDecision === 'Instant Payout Approved' && (
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                        )}
                        {effectiveDecision === 'Escalated to Human Adjuster' && (
                          <AlertTriangle className="w-3 h-3 mr-1 text-amber-600" />
                        )}
                        {effectiveDecision}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Ready for Assessment
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Risk Row */}
                <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Estimated Damage</span>
                    <span className="text-sm font-extrabold text-slate-900">
                      ${claim.estimatedDamage.toLocaleString()}
                    </span>
                  </div>

                  {isEvaluated && assessment && (
                    <div className="text-right">
                      <span className="text-slate-500 block text-[10px] uppercase font-bold">Fraud Risk</span>
                      <span
                        className={`font-extrabold text-xs px-2 py-0.5 rounded ${
                          assessment.fraudRiskLevel === 'Low'
                            ? 'bg-emerald-100 text-emerald-800'
                            : assessment.fraudRiskLevel === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {assessment.fraudRiskLevel} ({assessment.fraudRiskScore}%)
                      </span>
                    </div>
                  )}
                </div>

                {/* Narrative excerpt */}
                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {claim.incidentDescription}
                </p>

                {/* Anomaly pill preview */}
                {assessment && assessment.flaggedAnomalies.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {assessment.flaggedAnomalies.slice(0, 2).map((a, i) => (
                      <span key={i} className="text-[10px] font-medium bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                        ⚠ {a.label}
                      </span>
                    ))}
                    {assessment.flaggedAnomalies.length > 2 && (
                      <span className="text-[10px] text-slate-500">+{assessment.flaggedAnomalies.length - 2} more</span>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 flex items-center">
                  <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                  {claim.incidentDate}
                </span>

                {isEvaluated ? (
                  <button
                    onClick={() => onSelectClaim(claim)}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                  >
                    <span>View Decision Report</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => onEvaluateClaim(claim)}
                    className="inline-flex items-center space-x-1 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Run AI Evaluation</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filteredClaims.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching claims found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search filters or add a new claim to evaluate.
          </p>
        </div>
      )}
    </div>
  );
};
