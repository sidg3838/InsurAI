import { GoogleGenAI, Type } from '@google/genai';
import { ClaimData, ClaimAssessmentResult, PolicyRulesConfig, FlaggedAnomaly, RuleCheck, FraudRiskLevel } from '../types';

export function evaluateDeterministicRules(claim: ClaimData, rules: PolicyRulesConfig): {
  ruleBreakdown: RuleCheck[];
  deterministicFlags: FlaggedAnomaly[];
  deterministicFailed: boolean;
} {
  const ruleBreakdown: RuleCheck[] = [];
  const deterministicFlags: FlaggedAnomaly[] = [];
  let deterministicFailed = false;

  // 1. Amount Threshold Rule ($2,000)
  const isAmountApproved = claim.estimatedDamage <= rules.autoApproveMaxAmount;
  ruleBreakdown.push({
    ruleName: `Amount Threshold (<= $${rules.autoApproveMaxAmount.toLocaleString()})`,
    passed: isAmountApproved,
    detail: isAmountApproved 
      ? `Claim amount ($${claim.estimatedDamage.toLocaleString()}) is within instant payout limit of $${rules.autoApproveMaxAmount.toLocaleString()}.`
      : `Claim amount ($${claim.estimatedDamage.toLocaleString()}) exceeds the instant auto-approval limit of $${rules.autoApproveMaxAmount.toLocaleString()}. High value claims require human adjuster review.`
  });
  if (!isAmountApproved) {
    deterministicFailed = true;
    deterministicFlags.push({
      code: 'HIGH_DAMAGE_AMOUNT',
      label: 'High Claim Value',
      severity: 'medium',
      description: `Claim amount of $${claim.estimatedDamage.toLocaleString()} exceeds automatic $${rules.autoApproveMaxAmount.toLocaleString()} threshold.`
    });
  }

  // 2. Timeline Delay Check
  const incidentTs = new Date(claim.incidentDate).getTime();
  const reportedTs = new Date(claim.reportedDate).getTime();
  const diffDays = Math.max(0, Math.floor((reportedTs - incidentTs) / (1000 * 60 * 60 * 24)));
  
  const isTimelineValid = diffDays <= rules.maxFilingDelayDays;
  ruleBreakdown.push({
    ruleName: `Filing Timeline (<= ${rules.maxFilingDelayDays} days delay)`,
    passed: isTimelineValid,
    detail: isTimelineValid
      ? `Reported ${diffDays} day(s) post-incident, well within acceptable filing window (${rules.maxFilingDelayDays} days).`
      : `Filing delayed by ${diffDays} days post-incident, exceeding maximum ${rules.maxFilingDelayDays}-day threshold. Delayed filing correlates with increased risk.`
  });
  if (!isTimelineValid) {
    deterministicFailed = true;
    deterministicFlags.push({
      code: 'TIMELINE_DELAY_ANOMALY',
      label: 'Delayed Claim Filing',
      severity: 'high',
      description: `Reported ${diffDays} days after incident occurred (limit is ${rules.maxFilingDelayDays} days).`
    });
  }

  // 3. Prior Claims History Check
  const isHistoryClean = claim.claimantHistoryCount <= rules.maxPriorClaimsThreshold;
  ruleBreakdown.push({
    ruleName: `Claimant History (<= ${rules.maxPriorClaimsThreshold} prior claims)`,
    passed: isHistoryClean,
    detail: isHistoryClean
      ? `Claimant has ${claim.claimantHistoryCount} prior claim(s) in past 24 months.`
      : `Claimant has ${claim.claimantHistoryCount} prior claims in 24 months, exceeding threshold of ${rules.maxPriorClaimsThreshold}. Frequent claimant profile flagged.`
  });
  if (!isHistoryClean) {
    deterministicFailed = true;
    deterministicFlags.push({
      code: 'HIGH_CLAIM_FREQUENCY',
      label: 'Frequent Claimant Profile',
      severity: 'medium',
      description: `${claim.claimantHistoryCount} claims submitted in recent history.`
    });
  }

  // 4. Required Documentation Check
  const requiresDoc = claim.estimatedDamage >= rules.requireEvidenceOverAmount;
  const hasDoc = (claim.evidenceNotes && claim.evidenceNotes.trim().length > 15) || (claim.attachments && claim.attachments.length > 0);
  const isDocPassed = !requiresDoc || hasDoc;

  ruleBreakdown.push({
    ruleName: `Evidence & Documentation Verification`,
    passed: isDocPassed,
    detail: isDocPassed
      ? `Sufficient evidence notes or attachment proofs provided.`
      : `Claims over $${rules.requireEvidenceOverAmount} require itemized repair quotes, photos, or invoices.`
  });
  if (!isDocPassed) {
    deterministicFailed = true;
    deterministicFlags.push({
      code: 'MISSING_EVIDENCE_DOCS',
      label: 'Insufficient Evidence Documentation',
      severity: 'medium',
      description: `Missing required photo or repair document verification for claim > $${rules.requireEvidenceOverAmount}.`
    });
  }

  // 5. Red Flag Keyword Scan
  const textToScan = `${claim.incidentDescription} ${claim.evidenceNotes}`.toLowerCase();
  const matchedKeywords = rules.flagKeywords.filter(kw => textToScan.includes(kw.toLowerCase()));
  const isKeywordClean = matchedKeywords.length === 0;

  ruleBreakdown.push({
    ruleName: `Suspicious Pattern Keyword Scan`,
    passed: isKeywordClean,
    detail: isKeywordClean
      ? `No red-flag phrases or suspicious indicators detected in narrative text.`
      : `Detected high-risk key phrases: ${matchedKeywords.join(', ')}.`
  });
  if (!isKeywordClean) {
    deterministicFailed = true;
    deterministicFlags.push({
      code: 'SUSPICIOUS_KEYWORD_MATCH',
      label: 'Red Flag Phrase Indicator',
      severity: 'high',
      description: `Matched high-risk keywords: ${matchedKeywords.join(', ')}.`
    });
  }

  return { ruleBreakdown, deterministicFlags, deterministicFailed };
}

export async function evaluateClaimWithGemini(
  claim: ClaimData,
  rules: PolicyRulesConfig,
  apiKey?: string
): Promise<{ assessment: ClaimAssessmentResult; aiFetched: boolean; aiError?: string }> {
  const { ruleBreakdown, deterministicFlags, deterministicFailed } = evaluateDeterministicRules(claim, rules);

  let aiAssessmentPartial: {
    summary?: string;
    riskLevel?: FraudRiskLevel;
    riskScore?: number;
    aiAnomalies?: FlaggedAnomaly[];
    aiDecisionReason?: string;
    customerNextSteps?: string[];
    adjusterNextSteps?: string[];
  } = {};

  let aiFetched = false;
  let aiError: string | undefined;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const prompt = `
Evaluated Claim Input:
- Claim Number: ${claim.claimNumber}
- Policy Number: ${claim.policyNumber}
- Policy Type: ${claim.policyType}
- Policyholder: ${claim.policyholderName}
- Estimated Damage: $${claim.estimatedDamage}
- Incident Date & Time: ${claim.incidentDate} at ${claim.incidentTime}
- Date Reported: ${claim.reportedDate}
- Location: ${claim.location}
- Deductible: $${claim.deductible}
- Prior Claims History: ${claim.claimantHistoryCount} prior claims
- Incident Description: "${claim.incidentDescription}"
- Evidence & Notes: "${claim.evidenceNotes}"
- Attachments List: ${claim.attachments.map(a => `${a.fileName} (${a.description})`).join('; ') || 'None'}

Deterministic Pre-checks:
- Failed standard rules? ${deterministicFailed ? 'YES' : 'NO'}
- Existing rule flags: ${deterministicFlags.map(f => f.label).join(', ') || 'None'}

InsurAI Policy Directives:
1. Claims UNDER $2,000 with LOW fraud risk and clean evidence MUST be AUTOMATICALLY APPROVED (Instant Payout Approved).
2. Claims OVER $2,000, OR claims with inconsistent timelines (e.g. late reporting), OR suspicious descriptions/evidence, OR high prior claim counts MUST be FLAGGED FOR HUMAN ADJUSTER REVIEW (Escalated to Human Adjuster).

Perform an in-depth analytical assessment. Identify any narrative discrepancies, timing inconsistencies, plausible physical damage causes, and fraud indicators.
Return JSON with structure matching:
{
  "summary": "Concise 2-3 sentence claim assessment summary",
  "riskLevel": "Low" | "Medium" | "High",
  "riskScore": number 0 to 100,
  "aiAnomalies": [
    {
      "code": "STRING_CODE",
      "label": "Short Title",
      "severity": "low" | "medium" | "high",
      "description": "Explanation of anomaly"
    }
  ],
  "aiDecisionReason": "Comprehensive explanation of why this claim was approved instantly or escalated to human adjuster based on policy parameters and risk factors.",
  "customerNextSteps": ["Step 1", "Step 2"],
  "adjusterNextSteps": ["Step 1", "Step 2"]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction: `You are InsurAI Claims Copilot, an expert AI insurance fraud investigator and automated claims triage system. Always return strictly valid JSON.`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
              riskLevel: { type: Type.STRING, enum: ['Low', 'Medium', 'High'] },
              riskScore: { type: Type.INTEGER },
              aiAnomalies: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    code: { type: Type.STRING },
                    label: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ['low', 'medium', 'high'] },
                    description: { type: Type.STRING }
                  },
                  required: ['code', 'label', 'severity', 'description']
                }
              },
              aiDecisionReason: { type: Type.STRING },
              customerNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              adjusterNextSteps: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ['summary', 'riskLevel', 'riskScore', 'aiAnomalies', 'aiDecisionReason', 'customerNextSteps', 'adjusterNextSteps']
          }
        }
      });

      if (response.text) {
        aiAssessmentPartial = JSON.parse(response.text.trim());
        aiFetched = true;
      }
    } catch (err: any) {
      console.error('Gemini API call error in claim evaluator:', err);
      aiFetched = false;
      aiError = err?.message || 'Failed to communicate with Gemini API / model';
    }
  } else {
    aiFetched = false;
    aiError = 'GEMINI_API_KEY environment variable is not configured';
  }

  // Combine Deterministic Rules & AI Response
  const combinedAnomalies: FlaggedAnomaly[] = [...deterministicFlags];
  if (aiAssessmentPartial.aiAnomalies && Array.isArray(aiAssessmentPartial.aiAnomalies)) {
    for (const aiAnom of aiAssessmentPartial.aiAnomalies) {
      if (!combinedAnomalies.some(existing => existing.code === aiAnom.code || existing.label === aiAnom.label)) {
        combinedAnomalies.push(aiAnom);
      }
    }
  }

  // Determine final fraud risk level and score
  let fraudRiskLevel: FraudRiskLevel = aiAssessmentPartial.riskLevel || 'Low';
  let fraudRiskScore = aiAssessmentPartial.riskScore ?? 15;

  if (combinedAnomalies.some(a => a.severity === 'high') || deterministicFailed) {
    if (fraudRiskLevel === 'Low') fraudRiskLevel = 'Medium';
    if (combinedAnomalies.some(a => a.severity === 'high')) fraudRiskLevel = 'High';
    if (fraudRiskScore < 50) fraudRiskScore = Math.min(88, fraudRiskScore + 40);
  }

  // Enforce rigid policy decision rules:
  // Must be under $2000 AND low risk AND no deterministic failures for Instant Payout Approved.
  const isOverAmountLimit = claim.estimatedDamage > rules.autoApproveMaxAmount;
  const isHighOrMedRisk = fraudRiskLevel !== 'Low';

  let finalDecision: 'Instant Payout Approved' | 'Escalated to Human Adjuster';
  if (isOverAmountLimit || isHighOrMedRisk || deterministicFailed) {
    finalDecision = 'Escalated to Human Adjuster';
  } else {
    finalDecision = 'Instant Payout Approved';
  }

  let finalReason = aiAssessmentPartial.aiDecisionReason || '';
  if (!finalReason) {
    if (finalDecision === 'Instant Payout Approved') {
      finalReason = `Claim amount of $${claim.estimatedDamage.toLocaleString()} is below the $${rules.autoApproveMaxAmount.toLocaleString()} threshold with no detected fraud risk indicators or timeline anomalies. Automatically approved for instant payout.`;
    } else {
      const reasonsList: string[] = [];
      if (isOverAmountLimit) reasonsList.push(`Claim estimated damage ($${claim.estimatedDamage.toLocaleString()}) exceeds automatic payout limit ($${rules.autoApproveMaxAmount.toLocaleString()}).`);
      if (deterministicFailed) reasonsList.push(`One or more core policy rules failed validation.`);
      if (combinedAnomalies.length > 0) reasonsList.push(`Detected ${combinedAnomalies.length} risk/anomaly indicator(s).`);
      finalReason = `Escalated for human adjuster verification: ${reasonsList.join(' ')}`;
    }
  }

  const defaultCustSteps = finalDecision === 'Instant Payout Approved'
    ? [
        `Direct deposit payout of $${Math.max(0, claim.estimatedDamage - claim.deductible).toLocaleString()} (Estimated $${claim.estimatedDamage} less $${claim.deductible} deductible) initiated.`,
        'Track payment status in your InsurAI Policyholder Portal.',
        'Keep original receipts and photo documentation on file for 180 days.'
      ]
    : [
        'Your claim has been assigned to a Senior Claims Adjuster for priority review.',
        'An adjuster will contact you within 1 business day if additional photo proof or receipts are needed.',
        'You can upload additional repair documents directly in your portal at any time.'
      ];

  const defaultAdjSteps = finalDecision === 'Instant Payout Approved'
    ? [
        'No manual action required. Claim processed automatically via InsurAI Auto-Approval Workflow.',
        'Archived in audit ledger under Rule ID #AUTO-APPV-2000.'
      ]
    : [
        'Review flagged timeline and damage estimate breakdown.',
        'Verify independent repair shop quote or schedule on-site physical damage assessment.',
        'Cross-check prior claim history for repeat patterns or duplicate item submissions.'
      ];

  return {
    assessment: {
      claimId: claim.id,
      assessmentSummary: aiAssessmentPartial.summary || `Claim #${claim.claimNumber} evaluated for ${claim.policyholderName} (${claim.policyType} Policy). Estimated damage $${claim.estimatedDamage.toLocaleString()}.`,
      fraudRiskLevel,
      fraudRiskScore,
      flaggedAnomalies: combinedAnomalies,
      decision: finalDecision,
      decisionReason: finalReason,
      ruleBreakdown,
      customerNextSteps: aiAssessmentPartial.customerNextSteps && aiAssessmentPartial.customerNextSteps.length > 0 
        ? aiAssessmentPartial.customerNextSteps 
        : defaultCustSteps,
      adjusterNextSteps: aiAssessmentPartial.adjusterNextSteps && aiAssessmentPartial.adjusterNextSteps.length > 0 
        ? aiAssessmentPartial.adjusterNextSteps 
        : defaultAdjSteps,
      evaluatedAt: new Date().toISOString(),
      aiModelUsed: (apiKey && aiFetched) ? 'Gemini 3.6 Flash (InsurAI Copilot)' : 'InsurAI Policy Rule Engine'
    },
    aiFetched,
    aiError
  };
}
