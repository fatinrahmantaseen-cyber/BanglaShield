/**
 * BanglaShield - TypeScript Type Definitions
 *
 * Defines standard interfaces for URL scanning, risk categories,
 * heuristic breakdown, and session history matching the FastAPI backend schema.
 */

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

/**
 * Exact schema returned by POST /api/v1/scan-url
 */
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

/**
 * Extended ScanResult for frontend state management
 */
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

export interface SessionMetrics {
  totalScans: number;
  highRiskCount: number;
  suspiciousCount: number;
  lowRiskCount: number;
}
