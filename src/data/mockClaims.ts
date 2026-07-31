import { ClaimData, PolicyRulesConfig } from '../types';

export const DEFAULT_POLICY_RULES: PolicyRulesConfig = {
  autoApproveMaxAmount: 2000,
  maxFilingDelayDays: 30,
  maxPriorClaimsThreshold: 2,
  requireEvidenceOverAmount: 1000,
  flagKeywords: [
    'cash', 'unwitnessed', 'friend repair', 'pre-existing', 'expired',
    'stolen without police report', 'vague', 'unknown driver', 'discrepancy'
  ],
};

export const INITIAL_MOCK_CLAIMS: ClaimData[] = [
  {
    id: 'clm-001',
    claimNumber: 'CLM-2026-8812',
    policyNumber: 'POL-AUTO-9482',
    policyholderName: 'Sarah Jenkins',
    policyholderEmail: 'sarah.j@example.com',
    policyType: 'Auto',
    coverageLimit: 50000,
    deductible: 250,
    policyStartDate: '2024-03-15',
    claimantHistoryCount: 0,
    estimatedDamage: 1450,
    incidentDate: '2026-07-28',
    incidentTime: '14:30',
    reportedDate: '2026-07-29',
    location: 'Supermarket Parking Lot, Austin TX',
    incidentDescription: 'Backing out of a parking spot at low speed, hit a concrete pillar damaging the rear passenger bumper and taillight. No third-party involvement.',
    evidenceNotes: 'Attached clear photos showing scuffed bumper plastic and cracked right taillight lens. Body shop estimate provided: $1,450 for OEM bumper cover replacement and painted match.',
    attachments: [
      { id: 'att-1', fileName: 'rear_bumper_damage.jpg', fileType: 'image/jpeg', description: 'Photo of cracked taillight and scratched bumper' },
      { id: 'att-2', fileName: 'repair_estimate_austin_auto.pdf', fileType: 'application/pdf', description: 'Itemized body shop repair quote ($1,450)' }
    ],
    createdAt: '2026-07-29T10:15:00Z'
  },
  {
    id: 'clm-002',
    claimNumber: 'CLM-2026-4401',
    policyNumber: 'POL-HOME-1209',
    policyholderName: 'Marcus Vance',
    policyholderEmail: 'm.vance@example.com',
    policyType: 'Home',
    coverageLimit: 350000,
    deductible: 1000,
    policyStartDate: '2025-01-10',
    claimantHistoryCount: 1,
    estimatedDamage: 14200,
    incidentDate: '2026-07-20',
    incidentTime: '03:15',
    reportedDate: '2026-07-21',
    location: 'Primary Residence, Seattle WA',
    incidentDescription: 'Burst water pipe under kitchen sink overnight while sleeping. Flooded kitchen hardwood floor, cabinetry, and seeped into basement ceiling below.',
    evidenceNotes: 'Plumber receipt for emergency shutoff valve replacement ($350). Remediation service quote for moisture drying and cabinet restoration ($13,850). Photos show buckled flooring.',
    attachments: [
      { id: 'att-3', fileName: 'kitchen_water_damage.png', fileType: 'image/png', description: 'Buckled hardwood flooring in kitchen' },
      { id: 'att-4', fileName: 'emergency_plumbing_invoice.pdf', fileType: 'application/pdf', description: 'Plumbing invoice for valve repair' },
      { id: 'att-5', fileName: 'restoration_quote.pdf', fileType: 'application/pdf', description: 'Dryout and floor quote ($13,850)' }
    ],
    createdAt: '2026-07-21T08:45:00Z'
  },
  {
    id: 'clm-003',
    claimNumber: 'CLM-2026-9913',
    policyNumber: 'POL-TRAV-7721',
    policyholderName: 'Elena Rostova',
    policyholderEmail: 'elena.r@example.com',
    policyType: 'Travel',
    coverageLimit: 5000,
    deductible: 50,
    policyStartDate: '2026-06-01',
    claimantHistoryCount: 3,
    estimatedDamage: 1850,
    incidentDate: '2026-06-10',
    incidentTime: '18:00',
    reportedDate: '2026-07-28',
    location: 'Airport Luggage Carousel, Rome Italy',
    incidentDescription: 'Claimant states designer handbag containing cash and electronics was stolen from luggage carousel 48 days ago during European vacation.',
    evidenceNotes: 'No police report filed in Italy. Single handwritten note provided describing missing items. Filed claim 48 days after alleged incident date.',
    attachments: [
      { id: 'att-6', fileName: 'item_description_list.txt', fileType: 'text/plain', description: 'Handwritten list of designer items' }
    ],
    createdAt: '2026-07-28T16:20:00Z'
  },
  {
    id: 'clm-004',
    claimNumber: 'CLM-2026-1104',
    policyNumber: 'POL-COMM-3321',
    policyholderName: 'Apex Bakery LLC (Manager: David Chen)',
    policyholderEmail: 'd.chen@apexbakery.com',
    policyType: 'Commercial',
    coverageLimit: 100000,
    deductible: 500,
    policyStartDate: '2023-09-01',
    claimantHistoryCount: 0,
    estimatedDamage: 850,
    incidentDate: '2026-07-27',
    incidentTime: '06:00',
    reportedDate: '2026-07-27',
    location: 'Storefront Bakery, Chicago IL',
    incidentDescription: 'Storefront glass window cracked by stray debris during municipal street power washing. Window replaced immediately to secure store.',
    evidenceNotes: 'Glass replacement receipt ($850) from Chicago Commercial Glass Co. Photo showing cracked outer pane and city maintenance work notice.',
    attachments: [
      { id: 'att-7', fileName: 'window_crack_photo.jpg', fileType: 'image/jpeg', description: 'Photo of cracked storefront window' },
      { id: 'att-8', fileName: 'glass_company_receipt.pdf', fileType: 'application/pdf', description: 'Paid receipt for $850 glass replacement' }
    ],
    createdAt: '2026-07-27T11:00:00Z'
  },
  {
    id: 'clm-005',
    claimNumber: 'CLM-2026-5509',
    policyNumber: 'POL-HEALTH-601',
    policyholderName: 'Jonathan Rivera',
    policyholderEmail: 'j.rivera@example.com',
    policyType: 'Health',
    coverageLimit: 25000,
    deductible: 200,
    policyStartDate: '2025-05-20',
    claimantHistoryCount: 1,
    estimatedDamage: 1620,
    incidentDate: '2026-07-25',
    incidentTime: '20:00',
    reportedDate: '2026-07-26',
    location: 'Urgent Care Center, Denver CO',
    incidentDescription: 'Emergency outpatient treatment for sprained ankle and X-rays following fall during recreational hiking.',
    evidenceNotes: 'Itemized urgent care medical bill ($1,620) with standard CPT diagnostic codes and discharge instructions.',
    attachments: [
      { id: 'att-9', fileName: 'urgent_care_itemized_bill.pdf', fileType: 'application/pdf', description: 'Itemized hospital statement and X-ray records' }
    ],
    createdAt: '2026-07-26T09:30:00Z'
  }
];
