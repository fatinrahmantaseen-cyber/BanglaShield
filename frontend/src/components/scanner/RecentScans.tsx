'use client';

import React from 'react';
import { History, Trash2, ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';
import { ScanHistoryItem, RiskLevel } from '@/types/scanner';

interface RecentScansProps {
  history: ScanHistoryItem[];
  onSelectScan: (item: ScanHistoryItem) => void;
  onClearHistory: () => void;
}

export function RecentScans({ history, onSelectScan, onClearHistory }: RecentScansProps) {
  const getBadge = (risk: RiskLevel) => {
    switch (risk) {
      case 'high':
        return {
          label: 'High Risk',
          className: 'bg-rose-950/80 text-rose-400 border-rose-800/40',
          icon: ShieldAlert,
        };
      case 'suspicious':
        return {
          label: 'Suspicious',
          className: 'bg-amber-950/80 text-amber-400 border-amber-800/40',
          icon: AlertTriangle,
        };
      case 'low':
      default:
        return {
          label: 'Low Risk',
          className: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/40',
          icon: ShieldCheck,
        };
    }
  };

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 sm:p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-cyan-400" aria-hidden="true" />
          <h3 className="text-sm font-semibold text-slate-200">
            Session Scan History
          </h3>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
            {history.length}
          </span>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition-colors focus:outline-none focus:underline"
            title="Clear in-memory session history"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-800/80 p-6 text-center text-xs text-slate-400">
          No URLs have been evaluated yet in this session. Submit an address above to analyze it with the FastAPI backend.
        </div>
      ) : (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {history.map((item) => {
            const badge = getBadge(item.risk_level);
            const Icon = badge.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectScan(item)}
                className="w-full flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/50 p-2.5 text-left transition-all hover:border-cyan-500/30 hover:bg-slate-900/80 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <Icon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-xs text-slate-200 truncate">
                        {item.hostname}
                      </p>
                      <span className="text-[10px] font-mono text-slate-500">
                        Score: {item.risk_score}
                      </span>
                    </div>
                    <p className="font-mono text-[11px] text-slate-400 truncate max-w-xs">
                      {item.url}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span
                    className={`rounded border px-1.5 py-0.5 text-[10px] font-semibold font-mono ${badge.className}`}
                  >
                    {badge.label} ({item.risk_score})
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-[11px] text-slate-400">
        ℹ️ Session memory only: URLs are processed in memory and never stored in a permanent database or logged.
      </p>
    </div>
  );
}
