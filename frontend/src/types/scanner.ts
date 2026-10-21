/**
 * BanglaShield - TypeScript Type Definitions
 *
 * Defines standard interfaces for URL scanning, message scam analysis,
 * heuristic breakdown, and session history matching the FastAPI backend schemas.
 */

// ---------------------------------------------------------------------------
// URL Scanner Types
// ---------------------------------------------------------------------------

export type RiskLevel = 'low' | 'suspicious' | 'high';

export type IndicatorCategory = 'protocol' | 'domain' | 'keywords' | 'structure' | 'regional';

export type IndicatorStatus = 'passed' | 'warning' | 'alert' | 'info';

export interface HeuristicIndicator {
  id: string;
  category: IndicatorCategory;
  title: string;
  description: string;
  status: IndicatorStatus;
  score_impact: number;
}

export interface UrlScanResponse {
  url: string;
  hostname: string;
  risk_level: RiskLevel;
  risk_score: number; // 0 to 100
  max_risk_score: number; // 100
  score_meaning: string;
  summary: string;
  indicators: HeuristicIndicator[];
  disclaimer: string;
  is_demo_heuristic: boolean;
  timestamp: string;
}

export interface ScanResult extends UrlScanResponse {
  id: string;
  source: 'api' | 'fallback';
}

export interface ScanHistoryItem {
  id: string;
  url: string;
  hostname: string;
  timestamp: string;
  risk_level: RiskLevel;
  risk_score: number;
  source: 'api' | 'fallback';
}

// ---------------------------------------------------------------------------
// Message / Scam Analyzer Types
// ---------------------------------------------------------------------------

export type MessageIndicatorCategory =
  | 'prize_lottery'
  | 'urgency_threat'
  | 'credential_harvesting'
  | 'suspicious_payment'
  | 'brand_impersonation'
  | 'suspicious_link'
  | 'general';

export interface MessageIndicator {
  id: string;
  category: MessageIndicatorCategory;
  title: string;
  description: string;
  status: IndicatorStatus;
  score_impact: number;
}

export interface MessageAnalyzeResponse {
  risk_level: RiskLevel;
  risk_score: number; // 0 to 100
  max_risk_score: number; // 100
  score_meaning: string;
  summary: string;
  indicators: MessageIndicator[];
  extracted_urls: string[];
  disclaimer: string;
  is_rule_based: boolean;
  timestamp: string;
}

export interface MessageScanResult extends MessageAnalyzeResponse {
  id: string;
  messageSnippet: string;
}

export interface MessageHistoryItem {
  id: string;
  snippet: string;
  timestamp: string;
  risk_level: RiskLevel;
  risk_score: number;
}

// ---------------------------------------------------------------------------
// Metrics
// ---------------------------------------------------------------------------

export interface SessionMetrics {
  totalScans: number;
  highRiskCount: number;
  suspiciousCount: number;
  lowRiskCount: number;
}
