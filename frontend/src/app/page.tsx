'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Radar, MessageSquareWarning } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { NoticeBanner } from '@/components/dashboard/NoticeBanner';
import { SecurityCards } from '@/components/dashboard/SecurityCards';
import { UrlScannerForm } from '@/components/scanner/UrlScannerForm';
import { RiskAnalysisPanel } from '@/components/scanner/RiskAnalysisPanel';
import { RecentScans } from '@/components/scanner/RecentScans';
import { MessageScannerForm } from '@/components/message/MessageScannerForm';
import { MessageAnalysisPanel } from '@/components/message/MessageAnalysisPanel';
import { RecentMessages } from '@/components/message/RecentMessages';
import {
  scanUrlApi,
  analyzeMessageApi,
  checkBackendHealth,
  BackendConnectionError,
  ValidationError
} from '@/lib/api';
import {
  ScanResult,
  ScanHistoryItem,
  MessageScanResult,
  MessageHistoryItem,
  SessionMetrics
} from '@/types/scanner';

export default function DashboardPage() {
  const [currentTab, setCurrentTab] = useState<string>('scanner');

  // URL Scanner state
  const [currentUrlResult, setCurrentUrlResult] = useState<ScanResult | null>(null);
  const [isUrlLoading, setIsUrlLoading] = useState<boolean>(false);
  const [urlHistory, setUrlHistory] = useState<ScanHistoryItem[]>([]);
  const [urlResultCache, setUrlResultCache] = useState<Record<string, ScanResult>>({});
  const [prefilledUrl, setPrefilledUrl] = useState<string>('');

  // Message Scanner state
  const [currentMessageResult, setCurrentMessageResult] = useState<MessageScanResult | null>(null);
  const [isMessageLoading, setIsMessageLoading] = useState<boolean>(false);
  const [messageHistory, setMessageHistory] = useState<MessageHistoryItem[]>([]);
  const [messageResultCache, setMessageResultCache] = useState<Record<string, MessageScanResult>>({});

  // Backend connection state
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [urlServerError, setUrlServerError] = useState<string | null>(null);
  const [messageServerError, setMessageServerError] = useState<string | null>(null);

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

  // Compute metrics based on active tab
  const urlMetrics: SessionMetrics = {
    totalScans: urlHistory.length,
    highRiskCount: urlHistory.filter((h) => h.risk_level === 'high').length,
    suspiciousCount: urlHistory.filter((h) => h.risk_level === 'suspicious').length,
    lowRiskCount: urlHistory.filter((h) => h.risk_level === 'low').length,
  };

  const messageMetrics: SessionMetrics = {
    totalScans: messageHistory.length,
    highRiskCount: messageHistory.filter((h) => h.risk_level === 'high').length,
    suspiciousCount: messageHistory.filter((h) => h.risk_level === 'suspicious').length,
    lowRiskCount: messageHistory.filter((h) => h.risk_level === 'low').length,
  };

  // -------------------------------------------------------------------------
  // URL Scan Handlers
  // -------------------------------------------------------------------------
  const handleUrlScan = async (url: string) => {
    setIsUrlLoading(true);
    setUrlServerError(null);
    setConnectionError(null);

    try {
      const apiResponse = await scanUrlApi(url);
      const result: ScanResult = {
        ...apiResponse,
        id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        source: 'api',
      };

      setCurrentUrlResult(result);
      setBackendOnline(true);
      setUrlResultCache((prev) => ({ ...prev, [result.id]: result }));

      const historyItem: ScanHistoryItem = {
        id: result.id,
        url: result.url,
        hostname: result.hostname,
        timestamp: result.timestamp,
        risk_level: result.risk_level,
        risk_score: result.risk_score,
        source: 'api',
      };

      setUrlHistory((prev) => [historyItem, ...prev.filter((item) => item.url !== result.url)]);
    } catch (err: unknown) {
      if (err instanceof BackendConnectionError) {
        setBackendOnline(false);
        setConnectionError(err.message);
        setUrlServerError(err.message);
      } else if (err instanceof ValidationError) {
        setUrlServerError(err.message);
      } else if (err instanceof Error) {
        setUrlServerError(err.message);
      } else {
        setUrlServerError('An unknown error occurred while scanning the URL.');
      }
    } finally {
      setIsUrlLoading(false);
    }
  };

  const handleSelectHistoricalUrl = (item: ScanHistoryItem) => {
    if (urlResultCache[item.id]) {
      setCurrentUrlResult(urlResultCache[item.id]);
      setUrlServerError(null);
    }
  };

  const handleClearUrlHistory = () => {
    setUrlHistory([]);
    setUrlResultCache({});
  };

  // -------------------------------------------------------------------------
  // Message Scan Handlers
  // -------------------------------------------------------------------------
  const handleMessageScan = async (messageText: string) => {
    setIsMessageLoading(true);
    setMessageServerError(null);
    setConnectionError(null);

    try {
      const apiResponse = await analyzeMessageApi(messageText);
      const snippet = messageText.length > 90 ? `${messageText.substring(0, 87)}...` : messageText;
      const result: MessageScanResult = {
        ...apiResponse,
        id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        messageSnippet: snippet,
      };

      setCurrentMessageResult(result);
      setBackendOnline(true);
      setMessageResultCache((prev) => ({ ...prev, [result.id]: result }));

      const historyItem: MessageHistoryItem = {
        id: result.id,
        snippet,
        timestamp: result.timestamp,
        risk_level: result.risk_level,
        risk_score: result.risk_score,
      };

      setMessageHistory((prev) => [historyItem, ...prev.filter((item) => item.snippet !== snippet)]);
    } catch (err: unknown) {
      if (err instanceof BackendConnectionError) {
        setBackendOnline(false);
        setConnectionError(err.message);
        setMessageServerError(err.message);
      } else if (err instanceof ValidationError) {
        setMessageServerError(err.message);
      } else if (err instanceof Error) {
        setMessageServerError(err.message);
      } else {
        setMessageServerError('An unknown error occurred while analyzing the message.');
      }
    } finally {
      setIsMessageLoading(false);
    }
  };

  const handleSelectHistoricalMessage = (item: MessageHistoryItem) => {
    if (messageResultCache[item.id]) {
      setCurrentMessageResult(messageResultCache[item.id]);
      setMessageServerError(null);
    }
  };

  const handleClearMessageHistory = () => {
    setMessageHistory([]);
    setMessageResultCache({});
  };

  // Switch to URL scanner and pre-fill extracted URL
  const handleInspectExtractedUrl = (url: string) => {
    setPrefilledUrl(url);
    setCurrentTab('scanner');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Application Bar */}
      <Navbar backendOnline={backendOnline} />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Educational & Architecture Notice Banner */}
        <NoticeBanner backendOnline={backendOnline} />

        {/* Responsive Layout with Sidebar and Workspace */}
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Navigation Sidebar */}
          <Sidebar
            currentTab={currentTab}
            onSelectTab={setCurrentTab}
            backendOnline={backendOnline}
          />

          {/* Primary Security Workspace */}
          <div className="flex-1 space-y-6">

            {/* Top Workspace Tab Selector (Mobile / Quick Switcher) */}
            <div className="flex border-b border-slate-800 bg-slate-900/40 rounded-xl p-1.5 gap-2 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setCurrentTab('scanner')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  currentTab === 'scanner'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Radar className="h-4 w-4" />
                <span>URL Heuristic Scanner</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('sms')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                  currentTab === 'sms'
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <MessageSquareWarning className="h-4 w-4" />
                <span>SMS & Scam Message Classifier</span>
              </button>
            </div>

            {/* TAB 1: URL Scanner Workspace */}
            {currentTab === 'scanner' && (
              <div className="space-y-6">
                <SecurityCards metrics={urlMetrics} />
                <UrlScannerForm
                  onScan={handleUrlScan}
                  isLoading={isUrlLoading}
                  serverError={urlServerError}
                  onClearServerError={() => setUrlServerError(null)}
                  initialUrl={prefilledUrl}
                />
                <RiskAnalysisPanel
                  result={currentUrlResult}
                  isLoading={isUrlLoading}
                  connectionError={connectionError}
                  onRetry={verifyHealth}
                />
                <RecentScans
                  history={urlHistory}
                  onSelectScan={handleSelectHistoricalUrl}
                  onClearHistory={handleClearUrlHistory}
                />
              </div>
            )}

            {/* TAB 2: SMS & Scam Message Classifier Workspace */}
            {currentTab === 'sms' && (
              <div className="space-y-6">
                <SecurityCards metrics={messageMetrics} />
                <MessageScannerForm
                  onAnalyze={handleMessageScan}
                  isLoading={isMessageLoading}
                  serverError={messageServerError}
                  onClearServerError={() => setMessageServerError(null)}
                />
                <MessageAnalysisPanel
                  result={currentMessageResult}
                  isLoading={isMessageLoading}
                  connectionError={connectionError}
                  onRetry={verifyHealth}
                  onInspectUrl={handleInspectExtractedUrl}
                />
                <RecentMessages
                  history={messageHistory}
                  onSelectMessage={handleSelectHistoricalMessage}
                  onClearHistory={handleClearMessageHistory}
                />
              </div>
            )}

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
            Current Stage: URL Scanner & Bangla/Banglish Scam Message Classifier • Offline Heuristic Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
