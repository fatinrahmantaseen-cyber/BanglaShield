import { HeuristicIndicator, RiskLevel, ScanResult } from '@/types/scanner';

/**
 * BanglaShield Client-Side Utilities & Fallback Simulator
 *
 * Used for pre-validation and offline demo fallback if backend is offline.
 * Zero external network calls.
 */

const OFFICIAL_BANGLADESH_DOMAINS = [
  'bkash.com',
  'nagad.com.bd',
  'dutchbanglabank.com',
  'bangladesh.gov.bd',
  'grameenphone.com',
  'robi.com.bd',
  'banglalink.net',
  'teletalk.com.bd',
];

const BANGLA_FINANCIAL_KEYWORDS = [
  'bkash',
  'nagad',
  'rocket',
  'upay',
  'grameenphone',
  'robi',
  'banglalink',
  'teletalk',
  'cashout',
  'recharge',
  'lottery',
  'bonus',
  'reward',
];

const SUSPICIOUS_TLDS = ['.xyz', '.top', '.buzz', '.fit', '.work', '.click', '.gq', '.cf', '.tk', '.ml'];

export function isValidUrl(input: string): boolean {
  if (!input || typeof input !== 'string') return false;
  const trimmed = input.trim();

  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function simulateScanUrl(rawInput: string): Promise<ScanResult> {
  const trimmed = rawInput.trim();
  await new Promise((resolve) => setTimeout(resolve, 600));

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Invalid URL format. Please include http:// or https://');
  }

  const hostname = parsed.hostname.toLowerCase();
  const fullUrl = parsed.href;
  const indicators: HeuristicIndicator[] = [];
  let alertScore = 0;

  // 1. Protocol check
  if (parsed.protocol === 'https:') {
    indicators.push({
      id: 'proto-https',
      category: 'protocol',
      title: 'Transport Layer Security (HTTPS)',
      description: 'The URL specifies TLS/HTTPS encryption.',
      status: 'passed',
      score_impact: 0,
    });
  } else {
    alertScore += 25;
    indicators.push({
      id: 'proto-http-unencrypted',
      category: 'protocol',
      title: 'Unencrypted Protocol (HTTP)',
      description: 'Plaintext HTTP is used. Authentic portals mandate HTTPS.',
      status: 'alert',
      score_impact: 25,
    });
  }

  // 2. IP address host check
  const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipPattern.test(hostname)) {
    alertScore += 45;
    indicators.push({
      id: 'host-ip-address',
      category: 'domain',
      title: 'Raw IP Address Host',
      description: 'Host is a raw IP literal instead of a registered domain name.',
      status: 'alert',
      score_impact: 45,
    });
  } else {
    indicators.push({
      id: 'host-standard-domain',
      category: 'domain',
      title: 'Standard Domain Format',
      description: 'Host adheres to standard domain syntax.',
      status: 'passed',
      score_impact: 0,
    });
  }

  // 3. Regional keywords
  const isOfficial = OFFICIAL_BANGLADESH_DOMAINS.some(
    (official) => hostname === official || hostname.endsWith(`.${official}`)
  );
  const matchedKeywords = BANGLA_FINANCIAL_KEYWORDS.filter((k) =>
    fullUrl.toLowerCase().includes(k)
  );

  if (matchedKeywords.length > 0 && !isOfficial) {
    alertScore += 40;
    indicators.push({
      id: 'regional-lure-mismatch',
      category: 'regional',
      title: 'Potential Bangladesh Brand Impersonation',
      description: `Contains regional keywords (${matchedKeywords.slice(0, 3).join(', ')}) on an unofficial domain (${hostname}).`,
      status: 'alert',
      score_impact: 40,
    });
  } else if (isOfficial) {
    indicators.push({
      id: 'regional-official-match',
      category: 'regional',
      title: 'Verified Official Domain Pattern',
      description: `Host matches recognized official service domain (${hostname}).`,
      status: 'passed',
      score_impact: 0,
    });
  } else {
    indicators.push({
      id: 'regional-no-lure',
      category: 'regional',
      title: 'No Regional Impersonation Keywords',
      description: 'No regional financial or telecom keywords detected.',
      status: 'passed',
      score_impact: 0,
    });
  }

  // 4. Suspicious TLD
  const matchedTld = SUSPICIOUS_TLDS.find((tld) => hostname.endsWith(tld));
  if (matchedTld) {
    alertScore += 20;
    indicators.push({
      id: 'domain-high-abuse-tld',
      category: 'domain',
      title: `High-Abuse Top-Level Domain (${matchedTld})`,
      description: `Domain utilizes ${matchedTld}, a high-risk disposable TLD.`,
      status: 'warning',
      score_impact: 20,
    });
  }

  const finalScore = Math.min(100, Math.max(0, alertScore));
  let riskLevel: RiskLevel = 'low';
  let summary = 'No high-risk structural heuristic flags were triggered in this lexical analysis.';

  if (finalScore >= 50) {
    riskLevel = 'high';
    summary = 'Multiple high-risk structural indicators were flagged. Strongly advise caution.';
  } else if (finalScore >= 16) {
    riskLevel = 'suspicious';
    summary = 'Suspicious structural patterns were observed. Exercise caution before proceeding.';
  }

  return {
    id: `scan-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    url: fullUrl,
    hostname,
    risk_level: riskLevel,
    risk_score: finalScore,
    max_risk_score: 100,
    score_meaning: 'Heuristic Risk Index (0 - 100): 0 indicates no structural risk heuristics were triggered; 100 indicates maximum cumulative structural risk flags were observed.',
    summary,
    indicators,
    disclaimer: 'BanglaShield uses deterministic heuristic analysis for educational and risk-flagging purposes. It does not prove a URL is definitively safe or malicious, and does not claim to use machine learning.',
    is_demo_heuristic: true,
    timestamp: new Date().toISOString(),
    source: 'fallback',
  };
}
