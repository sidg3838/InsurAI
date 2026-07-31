import React, { useState, useEffect } from 'react';
import { ClaimData, ClaimAssessmentResult, PolicyRulesConfig, ClaimStatus } from './types';
import { INITIAL_MOCK_CLAIMS, DEFAULT_POLICY_RULES } from './data/mockClaims';
import { Header } from './components/Header';
import { ClaimsList } from './components/ClaimsList';
import { NewClaimForm } from './components/NewClaimForm';
import { ClaimDetailModal } from './components/ClaimDetailModal';
import { RulesConfigurator } from './components/RulesConfigurator';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-claim' | 'rules' | 'analytics'>('dashboard');
  const [claims, setClaims] = useState<ClaimData[]>(INITIAL_MOCK_CLAIMS);
  const [assessments, setAssessments] = useState<Record<string, ClaimAssessmentResult>>({});
  const [rules, setRules] = useState<PolicyRulesConfig>(DEFAULT_POLICY_RULES);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Evaluate single claim via Express backend
  const evaluateClaim = async (claim: ClaimData, currentRules = rules): Promise<ClaimAssessmentResult | null> => {
    try {
      const response = await fetch('/api/evaluate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, rules: currentRules })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.assessment) {
        setAssessments(prev => ({
          ...prev,
          [claim.id]: data.assessment
        }));
        return data.assessment;
      }
    } catch (err) {
      console.error('Failed to evaluate claim via API:', err);
    }
    return null;
  };

  // Evaluate all unassessed claims on initial load or on batch click
  const evaluateAllClaims = async (claimList = claims, currentRules = rules) => {
    setIsEvaluating(true);
    for (const claim of claimList) {
      await evaluateClaim(claim, currentRules);
    }
    setIsEvaluating(false);
  };

  useEffect(() => {
    // Initial batch evaluation so the dashboard displays live decisions immediately
    evaluateAllClaims(INITIAL_MOCK_CLAIMS, DEFAULT_POLICY_RULES);
  }, []);

  const handleCreateAndEvaluateClaim = async (newClaim: ClaimData) => {
    setIsEvaluating(true);
    setClaims(prev => [newClaim, ...prev]);
    
    const assessmentResult = await evaluateClaim(newClaim, rules);
    setIsEvaluating(false);

    if (assessmentResult) {
      setSelectedClaimId(newClaim.id);
    }
    setActiveTab('dashboard');
  };

  const handleUpdateRules = (newRules: PolicyRulesConfig) => {
    setRules(newRules);
    // Automatically re-evaluate queue with new rules
    evaluateAllClaims(claims, newRules);
  };

  const handleResetRules = () => {
    setRules(DEFAULT_POLICY_RULES);
    evaluateAllClaims(claims, DEFAULT_POLICY_RULES);
  };

  const handleSaveAdjusterOverride = (
    claimId: string,
    newStatus: ClaimStatus,
    overrideReason: string,
    adjusterNotes: string
  ) => {
    setAssessments(prev => {
      const existing = prev[claimId];
      if (!existing) return prev;

      return {
        ...prev,
        [claimId]: {
          ...existing,
          adjusterNotes,
          humanOverride: {
            overriddenBy: 'Senior Field Adjuster',
            newDecision: newStatus,
            reason: overrideReason,
            timestamp: new Date().toISOString()
          }
        }
      };
    });
  };

  // Compute Header Stats
  const totalClaimsCount = claims.length;
  const evaluatedValues = Object.values(assessments) as ClaimAssessmentResult[];
  
  const approvedCount = evaluatedValues.filter(a => {
    const eff = a.humanOverride ? a.humanOverride.newDecision : a.decision;
    return eff === 'Instant Payout Approved' || eff === 'Approved by Adjuster';
  }).length;

  const escalatedCount = evaluatedValues.filter(a => {
    const eff = a.humanOverride ? a.humanOverride.newDecision : a.decision;
    return eff === 'Escalated to Human Adjuster';
  }).length;

  const avgRiskScore = evaluatedValues.length > 0
    ? Math.round(evaluatedValues.reduce((sum, a) => sum + a.fraudRiskScore, 0) / evaluatedValues.length)
    : 0;

  const selectedClaim = claims.find(c => c.id === selectedClaimId);
  const selectedAssessment = selectedClaimId ? assessments[selectedClaimId] : undefined;

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 flex flex-col">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={{
          total: totalClaimsCount,
          approved: approvedCount,
          escalated: escalatedCount,
          avgRisk: avgRiskScore
        }}
      />

      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <ClaimsList
            claims={claims}
            assessments={assessments}
            onSelectClaim={(claim) => setSelectedClaimId(claim.id)}
            onEvaluateClaim={(claim) => evaluateClaim(claim)}
            onBatchEvaluateAll={() => evaluateAllClaims(claims, rules)}
            isEvaluatingAny={isEvaluating}
          />
        )}

        {activeTab === 'new-claim' && (
          <NewClaimForm
            onSubmitClaim={handleCreateAndEvaluateClaim}
            isEvaluating={isEvaluating}
          />
        )}

        {activeTab === 'rules' && (
          <RulesConfigurator
            rules={rules}
            onUpdateRules={handleUpdateRules}
            onResetRules={handleResetRules}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            claims={claims}
            assessments={assessments}
          />
        )}
      </main>

      {/* Claim Detail / Decision Report Modal */}
      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          assessment={selectedAssessment}
          onClose={() => setSelectedClaimId(null)}
          onSaveOverride={handleSaveAdjusterOverride}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-100 px-6 py-3 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 font-medium border-t border-slate-200 gap-2 shrink-0">
        <div className="flex gap-4">
          <span>Session: Active • Engine: Gemini 3.6 Flash</span>
        </div>
        <div>InsurAI Claims Copilot • Confidential • Internal Use Only</div>
      </footer>
    </div>
  );
}
