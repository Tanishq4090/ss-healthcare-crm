import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, Surface } from '@/components/AppPrimitives';
import { supabase } from '@/lib/supabase';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

type SystemHealth = {
  ok: boolean;
  service: string;
  ts: string;
  env: Record<string, boolean>;
  checks: { table: string; ok: boolean; count: number; error: string | null }[];
};

export default function SystemStatus() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [frontChecks, setFrontChecks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${BACKEND_URL}/api/system/health`);
      if (!response.ok) throw new Error(`Backend returned HTTP ${response.status}`);
      setHealth(await response.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backend health check failed');
      setHealth(null);
    }

    const tables = ['crm_leads', 'call_inquiries', 'employees', 'manual_attendance'];
    const checks = await Promise.all(tables.map(async (table) => {
      const { count, error: tableError } = await supabase.from(table).select('id', { count: 'exact', head: true });
      return { table, ok: !tableError, count: count || 0, error: tableError?.message || null };
    }));
    setFrontChecks(checks);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <SectionHeader
          title="Live System Status"
          description="This page proves whether the deployed product is live or only showing a static shell."
          action={<button type="button" onClick={load} className="btn-secondary"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>}
        />
      </Surface>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Surface>
          <SectionHeader title="Backend API" description={`Expected backend: ${BACKEND_URL}`} action={<IconFrame icon={Server} tone="blue" />} />
          {error ? (
            <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm font-bold text-rose-700"><AlertTriangle className="mb-2 h-5 w-5" />{error}</div>
          ) : health ? (
            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><p className="flex items-center gap-2 text-sm font-extrabold text-emerald-700"><CheckCircle2 className="h-5 w-5" /> Backend reachable</p><p className="mt-1 text-xs text-emerald-600">{health.service} · {health.ts}</p></div>
              {Object.entries(health.env).map(([key, value]) => <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-sm"><span className="font-semibold text-slate-600">{key}</span><span className={value ? 'font-bold text-emerald-700' : 'font-bold text-rose-700'}>{value ? 'configured' : 'missing'}</span></div>)}
            </div>
          ) : <p className="mt-5 text-sm text-slate-400">Checking backend...</p>}
        </Surface>

        <Surface>
          <SectionHeader title="Frontend Supabase Access" description="These counts are read directly from the browser using VITE_SUPABASE_* keys." />
          <div className="mt-5 space-y-3">
            {frontChecks.map((check) => <div key={check.table} className="flex items-center justify-between rounded-xl border border-slate-100 bg-white p-3 text-sm"><div><p className="font-extrabold text-slate-800">{check.table}</p>{check.error && <p className="mt-1 text-xs text-rose-600">{check.error}</p>}</div><span className={check.ok ? 'font-extrabold text-emerald-700' : 'font-extrabold text-rose-700'}>{check.ok ? `${check.count} rows` : 'error'}</span></div>)}
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
