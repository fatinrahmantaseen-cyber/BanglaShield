'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Server } from 'lucide-react';

interface NoticeBannerProps {
  backendOnline?: boolean | null;
}

export function NoticeBanner({ backendOnline }: NoticeBannerProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm">
      <div className="flex items-start gap-3.5">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
          <Server className="h-4.5 w-4.5" aria-hidden="true" />
        </div>
        
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-cyan-200">
                FastAPI Heuristic Analysis Engine Active
              </h2>
              <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-mono font-medium ${
                backendOnline === true
                  ? 'border border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
                  : backendOnline === false
                  ? 'border border-rose-500/40 bg-rose-950/60 text-rose-300'
                  : 'border border-amber-500/40 bg-amber-950/60 text-amber-300'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  backendOnline === true ? 'bg-emerald-400' : backendOnline === false ? 'bg-rose-400' : 'bg-amber-400'
                }`} />
                {backendOnline === true ? 'Backend Connected' : backendOnline === false ? 'Backend Offline' : 'Connecting...'}
              </span>
            </div>

            <button
              onClick={() => setExpanded(!expanded)}
              type="button"
              className="inline-flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium focus:outline-none focus:underline"
              aria-expanded={expanded}
            >
              <span>{expanded ? 'Less details' : 'How the backend works'}</span>
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Scans are evaluated by the deterministic Python FastAPI backend. The engine analyzes URL lexical structure, scheme encryption, and regional lure patterns without ever connecting to the submitted address. It does <strong>not</strong> use machine learning models or live threat feeds at this stage.
          </p>

          {expanded && (
            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
              <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                <span className="font-semibold text-cyan-400 block mb-1">🔒 Zero External Traffic</span>
                URLs are parsed strictly using offline string parsing. The backend never performs DNS queries, socket connections, or HTTP requests to the target.
              </div>
              <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                <span className="font-semibold text-cyan-400 block mb-1">⚖️ Deterministic Scoring</span>
                Scores are derived purely from additive rule weights (0–100 scale), ensuring identical inputs always yield identical results without randomness.
              </div>
              <div className="rounded-lg bg-slate-950/80 p-3 border border-slate-800">
                <span className="font-semibold text-cyan-400 block mb-1">🛡️ No URL Logging</span>
                The FastAPI service logs operational metrics (e.g. input length, status codes) but never logs or persists raw submitted URL strings.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
