import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CalendarCheck,
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
    const pendingCalls = calls.filter((c) => c.review_status === 'new').length;
    const reviewedCalls = calls.filter((c) => c.review_status === 'reviewed').length;
    const addedCalls = calls.filter((c) => c.review_status === 'added_to_pipeline').length;
    const pipelineValue = leads.reduce((sum, l) => sum + Number(l.value || 0), 0);
    const activeClients = leads.filter((l) => ['active-client', 'closed-won'].includes(String(l.stage || ''))).length;
    const presentToday = attendance.filter((r) => r.status === 'present').length;
    return { pendingCalls, reviewedCalls, addedCalls, pipelineValue, activeClients, presentToday };
  }, [attendance, calls, leads]);

  const pipelineData = useMemo(() =>
    CRM_STAGES.map((stage) => ({
      stage: stage.label,
      count: leads.filter((l) => (l.stage || 'new-lead') === stage.id).length,
      color: stageColors[stage.id],
    })).filter((r) => r.count > 0), [leads]);

  const recentCalls = calls.slice(0, 6);
  const recentLeads = leads.slice(0, 6);
  const hasAnyError = Object.values(errors).some(Boolean);

  const stats = [
    { label: 'Pending Calls', value: metrics.pendingCalls, sub: 'Callyzer logs awaiting review', icon: PhoneCall, color: '#F59E0B' },
    { label: 'Pipeline Leads', value: leads.length, sub: `${metrics.activeClients} active clients`, icon: TrendingUp, color: '#00A859' },
    { label: 'Workers Present', value: `${metrics.presentToday}/${employees.length}`, sub: 'Manual attendance today', icon: Users, color: '#3B82F6' },
    { label: 'Pipeline Value', value: formatINR(metrics.pipelineValue), sub: 'Live value from crm_leads', icon: WalletCards, color: '#004C8C' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Page header ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">
            Platform Overview
          </h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}. Here's what's happening today.
          </p>
        </div>
        <button
          onClick={load}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Error banner ─────────────────────────────── */}
      {hasAnyError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Some live tables are not reachable</p>
            <p className="mt-1 text-xs text-amber-700">Run the latest migration and confirm environment variables.</p>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-white/70 p-2 text-xs text-amber-800">{JSON.stringify(errors, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* ── KPI cards ────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-sm font-medium text-slate-500 mb-1">{stat.label}</p>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${stat.color}15` }}>
                <stat.icon className="h-4 w-4" style={{ color: stat.color }} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</h3>
            <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Pipeline + Call review ────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-slate-900">Live Pipeline by Stage</h2>
              <p className="text-xs text-slate-400 mt-0.5">Calculated from crm_leads.stage</p>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(0,168,89,0.1)', color: '#00A859' }}>
              Live Data
            </span>
          </div>
          <div className="p-5">
            {pipelineData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <span className="text-xl">📊</span>
                </div>
                <p className="text-sm font-medium text-slate-600">No leads in pipeline yet</p>
                <p className="text-xs text-slate-400 mt-1">Add a lead or convert a reviewed call.</p>
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: '8px', fontSize: 12 }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {pipelineData.map((e) => <Cell key={e.stage} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Call review queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Call Review Queue</h2>
            <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,168,89,0.1)' }}>
              <Activity className="h-4 w-4" style={{ color: '#00A859' }} />
            </div>
          </div>
          <div className="p-5 flex-1">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-amber-50 p-4">
                <p className="text-2xl font-bold text-amber-700">{metrics.pendingCalls}</p>
                <p className="text-xs font-medium text-amber-600 mt-1">New</p>
              </div>
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-2xl font-bold text-blue-700">{metrics.reviewedCalls}</p>
                <p className="text-xs font-medium text-blue-600 mt-1">Reviewed</p>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-2xl font-bold text-emerald-700">{metrics.addedCalls}</p>
                <p className="text-xs font-medium text-emerald-600 mt-1">Converted</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Recent lists ─────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent calls */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Callyzer Calls</h2>
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(0,168,89,0.1)', color: '#00A859' }}>
              Live
            </span>
          </div>
          <div className="p-5 space-y-3">
            {recentCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <PhoneCall className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No calls yet</p>
                <p className="text-xs text-slate-400 mt-1">Send a sample webhook or connect Callyzer.</p>
              </div>
            ) : recentCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{call.caller_name || call.caller_number}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{call.employee_name || 'Unassigned'} · {formatDuration(call.duration_seconds)} · {formatDateTime(call.call_started_at || call.created_at)}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  call.review_status === 'added_to_pipeline' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {call.review_status.replaceAll('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent leads */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Recent Pipeline Leads</h2>
            <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'rgba(0,168,89,0.1)', color: '#00A859' }}>
              Live
            </span>
          </div>
          <div className="p-5 space-y-3">
            {recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-slate-400" />
                </div>
                <p className="text-sm font-medium text-slate-600">No leads yet</p>
                <p className="text-xs text-slate-400 mt-1">Create a lead or add a call inquiry.</p>
              </div>
            ) : recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{lead.client_name || 'Unnamed Lead'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{lead.phone || 'No phone'} · {lead.assignee || 'Unassigned'} · {formatDateTime(lead.created_at)}</p>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {stageLabel[lead.stage || 'new-lead'] || lead.stage}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
