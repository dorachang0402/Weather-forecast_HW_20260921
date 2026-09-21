'use client';

import { useState } from 'react';
import type { CwaTestResult } from '@/types/cwa';

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CwaTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch('/api/test-cwa');
      const json: CwaTestResult = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || json.message || 'CWA API request failed');
        setData(json);
      } else {
        setData(json);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network request error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>CWA API Test</h1>
      <p className="subtitle">Milestone 1 — CWA API → JSON Verification</p>

      <div className="card">
        <button className="btn" onClick={runTest} disabled={loading}>
          {loading ? 'Testing...' : 'Test CWA API'}
        </button>

        {loading && (
          <div className="result-box">
            <p className="status-line">Connecting to CWA Open Data API...</p>
          </div>
        )}

        {error && !loading && (
          <div className="result-box">
            <p className="status-line status-error">Status: ❌ Error</p>
            <div className="sample-panel">
              {JSON.stringify({ error, detail: data?.error }, null, 2)}
            </div>
          </div>
        )}

        {data && data.success && !loading && (
          <div className="result-box">
            <p className="status-line status-success">Status: ✅ Success</p>
            <div className="info-badge">
              Dataset: {data.dataset} | Locations: {data.locationCount}
            </div>

            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Sample Location:</h3>
            <div className="sample-panel">
              <strong>{data.sampleLocation?.locationName}</strong>
              {'\n\n'}
              {data.sampleLocation?.elements.map((el) => 
                `[${el.name}] ${el.value}${el.unit || ''} (${el.startTime} ~ ${el.endTime})`
              ).join('\n')}
            </div>
          </div>
        )}
      </div>

      <footer className="meta-footer">
        Alo DIC-2 Taiwan Weather GIS Dashboard • Milestone 1
      </footer>
    </main>
  );
}
