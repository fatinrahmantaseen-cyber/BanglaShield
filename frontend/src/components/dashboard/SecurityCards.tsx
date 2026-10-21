'use client';

import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, Activity } from 'lucide-react';
import { SessionMetrics } from '@/types/scanner';

interface SecurityCardsProps {
  metrics: SessionMetrics;
}

export function SecurityCards({ metrics }: SecurityCardsProps) {
  const cards = [
    {
      title: 'Session Scans',
      value: metrics.totalScans,
      description: 'URLs evaluated in current browser session',
      icon: Activity,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/40',
      borderColor: 'border-cyan-500/30',
      badge: 'Local Session',
    },
    {
      title: 'High Risk Flags',
      value: metrics.highRiskCount,
      description: 'Heuristic risk score >= 50 (severe indicators)',
      icon: ShieldAlert,
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/40',
      borderColor: 'border-rose-500/30',
      badge: 'FastAPI Score >= 50',
    },
    {
      title: 'Suspicious Flags',
      value: metrics.suspiciousCount,
      description: 'Heuristic risk score 16 - 49 (anomalies observed)',
      icon: AlertTriangle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-500/30',
      badge: 'FastAPI Score 16-49',
    },
    {
      title: 'Low Risk Baseline',
      value: metrics.lowRiskCount,
      description: 'Heuristic risk score 0 - 15 (no severe flags)',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-500/30',
      badge: 'FastAPI Score 0-15',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-sm transition-all hover:border-slate-700/80"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">{card.title}</span>
              <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${card.bgColor} ${card.borderColor} border`}>
                <Icon className={`h-4 w-4 ${card.color}`} aria-hidden="true" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {card.value}
              </span>
              <span className="rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-400">
                {card.badge}
              </span>
            </div>

            <p className="mt-1 text-[11px] text-slate-400 leading-normal">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}
