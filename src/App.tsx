import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { ClaimData, ClaimAssessmentResult, PolicyRulesConfig, ClaimStatus } from './types';
import { INITIAL_MOCK_CLAIMS, DEFAULT_POLICY_RULES } from './data/mockClaims';
import { Header } from './components/Header';
import { ApiKeyModal } from './components/ApiKeyModal';
import { ClaimsList } from './components/ClaimsList';
import { NewClaimForm } from './components/NewClaimForm';
import { ClaimDetailModal } from './components/ClaimDetailModal';
import { RulesConfigurator } from './components/RulesConfigurator';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { evaluateClaimWithGemini } from './server/geminiEvaluator';

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

  // User API key state - strictly runtime memory (resets on page refresh)
  const [userApiKey, setUserApiKey] = useState<string>('');
  const [keyTestStatus, setKeyTestStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [keyStatusMessage, setKeyStatusMessage] = useState<string | null>(null);

  // Clear legacy stored key on mount to ensure session-only memory
  useEffect(() => {
    localStorage.removeItem('google_aistudio_api_key');
  }, []);

  const handleUserApiKeyChange = (newKey: string) => {
    setUserApiKey(newKey);
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

    if (!key || !key.trim()) {
      setKeyTestStatus('error');
      const errMsg = 'Please enter a Google AI Studio API key in the input field.';
      setKeyStatusMessage(errMsg);
      setEvalError(`Failed to fetch AI evaluation: ${errMsg}`);
      setIsTestingKey(false);
      return false;
    }

    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key })
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setKeyTestStatus('success');
          const successMsg = data.message || 'Gemini 3.6 Flash model fetched and verified successfully!';
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
      } else {
        // If server returned non-JSON HTML (e.g. Vercel static routing 404 HTML fallback), fallback to client-side test
        throw new Error('SERVER_NON_JSON');
      }
    } catch (err: any) {
      // Client-side fallback for Vercel static deployment
      try {
        const ai = new GoogleGenAI({
          apiKey: key,
          httpOptions: {
            headers: { 'User-Agent': 'aistudio-build' }
          }
        });
        const response = await ai.models.generateContent({
          model: 'gemini-3.6-flash',
          contents: 'Ping test',
        });

        if (response.text) {
          setKeyTestStatus('success');
          const successMsg = 'Gemini 3.6 Flash model fetched and verified successfully!';
          setKeyStatusMessage(successMsg);
          setEvalSuccessMessage(successMsg);
          return true;
        } else {
          throw new Error('Empty response from Gemini model');
        }
      } catch (clientErr: any) {
        setKeyTestStatus('error');
        const errMsg = clientErr?.message || 'Failed to fetch key or model response from Gemini API';
        setKeyStatusMessage(errMsg);
        setEvalError(`Failed to fetch AI evaluation: ${errMsg}`);
        return false;
      }
    } finally {
      setIsTestingKey(false);
    }
  };

  // Evaluate single claim via Express backend or client-side fallback
  const evaluateClaim = async (claim: ClaimData, currentRules = rules, overrideApiKey = userApiKey): Promise<ClaimAssessmentResult | null> => {
    if (!overrideApiKey || !overrideApiKey.trim()) {
      setIsApiKeyModalOpen(true);
      setEvalError('Please enter your Google AI Studio API key first to run AI evaluations.');
      return null;
    }

    let assessmentResult: ClaimAssessmentResult | null = null;
    let aiFetched = false;
    let aiErrorMsg = '';

    try {
      const response = await fetch('/api/evaluate-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claim, rules: currentRules, apiKey: overrideApiKey })
      });

      const contentType = response.headers.get('content-type') || '';
      if (response.ok && contentType.includes('application/json')) {
        const data = await response.json();
        if (data.success && data.assessment && data.aiFetched !== false) {
          assessmentResult = data.assessment;
          aiFetched = true;
        } else if (data.assessment) {
          assessmentResult = data.assessment;
          aiErrorMsg = data.message || data.error || 'AI evaluation failed';
        }
      } else {
        // Non-JSON response (e.g. Vercel static hosting fallback) -> proceed to client fallback
        throw new Error('SERVER_NON_JSON');
      }
    } catch (err) {
      // Fallback to client-side evaluation using Gemini SDK directly in the browser
      try {
        const res = await evaluateClaimWithGemini(claim, currentRules, overrideApiKey);
        assessmentResult = res.assessment;
        aiFetched = res.aiFetched;
        if (!res.aiFetched) {
          aiErrorMsg = res.aiError || 'Failed to fetch AI evaluation from Gemini API';
        }
      } catch (fallbackErr: any) {
        aiErrorMsg = fallbackErr?.message || 'Client fallback evaluation error';
      }
    }

    if (assessmentResult) {
      setAssessments(prev => ({
        ...prev,
        [claim.id]: assessmentResult!
      }));
    }

    if (!aiFetched && aiErrorMsg) {
      setEvalError(`Failed to fetch AI evaluation: ${aiErrorMsg}`);
    }

    return aiFetched ? assessmentResult : null;
  };

  // Evaluate all unassessed claims on manual user click
  const evaluateAllClaims = async (claimList = claims, currentRules = rules) => {
    if (!userApiKey || !userApiKey.trim()) {
      setIsApiKeyModalOpen(true);
      setEvalError('Please enter your Google AI Studio API key first to run AI evaluations.');
      return;
    }

    setIsEvaluating(true);
    setEvalError(null);
    setEvalSuccessMessage(null);
    let failedCount = 0;
    let successCount = 0;

    for (let i = 0; i < claimList.length; i++) {
      const claim = claimList[i];
      const result = await evaluateClaim(claim, currentRules, userApiKey);
      if (!result) {
        failedCount++;
      } else {
        successCount++;
      }
      // Add brief delay between consecutive batch requests to respect free-tier RPM rate limits
      if (i < claimList.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 800));
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
    if (userApiKey && userApiKey.trim()) {
      evaluateAllClaims(claims, newRules);
    }
  };

  const handleResetRules = () => {
    setRules(DEFAULT_POLICY_RULES);
    if (userApiKey && userApiKey.trim()) {
      evaluateAllClaims(claims, DEFAULT_POLICY_RULES);
    }
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
