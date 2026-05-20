import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, CreditCard, Landmark, RefreshCw, Users, WalletCards } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import { CRM_STAGE_LABELS, normalizeCrmStage } from '@/config/crmStages';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

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
      <Surface className="bg-gradient-to-br from-[#004C8C]/5 via-white to-[#00A859]/5 border-[#00A859]/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-40 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between relative z-10">
          <SectionHeader
            eyebrow="Billing Operations"
            title="Finance Module"
            description="Track deposit-pending clients, monthly billing workload, and service-ready accounts from live CRM records."
            action={<div className="h-10 w-10 bg-[#004C8C]/10 rounded-xl flex items-center justify-center border border-[#004C8C]/20"><WalletCards className="w-5 h-5 text-[#004C8C]" /></div>}
          />
          <button type="button" onClick={fetchBilling} className="btn-secondary self-start xl:self-center">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Billing-ready Leads', value: billingReady.length, Icon: Users, color: '#004C8C' },
          { label: 'Deposit Pending', value: depositPending.length, Icon: AlertCircle, color: '#d97706' },
          { label: 'Monthly Billing', value: monthlyBilling.length, Icon: CreditCard, color: '#4f46e5' },
          { label: 'Pipeline Value', value: `₹${pipelineValue.toLocaleString()}`, Icon: Landmark, color: '#00A859' },
        ].map(({ label, value, Icon, color }) => (
          <Surface key={String(label)} className="group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity duration-300">
              <Icon className="w-20 h-20 transform translate-x-4 -translate-y-4" style={{ color }} />
            </div>
            <div className="flex items-start justify-between gap-4 relative z-10">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
                <p className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl shadow-sm border transition-transform group-hover:scale-110" style={{ background: `${color}10`, borderColor: `${color}20` }}>
                <Icon className="h-6 w-6" style={{ color }} />
              </div>
            </div>
          </Surface>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Surface>
          <SectionHeader title="Deposit Pending" description="Clients waiting for deposit confirmation before service activation." />
          <div className="mt-5 space-y-3">
            {!depositPending.length && <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">No deposit-pending clients right now.</div>}
            {depositPending.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-transparent hover:border-slate-100 bg-slate-50 hover:bg-slate-50/80 transition-all p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-bold text-slate-900">{lead.client_name || 'Unnamed Client'}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">{lead.phone || 'No phone'} · {lead.assigned_staff_name || 'Staff pending'} · {lead.service_type || 'Service pending'}</p>
                  </div>
                  <StatusBadge className="bg-amber-50 text-amber-700 border-amber-200/60 uppercase tracking-wider text-[10px] font-bold">Deposit Pending</StatusBadge>
                </div>
                {lead.notes && <p className="mt-3 bg-white p-2.5 rounded-lg border border-slate-100 text-xs font-medium text-slate-600 leading-relaxed italic">{lead.notes}</p>}
              </div>
            ))}
          </div>
        </Surface>

        <Surface>
          <SectionHeader title="Monthly Billing Queue" description="Active clients ready for monthly billing follow-up." />
          <div className="mt-5 space-y-3">
            {!monthlyBilling.length && <div className="rounded-2xl border border-slate-100 bg-slate-50 p-8 text-center text-sm font-medium text-slate-500">No monthly billing records yet.</div>}
            {monthlyBilling.map((lead) => (
              <div key={lead.id} className="rounded-2xl border border-transparent hover:border-slate-100 bg-slate-50 hover:bg-slate-50/80 transition-all p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-bold text-slate-900">{lead.client_name || 'Unnamed Client'}</p>
                    <p className="mt-1 text-[11px] font-medium text-slate-500">{lead.phone || 'No phone'} · {lead.assigned_staff_name || 'Staff pending'}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5">
                    <span className="text-[13px] font-extrabold text-[#00A859] tracking-tight">₹{Number(lead.value || 0).toLocaleString()}</span>
                    <StatusBadge className="bg-indigo-50 text-indigo-700 border-indigo-200/60 uppercase tracking-wider text-[10px] font-bold">Monthly Billing</StatusBadge>
                  </div>
                </div>
                {lead.notes && <p className="mt-3 bg-white p-2.5 rounded-lg border border-slate-100 text-xs font-medium text-slate-600 leading-relaxed italic">{lead.notes}</p>}
              </div>
            ))}
          </div>
        </Surface>
      </div>

      <Surface>
        <SectionHeader title="Active Client Ledger" description="Operational client accounts that are already running or closed successfully." action={<div className="h-8 w-8 bg-[#00A859]/10 rounded-lg flex items-center justify-center border border-[#00A859]/20"><CheckCircle2 className="w-4 h-4 text-[#00A859]" /></div>} />
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="w-full min-w-[820px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50">
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Service</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Assigned Staff</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">Stage</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 bg-white">
              {!activeClients.length && <tr><td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-500">No active client ledger entries yet.</td></tr>}
              {activeClients.map((lead) => {
                const stage = normalizeCrmStage(lead.stage);
                return (
                  <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900 text-[14px]">{lead.client_name || 'Unnamed Client'}</p>
                      <p className="text-[11px] font-medium text-slate-500 mt-0.5">{lead.contact_person || 'Primary contact not set'} · {lead.phone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4 text-[13px] font-bold text-slate-600">{lead.service_type || 'Service pending'}</td>
                    <td className="px-6 py-4 text-[13px] font-bold text-[#004C8C]">{lead.assigned_staff_name || 'Not assigned'}</td>
                    <td className="px-6 py-4"><StatusBadge className={cn(financeStageStyles[stage] || 'bg-slate-50 text-slate-600 border-slate-200', 'uppercase tracking-wider text-[10px] font-bold')}>{CRM_STAGE_LABELS[stage]}</StatusBadge></td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-base font-extrabold tracking-tight text-[#00A859]">₹{Number(lead.value || 0).toLocaleString()}</p>
                    </td>
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
