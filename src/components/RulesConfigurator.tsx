import React, { useState } from 'react';
import { PolicyRulesConfig } from '../types';
import { Settings, Save, RotateCcw, AlertCircle, CheckCircle2, Sliders, Shield, Zap } from 'lucide-react';

interface RulesConfiguratorProps {
  rules: PolicyRulesConfig;
  onUpdateRules: (newRules: PolicyRulesConfig) => void;
  onResetRules: () => void;
}

export const RulesConfigurator: React.FC<RulesConfiguratorProps> = ({
  rules,
  onUpdateRules,
  onResetRules
}) => {
  const [autoApproveMaxAmount, setAutoApproveMaxAmount] = useState<number>(rules.autoApproveMaxAmount);
  const [maxFilingDelayDays, setMaxFilingDelayDays] = useState<number>(rules.maxFilingDelayDays);
  const [maxPriorClaimsThreshold, setMaxPriorClaimsThreshold] = useState<number>(rules.maxPriorClaimsThreshold);
  const [requireEvidenceOverAmount, setRequireEvidenceOverAmount] = useState<number>(rules.requireEvidenceOverAmount);
  const [keywordsText, setKeywordsText] = useState<string>(rules.flagKeywords.join(', '));
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: PolicyRulesConfig = {
      autoApproveMaxAmount: Number(autoApproveMaxAmount),
      maxFilingDelayDays: Number(maxFilingDelayDays),
      maxPriorClaimsThreshold: Number(maxPriorClaimsThreshold),
      requireEvidenceOverAmount: Number(requireEvidenceOverAmount),
      flagKeywords: keywordsText.split(',').map(k => k.trim()).filter(Boolean)
    };

    onUpdateRules(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-white px-6 py-5 border-b border-slate-200 text-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">InsurAI Standard Policy Rule Engine</h2>
            <p className="text-xs text-slate-500">
              Configure baseline limits and automatic escalation triggers enforced prior to AI fraud analytics.
            </p>
          </div>
        </div>

        <button
          onClick={onResetRules}
          className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition flex items-center space-x-1"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="p-6 space-y-6">
        {savedSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Policy rule parameters updated successfully! Re-run evaluations on claim queue to apply new rules.</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-100 space-y-2">
            <label className="block text-xs font-bold text-blue-900 uppercase tracking-wide">
              Instant Payout Max Limit ($)
            </label>
            <input
              type="number"
              min={100}
              step={100}
              required
              value={autoApproveMaxAmount}
              onChange={(e) => setAutoApproveMaxAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-blue-300 bg-white px-3 py-2 text-base font-bold text-blue-900 focus:outline-none"
            />
            <p className="text-[11px] text-blue-700 leading-snug">
              Claims at or under this amount with low fraud risk are automatically approved. Default is $2,000.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
              Max Filing Delay (Days)
            </label>
            <input
              type="number"
              min={1}
              required
              value={maxFilingDelayDays}
              onChange={(e) => setMaxFilingDelayDays(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-bold text-slate-900 focus:outline-none"
            />
            <p className="text-[11px] text-slate-600 leading-snug">
              Claims submitted beyond this delay trigger a mandatory timeline anomaly flag for adjuster review.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
              Max Prior Claims (24 mo)
            </label>
            <input
              type="number"
              min={0}
              required
              value={maxPriorClaimsThreshold}
              onChange={(e) => setMaxPriorClaimsThreshold(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-bold text-slate-900 focus:outline-none"
            />
            <p className="text-[11px] text-slate-600 leading-snug">
              Maximum allowable prior claim count before claimant history is flagged as high-frequency.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
              Doc Proof Required Above ($)
            </label>
            <input
              type="number"
              min={100}
              step={100}
              required
              value={requireEvidenceOverAmount}
              onChange={(e) => setRequireEvidenceOverAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base font-bold text-slate-900 focus:outline-none"
            />
            <p className="text-[11px] text-slate-600 leading-snug">
              Mandates attached photo/invoice evidence notes for claims exceeding this dollar value.
            </p>
          </div>
        </div>

        {/* Keywords */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wide">
            Red-Flag Keywords & Suspicious Phrase Trigger List
          </label>
          <p className="text-xs text-slate-500">
            Comma-separated key phrases that trigger immediate risk escalation during narrative scanning.
          </p>
          <textarea
            rows={3}
            value={keywordsText}
            onChange={(e) => setKeywordsText(e.target.value)}
            className="w-full rounded-lg border border-slate-300 p-3 text-xs font-mono text-slate-800 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Action button */}
        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg shadow-md transition flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Rule Configuration</span>
          </button>
        </div>
      </form>
    </div>
  );
};
