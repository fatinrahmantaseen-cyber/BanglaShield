'use client';

import React, { useState } from 'react';
import { ShieldAlert, Menu, X, Cpu } from 'lucide-react';

interface NavbarProps {
  backendOnline?: boolean | null;
}

export function Navbar({ backendOnline }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#070b14]/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400 cyber-glow-cyan">
            <ShieldAlert className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">
                Bangla<span className="text-cyan-400">Shield</span>
              </span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-950/60 px-2 py-0.5 text-[10px] font-semibold tracking-wider text-cyan-300 uppercase">
                v0.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Heuristic Cyber Defense & Regional Phishing Analysis
            </p>
          </div>
        </div>

        {/* Right side status indicators */}
        <div className="hidden md:flex items-center gap-4">
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
            backendOnline === true
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
              : backendOnline === false
              ? 'border-rose-500/40 bg-rose-950/40 text-rose-300'
              : 'border-slate-800 bg-slate-900/60 text-slate-400'
          }`}>
            <span className={`h-2 w-2 rounded-full ${
              backendOnline === true
                ? 'bg-emerald-400 animate-pulse'
                : backendOnline === false
                ? 'bg-rose-400'
                : 'bg-amber-400 animate-pulse'
            }`} />
            <span>
              {backendOnline === true
                ? 'FastAPI Connected (127.0.0.1:8000)'
                : backendOnline === false
                ? 'FastAPI Disconnected'
                : 'Checking API Status...'}
            </span>
          </div>

          <div className="flex items-center gap-2 rounded-md border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-xs text-slate-400">
            <Cpu className="h-3.5 w-3.5 text-cyan-400" />
            <span>Deterministic Engine</span>
          </div>
        </div>

        {/* Mobile menu trigger */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-[#0a0f1d] px-4 pt-2 pb-4 space-y-3">
          <div className={`flex items-center gap-2 rounded-md border p-2 text-xs ${
            backendOnline === true
              ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300'
              : 'border-rose-500/40 bg-rose-950/40 text-rose-300'
          }`}>
            <span className={`h-2 w-2 rounded-full ${backendOnline === true ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span>{backendOnline === true ? 'FastAPI Backend Online' : 'FastAPI Backend Offline'}</span>
          </div>
          <div className="text-xs text-slate-400">
            Backend Endpoint: POST http://127.0.0.1:8000/api/v1/scan-url
          </div>
        </div>
      )}
    </header>
  );
}
