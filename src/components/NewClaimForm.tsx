import React, { useState } from 'react';
import { ClaimData, PolicyType } from '../types';
import { Sparkles, Zap, AlertCircle, FilePlus, Calendar, DollarSign, User, Shield, Info, Image, Upload } from 'lucide-react';

interface NewClaimFormProps {
  onSubmitClaim: (claim: ClaimData) => void;
  isEvaluating: boolean;
}

export const NewClaimForm: React.FC<NewClaimFormProps> = ({ onSubmitClaim, isEvaluating }) => {
  const [policyType, setPolicyType] = useState<PolicyType>('Auto');
  const [policyholderName, setPolicyholderName] = useState('Sarah Jenkins');
  const [policyholderEmail, setPolicyholderEmail] = useState('sarah.j@example.com');
  const [policyNumber, setPolicyNumber] = useState(`POL-${policyType.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
  const [coverageLimit, setCoverageLimit] = useState<number>(50000);
  const [deductible, setDeductible] = useState<number>(250);
  const [claimantHistoryCount, setClaimantHistoryCount] = useState<number>(0);
  const [estimatedDamage, setEstimatedDamage] = useState<number>(1450);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const [incidentDate, setIncidentDate] = useState('2026-07-28');
  const [incidentTime, setIncidentTime] = useState('14:30');
  const [reportedDate, setReportedDate] = useState(todayStr);
  const [location, setLocation] = useState('Supermarket Parking Lot, Austin TX');
  const [incidentDescription, setIncidentDescription] = useState(
    'Backing out of a parking spot at low speed, hit a concrete pillar damaging the rear passenger bumper and taillight. No third-party involvement.'
  );
  const [evidenceNotes, setEvidenceNotes] = useState(
    'Attached clear photos showing scuffed bumper plastic and cracked right taillight lens. Body shop estimate provided: $1,450 for OEM bumper cover replacement and painted match.'
  );

  const loadPresetScenario = (scenarioKey: 'instant-auto' | 'high-home' | 'suspicious-travel' | 'instant-commercial') => {
    if (scenarioKey === 'instant-auto') {
      setPolicyType('Auto');
      setPolicyholderName('Sarah Jenkins');
      setPolicyholderEmail('sarah.j@example.com');
      setPolicyNumber('POL-AUTO-9482');
      setCoverageLimit(50000);
      setDeductible(250);
      setClaimantHistoryCount(0);
      setEstimatedDamage(1450);
      setIncidentDate('2026-07-28');
      setIncidentTime('14:30');
      setReportedDate('2026-07-29');
      setLocation('Supermarket Parking Lot, Austin TX');
      setIncidentDescription('Backing out of a parking spot at low speed, hit a concrete pillar damaging the rear passenger bumper and taillight. No third-party involvement.');
      setEvidenceNotes('Attached clear photos showing scuffed bumper plastic and cracked right taillight lens. Body shop estimate provided: $1,450 for OEM bumper cover replacement and painted match.');
    } else if (scenarioKey === 'high-home') {
      setPolicyType('Home');
      setPolicyholderName('Marcus Vance');
      setPolicyholderEmail('m.vance@example.com');
      setPolicyNumber('POL-HOME-1209');
      setCoverageLimit(350000);
      setDeductible(1000);
      setClaimantHistoryCount(1);
      setEstimatedDamage(14200);
      setIncidentDate('2026-07-20');
      setIncidentTime('03:15');
      setReportedDate('2026-07-21');
      setLocation('Primary Residence, Seattle WA');
      setIncidentDescription('Burst water pipe under kitchen sink overnight while sleeping. Flooded kitchen hardwood floor, cabinetry, and seeped into basement ceiling below.');
      setEvidenceNotes('Plumber receipt for emergency shutoff valve replacement ($350). Remediation service quote for moisture drying and cabinet restoration ($13,850). Photos show buckled flooring.');
    } else if (scenarioKey === 'suspicious-travel') {
      setPolicyType('Travel');
      setPolicyholderName('Elena Rostova');
      setPolicyholderEmail('elena.r@example.com');
      setPolicyNumber('POL-TRAV-7721');
      setCoverageLimit(5000);
      setDeductible(50);
      setClaimantHistoryCount(3);
      setEstimatedDamage(1850);
      setIncidentDate('2026-06-10');
      setIncidentTime('18:00');
      setReportedDate('2026-07-28');
      setLocation('Airport Luggage Carousel, Rome Italy');
      setIncidentDescription('Claimant states designer handbag containing cash and electronics was stolen from luggage carousel 48 days ago during European vacation.');
      setEvidenceNotes('No police report filed in Italy. Single handwritten note provided describing missing items. Filed claim 48 days after alleged incident date without receipts.');
    } else if (scenarioKey === 'instant-commercial') {
      setPolicyType('Commercial');
      setPolicyholderName('Apex Bakery LLC (David Chen)');
      setPolicyholderEmail('d.chen@apexbakery.com');
      setPolicyNumber('POL-COMM-3321');
      setCoverageLimit(100000);
      setDeductible(500);
      setClaimantHistoryCount(0);
      setEstimatedDamage(850);
      setIncidentDate('2026-07-27');
      setIncidentTime('06:00');
      setReportedDate('2026-07-27');
      setLocation('Storefront Bakery, Chicago IL');
      setIncidentDescription('Storefront glass window cracked by stray debris during municipal street power washing. Window replaced immediately to secure store.');
      setEvidenceNotes('Glass replacement receipt ($850) from Chicago Commercial Glass Co. Photo showing cracked outer pane and city maintenance work notice.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newClaim: ClaimData = {
      id: `clm-${Date.now()}`,
      claimNumber: `CLM-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      policyNumber: policyNumber || `POL-${policyType.toUpperCase()}-0000`,
      policyholderName,
      policyholderEmail,
      policyType,
      coverageLimit: Number(coverageLimit) || 10000,
      deductible: Number(deductible) || 250,
      policyStartDate: '2024-01-01',
      claimantHistoryCount: Number(claimantHistoryCount) || 0,
      estimatedDamage: Number(estimatedDamage) || 0,
      incidentDate,
      incidentTime,
      reportedDate,
      location,
      incidentDescription,
      evidenceNotes,
      attachments: [
        {
          id: `att-${Date.now()}`,
          fileName: 'evidence_documentation_photo.jpg',
          fileType: 'image/jpeg',
          description: evidenceNotes.slice(0, 80)
        }
      ],
      createdAt: new Date().toISOString()
    };

    onSubmitClaim(newClaim);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Form Header */}
      <div className="bg-white px-6 py-5 border-b border-slate-200 text-slate-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="text-lg font-bold text-slate-900">New Claim Evaluation Intake</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enter policyholder claim details or pick a pre-loaded test case to run real-time InsurAI assessment.
          </p>
        </div>

        {/* Quick Test Preset Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Test Scenarios:</span>
          <button
            type="button"
            onClick={() => loadPresetScenario('instant-auto')}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold transition"
          >
            Auto ($1,450) [Auto-Approve]
          </button>
          <button
            type="button"
            onClick={() => loadPresetScenario('high-home')}
            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold transition"
          >
            Home ($14,200) [High Amount]
          </button>
          <button
            type="button"
            onClick={() => loadPresetScenario('suspicious-travel')}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold transition"
          >
            Travel ($1,850) [Late/Flagged]
          </button>
          <button
            type="button"
            onClick={() => loadPresetScenario('instant-commercial')}
            className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-semibold transition"
          >
            Commercial ($850) [Glass]
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Policy & Claimant Info */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center space-x-2 border-b pb-2 border-slate-200">
            <User className="w-4 h-4 text-blue-600" />
            <span>Policy & Claimant Details</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Policy Type</label>
              <select
                value={policyType}
                onChange={(e) => {
                  const newType = e.target.value as PolicyType;
                  setPolicyType(newType);
                  setPolicyNumber(`POL-${newType.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`);
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Auto">Auto Policy</option>
                <option value="Home">Home & Property</option>
                <option value="Commercial">Commercial Business</option>
                <option value="Health">Health & Medical</option>
                <option value="Travel">Travel & Luggage</option>
                <option value="Cyber">Cyber Liability</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Policyholder Name</label>
              <input
                type="text"
                required
                value={policyholderName}
                onChange={(e) => setPolicyholderName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Policyholder Email</label>
              <input
                type="email"
                required
                value={policyholderEmail}
                onChange={(e) => setPolicyholderEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Policy Number</label>
              <input
                type="text"
                required
                value={policyNumber}
                onChange={(e) => setPolicyNumber(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Coverage Limit ($)</label>
              <input
                type="number"
                min={1000}
                required
                value={coverageLimit}
                onChange={(e) => setCoverageLimit(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Deductible ($)</label>
              <input
                type="number"
                min={0}
                required
                value={deductible}
                onChange={(e) => setDeductible(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Prior Claims in Past 24 Months</label>
              <select
                value={claimantHistoryCount}
                onChange={(e) => setClaimantHistoryCount(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={0}>0 Prior Claims (Clean History)</option>
                <option value={1}>1 Prior Claim</option>
                <option value={2}>2 Prior Claims (Threshold Limit)</option>
                <option value={3}>3 Prior Claims (High Frequency)</option>
                <option value={4}>4+ Prior Claims (Repeated History)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Claim Financials & Incident Timeline */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center space-x-2 border-b pb-2 border-slate-200">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Claim Value & Incident Timeline</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
              <label className="block text-xs font-bold text-blue-900 mb-1">
                Estimated Damage ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  min={1}
                  required
                  value={estimatedDamage}
                  onChange={(e) => setEstimatedDamage(Number(e.target.value))}
                  className="w-full rounded-lg border border-blue-300 bg-white pl-8 pr-3 py-2 text-base font-bold text-blue-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              <p className="text-[11px] text-blue-700 mt-1">
                {estimatedDamage <= 2000 ? (
                  <span className="text-emerald-700 font-semibold flex items-center">
                    ✓ Within $2,000 instant payout threshold
                  </span>
                ) : (
                  <span className="text-amber-700 font-semibold flex items-center">
                    ⚠ Exceeds $2,000 auto-approval limit
                  </span>
                )}
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Incident Date</label>
              <input
                type="date"
                required
                value={incidentDate}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Incident Time</label>
              <input
                type="time"
                required
                value={incidentTime}
                onChange={(e) => setIncidentTime(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Date Reported</label>
              <input
                type="date"
                required
                value={reportedDate}
                onChange={(e) => setReportedDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-700 mb-1">Incident Location</label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Address, Landmark, or City"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Narrative & Attached Evidence */}
        <div>
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide flex items-center space-x-2 border-b pb-2 border-slate-200">
            <FilePlus className="w-4 h-4 text-indigo-600" />
            <span>Incident Description & Attached Evidence Notes</span>
          </h3>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Incident Narrative / Description
              </label>
              <textarea
                rows={3}
                required
                value={incidentDescription}
                onChange={(e) => setIncidentDescription(e.target.value)}
                placeholder="Detailed description of what occurred, sequence of events, involved parties, etc."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Evidence Notes, Repair Quotes & Document References
              </label>
              <textarea
                rows={3}
                required
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                placeholder="Details of photos, police reports, contractor estimates, receipts, or witness statements attached..."
                className="w-full rounded-lg border border-slate-300 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit Action CTA */}
        <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Evaluated via InsurAI Rules Engine & Gemini AI Fraud Analytics</span>
          </div>

          <button
            type="submit"
            disabled={isEvaluating}
            className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 py-2.5 rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isEvaluating ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Analyzing Claim & Fraud Factors...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Evaluate Claim with InsurAI Copilot</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
