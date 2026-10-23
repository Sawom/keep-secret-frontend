'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Activity, AlertTriangle, BookOpen, FileText, Loader2, RefreshCw, Users } from 'lucide-react';

type EndpointMetric = {
  endpoint: string;
  requests: number;
  averageResponseTimeMs: number;
  errors: number;
  statuses: Record<string, number>;
};

type HealthReport = {
  generatedAt: string;
  counts: {
    totalUsers: number;
    newUsersToday: number;
    newUsersLast7Days: number;
    activeNotes: number;
    trashedNotes: number;
    activeNotebooks: number;
    trashedNotebooks: number;
    auditEventsLast7Days: number;
  };
  api: {
    windowHours: number;
    sampleCount: number;
    totalRequests: number;
    averageResponseTimeMs: number;
    errorRequests: number;
    errorRatePercent: number;
    endpoints: EndpointMetric[];
    note: string;
  };
};

export default function AdminHealthPage() {
  const [report, setReport] = useState<HealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // request the protected report; a non-admin receives 403 from the backend.
  // Purpose: Fetch the protected Application Health report and show useful errors.
  const loadReport = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      // api.ts returns response.data, so this is the report object.
      const data = await api.get(
        '/admin/health'
      ) as unknown as HealthReport;

      setReport(data);
    } catch (err: any) {
      console.error(
        'Failed to load Application health report:',
        err
      );

      const status = err?.response?.status;

      if (status === 401) {
        setError(
          'Your session is not valid. Please log out, log in again, and retry.'
        );
      } else if (status === 403) {
        setError(
          'Your account does not have admin permission. Confirm its role is ADMIN in the same Neon database used by the backend.'
        );
      } else if (status === 404) {
        setError(
          'The backend returned 404 for /admin/health. Deploy the backend containing the AdminModule and confirm NEXT_PUBLIC_API_URL points to that backend.'
        );
      } else if (status >= 500) {
        setError(
          `The backend failed while generating the report (HTTP ${status}). Check the backend deployment logs for the exact error.`
        );
      } else {
        setError(
          status
            ? `Could not load the report (HTTP ${status}). Check the browser Network tab and backend logs.`
            : 'Could not reach the backend. Check NEXT_PUBLIC_API_URL, CORS, and cookie settings.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadReport(); }, [loadReport]);

  if (loading && !report) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;
  }

  if (error && !report) {
    return <section className="w-full max-w-5xl space-y-4"><h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Application Health</h1><p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p><button onClick={() => void loadReport()} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white">Try again</button></section>;
  }

  if (!report) return null;
  const countCards = [
    { label: 'Total users', value: report.counts.totalUsers, detail: `+${report.counts.newUsersToday} today`, icon: Users },
    { label: 'New users (7 days)', value: report.counts.newUsersLast7Days, detail: 'Created in the last 7 days', icon: Users },
    { label: 'Active notes', value: report.counts.activeNotes, detail: `${report.counts.trashedNotes} in Trash`, icon: FileText },
    { label: 'Active notebooks', value: report.counts.activeNotebooks, detail: `${report.counts.trashedNotebooks} in Trash`, icon: BookOpen },
    { label: 'API requests sampled', value: report.api.totalRequests, detail: 'Last 24 hours on this instance', icon: Activity },
    { label: 'Average API response', value: `${report.api.averageResponseTimeMs} ms`, detail: 'Across sampled requests', icon: Activity },
    { label: '5xx errors', value: report.api.errorRequests, detail: `${report.api.errorRatePercent}% of sampled requests`, icon: AlertTriangle },
    { label: 'Audit events (7 days)', value: report.counts.auditEventsLast7Days, detail: 'Security/activity records', icon: FileText },
  ];

  return (
    <section className="w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">Application Health</h1><p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Application usage and recent backend API performance.</p></div>
        <button onClick={() => void loadReport()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {countCards.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between gap-3"><p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p><Icon className="h-5 w-5 text-amber-600" /></div>
            <p className="mt-3 text-2xl font-semibold text-zinc-900 dark:text-white">{value}</p><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{detail}</p>
          </article>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 p-5 dark:border-zinc-800"><h2 className="font-semibold text-zinc-900 dark:text-white">API endpoint performance</h2><p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Recent sampled requests only; query values and request bodies are not recorded.</p></div>
        {report.api.endpoints.length === 0 ? <p className="p-5 text-sm text-zinc-500">No API requests have been sampled yet. Refresh after using the app.</p> : (
          <div className="overflow-x-auto"><table className="min-w-full text-left text-sm"><thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400"><tr><th className="px-5 py-3">Endpoint</th><th className="px-5 py-3">Requests</th><th className="px-5 py-3">Avg. response</th><th className="px-5 py-3">5xx errors</th><th className="px-5 py-3">Status codes</th></tr></thead><tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">{report.api.endpoints.map((item) => <tr key={item.endpoint}><td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-zinc-700 dark:text-zinc-300">{item.endpoint}</td><td className="px-5 py-3">{item.requests}</td><td className="px-5 py-3">{item.averageResponseTimeMs} ms</td><td className="px-5 py-3">{item.errors}</td><td className="px-5 py-3">{Object.entries(item.statuses).map(([status, count]) => `${status}: ${count}`).join(' · ')}</td></tr>)}</tbody></table></div>
        )}
      </div>
      <p className="text-xs leading-5 text-zinc-500 dark:text-zinc-400">{report.api.note} Report generated: {new Date(report.generatedAt).toLocaleString()}.</p>
    </section>
  );
}
