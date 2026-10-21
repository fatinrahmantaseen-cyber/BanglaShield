'use client';

import React, { useState } from 'react';
import { Search, Loader2, Sparkles, Shield, AlertCircle } from 'lucide-react';
import { isValidUrl } from '@/lib/demoScanner';

interface UrlScannerFormProps {
  onScan: (url: string) => Promise<void>;
  isLoading: boolean;
  serverError?: string | null;
  onClearServerError?: () => void;
}

export function UrlScannerForm({
  onScan,
  isLoading,
  serverError,
  onClearServerError,
}: UrlScannerFormProps) {
  const [inputUrl, setInputUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Quick test presets matching common cybersecurity scenarios
  const demoPresets = [
    {
      label: 'Safe Example (Official)',
      url: 'https://bangladesh.gov.bd',
      note: 'Official government portal using TLS/HTTPS',
    },
    {
      label: 'Regional Impersonation Test',
      url: 'http://bkash-eid-bonus.xyz/claim',
      note: 'bKash brand keyword on .xyz with unencrypted HTTP',
    },
    {
      label: 'Raw IP Host Test',
      url: 'http://192.168.1.1/admin',
      note: 'Direct IP destination bypassing domain reputation',
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    if (onClearServerError) onClearServerError();

    const trimmed = inputUrl.trim();

    if (!trimmed) {
      setValidationError('Please enter a target URL to evaluate.');
      return;
    }

    // Client-side pre-flight format validation
    if (!isValidUrl(trimmed)) {
      setValidationError(
        'Invalid URL format. Please include a complete web address starting with http:// or https://'
      );
      return;
    }

    try {
      await onScan(trimmed);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setValidationError(err.message);
      } else {
        setValidationError('An unexpected error occurred while communicating with the scanner.');
      }
    }
  };

  const handleSelectPreset = (url: string) => {
    setInputUrl(url);
    setValidationError(null);
    if (onClearServerError) onClearServerError();
  };

  const activeError = validationError || serverError;

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-sm">
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold text-base sm:text-lg">
          <Search className="h-5 w-5" aria-hidden="true" />
          <h2>Inspect Target URL</h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400">
          Analyzes URL structure and regional deception patterns via the local FastAPI heuristic engine.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3" noValidate>
        <div className="relative flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <label htmlFor="url-input" className="sr-only">
              Target URL to analyze
            </label>
            <input
              id="url-input"
              type="text"
              value={inputUrl}
              onChange={(e) => {
                setInputUrl(e.target.value);
                if (validationError) setValidationError(null);
                if (onClearServerError) onClearServerError();
              }}
              placeholder="e.g. https://example.com/login or http://bkash-eid-bonus.xyz"
              disabled={isLoading}
              className={`w-full rounded-lg border bg-slate-950/80 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 font-mono transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${
                activeError
                  ? 'border-rose-500/60 focus:border-rose-500'
                  : 'border-slate-800 focus:border-cyan-500/50'
              } disabled:opacity-60`}
              aria-invalid={activeError ? 'true' : 'false'}
              aria-describedby={activeError ? 'url-error' : undefined}
            />
            {inputUrl && !isLoading && (
              <button
                type="button"
                onClick={() => {
                  setInputUrl('');
                  setValidationError(null);
                  if (onClearServerError) onClearServerError();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
                aria-label="Clear input"
              >
                Clear
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-blue-500 hover:shadow-cyan-500/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" aria-hidden="true" />
                <span>Scan URL</span>
              </>
            )}
          </button>
        </div>

        {activeError && (
          <div
            id="url-error"
            role="alert"
            className="flex items-start gap-2.5 text-xs text-rose-300 bg-rose-950/40 border border-rose-500/40 rounded-lg p-3"
          >
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" aria-hidden="true" />
            <span className="leading-relaxed">{activeError}</span>
          </div>
        )}
      </form>

      {/* Preset demo buttons for convenience */}
      <div className="mt-4 pt-3 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-cyan-400" aria-hidden="true" />
          <span>Quick test presets:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {demoPresets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(preset.url)}
              disabled={isLoading}
              className="rounded-md border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-xs text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-500 text-left disabled:opacity-50"
              title={preset.note}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 text-[11px] text-slate-400">
        🛡️ <strong>Safety Sandbox:</strong> BanglaShield inspects lexical structure locally through FastAPI. It never connects, fetches content, or pings the submitted URL.
      </div>
    </div>
  );
}
