import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Landmark, RefreshCw, Users, WalletCards } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import { CRM_STAGE_LABELS, normalizeCrmStage } from '@/config/crmStages';
import { supabase } from '@/lib/supabase';

type BillingLead = {
  id: string;
  client_name?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  service_type?: string | null;
  assigned_staff_name?: string | null;
  stage?: string | null;
  value?: number | null;
  notes?: string | null;
};

const financeStageStyles: Record<string, string> = {
  'deposit-pending': 'bg-orange-50 text-orange-700 border-orange-100',
  'monthly-billing': 'bg-indigo-50 text-indigo-700 border-indigo-100',
  'active-client': 'bg-emerald-50 text-emerald-700 border-emerald-100',
  'closed-won': 'bg-teal-50 text-teal-700 border-teal-100',
};

export default function Finance() {
  const [leads, setLeads] = useState<BillingLead[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBilling = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('crm_leads').select('*').order('created_at', { ascending: false });
    setLeads((data || []) as BillingLead[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBilling();
    const channel = supabase.channel('finance-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, fetchBilling)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchBilling]);

  const billingReady = useMemo(() => leads.filter((lead) => ['deposit-pending', 'monthly-billing', 'active-client', 'closed-won'].includes(normalizeCrmStage(lead.stage))), [leads]);
  const depositPending = billingReady.filter((lead) => normalizeCrmStage(lead.stage) === 'deposit-pending');
  const monthlyBilling = billingReady.filter((lead) => normalizeCrmStage(lead.stage) === 'monthly-billing');
  const activeClients = billingReady.filter((lead) => ['active-client', 'closed-won'].includes(normalizeCrmStage(lead.stage)));
  const pipelineValue = billingReady.reduce((sum, lead) => sum + Number(lead.value || 0), 0);

  return (
    <PageShell>
      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <SectionHeader
            eyebrow="Billing operations"
            title="Finance Module"
            description="Track deposit-pending clients, monthly billing workload, and service-ready accounts from live CRM records."
            action={<IconFrame icon={WalletCards} tone="blue" />}
          />
          <button type="button" onClick={fetchBilling} className="btn-secondary">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Billing-ready Leads', value: billingReady.length, Icon: Users },
          { label: 'Deposit Pending', value: depositPending.length, Icon: AlertCircle },
          { label: 'Monthly Billing', value: monthlyBilling.length, Icon: CreditCard },
          { label: 'Pipeline Value', value: `Rs ${pipelineValue.toLocaleString()}`, Icon: Landmark },
        ].map(({ label, value, Icon }) => (
          <Surface key={String(label)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400">{label}</span>
                <p className="mt-5 text-3xl font-extrabold leading-none text-slate-950">{value}</p>
              </div>
              <Icon className="h-8 w-8 text-teal-600" />
            </div>
          </Surface>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Surface>
          <SectionHeader title="Deposit Pending" description="Clients waiting for deposit confirmation before service activation." />
          <div className="mt-5 space-y-3">
            {!depositPending.length && <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No deposit-pending clients right now.</p>}
            {depositPending.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-slate-100 bg-white/90 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">{lead.client_name || 'Unnamed Client'}</p>
                    <p className="mt-1 text-xs text-slate-500">{lead.phone || 'No phone'} · {lead.assigned_staff_name || 'Staff pending'} · {lead.service_type || 'Service pending'}</p>
                  </div>
                  <StatusBadge className={financeStageStyles['deposit-pending']}>Deposit Pending</StatusBadge>
                </div>
                {lead.notes && <p className="mt-2 text-xs text-slate-500">{lead.notes}</p>}
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionHeader title="Monthly Billing Queue" description="Active clients ready for monthly billing follow-up." />
          <div className="mt-5 space-y-3">
            {!monthlyBilling.length && <p className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">No monthly billing records yet.</p>}
            {monthlyBilling.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-slate-100 bg-white/90 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-950">{lead.client_name || 'Unnamed Client'}</p>
                    <p className="mt-1 text-xs text-slate-500">{lead.phone || 'No phone'} · {lead.assigned_staff_name || 'Staff pending'} · Value Rs {Number(lead.value || 0).toLocaleString()}</p>
                  </div>
                  <StatusBadge className={financeStageStyles['monthly-billing']}>Monthly Billing</StatusBadge>
                </div>
                {lead.notes && <p className="mt-2 text-xs text-slate-500">{lead.notes}</p>}
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <Surface>
        <SectionHeader title="Active Client Ledger" description="Operational client accounts that are already running or closed successfully." action={<IconFrame icon={CheckCircle2} tone="emerald" />} />
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="table-heading px-6 py-4">Client</th>
                <th className="table-heading px-6 py-4">Service</th>
                <th className="table-heading px-6 py-4">Assigned Staff</th>
                <th className="table-heading px-6 py-4">Stage</th>
                <th className="table-heading px-6 py-4">Value</th>
              </tr>
            </thead>
            <tbody>
              {!activeClients.length && <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-slate-500">No active client ledger entries yet.</td></tr>}
              {activeClients.map((lead) => {
                const stage = normalizeCrmStage(lead.stage);
                return (
                  <tr key={lead.id} className="border-b border-slate-100/80">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-950">{lead.client_name || 'Unnamed Client'}</p>
                      <p className="text-xs text-slate-500">{lead.contact_person || 'Primary contact not set'} · {lead.phone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{lead.service_type || 'Service pending'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-600">{lead.assigned_staff_name || 'Not assigned'}</td>
                    <td className="px-6 py-4"><StatusBadge className={financeStageStyles[stage] || 'bg-slate-50 text-slate-600 border-slate-200'}>{CRM_STAGE_LABELS[stage]}</StatusBadge></td>
                    <td className="px-6 py-4 text-sm font-extrabold text-slate-950">Rs {Number(lead.value || 0).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Surface>
    </PageShell>
  );
}
