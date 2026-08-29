'use client';

import { useEffect, useState } from 'react';

interface HealthData {
  status: 'ok' | 'degraded' | 'down' | 'loading' | 'error';
  database?: { status: 'ok' | 'down'; message: string };
  environment?: string;
  uptime?: number;
  version?: string;
  error?: string;
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    ok: 'bg-emerald-400 shadow-emerald-400/50',
    degraded: 'bg-amber-400 shadow-amber-400/50',
    down: 'bg-red-400 shadow-red-400/50',
    loading: 'bg-slate-400',
    error: 'bg-red-400 shadow-red-400/50',
  };

  const pulse = status === 'ok' || status === 'loading';

  return (
    <span
      className={`inline-block w-2.5 h-2.5 rounded-full shadow-lg ${colors[status] ?? 'bg-slate-400'} ${
        pulse ? 'animate-pulse' : ''
      }`}
      aria-hidden="true"
    />
  );
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

/**
 * SystemStatus component
 * 
 * Fetches real health status from the NestJS API.
 * Displays actual database connectivity, uptime, and environment.
 * Never shows fake data — if the API is unreachable, it says so.
 */
export function SystemStatus() {
  const [health, setHealth] = useState<HealthData>({ status: 'loading' });
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  useEffect(() => {
    let cancelled = false;

    async function fetchHealth() {
      try {
        const res = await fetch(`${apiUrl}/api/v1/health`, {
          cache: 'no-store',
          signal: AbortSignal.timeout(5000),
        });

        if (!res.ok) {
          setHealth({ status: 'down', error: `API returned ${res.status}` });
          return;
        }

        const json = await res.json();
        if (!cancelled) {
          setHealth(json.data ?? json);
        }
      } catch (err) {
        if (!cancelled) {
          setHealth({
            status: 'error',
            error:
              err instanceof Error
                ? err.message
                : 'Cannot reach API server',
          });
        }
      }
    }

    void fetchHealth();

    // Poll every 30 seconds
    const interval = setInterval(() => void fetchHealth(), 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [apiUrl]);

  const statusLabels: Record<string, string> = {
    ok: 'All Systems Operational',
    degraded: 'Degraded Performance',
    down: 'System Down',
    loading: 'Checking Status...',
    error: 'API Unreachable',
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-800 rounded-2xl p-6 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          System Status
        </h2>
        <span className="text-xs text-slate-600">
          Auto-refreshes every 30s
        </span>
      </div>

      {/* Overall Status */}
      <div className="flex items-center gap-3 mb-6">
        <StatusDot status={health.status} />
        <span className="font-semibold text-white">
          {statusLabels[health.status] ?? 'Unknown'}
        </span>
      </div>

      {/* Details */}
      <div className="space-y-3">
        {/* Database */}
        <div className="flex items-center justify-between py-2 border-t border-slate-800">
          <span className="text-sm text-slate-400">PostgreSQL 18</span>
          <div className="flex items-center gap-2">
            <StatusDot status={health.database?.status ?? health.status} />
            <span className="text-sm text-slate-300">
              {health.database?.message ?? (health.status === 'loading' ? 'Checking...' : '—')}
            </span>
          </div>
        </div>

        {/* API Server */}
        <div className="flex items-center justify-between py-2 border-t border-slate-800">
          <span className="text-sm text-slate-400">API Server</span>
          <div className="flex items-center gap-2">
            <StatusDot status={health.status === 'error' ? 'down' : (health.status === 'loading' ? 'loading' : 'ok')} />
            <span className="text-sm text-slate-300">
              {health.status === 'error'
                ? health.error
                : health.status === 'loading'
                ? 'Connecting...'
                : `NestJS v${health.version ?? '—'} (${health.environment ?? '—'})`}
            </span>
          </div>
        </div>

        {/* Uptime */}
        {health.uptime !== undefined && (
          <div className="flex items-center justify-between py-2 border-t border-slate-800">
            <span className="text-sm text-slate-400">API Uptime</span>
            <span className="text-sm text-slate-300 font-mono">
              {formatUptime(health.uptime)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

