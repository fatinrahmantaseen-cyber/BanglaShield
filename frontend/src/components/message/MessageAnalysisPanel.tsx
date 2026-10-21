'use client';

import React from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Radar,
  ServerCrash,
  Info,
  Link2,
  ArrowRight
} from 'lucide-react';
import { MessageScanResult, RiskLevel } from '@/types/scanner';

interface MessageAnalysisPanelProps {
  result: MessageScanResult | null;
  isLoading: boolean;
  connectionError?: string | null;
  onRetry?: () => void;
  onInspectUrl?: (url: string) => void;
}

export function MessageAnalysisPanel({
  result,
  isLoading,
  connectionError,
  onRetry,
  onInspectUrl,
}: MessageAnalysisPanelProps) {
  // 1. Loading State
  if (isLoading) {
    return (
      <div className="rounded-xl border border-cyan-500/30 bg-slate-900/50 p-8 backdrop-blur-sm flex flex-col items-center justify-center text-center cyber-glow-cyan">
        <div className="relative flex h-20 w-20 items-center justify-center">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full border-2 border-cyan-400/40 animate-pulse" />
          <Radar className="h-10 w-10 text-cyan-400 animate-spin" style={{ animationDuration: '2.5s' }} />
        </div>
        <h3 className="mt-4 text-base font-semibold text-slate-100">
          FastAPI Message Heuristic Engine Evaluating...
        </h3>
        <p className="mt-1 text-xs text-slate-400 max-w-sm">
          Analyzing social-engineering indicators across Bangla, Banglish, and English tokens...
        </p>
        <span className="mt-3 rounded-full border border-cyan-500/30 bg-cyan-950/60 px-3 py-1 text-[11px] font-mono text-cyan-300">
          POST /api/v1/analyze-message (Local Privacy Sandbox)
        </span>
      </div>
    );
  }

  // 2. Connection / Backend Error State
  if (connectionError && !result) {
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-6 sm:p-8 backdrop-blur-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-900/40 border border-rose-500/50 text-rose-400">
            <ServerCrash className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="flex-1 space-y-2">
            <h3 className="text-base font-semibold text-rose-200">
              FastAPI Backend Service Offline
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {connectionError}
            </p>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
              >
                Retry Health Check
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 3. Empty State
  if (!result) {
    return (
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-8 sm:p-12 backdrop-blur-sm flex flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/60 border border-slate-700/60 text-slate-400 mb-4">
          <Radar className="h-8 w-8 text-cyan-400/70" />
        </div>
        <h3 className="text-base font-semibold text-slate-200">
          No Message Analyzed Yet
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
          Paste an SMS or choose one of the test presets above to inspect social-engineering indicators, urgency pressure, credential harvesting, or deceptive links.
        </p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left text-xs">
          <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/80">
            <span className="text-cyan-400 font-semibold block mb-1">1. Prize & Lottery Lures</span>
            <span className="text-slate-400">Identifies fake Eid bonuses, lotteries, and advance-fee requests.</span>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/80">
            <span className="text-cyan-400 font-semibold block mb-1">2. Urgency & Credential Theft</span>
            <span className="text-slate-400">Detects artificial suspension threats demanding OTPs or PINs.</span>
          </div>
          <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800/80">
            <span className="text-cyan-400 font-semibold block mb-1">3. Non-Punitive Brand Context</span>
            <span className="text-slate-400">Distinguishes authentic bank receipts from brand impersonation.</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Results Panel
  const getBadgeConfig = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return {
          title: 'High Risk Scam Indicators',
          badgeColor: 'border-rose-500/40 bg-rose-950/60 text-rose-300',
          glow: 'border-rose-500/40',
          scoreBarColor: 'bg-rose-500',
          icon: ShieldAlert,
          iconColor: 'text-rose-400',
          bannerBg: 'bg-gradient-to-r from-rose-950/40 to-slate-900/60 border-rose-500/30',
        };
      case 'suspicious':
        return {
          title: 'Suspicious Indicators Observed',
          badgeColor: 'border-amber-500/40 bg-amber-950/60 text-amber-300',
          glow: 'border-amber-500/40',
          scoreBarColor: 'bg-amber-500',
          icon: AlertTriangle,
          iconColor: 'text-amber-400',
          bannerBg: 'bg-gradient-to-r from-amber-950/40 to-slate-900/60 border-amber-500/30',
        };
      case 'low':
      default:
        return {
          title: 'Low Risk (Standard Baseline)',
          badgeColor: 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300',
          glow: 'border-emerald-500/40',
          scoreBarColor: 'bg-emerald-500',
          icon: ShieldCheck,
          iconColor: 'text-emerald-400',
          bannerBg: 'bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border-emerald-500/30',
        };
    }
  };

  const badgeConfig = getBadgeConfig(result.risk_level);
  const StatusIcon = badgeConfig.icon;

  return (
    <div className={`rounded-xl border bg-slate-900/50 backdrop-blur-sm overflow-hidden ${badgeConfig.glow}`}>

      {/* Result Header Banner */}
      <div className={`p-5 sm:p-6 border-b ${badgeConfig.bannerBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-950/80 border border-slate-700/60 shadow-lg">
              <StatusIcon className={`h-6 w-6 ${badgeConfig.iconColor}`} aria-hidden="true" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeConfig.badgeColor}`}>
                  {badgeConfig.title}
                </span>
                <span className="rounded-full border border-cyan-500/40 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-mono font-medium text-cyan-300">
                  FastAPI Heuristic Engine
                </span>
              </div>
              <h3 className="mt-1 text-base sm:text-lg font-bold text-white">
                {result.summary}
              </h3>
            </div>
          </div>

          {/* Actual Deterministic Risk Score Gauge */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 sm:text-right shrink-0 min-w-36">
            <span className="text-[11px] font-medium text-slate-400 block">
              Heuristic Risk Score
            </span>
            <div className="flex items-baseline justify-start sm:justify-end gap-1 my-0.5">
              <span className="text-2xl font-bold font-mono text-white">
                {result.risk_score}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                / {result.max_risk_score}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
              <div
                className={`h-full ${badgeConfig.scoreBarColor} transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(4, result.risk_score))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Message snippet preview */}
        <div className="mt-4 rounded-lg bg-slate-950/90 border border-slate-800/80 p-3">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-semibold text-slate-300">Evaluated Message Snippet:</span>
            <span className="font-mono text-slate-400">{new Date(result.timestamp).toLocaleTimeString()}</span>
          </div>
          <p className="text-xs text-slate-200 italic line-clamp-3">
            &quot;{result.messageSnippet}&quot;
          </p>
        </div>
      </div>

      {/* Extracted URLs box if any found in the message */}
      {result.extracted_urls && result.extracted_urls.length > 0 && (
        <div className="px-5 sm:px-6 py-3.5 bg-slate-950/70 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-amber-300">
              <Link2 className="h-4 w-4 text-amber-400 shrink-0" aria-hidden="true" />
              <span className="font-medium">
                Found {result.extracted_urls.length} link{result.extracted_urls.length > 1 ? 's' : ''} in message:
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Never automatically visited or fetched
            </span>
          </div>

          <div className="mt-2 space-y-1.5">
            {result.extracted_urls.map((url, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 rounded-md bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs"
              >
                <span className="font-mono text-cyan-300 truncate max-w-sm sm:max-w-md select-all">
                  {url}
                </span>

                {onInspectUrl && (
                  <button
                    type="button"
                    onClick={() => onInspectUrl(url)}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium px-2 py-0.5 rounded border border-cyan-500/30 bg-cyan-950/50 hover:bg-cyan-900/50 transition-colors shrink-0"
                    title="Send this URL to the URL Scanner tab for safe structural inspection"
                  >
                    <span>Inspect in URL Scanner</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heuristic Score Meaning */}
      <div className="px-5 sm:px-6 pt-3.5 pb-2 border-b border-slate-800/60 bg-slate-950/40 flex items-start gap-2 text-xs text-slate-300">
        <Info className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" aria-hidden="true" />
        <span className="leading-relaxed">{result.score_meaning}</span>
      </div>

      {/* Heuristic Indicators Breakdown */}
      <div className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Detected Indicators & Correlation ({result.indicators.length})
          </h4>
          <span className="text-[11px] text-slate-400 font-mono">
            Deterministic Rule Weighting
          </span>
        </div>

        <div className="space-y-2.5">
          {result.indicators.map((ind) => {
            const isAlert = ind.status === 'alert';
            const isWarning = ind.status === 'warning';
            const isPassed = ind.status === 'passed';

            return (
              <div
                key={ind.id}
                className={`rounded-lg border p-3.5 transition-colors ${
                  isAlert
                    ? 'border-rose-500/30 bg-rose-950/15'
                    : isWarning
                    ? 'border-amber-500/30 bg-amber-950/15'
                    : 'border-slate-800/80 bg-slate-950/40'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {isAlert && <XCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />}
                    {isWarning && <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />}
                    {isPassed && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-200">
                          {ind.title}
                        </span>
                        <span className="rounded bg-slate-800/80 px-1.5 py-0.2 text-[10px] uppercase font-mono text-slate-400">
                          {ind.category}
                        </span>
                        {ind.score_impact > 0 && (
                          <span className="rounded bg-rose-950/80 border border-rose-800/40 px-1.5 text-[10px] font-mono text-rose-300">
                            +{ind.score_impact} pts
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                        {ind.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                      isAlert
                        ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                        : isWarning
                        ? 'bg-amber-950 text-amber-400 border border-amber-800/40'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                    }`}
                  >
                    {ind.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer footer on results */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
          <p className="leading-relaxed">
            🛡️ <strong>Safety Disclaimer:</strong> {result.disclaimer}
          </p>
          <span className="text-cyan-400/80 shrink-0 font-mono">
            Local Execution Only
          </span>
        </div>
      </div>

    </div>
  );
}
