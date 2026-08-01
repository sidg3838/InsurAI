import React, { useState, useEffect } from 'react';
import { ClaimData, ClaimAssessmentResult, PolicyRulesConfig, ClaimStatus } from './types';
import { INITIAL_MOCK_CLAIMS, DEFAULT_POLICY_RULES } from './data/mockClaims';
import { Header } from './components/Header';
import { ApiKeyModal } from './components/ApiKeyModal';
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
  const [evalError, setEvalError] = useState<string | null>(null);
  const [evalSuccessMessage, setEvalSuccessMessage] = useState<string | null>(null);
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState<boolean>(false);

  // User API key state with localStorage persistence
  const [userApiKey, setUserApiKey] = useState<string>(() => {
    return localStorage.getItem('google_aistudio_api_key') || '';
  });
  const [keyTestStatus, setKeyTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [keyStatusMessage, setKeyStatusMessage] = useState<string | null>(null);

  const handleUserApiKeyChange = (newKey: string) => {
    setUserApiKey(newKey);
    localStorage.setItem('google_aistudio_api_key', newKey);
    setKeyTestStatus('idle');
    setKeyStatusMessage(null);
  };

  const handleTestApiKey = async (keyToTest?: string): Promise<boolean> => {
    const key = keyToTest !== undefined ? keyToTest : userApiKey;
    setIsTestingKey(true);
    setKeyTestStatus('idle');
    setKeyStatusMessage(null);
    setEvalError(null);
    setEvalSuccessMessage(null);

    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setKeyTestStatus('success');
        const successMsg = data.message || 'Gemini 3.6 Flash API Key & Model verified successfully!';
        setKeyStatusMessage(successMsg);
        setEvalSuccessMessage(successMsg);
        return true;
      } else {
        setKeyTestStatus('error');
        const errMsg = data.message || data.error || 'Failed to fetch AI evaluation key or model from Gemini API.';
        setKeyStatusMessage(errMsg);
        setEvalError(`Failed to fetch AI evaluation: ${errMsg}`);
        return false;
      }
    } catch (err: any) {
      setKeyTestStatus('error');
      const errMsg = `Failed to fetch AI evaluation: ${err?.message || 'Network error connecting to API'}`;
      setKeyStatusMessage(errMsg);
      setEvalError(errMsg);
      return false;
    } finally {
      setIsTestingKey(false);
    }
  };

  // Evaluate single claim via Express backend
  const evaluateClaim = async (claim: ClaimData, currentRules = rules, overrideApiKey = userApiKey): Promise<ClaimAssessmentResult | null> => {
    try {
      const response = await fetch('/api/evaluate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, rules: currentRules, apiKey: overrideApiKey })
      });

      const data = await response.json();

      if (!response.ok || !data.success || data.aiFetched === false) {
        const errMsg = data.message || data.error || `Server returned ${response.status}`;
        setEvalError(`Failed to fetch AI evaluation: ${errMsg}`);
        if (data.assessment) {
          setAssessments(prev => ({
            ...prev,
            [claim.id]: data.assessment
          }));
        }
        return null;
      }

      if (data.success && data.assessment) {
        setAssessments(prev => ({
          ...prev,
          [claim.id]: data.assessment
        }));
        return data.assessment;
      }
    } catch (err: any) {
      console.error('Failed to evaluate claim via API:', err);
      setEvalError(`Failed to fetch AI evaluation: ${err?.message || 'Network request failed'}`);
    }
    return null;
  };

  // Evaluate all unassessed claims on initial load or on batch click
  const evaluateAllClaims = async (claimList = claims, currentRules = rules) => {
    setIsEvaluating(true);
    setEvalError(null);
    setEvalSuccessMessage(null);
    let failedCount = 0;
    let successCount = 0;

    for (const claim of claimList) {
      const result = await evaluateClaim(claim, currentRules);
      if (!result) {
        failedCount++;
      } else {
        successCount++;
      }
    }
    setIsEvaluating(false);

    if (failedCount > 0 && successCount === 0) {
      setEvalError('Failed to fetch AI evaluation for queue. Unable to fetch key or model response from Gemini API.');
    } else if (failedCount > 0) {
      setEvalError(`Failed to fetch AI evaluation for ${failedCount} claim(s). Successfully processed ${successCount}.`);
    } else if (successCount > 0) {
      setEvalSuccessMessage(`AI evaluation completed successfully for all ${successCount} claim(s) via Gemini 3.6 Flash!`);
    }
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

      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        apiKey={userApiKey}
        onChangeApiKey={handleUserApiKeyChange}
        onTestApiKey={handleTestApiKey}
        isTestingKey={isTestingKey}
        testStatus={keyTestStatus}
        statusMessage={keyStatusMessage}
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
            evalError={evalError}
            evalSuccessMessage={evalSuccessMessage}
            onClearEvalMessages={() => { setEvalError(null); setEvalSuccessMessage(null); }}
            onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
            isTestingKey={isTestingKey}
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
