import { useCallback, useEffect, useMemo, useState } from 'react';
import { BriefcaseMedical, CreditCard, Phone, RefreshCw, Search, UserCheck, Users } from 'lucide-react';
import { PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import { CRM_CLIENT_STAGES, CRM_STAGE_LABELS, normalizeCrmStage } from '@/config/crmStages';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Lead = {
  id: string;
  client_name?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  service_type?: string | null;
  notes?: string | null;
  stage?: string | null;
  assigned_staff_name?: string | null;
  priority?: string | null;
  created_at?: string | null;
};

const stageStyles: Record<string, string> = {
  'staff-assigned': 'bg-cyan-50 text-cyan-700 border-cyan-100',
  'deposit-pending': 'bg-orange-50 text-orange-700 border-orange-100',
  'active-client': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'monthly-billing': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'closed-won': 'bg-teal-50 text-teal-700 border-teal-100',
};

function serviceStatus(stage: string) {
  if (stage === 'active-client' || stage === 'monthly-billing' || stage === 'closed-won') return 'Active';
  if (stage === 'deposit-pending') return 'Pending activation';
  return 'Preparing service';
}

function depositStatus(stage: string) {
  if (stage === 'deposit-pending') return 'Pending';
  if (stage === 'staff-assigned') return 'Not started';
  return 'Cleared';
}

function billingStatus(stage: string) {
  if (stage === 'monthly-billing') return 'Billing due';
  if (stage === 'closed-won') return 'Closed';
  return 'Not ready';
}

export default function Clients() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'billing' | 'deposit'>('all');

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('crm_leads').select('*').order('created_at', { ascending: false });
    setLeads((data || []) as Lead[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchClients();
    const channel = supabase.channel('clients-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, fetchClients)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchClients]);

  const clients = useMemo(() => leads.filter((lead) => CRM_CLIENT_STAGES.has(normalizeCrmStage(lead.stage))), [leads]);

  const filtered = useMemo(() => clients.filter((lead) => {
    const stage = normalizeCrmStage(lead.stage);
    const matchesSearch = `${lead.client_name || ''} ${lead.contact_person || ''} ${lead.phone || ''} ${lead.assigned_staff_name || ''} ${lead.service_type || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'active' && ['active-client', 'closed-won'].includes(stage)) ||
      (filter === 'billing' && stage === 'monthly-billing') ||
      (filter === 'deposit' && stage === 'deposit-pending');
    return matchesSearch && matchesFilter;
  }), [clients, filter, search]);

  const stats = {
    total: clients.length,
    active: clients.filter((lead) => ['active-client', 'closed-won'].includes(normalizeCrmStage(lead.stage))).length,
    deposit: clients.filter((lead) => normalizeCrmStage(lead.stage) === 'deposit-pending').length,
    billing: clients.filter((lead) => normalizeCrmStage(lead.stage) === 'monthly-billing').length,
  };

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <SectionHeader
            eyebrow="Operational clients"
            title="Clients Module"
            description="Track converted and active client records with assigned staff, deposit readiness, and billing progression."
          />
          <button type="button" onClick={fetchClients} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </Surface>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {[
          { label: 'Total Clients', value: stats.total, Icon: Users },
          { label: 'Active Service', value: stats.active, Icon: BriefcaseMedical },
          { label: 'Deposit Pending', value: stats.deposit, Icon: CreditCard },
          { label: 'Monthly Billing', value: stats.billing, Icon: UserCheck },
        ].map(({ label, value, Icon }) => (
          <Surface key={String(label)}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-3 text-2xl font-extrabold text-slate-950">{value}</p>
              </div>
              <Icon className="h-8 w-8 text-teal-600" />
            </div>
          </Surface>
        ))}
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search client, family, staff, service..." className="field-control w-full pl-10" />
        </div>
        <div className="segmented-control w-full overflow-x-auto xl:w-auto">
          {[
            ['all', 'All'],
            ['active', 'Active'],
            ['deposit', 'Deposit'],
            ['billing', 'Billing'],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setFilter(value as typeof filter)} className={cn('segmented-item whitespace-nowrap', filter === value && 'segmented-item-active')}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2 2xl:grid-cols-3">
        {!loading && filtered.length === 0 && (
          <Surface>
            <div className="py-16 text-center text-slate-400">
              <Users className="mx-auto mb-3 h-10 w-10 opacity-30" />
              <p className="text-sm">No clients found for this filter.</p>
            </div>
          </Surface>
        )}

        {filtered.map((lead) => {
          const stage = normalizeCrmStage(lead.stage);
          return (
            <article key={lead.id} className="clinical-surface p-5">
              <div className="clinical-content">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-extrabold text-slate-950">{lead.client_name || 'Unnamed Client'}</h3>
                    <p className="mt-1 truncate text-sm font-medium text-slate-500">{lead.contact_person || 'Primary contact not set'}</p>
                  </div>
                  <StatusBadge className={stageStyles[stage] || 'bg-slate-50 text-slate-600 border-slate-200'}>
                    {CRM_STAGE_LABELS[stage]}
                  </StatusBadge>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-slate-400" /> {lead.phone || 'No phone'}</div>
                  <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-slate-400" /> {lead.assigned_staff_name || 'Staff not assigned yet'}</div>
                  <div className="flex items-center gap-2"><BriefcaseMedical className="h-4 w-4 text-slate-400" /> {lead.service_type || 'Service not set'}</div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Service</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">{serviceStatus(stage)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Deposit</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">{depositStatus(stage)}</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Billing</p>
                    <p className="mt-1 text-sm font-extrabold text-slate-900">{billingStatus(stage)}</p>
                  </div>
                </div>

                {lead.notes && <p className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500 line-clamp-3">{lead.notes}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </PageShell>
  );
}
