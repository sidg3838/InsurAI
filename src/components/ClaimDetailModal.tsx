import React, { useState } from 'react';
import { ClaimData, ClaimAssessmentResult, ClaimStatus } from '../types';
import { 
  X, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, FileText, 
  User, DollarSign, Calendar, AlertCircle, ArrowRight, Printer, 
  Sparkles, ShieldAlert, Check, Clock, Edit3, Save, ChevronDown, ChevronUp
} from 'lucide-react';

interface ClaimDetailModalProps {
  claim: ClaimData;
  assessment?: ClaimAssessmentResult;
  onClose: () => void;
  onSaveOverride?: (claimId: string, newStatus: ClaimStatus, overrideReason: string, adjusterNotes: string) => void;
}

export const ClaimDetailModal: React.FC<ClaimDetailModalProps> = ({
  claim,
  assessment,
  onClose,
  onSaveOverride
}) => {
  const [showOverrideForm, setShowOverrideForm] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState<ClaimStatus>('Approved by Adjuster');
  const [overrideReason, setOverrideReason] = useState('');
  const [adjusterNotes, setAdjusterNotes] = useState(assessment?.adjusterNotes || '');
  const [showRuleDetails, setShowRuleDetails] = useState(true);

  if (!assessment) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-900',
          badge: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
          meter: 'bg-emerald-500',
        };
      case 'Medium':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-900',
          badge: 'bg-amber-100 text-amber-800 border border-amber-300',
          meter: 'bg-amber-500',
        };
      case 'High':
      default:
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-900',
          badge: 'bg-rose-100 text-rose-800 border border-rose-300',
          meter: 'bg-rose-600',
        };
    }
  };

  const riskColors = getRiskColor(assessment.fraudRiskLevel);

  const effectiveDecision = assessment.humanOverride
    ? assessment.humanOverride.newDecision
    : assessment.decision;

  const handlePrint = () => {
    window.print();
  };

  const handleSaveOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSaveOverride && overrideReason) {
      onSaveOverride(claim.id, overrideStatus, overrideReason, adjusterNotes);
      setShowOverrideForm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col font-sans">
        {/* Header */}
        <div className="bg-white px-8 py-4 border-b border-slate-200 text-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0">
              <ShieldCheck className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-900">Decision Report</h2>
                <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                  {claim.claimNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Policy: {claim.policyNumber} ({claim.policyType}) • Policyholder: {claim.policyholderName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-400 hidden sm:inline mr-2">
              Computed at {new Date(assessment.evaluatedAt).toLocaleTimeString()}
            </span>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold transition text-xs flex items-center space-x-1"
              title="Print / Export Report"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto grow">
          {/* Claim Metadata & Narrative Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Incoming Claim Inputs */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Incoming Claim Details</h3>
              
              <div>
                <label className="text-[11px] text-slate-400 uppercase font-semibold">Policyholder</label>
                <p className="text-sm font-bold text-slate-800">{claim.policyholderName}</p>
                <p className="text-xs text-slate-500 font-serif italic">{claim.policyType} Protection • {claim.policyNumber}</p>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 uppercase font-semibold">Estimated Damage</label>
                <p className="text-lg font-black text-slate-900">${claim.estimatedDamage.toLocaleString()}</p>
                <p className="text-[11px] text-slate-500">Deductible: ${claim.deductible.toLocaleString()}</p>
              </div>

              <div className="pt-2 border-t border-slate-200/80">
                <label className="text-[11px] text-slate-400 uppercase font-semibold">Incident Narrative</label>
                <p className="text-xs text-slate-600 leading-relaxed mt-1 italic">
                  "{claim.incidentDescription}"
                </p>
              </div>
            </div>

            {/* Decision Highlight Card */}
            <div className="md:col-span-2 flex flex-col justify-between">
              <div className="p-6 border-2 border-slate-900 rounded-xl relative overflow-hidden bg-white shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Final Automated Decision</span>
                  {assessment.humanOverride && (
                    <span className="text-[10px] font-bold bg-slate-900 text-amber-300 px-2.5 py-0.5 rounded-full">
                      Adjuster Overridden
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 mt-2">
                  {effectiveDecision === 'Instant Payout Approved' || effectiveDecision === 'Approved by Adjuster' ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-amber-600 shrink-0" />
                  )}
                  <p className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                    {effectiveDecision}
                  </p>
                </div>

                <p className="text-xs text-slate-600 mt-3 leading-relaxed">
                  {assessment.decisionReason}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Net Payout Value:</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    ${Math.max(0, claim.estimatedDamage - claim.deductible).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Fraud Risk Indicator */}
              <div className={`mt-4 p-4 rounded-xl border ${riskColors.bg} flex items-center justify-between`}>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Fraud Risk Level</span>
                    <span className={`px-2 py-0.5 text-[10px] font-black tracking-widest rounded ${riskColors.badge}`}>
                      {assessment.fraudRiskLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">Calculated Anomaly Probability: <strong className="text-slate-900">{assessment.fraudRiskScore}%</strong></p>
                </div>
                <div className="w-32 bg-slate-200/80 rounded-full h-2 overflow-hidden">
                  <div className={`h-2 rounded-full ${riskColors.meter}`} style={{ width: `${assessment.fraudRiskScore}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Summary Box */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Claim Assessment Summary</span>
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed">
              {assessment.assessmentSummary}
            </p>
          </div>

          {/* Flagged Anomaly Indicators */}
          {assessment.flaggedAnomalies && assessment.flaggedAnomalies.length > 0 && (
            <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-200">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center space-x-1.5 mb-3">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                <span>Detected Anomaly Indicators ({assessment.flaggedAnomalies.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {assessment.flaggedAnomalies.map((anom, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-lg border border-rose-200 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{anom.label}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          anom.severity === 'high'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : anom.severity === 'medium'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {anom.severity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-normal">{anom.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Policy Rule Matrix Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <button
              onClick={() => setShowRuleDetails(!showRuleDetails)}
              className="w-full px-5 py-3.5 bg-slate-50 hover:bg-slate-100 border-b border-slate-200 flex items-center justify-between text-left transition"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>Policy Standard Rules Matrix Breakdown</span>
              </span>
              {showRuleDetails ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {showRuleDetails && (
              <div className="divide-y divide-slate-100 text-xs">
                {assessment.ruleBreakdown.map((rule, idx) => (
                  <div key={idx} className="p-4 flex items-start space-x-3 hover:bg-slate-50/50">
                    {rule.passed ? (
                      <div className="p-1 rounded-full bg-emerald-100 text-emerald-700 mt-0.5 shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="p-1 rounded-full bg-amber-100 text-amber-700 mt-0.5 shrink-0">
                        <X className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}

                    <div className="grow">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{rule.ruleName}</span>
                        <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${rule.passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {rule.passed ? 'PASSED' : 'FLAGGED'}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-0.5 leading-relaxed">{rule.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recommended Next Steps */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-slate-800">Recommended Next Steps</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-2">Customer Actions</span>
                <div className="space-y-2">
                  {assessment.customerNextSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-blue-100 text-blue-600 rounded text-[10px] flex items-center justify-center font-bold shrink-0">
                        0{idx + 1}
                      </span>
                      <p className="text-xs text-slate-600 pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">Adjuster Actions</span>
                <div className="space-y-2">
                  {assessment.adjusterNextSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 bg-slate-200 text-slate-700 rounded text-[10px] flex items-center justify-center font-bold shrink-0">
                        0{idx + 1}
                      </span>
                      <p className="text-xs text-slate-600 pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Field Adjuster Override Section */}
          <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-white">Field Adjuster Decision Override</h4>
              </div>

              {!showOverrideForm ? (
                <button
                  onClick={() => setShowOverrideForm(true)}
                  className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition"
                >
                  Manual Override
                </button>
              ) : (
                <button
                  onClick={() => setShowOverrideForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              )}
            </div>

            {assessment.humanOverride && !showOverrideForm && (
              <div className="mt-3 p-3 bg-purple-950/60 rounded-lg border border-purple-500/30 text-xs text-purple-200 space-y-1">
                <p className="font-bold text-purple-300">
                  Current Status: {assessment.humanOverride.newDecision} (Overridden by {assessment.humanOverride.overriddenBy})
                </p>
                <p>Reason: "{assessment.humanOverride.reason}"</p>
                <p className="text-[10px] text-purple-400">Timestamp: {new Date(assessment.humanOverride.timestamp).toLocaleString()}</p>
              </div>
            )}

            {showOverrideForm && (
              <form onSubmit={handleSaveOverrideSubmit} className="mt-4 space-y-4 pt-3 border-t border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Override Decision</label>
                    <select
                      value={overrideStatus}
                      onChange={(e) => setOverrideStatus(e.target.value as ClaimStatus)}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-amber-400"
                    >
                      <option value="Approved by Adjuster">Approve Instant Payout (Override)</option>
                      <option value="Escalated to Human Adjuster">Escalate for Deep Investigation</option>
                      <option value="Rejected by Adjuster">Reject Claim (Fraud / Non-Covered)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Adjuster Name / ID</label>
                    <input
                      type="text"
                      defaultValue="Senior Adjuster Sarah Jenkins"
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Override Justification & Notes</label>
                  <textarea
                    rows={2}
                    required
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    placeholder="Provide required justification for overriding the automated AI decision..."
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg p-2.5 text-xs focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition flex items-center space-x-1"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Adjuster Decision</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">
            Confidential • Internal Reviewer: Sarah Jenkins
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-600 rounded-lg text-sm font-semibold hover:bg-white transition-colors"
            >
              Close
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold shadow-md hover:bg-slate-800 transition-colors"
            >
              Confirm Review
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
