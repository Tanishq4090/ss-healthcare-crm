import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  PhoneCall,
  RefreshCw,
  TrendingUp,
  Users,
  WalletCards,
} from 'lucide-react';
import {
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
  type AttendanceRow,
  type CallInquiry,
  type EmployeeRow,
  type LeadRow,
  CRM_STAGES,
  formatDateTime,
  formatDuration,
  formatINR,
  fetchLiveOpsSnapshot,
  stageColors,
  stageLabel,
} from '@/lib/liveOps';

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white/50 p-8 text-center">
      <AlertTriangle className="mx-auto h-8 w-8 text-slate-300" />
      <p className="mt-3 text-sm font-bold text-slate-700">{title}</p>
      <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
    </div>
  );
}

function MetricCard({ label, value, helper, icon: Icon, tone }: { label: string; value: string | number; helper: string; icon: any; tone: 'cyan' | 'emerald' | 'amber' | 'blue' | 'rose' }) {
  return (
    <Surface className="transition-all duration-300 hover:-translate-y-1 hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{label}</p>
          <p className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{helper}</p>
        </div>
        <IconFrame icon={Icon} tone={tone} />
      </div>
    </Surface>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [calls, setCalls] = useState<CallInquiry[]>([]);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const snapshot = await fetchLiveOpsSnapshot();
    setLeads(snapshot.leads);
    setCalls(snapshot.calls);
    setEmployees(snapshot.employees);
    setAttendance(snapshot.attendance);
    setErrors(snapshot.errors);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('dashboard-live-product')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'call_inquiries' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'manual_attendance' }, load)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load]);

  const metrics = useMemo(() => {
    const pendingCalls = calls.filter((call) => call.review_status === 'new').length;
    const reviewedCalls = calls.filter((call) => call.review_status === 'reviewed').length;
    const addedCalls = calls.filter((call) => call.review_status === 'added_to_pipeline').length;
    const pipelineValue = leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
    const activeClients = leads.filter((lead) => ['closed-won', 'active'].includes(String(lead.stage || ''))).length;
    const presentToday = attendance.filter((row) => row.status === 'present').length;
    return { pendingCalls, reviewedCalls, addedCalls, pipelineValue, activeClients, presentToday };
  }, [attendance, calls, leads]);

  const pipelineData = useMemo(() => CRM_STAGES.map((stage) => ({
    stage: stage.label,
    count: leads.filter((lead) => (lead.stage || 'new-lead') === stage.id).length,
    color: stageColors[stage.id],
  })).filter((row) => row.count > 0), [leads]);

  const recentCalls = calls.slice(0, 6);
  const recentLeads = leads.slice(0, 6);
  const hasAnyError = Object.values(errors).some(Boolean);

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: '#00A859' }}>Live SS Health Care Admin OS</p>
            <h2 className="mt-3 text-3xl font-extrabold text-slate-950">Good morning, {user?.name?.split(' ')[0] || 'Admin'}.</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              This dashboard is now bound to live Supabase records: Callyzer calls, CRM leads, employees, attendance, and pipeline value.
            </p>
          </div>
          <button type="button" onClick={load} className="btn-secondary self-start xl:self-auto">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh Live Data
          </button>
        </div>
      </Surface>

      {hasAnyError && (
        <Surface className="border-amber-200 bg-amber-50">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
            <div>
              <p className="text-sm font-extrabold text-amber-900">Some live tables are not reachable</p>
              <p className="mt-1 text-xs leading-5 text-amber-700">Run the latest migration and confirm Vercel/Supabase environment variables. This warning is intentionally visible so the app never silently looks static.</p>
              <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white/70 p-3 text-xs text-amber-900">{JSON.stringify(errors, null, 2)}</pre>
            </div>
          </div>
        </Surface>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-4">
        <MetricCard label="Pending Calls" value={metrics.pendingCalls} helper="Callyzer logs awaiting review" icon={PhoneCall} tone="amber" />
        <MetricCard label="Pipeline Leads" value={leads.length} helper={`${metrics.activeClients} active clients`} icon={TrendingUp} tone="cyan" />
        <MetricCard label="Workers Present" value={`${metrics.presentToday}/${employees.length}`} helper="Manual attendance today" icon={Users} tone="emerald" />
        <MetricCard label="Pipeline Value" value={formatINR(metrics.pipelineValue)} helper="Live value from crm_leads" icon={WalletCards} tone="blue" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Surface className="xl:col-span-2">
          <SectionHeader title="Live Pipeline by Stage" description="No mock chart. This is calculated directly from crm_leads.stage." />
          {pipelineData.length === 0 ? (
            <div className="mt-6"><EmptyState title="No live leads yet" description="Add a lead manually or convert a reviewed Callyzer call into the pipeline." /></div>
          ) : (
            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 12, right: 14, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(255,255,255,0.96)', border: '1px solid #CBD5E1', borderRadius: '12px' }} />
                  <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                    {pipelineData.map((entry) => <Cell key={entry.stage} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Surface>

        <Surface>
          <SectionHeader title="Call Review Queue" description="Real Callyzer call-review status." action={<IconFrame icon={Activity} tone="emerald" className="h-10 w-10" />} />
          <div className="mt-5 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-amber-50 p-4"><p className="text-2xl font-extrabold text-amber-700">{metrics.pendingCalls}</p><p className="text-xs font-bold text-amber-600">New</p></div>
            <div className="rounded-2xl bg-blue-50 p-4"><p className="text-2xl font-extrabold text-blue-700">{metrics.reviewedCalls}</p><p className="text-xs font-bold text-blue-600">Reviewed</p></div>
            <div className="rounded-2xl bg-emerald-50 p-4"><p className="text-2xl font-extrabold text-emerald-700">{metrics.addedCalls}</p><p className="text-xs font-bold text-emerald-600">Converted</p></div>
          </div>
        </Surface>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Surface>
          <SectionHeader title="Recent Callyzer Calls" description="Latest call logs received by webhook/API sync." />
          <div className="mt-5 space-y-3">
            {recentCalls.length === 0 ? <EmptyState title="No calls yet" description="Send a sample webhook or connect Callyzer using the deployed backend URL." /> : recentCalls.map((call) => (
              <div key={call.id} className="rounded-2xl border border-slate-100 bg-white/90 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">{call.caller_name || call.caller_number}</p>
                    <p className="mt-1 text-xs text-slate-500">{call.employee_name || 'Unassigned'} · {formatDuration(call.duration_seconds)} · {formatDateTime(call.call_started_at || call.created_at)}</p>
                  </div>
                  <StatusBadge className={call.review_status === 'added_to_pipeline' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'}>{call.review_status.replaceAll('_', ' ')}</StatusBadge>
                </div>
                <p className="mt-2 text-xs text-slate-500">{call.extracted_service || 'Service not extracted'} · {call.extracted_location || 'Location not set'}</p>
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionHeader title="Recent Pipeline Leads" description="Latest records from crm_leads." />
          <div className="mt-5 space-y-3">
            {recentLeads.length === 0 ? <EmptyState title="No leads yet" description="Create a lead or add a call inquiry to pipeline." /> : recentLeads.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-slate-100 bg-white/90 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">{lead.client_name || 'Unnamed Lead'}</p>
                    <p className="mt-1 text-xs text-slate-500">{lead.phone || 'No phone'} · {lead.assignee || 'Unassigned'} · {formatDateTime(lead.created_at)}</p>
                  </div>
                  <StatusBadge className="border-green-100 bg-green-50 text-green-700">{stageLabel[lead.stage || 'new-lead'] || lead.stage}</StatusBadge>
                </div>
                <p className="mt-2 text-xs text-slate-500">{lead.notes || 'No notes added yet.'}</p>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </PageShell>
  );
}
