import { CwaApiResponse } from '@/types/cwa';

const CWA_API_BASE = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';
const DEFAULT_DATASET = 'F-C0032-001';
const REQUEST_TIMEOUT_MS = 10000;

export class CwaApiError extends Error {
  statusCode?: number;
  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = 'CwaApiError';
    this.statusCode = statusCode;
  }
}

/**
 * Encapsulates authentication credentials retrieval from server environment.
 * Ensures the API key is never exposed to the client-side.
 */
function getApiKey(): string {
  const apiKey = process.env.CWA_API_KEY;
  if (!apiKey || apiKey.trim() === '') {
    throw new CwaApiError('Missing CWA_API_KEY. Please configure it in .env.local on the server.', 500);
  }
  return apiKey.trim();
}

/**
 * Encapsulates request construction per CWA Open Data API specification.
 * CWA supports Authorization via query parameter and Authorization header.
 */
function buildCwaUrl(datasetId: string, apiKey: string): string {
  const url = new URL(`${CWA_API_BASE}/${datasetId}`);
  url.searchParams.set('Authorization', apiKey);
  url.searchParams.set('format', 'JSON');
  return url.toString();
}

/**
 * Fetches forecast data from CWA Open Data API (F-C0032-001).
 * Runs strictly on the server-side.
 */
export async function fetchCwaForecast(datasetId: string = DEFAULT_DATASET): Promise<CwaApiResponse> {
  const apiKey = getApiKey();
  const requestUrl = buildCwaUrl(datasetId, apiKey);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': apiKey,
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new CwaApiError('CWA API Authentication failed. Please verify your CWA_API_KEY.', response.status);
      }
      throw new CwaApiError(`CWA API responded with HTTP status ${response.status}: ${response.statusText}`, response.status);
    }

    const data = await response.json();

    // Validate response structure
    if (!data || typeof data !== 'object') {
      throw new CwaApiError('Invalid response format: payload is not a valid JSON object.');
    }

    if (data.success !== 'true') {
      const msg = typeof data.message === 'string' ? data.message : 'API reported failure.';
      throw new CwaApiError(`CWA API returned unsuccessful status: ${msg}`);
    }

    if (!data.records || !Array.isArray(data.records.location)) {
      throw new CwaApiError('Invalid CWA data structure: missing records.location array.');
    }

    return data as CwaApiResponse;
  } catch (error: unknown) {
    clearTimeout(timeoutId);

    if (error instanceof CwaApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new CwaApiError(`CWA API request timed out after ${REQUEST_TIMEOUT_MS / 1000} seconds.`, 504);
      }
      throw new CwaApiError(`Network or fetch error: ${error.message}`);
    }

    throw new CwaApiError('An unknown error occurred while communicating with CWA API.');
  }
}
