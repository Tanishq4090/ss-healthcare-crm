import { useState, useEffect, useCallback } from 'react';
import { Bot, Briefcase, Calendar, Download, MoreHorizontal, Phone, Plus, Sparkles, RefreshCw } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

interface Lead {
  id: string;
  company: string;
  contact: string;
  priority: 'Very High' | 'High' | 'Medium' | 'Low';
  value: number;
  assignee: string;
  dueDate: string;
  tags: string[];
  stage: string;
  phone?: string;
}

const stages = [
  { id: 'new-lead',        label: 'New Lead',        color: '#3B82F6' },
  { id: 'new-inquiry',     label: 'New Inquiry',      color: '#8B5CF6' },
  { id: 'in-discussion',   label: 'In Discussion',    color: '#F59E0B' },
  { id: 'quotation-sent',  label: 'Quotation Sent',   color: '#EC4899' },
  { id: 'closed-won',      label: 'Closed Won',       color: '#00A859' },
];

const priorityColors: Record<string, string> = {
  'Very High': 'bg-rose-50 text-rose-700 border-rose-100',
  High:        'bg-orange-50 text-orange-700 border-orange-100',
  Medium:      'bg-amber-50 text-amber-700 border-amber-100',
  Low:         'bg-emerald-50 text-emerald-700 border-emerald-100',
};

// Map Supabase crm_leads column names → our Lead shape
function mapRow(row: Record<string, unknown>): Lead {
  const name = (row.client_name || row.company_name || row.name || 'Unknown') as string;
  const contact = (row.contact_person || row.contact || name) as string;
  const priority = (['Very High', 'High', 'Medium', 'Low'].includes(row.priority as string)
    ? row.priority
    : 'Medium') as Lead['priority'];
  const stage = (row.stage || row.status || 'new-lead') as string;
  // normalise stage slug
  const stageSlug = stages.find(s => s.id === stage || s.label.toLowerCase() === stage.toLowerCase())?.id ?? 'new-lead';

  return {
    id:       String(row.id),
    company:  name,
    contact,
    priority,
    value:    Number(row.value || row.deal_value || 0),
    assignee: (row.assignee || row.assigned_to || 'Unassigned') as string,
    dueDate:  row.due_date ? new Date(row.due_date as string).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—',
    tags:     Array.isArray(row.tags) ? row.tags as string[] : [],
    stage:    stageSlug,
    phone:    (row.phone || row.mobile || '') as string,
  };
}

export default function AICRM() {
  const [activeTab, setActiveTab] = useState('Pipeline');
  const [leads, setLeads] = useState<Record<string, Lead[]>>({});
  const [loadingLeads, setLoadingLeads] = useState(true);
  const tabs = ['Pipeline', 'Clients', 'AI Auto', 'Voice AI'];

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const { data, error } = await supabase
        .from('crm_leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const grouped: Record<string, Lead[]> = {};
      stages.forEach(s => { grouped[s.id] = []; });

      (data || []).forEach((row: Record<string, unknown>) => {
        const lead = mapRow(row);
        if (!grouped[lead.stage]) grouped[lead.stage] = [];
        grouped[lead.stage].push(lead);
      });

      setLeads(grouped);
    } catch {
      // fallback to empty columns if Supabase not configured yet
      const empty: Record<string, Lead[]> = {};
      stages.forEach(s => { empty[s.id] = []; });
      setLeads(empty);
    } finally {
      setLoadingLeads(false);
    }
  }, []);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('crm_leads_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, () => {
        fetchLeads();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchLeads]);

  const totalLeads = Object.values(leads).reduce((acc, arr) => acc + arr.length, 0);
  const totalValue = Object.values(leads).flat().reduce((acc, l) => acc + l.value, 0);

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <IconFrame icon={Briefcase} tone="cyan" className="h-12 w-12" />
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: '#00A859' }}>AI-powered management</p>
              <h2 className="text-2xl font-extrabold text-slate-950">Pipeline Orchestration</h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Convert healthcare leads with live Supabase sync, AI nudges, and clear ownership signals.
              </p>
            </div>
          </div>
          <div className="segmented-control w-full overflow-x-auto sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={cn('segmented-item whitespace-nowrap', activeTab === tab && 'segmented-item-active')}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </Surface>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm" style={{ borderColor: 'rgba(0,168,89,0.2)' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#00A859' }} />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: '#00A859' }} />
            </span>
            Live Sync Active
          </div>
          <span className="rounded-full border bg-white/80 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm" style={{ borderColor: 'rgba(0,76,140,0.15)' }}>
            {totalLeads} Leads · ₹{totalValue.toLocaleString()} Pipeline
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={fetchLeads} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={cn('h-4 w-4', loadingLeads && 'animate-spin')} />
            Refresh
          </button>
          <button type="button" className="btn-primary">
            <Plus className="h-4 w-4" />
            Add Lead
          </button>
          <button type="button" className="btn-secondary">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {loadingLeads ? (
        <div className="flex h-48 items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="h-5 w-5 animate-spin" style={{ color: '#00A859' }} />
          <span className="text-sm font-semibold">Loading leads from Supabase…</span>
        </div>
      ) : (
        <div className="no-scrollbar flex gap-4 overflow-x-auto pb-3">
          {stages.map((stage) => (
            <div key={stage.id} className="w-[304px] shrink-0">
              <div className="mb-3 flex items-center justify-between rounded-lg border border-slate-200 bg-white/75 px-3 py-2 shadow-sm">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="truncate text-sm font-bold text-slate-700">{stage.label}</span>
                </div>
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-500">
                  {leads[stage.id]?.length || 0}
                </span>
              </div>

              <div className="space-y-3">
                {(leads[stage.id] || []).map((lead) => (
                  <article
                    key={lead.id}
                    className="group rounded-lg border border-slate-200 bg-white/95 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                    style={{ '--hover-border': 'rgba(0,168,89,0.3)' } as React.CSSProperties}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,168,89,0.3)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-extrabold text-slate-950">{lead.company}</h3>
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <StatusBadge className={priorityColors[lead.priority] || priorityColors.Medium}>
                            {lead.priority}
                          </StatusBadge>
                          {lead.tags.slice(0, 1).map((tag) => (
                            <StatusBadge key={tag} className="border-green-100 bg-green-50 text-green-700">{tag}</StatusBadge>
                          ))}
                        </div>
                      </div>
                      <button type="button" className="rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-50 hover:text-slate-500" aria-label="Lead actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs font-medium text-slate-500">
                      <Phone className="h-3.5 w-3.5 text-slate-400" />
                      <span className="truncate">{lead.contact}</span>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-base font-extrabold text-slate-950">₹{lead.value.toLocaleString()}</span>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                        <Calendar className="h-3.5 w-3.5" />
                        {lead.dueDate}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-extrabold text-white shadow-sm"
                        style={{ background: 'linear-gradient(135deg,#00A859,#004C8C)' }}
                      >
                        {lead.assignee.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-xs font-semibold text-slate-500">{lead.assignee}</span>
                    </div>
                  </article>
                ))}

                {(leads[stage.id] || []).length === 0 && (
                  <div className="flex items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/30 py-6 text-xs font-medium text-slate-400">
                    No leads in this stage
                  </div>
                )}

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-white/50 py-3 text-sm font-semibold text-slate-400 transition-all hover:bg-white hover:text-slate-600"
                  style={{ '--hover-border': '#00A859' } as React.CSSProperties}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(0,168,89,0.4)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '')}
                >
                  <Plus className="h-4 w-4" />
                  Add Card
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Surface className="bg-gradient-to-r from-green-50/90 via-white to-blue-50/90" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <SectionHeader
          title="AI Suggestions"
          description="Smart actions based on lead age, quote status, and high-intent accounts."
          action={<IconFrame icon={Bot} tone="emerald" className="h-10 w-10" />}
        />
        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[
            { text: 'Follow up with', name: 'your top lead', copy: '— 3 days since last contact', action: 'Take Action' },
            { text: '', name: 'Quotation pending', copy: '— send a reminder today', action: 'View Details' },
            { text: 'Schedule demo for', name: 'a new inquiry', copy: 'this week', action: 'Schedule Now' },
          ].map((item) => (
            <div key={item.action} className="rounded-lg border bg-white/80 p-4 shadow-sm" style={{ borderColor: 'rgba(0,168,89,0.15)' }}>
              <div className="flex items-start gap-3">
                <IconFrame icon={Sparkles} tone="cyan" className="h-9 w-9" />
                <div>
                  <p className="text-sm leading-6 text-slate-700">
                    {item.text && `${item.text} `}
                    <span className="font-extrabold text-slate-950">{item.name}</span> {item.copy}
                  </p>
                  <button type="button" className="subtle-link mt-2">{item.action} →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Surface>
    </PageShell>
  );
}
