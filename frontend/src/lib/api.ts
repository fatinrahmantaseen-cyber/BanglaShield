/**
 * BanglaShield Backend API Client
 *
 * Safely sends URLs to the local FastAPI backend for deterministic heuristic analysis.
 * NEVER connects to the target URL itself.
 */

import { UrlScanResponse } from '@/types/scanner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export class BackendConnectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackendConnectionError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

/**
 * Perform a static structural scan of a URL via the FastAPI backend.
 */
export async function scanUrlApi(targetUrl: string): Promise<UrlScanResponse> {
  const endpoint = `${API_BASE_URL}/api/v1/scan-url`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: targetUrl.trim() }),
    });
  } catch {
    // Catch fetch network errors (e.g. backend server is not started)
    throw new BackendConnectionError(
      `Cannot connect to the BanglaShield backend at ${API_BASE_URL}. Ensure the FastAPI server is running (e.g. 'uvicorn backend.app.main:app --reload').`
    );
  }

  if (!response.ok) {
    let errorDetail = 'Analysis request rejected by server.';
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === 'string') {
        errorDetail = errorJson.detail;
      } else if (Array.isArray(errorJson.detail)) {
        errorDetail = errorJson.detail
          .map((item: { msg?: string }) => item.msg || 'Invalid field')
          .join('; ');
      }
    } catch {
      errorDetail = `Server returned HTTP ${response.status} ${response.statusText}`;
    }

    if (response.status === 422 || response.status === 400) {
      throw new ValidationError(errorDetail);
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

/**
 * Check whether the FastAPI backend is running.
 */
export async function checkBackendHealth(): Promise<{
  status: string;
  service: string;
  version: string;
} | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch {
    return null;
  }
}
