export type PolicyType = 'Auto' | 'Home' | 'Commercial' | 'Health' | 'Travel' | 'Cyber';

export type ClaimStatus = 
  | 'Instant Payout Approved'
  | 'Escalated to Human Adjuster'
  | 'Approved by Adjuster'
  | 'Rejected by Adjuster';

export type FraudRiskLevel = 'Low' | 'Medium' | 'High';

export interface AttachmentDetail {
  id: string;
  fileName: string;
  fileType: string;
  description: string;
}

export interface ClaimData {
  id: string;
  claimNumber: string;
  policyNumber: string;
  policyholderName: string;
  policyholderEmail: string;
  policyType: PolicyType;
  coverageLimit: number;
  deductible: number;
  policyStartDate: string;
  claimantHistoryCount: number; // Claims submitted in past 24 months
  estimatedDamage: number;
  incidentDate: string;
  incidentTime: string;
  reportedDate: string;
  location: string;
  incidentDescription: string;
  evidenceNotes: string;
  attachments: AttachmentDetail[];
  status?: ClaimStatus;
  createdAt: string;
}

export interface FlaggedAnomaly {
  code: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface RuleCheck {
  ruleName: string;
  passed: boolean;
  detail: string;
}

export interface ClaimAssessmentResult {
  claimId: string;
  assessmentSummary: string;
  fraudRiskLevel: FraudRiskLevel;
  fraudRiskScore: number; // 0 to 100
  flaggedAnomalies: FlaggedAnomaly[];
  decision: 'Instant Payout Approved' | 'Escalated to Human Adjuster';
  decisionReason: string;
  ruleBreakdown: RuleCheck[];
  customerNextSteps: string[];
  adjusterNextSteps: string[];
  evaluatedAt: string;
  aiModelUsed: string;
  adjusterNotes?: string;
  humanOverride?: {
    overriddenBy: string;
    newDecision: ClaimStatus;
    reason: string;
    timestamp: string;
  };
}

export interface PolicyRulesConfig {
  autoApproveMaxAmount: number;
  maxFilingDelayDays: number;
  maxPriorClaimsThreshold: number;
  requireEvidenceOverAmount: number;
  flagKeywords: string[];
}
