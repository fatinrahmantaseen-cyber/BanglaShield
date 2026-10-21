'use client';

import React from 'react';
import {
  Radar,
  MessageSquareWarning,
  Layers,
  Server,
  FileCode2
} from 'lucide-react';

interface SidebarProps {
  currentTab?: string;
  onSelectTab?: (tab: string) => void;
  backendOnline?: boolean | null;
}

export function Sidebar({ currentTab = 'scanner', onSelectTab, backendOnline }: SidebarProps) {
  const navItems = [
    {
      id: 'scanner',
      label: 'URL Heuristics Scanner',
      icon: Radar,
      status: 'Live API',
      active: true,
    },
    {
      id: 'sms',
      label: 'SMS / Scam Classifier',
      icon: MessageSquareWarning,
      status: 'Phase 2',
      active: false,
    },
    {
      id: 'threat-feed',
      label: 'BD Threat Patterns',
      icon: Layers,
      status: 'Planned',
      active: false,
    },
    {
      id: 'architecture',
      label: 'Architecture & Docs',
      icon: Server,
      status: 'FastAPI',
      active: false,
    },
  ];

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="flex flex-col gap-6 rounded-xl border border-slate-800/80 bg-slate-900/40 p-4 backdrop-blur-sm">

        {/* Navigation list */}
        <div>
          <h2 className="px-3 text-xs font-semibold tracking-wider text-slate-400 uppercase">
            Security Modules
          </h2>
          <nav className="mt-2 space-y-1" aria-label="Modules navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isSelected = item.id === currentTab;

              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab && onSelectTab(item.id)}
                  type="button"
                  className={`w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                      item.status === 'Live API'
                        ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/40'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {item.status}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Project Architecture Info Box */}
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-3.5 text-xs">
          <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1.5">
            <FileCode2 className="h-4 w-4" />
            <span>Architecture Stack</span>
          </div>
          <p className="text-slate-400 leading-relaxed mb-3">
            Frontend sends JSON to the local FastAPI backend, receiving explainable heuristic scores.
          </p>
          <div className="space-y-1.5 font-mono text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Frontend:</span>
              <span className="text-slate-300">Next.js 16</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Backend:</span>
              <span className={backendOnline ? 'text-emerald-400' : 'text-amber-400'}>
                FastAPI {backendOnline ? '(Online)' : '(Offline)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Engine:</span>
              <span className="text-cyan-400">Heuristics v0.1</span>
            </div>
          </div>
        </div>

        {/* Responsible Use Footer */}
        <div className="px-2 text-[11px] text-slate-400 leading-relaxed">
          <p>
            Academic cybersecurity portfolio project focusing on educational phishing awareness in Bangladesh.
          </p>
        </div>

      </div>
    </aside>
  );
}
