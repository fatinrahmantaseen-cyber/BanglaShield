'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { NoticeBanner } from '@/components/dashboard/NoticeBanner';
import { SecurityCards } from '@/components/dashboard/SecurityCards';
import { UrlScannerForm } from '@/components/scanner/UrlScannerForm';
import { RiskAnalysisPanel } from '@/components/scanner/RiskAnalysisPanel';
import { RecentScans } from '@/components/scanner/RecentScans';
import { scanUrlApi, checkBackendHealth, BackendConnectionError, ValidationError } from '@/lib/api';
import { ScanResult, ScanHistoryItem, SessionMetrics } from '@/types/scanner';

export default function DashboardPage() {
  const [currentResult, setCurrentResult] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [resultCache, setResultCache] = useState<Record<string, ScanResult>>({});
  const [currentTab, setCurrentTab] = useState<string>('scanner');

  // Backend connection state
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  // Check health on mount
  const verifyHealth = useCallback(async () => {
    const health = await checkBackendHealth();
    if (health && health.status === 'healthy') {
      setBackendOnline(true);
      setConnectionError(null);
    } else {
      setBackendOnline(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((health) => {
      if (!isMounted) return;
      if (health && health.status === 'healthy') {
        setBackendOnline(true);
        setConnectionError(null);
      } else {
        setBackendOnline(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Derive metrics strictly from session scans
  const metrics: SessionMetrics = {
    totalScans: history.length,
    highRiskCount: history.filter((h) => h.risk_level === 'high').length,
    suspiciousCount: history.filter((h) => h.risk_level === 'suspicious').length,
    lowRiskCount: history.filter((h) => h.risk_level === 'low').length,
  };

  const handleScan = async (url: string) => {
    setIsLoading(true);
    setServerError(null);
    setConnectionError(null);

    try {
      // Call actual FastAPI backend endpoint
      const apiResponse = await scanUrlApi(url);

      const result: ScanResult = {
        ...apiResponse,
        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        source: 'api',
      };

      setCurrentResult(result);
      setBackendOnline(true);

      // Cache result for quick reload from session history
      setResultCache((prev) => ({ ...prev, [result.id]: result }));

      // Add to session history
      const historyItem: ScanHistoryItem = {
        id: result.id,
        url: result.url,
        hostname: result.hostname,
        timestamp: result.timestamp,
        risk_level: result.risk_level,
        risk_score: result.risk_score,
        source: 'api',
      };

      setHistory((prev) => [historyItem, ...prev.filter((item) => item.url !== result.url)]);
    } catch (err: unknown) {
      if (err instanceof BackendConnectionError) {
        setBackendOnline(false);
        setConnectionError(err.message);
        setServerError(err.message);
      } else if (err instanceof ValidationError) {
        setServerError(err.message);
      } else if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('An unknown error occurred while communicating with the scanner service.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectHistoricalScan = (item: ScanHistoryItem) => {
    if (resultCache[item.id]) {
      setCurrentResult(resultCache[item.id]);
      setServerError(null);
    }
  };

  const handleClearHistory = () => {
    setHistory([]);
    setResultCache({});
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Application Bar */}
      <Navbar backendOnline={backendOnline} />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Educational & Architecture Notice Banner */}
        <NoticeBanner backendOnline={backendOnline} />

        {/* Responsive Layout with Sidebar and Main Panel */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Navigation Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            backendOnline={backendOnline}
          />

          {/* Primary Security Workspace */}
          <div className="flex-1 space-y-6">

            {/* Session Activity & Summary Metrics */}
            <SecurityCards metrics={metrics} />

            {/* URL Input Form */}
            <UrlScannerForm
              onScan={handleScan}
              isLoading={isLoading}
              serverError={serverError}
              onClearServerError={() => setServerError(null)}
            />

            {/* Analysis Results Panel with loading, error, and empty states */}
            <RiskAnalysisPanel
              result={currentResult}
              isLoading={isLoading}
              connectionError={connectionError}
              onRetry={verifyHealth}
            />

            {/* Recent Scans In-Memory List */}
            <RecentScans
              history={history}
              onSelectScan={handleSelectHistoricalScan}
              onClearHistory={handleClearHistory}
            />

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-400">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            <strong>BanglaShield</strong> — AI-Powered Cybersecurity Portfolio Project.
          </p>
          <p className="text-[11px] text-slate-400">
            Current Stage: FastAPI Integration • Deterministic Heuristics • Zero Outbound Traffic Sandbox
          </p>
        </div>
      </footer>
    </div>
  );
}
