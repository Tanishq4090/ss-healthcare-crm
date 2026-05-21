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
    const activeClients = leads.filter((l) => ['active-client', 'closed-won'].includes(String(l.stage || ''))).length;
    const presentToday = attendance.filter((r) => r.status === 'present').length;
    // KPI metrics
    const activeLeads = leads.filter((l) => !['closed-lost'].includes(String(l.stage || 'new-lead'))).length;
    const activeDeployments = employees.filter((e) => (e as any).status === 'deployed' || (e as any).current_client_id).length;
    const platformMRR = leads
      .filter((l) => ['active-client', 'closed-won'].includes(String(l.stage || '')))
      .reduce((sum, l) => sum + Number(l.value || 0), 0);
    const callyzerCalls = calls.length;
    return { pendingCalls, reviewedCalls, addedCalls, activeClients, presentToday, activeLeads, activeDeployments, platformMRR, callyzerCalls };
  }, [attendance, calls, leads, employees]);

  const pipelineData = useMemo(() =>
    CRM_STAGES.map((stage) => ({
      stage: stage.label,
      count: leads.filter((l) => (l.stage || 'new-lead') === stage.id).length,
      color: stageColors[stage.id],
    })).filter((r) => r.count > 0), [leads]);

  const recentCalls = calls.slice(0, 6);
  const recentLeads = leads.slice(0, 6);
  const hasAnyError = Object.values(errors).some(Boolean);

  const recentActivities = useMemo(() => {
    const list: Array<{ id: string; type: string; title: string; desc: string; dateObj: Date; timeStr: string }> = [];
    
    // Add calls
    calls.forEach((c) => {
      const d = new Date(c.call_started_at || c.created_at);
      list.push({
        id: `call-${c.id}`,
        type: 'call',
        title: 'Callyzer Call Logged',
        desc: `${c.caller_name || c.caller_number} · ${formatDuration(c.duration_seconds)}`,
        dateObj: d,
        timeStr: formatDateTime(c.call_started_at || c.created_at),
      });
    });

    // Add leads
    leads.forEach((l) => {
      const d = new Date(l.created_at);
      list.push({
        id: `lead-${l.id}`,
        type: 'Lead Stage Updated',
        desc: `${l.client_name || 'Unnamed Lead'} · ${stageLabel[l.stage || 'new-lead'] || l.stage}`,
        dateObj: d,
        timeStr: formatDateTime(l.created_at),
      });
    });

    // Add attendance
    attendance.forEach((a) => {
      const d = new Date(a.date + 'T09:00:00');
      list.push({
        id: `att-${a.id}`,
        type: 'Attendance Marked',
        desc: `${a.employee_name} · ${a.status === 'present' ? 'Present' : 'Absent'}`,
        dateObj: d,
        timeStr: a.date,
      });
    });

    return list
      .sort((a, b) => b.dateObj.getTime() - a.dateObj.getTime())
      .slice(0, 5);
  }, [calls, leads, attendance]);

  const stats = [
    { label: 'Active Leads', value: metrics.activeLeads, sub: 'In CRM pipeline', icon: TrendingUp, color: '#00A859' },
    { label: 'Active Deployments', value: metrics.activeDeployments, sub: 'Workers on assignment', icon: Users, color: '#3B82F6' },
    { label: 'Platform MRR', value: formatINR(metrics.platformMRR), sub: 'Monthly recurring revenue', icon: WalletCards, color: '#004C8C' },
    { label: 'Callyzer Calls', value: metrics.callyzerCalls, sub: 'Total call logs received', icon: PhoneCall, color: '#F59E0B' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* ── Page header ──────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-extrabold text-slate-900 tracking-tight">
            Platform Overview
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Welcome back, {user?.name?.split(' ')[0] || 'Admin'}. Here's what's happening today.
          </p>
        </div>
        <button
          onClick={load}
          className="btn-secondary hidden sm:flex"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* ── Error banner ─────────────────────────────── */}
      {hasAnyError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-start gap-4 shadow-sm animate-slide-in">
          <div className="bg-red-100 rounded-full p-2 mt-0.5">
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-900">Live Data Connectivity Issue</p>
            <p className="mt-1 text-xs font-medium text-red-700">Some tables are unreachable. Please verify database credentials.</p>
            <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-white/60 p-3 text-xs text-red-800 border border-red-100/50">{JSON.stringify(errors, null, 2)}</pre>
          </div>
        </div>
      )}

      {/* ── KPI cards ────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat) => (
          <div key={stat.label} className="premium-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity duration-300">
              <stat.icon className="w-24 h-24 transform translate-x-4 -translate-y-4" style={{ color: stat.color }} />
            </div>
            <div className="flex items-start justify-between relative z-10">
              <p className="text-[13px] font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.label}</p>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110" style={{ background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}05)`, border: `1px solid ${stat.color}20` }}>
                <stat.icon className="h-5 w-5" style={{ color: stat.color }} />
              </div>
            </div>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight relative z-10">{stat.value}</h3>
            <p className="text-xs font-medium text-slate-400 mt-1.5 relative z-10">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Pipeline + Call review ────────────────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Pipeline chart */}
        <div className="lg:col-span-2 premium-card overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/30">
            <div>
              <h2 className="text-base font-bold text-slate-900">Live Pipeline Velocity</h2>
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mt-1">Real-time Lead Distribution</p>
            </div>
            <span className="status-pill status-pill-green">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00A859] animate-pulse"></span>
              Live Data
            </span>
          </div>
          <div className="p-6 flex-1">
            {pipelineData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[280px] text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <p className="text-sm font-bold text-slate-700">Pipeline is Empty</p>
                <p className="text-xs font-medium text-slate-400 mt-1.5 max-w-[200px]">Add new leads to the CRM to visualize your sales velocity.</p>
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pipelineData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="4 4" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="stage" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} interval={0} angle={-15} textAnchor="end" height={70} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: 12, fontWeight: 600, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {pipelineData.map((e) => <Cell key={e.stage} fill={e.color} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>

        {/* Recent activity stream */}
        <div className="premium-card overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/30">
            <h2 className="text-base font-bold text-slate-900">Recent Activity</h2>
            <span className="status-pill status-pill-green text-[10px] font-bold py-0.5 px-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00A859] animate-pulse"></span>
              Live Stream
            </span>
          </div>
          <div className="p-6 flex-1 flex flex-col justify-start">
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[260px] text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                  <Activity className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600">No recent activity</p>
                <p className="text-xs font-medium text-slate-400 mt-1 max-w-[200px]">Waiting for new events...</p>
              </div>
            ) : (
              <div className="relative border-l border-slate-100 pl-6 space-y-5 text-left">
                {recentActivities.map((act) => {
                  let dotBg = 'bg-slate-400';
                  if (act.type === 'call') dotBg = 'bg-[#F59E0B]';
                  if (act.type === 'lead') dotBg = 'bg-[#00A859]';
                  if (act.type === 'attendance') dotBg = 'bg-[#3B82F6]';

                  return (
                    <div key={act.id} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-4 ring-white">
                        <span className={`h-2.5 w-2.5 rounded-full ${dotBg} transition-transform group-hover:scale-125`} />
                      </span>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 group-hover:text-[#004C8C] transition-colors">
                          {act.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                          {act.desc}
                        </p>
                        <span className="text-[10px] font-medium text-slate-400 block mt-1">
                          {act.timeStr}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Recent lists ─────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent calls */}
        <div className="premium-card overflow-hidden">
          <div className="p-5 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/30">
            <h2 className="text-sm font-bold text-slate-900">Recent Callyzer Logs</h2>
            <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-slate-100 text-slate-500">Last 6 Calls</span>
          </div>
          <div className="p-4 space-y-2">
            {recentCalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                  <PhoneCall className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600">No calls available</p>
                <p className="text-xs font-medium text-slate-400 mt-1 max-w-[200px] mx-auto">Waiting for inbound calls from Callyzer webhook.</p>
              </div>
            ) : recentCalls.map((call) => (
              <div key={call.id} className="flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 transition-all cursor-default group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 group-hover:bg-white group-hover:text-[#00A859] group-hover:border-[#00A859]/30 transition-colors">
                    {(call.caller_name || call.caller_number)[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{call.caller_name || call.caller_number}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{call.employee_name || 'Unassigned'} · {formatDuration(call.duration_seconds)} · {formatDateTime(call.call_started_at || call.created_at)}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                  call.review_status === 'added_to_pipeline' ? 'bg-[#00A859]/10 text-[#00A859] border border-[#00A859]/20' : 
                  call.review_status === 'reviewed' ? 'bg-[#004C8C]/10 text-[#004C8C] border border-[#004C8C]/20' :
                  'bg-amber-50 text-amber-600 border border-amber-200/60'
                }`}>
                  {call.review_status.replaceAll('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent leads */}
        <div className="premium-card overflow-hidden">
          <div className="p-5 border-b border-slate-100/60 flex items-center justify-between bg-slate-50/30">
            <h2 className="text-sm font-bold text-slate-900">Recent CRM Leads</h2>
            <span className="text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider bg-slate-100 text-slate-500">Last 6 Leads</span>
          </div>
          <div className="p-4 space-y-2">
            {recentLeads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3">
                  <TrendingUp className="h-5 w-5 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-600">No leads available</p>
                <p className="text-xs font-medium text-slate-400 mt-1 max-w-[200px] mx-auto">Leads added to the pipeline will appear here.</p>
              </div>
            ) : recentLeads.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50/80 transition-all cursor-default group">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs shrink-0 group-hover:bg-white group-hover:text-[#004C8C] group-hover:border-[#004C8C]/30 transition-colors">
                    {(lead.client_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-slate-900">{lead.client_name || 'Unnamed Lead'}</p>
                    <p className="text-[11px] font-medium text-slate-500 mt-0.5">{lead.phone || 'No phone'} · {lead.assignee || 'Unassigned'} · {formatDateTime(lead.created_at)}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200/60">
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
