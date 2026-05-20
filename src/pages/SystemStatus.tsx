import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, Server } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, Surface } from '@/components/AppPrimitives';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

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
      <Surface className="bg-gradient-to-br from-[#004C8C]/5 via-white to-[#00A859]/5 border-[#00A859]/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-40 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between relative z-10">
          <SectionHeader
            title="Live System Status"
            description="This page proves whether the deployed product is live or only showing a static shell."
          />
          <button type="button" onClick={load} className="btn-secondary self-start xl:self-center">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Surface className="premium-card">
          <SectionHeader title="Backend API" description={`Expected backend: ${BACKEND_URL}`} action={<div className="h-10 w-10 bg-[#004C8C]/10 rounded-xl flex items-center justify-center border border-[#004C8C]/20"><Server className="w-5 h-5 text-[#004C8C]" /></div>} />
          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-5 text-[13px] font-bold text-rose-700 shadow-sm"><AlertTriangle className="mb-2 h-6 w-6" />{error}</div>
          ) : health ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50 p-5 shadow-sm">
                <p className="flex items-center gap-2 text-[15px] font-extrabold text-[#00A859] tracking-tight"><CheckCircle2 className="h-6 w-6" /> Backend Reachable</p>
                <p className="mt-1 text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{health.service} · {health.ts}</p>
              </div>
              <div className="space-y-2">
                {Object.entries(health.env).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-[13px]">
                    <span className="font-bold text-slate-700">{key}</span>
                    <span className={cn('uppercase tracking-wider text-[10px] font-bold px-2 py-0.5 rounded-md border', value ? 'text-[#00A859] bg-[#00A859]/10 border-[#00A859]/20' : 'text-rose-700 bg-rose-50 border-rose-200/60')}>
                      {value ? 'Configured' : 'Missing'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : <p className="mt-6 text-[13px] font-bold text-slate-500 animate-pulse">Checking backend connection...</p>}
        </Surface>

        <Surface className="premium-card">
          <SectionHeader title="Frontend Supabase Access" description="These counts are read directly from the browser using VITE_SUPABASE_* keys." />
          <div className="mt-6 space-y-3">
            {frontChecks.map((check) => (
              <div key={check.table} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-[13px]">
                <div>
                  <p className="font-extrabold text-slate-900 tracking-tight">{check.table}</p>
                  {check.error && <p className="mt-1.5 text-[11px] font-medium text-rose-600 italic bg-rose-50 px-2 py-1 rounded-md">{check.error}</p>}
                </div>
                <span className={cn('text-lg tracking-tight', check.ok ? 'font-extrabold text-[#00A859]' : 'font-extrabold text-rose-700')}>
                  {check.ok ? `${check.count} rows` : 'Error'}
                </span>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
