import React, { useState } from 'react';
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertTriangle, RefreshCw, Sparkles, X, Cpu } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onChangeApiKey: (key: string) => void;
  onTestApiKey: (keyToTest?: string) => Promise<boolean>;
  isTestingKey: boolean;
  testStatus: 'idle' | 'success' | 'error';
  statusMessage: string | null;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onChangeApiKey,
  onTestApiKey,
  isTestingKey,
  testStatus,
  statusMessage,
}) => {
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onTestApiKey(apiKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-start justify-between border-b border-slate-800">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-xl text-blue-400 shrink-0 mt-0.5">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">Google AI Studio API Key</h3>
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-semibold">
                  <Cpu className="w-3 h-3 text-indigo-400" />
                  <span>Gemini 3.6 Flash</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Configure your key to perform live claim evaluations with the Gemini 3.6 Flash engine.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-50/50">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              API Key Input
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => onChangeApiKey(e.target.value)}
                placeholder="Paste your Google AI Studio API Key (e.g. AIzaSy...)"
                className="w-full bg-white border border-slate-300 focus:border-blue-600 text-slate-900 text-sm rounded-xl pl-3.5 pr-10 py-2.5 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono shadow-2xs"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center justify-between">
              <span>Get a free key from <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-600 underline hover:text-blue-700 font-medium">Google AI Studio</a>.</span>
              <span className="text-[10px] text-slate-400 font-sans italic">Runtime session storage (cleared on refresh)</span>
            </p>
          </div>

          {/* Verification Status Feedback */}
          {testStatus === 'success' && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-xs text-emerald-900 flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-emerald-900">Fetched successfully!</div>
                <div className="text-emerald-700 mt-0.5 font-medium">{statusMessage || 'Gemini 3.6 Flash model is verified and ready.'}</div>
              </div>
            </div>
          )}

          {testStatus === 'error' && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-rose-900">Failed to fetch</div>
                <div className="text-rose-700 mt-0.5 font-medium">{statusMessage || 'Could not fetch key/model response.'}</div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition"
            >
              Done
            </button>
            <button
              type="submit"
              disabled={isTestingKey || !apiKey.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs transition flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {isTestingKey ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Key...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Save & Test Key</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
