import { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, Calendar, CheckCircle2, CreditCard, FileText, IdCard, MessageCircle, Phone, RefreshCw, Send, UserCheck, X } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import StaffIDCard from '@/components/StaffIDCard';
import type { StaffIDCardEmployee } from '@/components/StaffIDCard';
import { CRM_PIPELINE_STAGES, CRM_STAGE_LABELS, normalizeCrmStage } from '@/config/crmStages';
import { absoluteStaffIdUrl, buildStaffAssignedMessage, logTemplateMessage, toWhatsAppPhone } from '@/lib/staffIdentity';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

type Lead = {
  id: string;
  client_name?: string | null;
  company_name?: string | null;
  name?: string | null;
  contact_person?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  stage?: string | null;
  priority?: string | null;
  value?: number | null;
  deal_value?: number | null;
  assignee?: string | null;
  assigned_staff_id?: string | null;
  assigned_staff_name?: string | null;
  assigned_staff_phone?: string | null;
  assigned_staff_code?: string | null;
  staff_id_card_url?: string | null;
  service_type?: string | null;
  source?: string | null;
  notes?: string | null;
  tags?: string[] | null;
  metadata?: Record<string, unknown> | null;
  created_at?: string;
  last_template_sent?: string | null;
};

type Employee = StaffIDCardEmployee & {
  id: string;
  email?: string | null;
  availability_status?: string | null;
};

type WhatsAppMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  template_name?: string | null;
  content: string;
  status: string;
  sent_by?: string | null;
  created_at: string;
};

const priorityColors: Record<string, string> = {
  'Very High': 'bg-rose-50 text-rose-700 border-rose-100',
  High: 'bg-orange-50 text-orange-700 border-orange-100',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

function leadName(lead: Lead) {
  return lead.client_name || lead.company_name || lead.name || 'Unknown Client';
}

function leadContact(lead: Lead) {
  return lead.contact_person || leadName(lead);
}

function leadValue(lead: Lead) {
  return Number(lead.value || lead.deal_value || 0);
}

function sourceBadges(lead: Lead) {
  const labels = new Set<string>();
  const source = String(lead.source || '').toLowerCase();
  if (source.includes('manual')) labels.add('Manual');
  if (source.includes('call')) labels.add('Call Lead');
  if (source.includes('callyzer')) labels.add('Callyzer-ready');
  if (!labels.size) labels.add('Manual');
  return Array.from(labels);
}

function templateText(template: string, lead: Lead) {
  const name = leadContact(lead).split(' ')[0] || 'there';
  const service = lead.service_type || 'Home Healthcare Service';
  switch (template) {
    case 'inquiry_received':
      return `Namaste ${name} ji, thank you for contacting SS Health Care. We have received your inquiry for ${service}. Our team will contact you shortly.`;
    case 'quotation_sent':
      return `Namaste ${name} ji, your quotation for ${service} is ready. Please reply here if you would like to proceed.`;
    case 'form_submitted':
      return `Namaste ${name} ji, we have received your form. Our care coordinator will verify the details and move to staff assignment.`;
    case 'staff_assigned':
      return `Namaste ${name} ji, your assigned SS Health Care staff profile is ready. Please verify the ID card link shared by our care coordinator before service starts.`;
    case 'deposit_pending':
      return `Namaste ${name} ji, your deposit is pending. Once deposit is completed, we will confirm your service start.`;
    case 'monthly_billing':
      return `Namaste ${name} ji, your monthly bill is ready. Please contact SS Health Care for payment details.`;
    case 'general_follow_up':
      return `Namaste ${name} ji, this is a general follow-up from SS Health Care regarding your ${service} requirement. Please let us know how we can help further.`;
    default:
      return `Namaste ${name} ji, this is a follow-up from SS Health Care regarding your home healthcare service.`;
  }
}

async function openLoggedTemplateMessage(lead: Lead, templateName: string, content: string, payload?: Record<string, unknown>) {
  if (!lead.phone) throw new Error('Lead phone number is missing.');
  await logTemplateMessage({
    leadId: lead.id,
    phone: lead.phone,
    templateName,
    content,
    payload,
  });
  const waPhone = toWhatsAppPhone(lead.phone);
  if (waPhone) window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(content)}`, '_blank');
}

function StaffAssignmentModal({
  lead,
  employees,
  onClose,
  onAssigned,
}: {
  lead: Lead;
  employees: Employee[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [selected, setSelected] = useState<Employee | null>(employees[0] || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const assign = async () => {
    if (!selected) return setError('Select one staff member.');
    setSaving(true);
    setError('');
    try {
      const { data, error: rpcError } = await supabase.rpc('assign_staff_to_lead', {
        p_lead_id: lead.id,
        p_employee_id: selected.id,
        p_sent_by: 'admin',
      });
      if (rpcError) throw rpcError;

      const idCardUrl = absoluteStaffIdUrl((data as { id_card_url?: string } | null)?.id_card_url || selected.id_card_url);
      const content = buildStaffAssignedMessage({
        clientName: leadContact(lead),
        staffName: selected.full_name || selected.username || 'Assigned Staff',
        staffRole: selected.job_title || selected.position || 'Care Specialist',
        idCardUrl,
      });

      if (lead.phone) {
        await openLoggedTemplateMessage(lead, 'staff_assigned', content, {
          employee_id: selected.id,
          employee_code: selected.employee_code,
          id_card_url: idCardUrl,
        });
      }

      onAssigned();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign staff.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-600">Staff assignment</p>
            <h3 className="text-2xl font-black text-slate-950">Assign staff to {leadName(lead)}</h3>
            <p className="mt-1 text-sm text-slate-500">Only available or active staff are shown here. The selected ID card link will be included in the WhatsApp template message.</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-5 grid max-h-[68vh] grid-cols-1 gap-5 overflow-y-auto lg:grid-cols-[1fr_420px]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {employees.map((emp) => {
              const isActive = selected?.id === emp.id;
              return (
                <button key={emp.id} type="button" onClick={() => setSelected(emp)} className={`rounded-2xl border p-4 text-left transition ${isActive ? 'border-teal-300 bg-teal-50 ring-2 ring-teal-100' : 'border-slate-200 bg-white hover:border-teal-200'}`}>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-teal-700 to-blue-700 text-sm font-black text-white">
                      {emp.photo_url ? <img src={emp.photo_url} className="h-full w-full object-cover" alt="" /> : (emp.full_name || 'S').split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{emp.full_name}</p>
                      <p className="truncate text-xs font-bold text-teal-700">{emp.employee_code} · {emp.job_title || emp.position || 'Care Specialist'}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500">{emp.gender || 'Unspecified'} · {emp.phone || 'No phone'}</span>
                    <span className={cn('rounded-full px-2 py-1', (emp.availability_status || 'available') === 'available' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700')}>
                      {emp.availability_status || 'available'}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(emp.service_skills || []).slice(0, 3).map((skill) => <span key={skill} className="rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-slate-500">{skill}</span>)}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-3xl border border-slate-100 bg-slate-50/50 p-4">
            {selected ? <StaffIDCard employee={selected} showActions={false} /> : <p className="text-sm text-slate-400">Select staff to preview ID card.</p>}
          </div>
        </div>

        {error && <p className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary px-6">Cancel</button>
          <button onClick={assign} disabled={saving || !selected} className="btn-primary px-6">
            <UserCheck className="h-4 w-4" /> {saving ? 'Assigning...' : 'Assign Staff + Send ID Card Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

function WhatsAppHistoryDrawer({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const phone = (lead.phone || '').replace(/\D/g, '').slice(-10);
      let query = supabase.from('whatsapp_messages').select('*').order('created_at', { ascending: true });
      if (lead.id) query = query.or(`lead_id.eq.${lead.id},phone.ilike.%${phone}%`);
      const { data } = await query;
      setMessages((data || []) as WhatsAppMessage[]);
      setLoading(false);
    }
    load();
  }, [lead]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-600">WhatsApp History</p>
            <h3 className="text-xl font-black text-slate-950">{leadName(lead)}</h3>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>
        <div className="space-y-3 p-6">
          {loading && <p className="text-sm text-slate-400">Loading conversation...</p>}
          {!loading && !messages.length && <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">No WhatsApp history yet. Send a template from the lead card.</p>}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.direction === 'outbound' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {msg.template_name && <p className="mb-1 text-[10px] font-black uppercase tracking-widest opacity-70">{msg.template_name}</p>}
                <p className="whitespace-pre-wrap leading-6">{msg.content}</p>
                <p className="mt-2 text-[10px] font-semibold opacity-70">{new Date(msg.created_at).toLocaleString()} · {msg.status}{msg.sent_by ? ` · ${msg.sent_by}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LeadDetailsDrawer({
  lead,
  onClose,
  onRefresh,
  onShowHistory,
  onAssignStaff,
}: {
  lead: Lead;
  onClose: () => void;
  onRefresh: () => void;
  onShowHistory: () => void;
  onAssignStaff: () => void;
}) {
  const [notes, setNotes] = useState(lead.notes || '');
  const [customMessage, setCustomMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const saveNotes = async () => {
    setSaving(true);
    setError('');
    const { error: updateError } = await supabase.from('crm_leads').update({ notes }).eq('id', lead.id);
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onRefresh();
  };

  const sendMessage = async (templateName: string, content?: string) => {
    try {
      await openLoggedTemplateMessage(lead, templateName, content || templateText(templateName, lead), { source: 'lead_details_drawer' });
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open WhatsApp.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45 backdrop-blur-sm">
      <div className="h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-100 bg-white/95 px-6 py-5 backdrop-blur">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-teal-600">CRM Lead Details</p>
            <h3 className="text-2xl font-black text-slate-950">{leadName(lead)}</h3>
            <p className="mt-1 text-sm text-slate-500">{CRM_STAGE_LABELS[normalizeCrmStage(lead.stage)]} · {lead.service_type || 'General service inquiry'}</p>
          </div>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-5 p-6">
          <Surface>
            <SectionHeader title="Contact and Source" description="Operational contact details and intake origin for this lead." />
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Phone</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{lead.phone || 'Not captured'}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Contact Person</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{leadContact(lead)}</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 md:col-span-2">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Source Tags</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {sourceBadges(lead).map((source) => (
                    <StatusBadge key={source} className="border-teal-100 bg-teal-50 text-teal-700">{source}</StatusBadge>
                  ))}
                </div>
              </div>
            </div>
          </Surface>

          <Surface>
            <SectionHeader title="Notes" description="Use notes for internal follow-up, staffing, deposit, or billing remarks." />
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={5} className="field-control mt-5 w-full resize-none" placeholder="Internal notes..." />
            <div className="mt-4 flex justify-end">
              <button onClick={saveNotes} disabled={saving} className="btn-secondary">{saving ? 'Saving...' : 'Save Notes'}</button>
            </div>
          </Surface>

          <Surface>
            <SectionHeader title="WhatsApp Templates" description="Phase 1 opens a prefilled wa.me message and logs the action in Supabase." action={<IconFrame icon={Send} tone="emerald" />} />
            <div className="mt-5 grid grid-cols-2 gap-2">
              {[
                ['inquiry_received', 'Inquiry'],
                ['quotation_sent', 'Quotation'],
                ['form_submitted', 'Form'],
                ['staff_assigned', 'Staff ID'],
                ['deposit_pending', 'Deposit'],
                ['monthly_billing', 'Billing'],
              ].map(([key, label]) => (
                <button key={key} onClick={() => sendMessage(key)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:border-teal-200 hover:text-teal-700">
                  {label}
                </button>
              ))}
            </div>
            <div className="mt-4">
              <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-slate-500">Custom follow-up</label>
              <textarea value={customMessage} onChange={(event) => setCustomMessage(event.target.value)} rows={4} className="field-control w-full resize-none" placeholder="Write a custom follow-up message..." />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button onClick={() => sendMessage('general_follow_up', customMessage || templateText('general_follow_up', lead))} className="btn-primary">
                <Send className="h-4 w-4" /> Send Custom Message
              </button>
              <button onClick={onShowHistory} className="btn-secondary">
                <MessageCircle className="h-4 w-4" /> WhatsApp History
              </button>
              <button onClick={onAssignStaff} className="btn-secondary">
                <IdCard className="h-4 w-4" /> Assign Staff
              </button>
            </div>
          </Surface>

          {error && <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AICRM() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentLead, setAssignmentLead] = useState<Lead | null>(null);
  const [historyLead, setHistoryLead] = useState<Lead | null>(null);
  const [detailsLead, setDetailsLead] = useState<Lead | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [leadRes, empRes] = await Promise.all([
      supabase.from('crm_leads').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
    ]);
    setLeads((leadRes.data || []) as Lead[]);
    setEmployees(((empRes.data || []) as Employee[]).filter((employee) => ['available', 'active', 'assigned'].includes(String(employee.availability_status || 'available'))));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase.channel('ai_crm_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_leads' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'employees' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const grouped = useMemo(() => {
    const base: Record<string, Lead[]> = {};
    CRM_PIPELINE_STAGES.forEach((stage) => { base[stage.id] = []; });
    leads.forEach((lead) => {
      const stage = normalizeCrmStage(lead.stage);
      base[stage].push(lead);
    });
    return base;
  }, [leads]);

  const updateStage = async (lead: Lead, stage: string) => {
    await supabase.from('crm_leads').update({ stage }).eq('id', lead.id);
    fetchData();
  };

  const sendTemplate = async (lead: Lead, templateName: string) => {
    try {
      await openLoggedTemplateMessage(lead, templateName, templateText(templateName, lead), { source: 'ai_crm_template_button' });
      fetchData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to open WhatsApp.');
    }
  };

  const totalValue = leads.reduce((sum, lead) => sum + leadValue(lead), 0);

  return (
    <PageShell>
      {assignmentLead && <StaffAssignmentModal lead={assignmentLead} employees={employees} onClose={() => setAssignmentLead(null)} onAssigned={fetchData} />}
      {historyLead && <WhatsAppHistoryDrawer lead={historyLead} onClose={() => setHistoryLead(null)} />}
      {detailsLead && (
        <LeadDetailsDrawer
          lead={detailsLead}
          onClose={() => setDetailsLead(null)}
          onRefresh={fetchData}
          onShowHistory={() => setHistoryLead(detailsLead)}
          onAssignStaff={() => setAssignmentLead(detailsLead)}
        />
      )}

      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <SectionHeader
            eyebrow="Operations pipeline"
            title="CRM Pipeline Orchestration"
            description="Move inquiries through the full SS Health Care operating pipeline, assign staff, and send client template messages with staff ID card links."
            action={<IconFrame icon={Briefcase} tone="cyan" />}
          />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-2xl font-black text-slate-950">{leads.length}</p><p className="text-xs font-bold text-slate-400">Leads</p></div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-2xl font-black text-slate-950">Rs {totalValue.toLocaleString()}</p><p className="text-xs font-bold text-slate-400">Pipeline</p></div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-2xl font-black text-slate-950">{employees.length}</p><p className="text-xs font-bold text-slate-400">Available Staff</p></div>
          </div>
        </div>
      </Surface>

      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-4 py-2 text-sm font-bold text-slate-700 shadow-sm" style={{ borderColor: 'rgba(0,168,89,0.2)' }}>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Live Supabase Pipeline
        </div>
        <button onClick={fetchData} className="btn-secondary"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</button>
      </div>

      <div className="no-scrollbar flex gap-4 overflow-x-auto pb-4">
        {CRM_PIPELINE_STAGES.map((stage) => (
          <div key={stage.id} className="w-[326px] shrink-0">
            <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200 bg-white/85 px-3 py-2 shadow-sm">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                <span className="truncate text-sm font-black text-slate-700">{stage.label}</span>
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-black text-slate-500">{grouped[stage.id]?.length || 0}</span>
            </div>

            <div className="space-y-3">
              {(grouped[stage.id] || []).map((lead) => (
                <article key={lead.id} className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-black text-slate-950">{leadName(lead)}</h3>
                      <p className="mt-1 truncate text-xs font-semibold text-slate-500">{leadContact(lead)}</p>
                    </div>
                    <StatusBadge className="border-slate-200 bg-slate-50 text-slate-600">{CRM_STAGE_LABELS[normalizeCrmStage(lead.stage)]}</StatusBadge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <StatusBadge className={priorityColors[lead.priority || 'Medium'] || priorityColors.Medium}>{lead.priority || 'Medium'}</StatusBadge>
                    {lead.service_type && <StatusBadge className="border-teal-100 bg-teal-50 text-teal-700">{lead.service_type}</StatusBadge>}
                    {lead.assigned_staff_name && <StatusBadge className="border-blue-100 bg-blue-50 text-blue-700"><UserCheck className="h-3 w-3" /> {lead.assigned_staff_name}</StatusBadge>}
                    {sourceBadges(lead).map((source) => <StatusBadge key={`${lead.id}-${source}`} className="border-slate-200 bg-slate-50 text-slate-600">{source}</StatusBadge>)}
                  </div>

                  <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                    {lead.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {lead.phone}</p>}
                    <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '-'}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-base font-black text-slate-950">Rs {leadValue(lead).toLocaleString()}</span>
                    <select value={normalizeCrmStage(lead.stage)} onChange={(event) => updateStage(lead, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600">
                      {CRM_PIPELINE_STAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                    </select>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setDetailsLead(lead)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><FileText className="mr-1 inline h-3.5 w-3.5" /> View Details</button>
                    <button onClick={() => setAssignmentLead(lead)} className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 hover:bg-teal-100"><IdCard className="mr-1 inline h-3.5 w-3.5" /> Assign Staff</button>
                    <button onClick={() => setHistoryLead(lead)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"><MessageCircle className="mr-1 inline h-3.5 w-3.5" /> WhatsApp History</button>
                    <button onClick={() => sendTemplate(lead, 'quotation_sent')} className="rounded-xl border border-pink-100 bg-pink-50 px-3 py-2 text-xs font-black text-pink-700 hover:bg-pink-100"><FileText className="mr-1 inline h-3.5 w-3.5" /> Quotation</button>
                    <button onClick={() => sendTemplate(lead, 'deposit_pending')} className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 hover:bg-orange-100"><CreditCard className="mr-1 inline h-3.5 w-3.5" /> Deposit</button>
                    <button onClick={() => sendTemplate(lead, 'monthly_billing')} className="rounded-xl border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700 hover:bg-indigo-100"><Send className="mr-1 inline h-3.5 w-3.5" /> Billing</button>
                  </div>

                  {lead.notes && <p className="mt-3 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-500">{lead.notes}</p>}
                  {lead.last_template_sent && <p className="mt-3 text-[11px] font-bold text-slate-400"><CheckCircle2 className="mr-1 inline h-3.5 w-3.5 text-emerald-500" /> Last template: {lead.last_template_sent}</p>}
                </article>
              ))}

              {(grouped[stage.id] || []).length === 0 && <div className="rounded-2xl border border-dashed border-slate-200 bg-white/40 py-7 text-center text-xs font-semibold text-slate-400">No leads in this stage</div>}
            </div>
          </div>
        ))}
      </div>

      <Surface>
        <SectionHeader title="Template Message Layer" description="Current mode opens WhatsApp with a prefilled message and logs the action. Meta WhatsApp Business API can replace this adapter later without changing the CRM workflow." action={<IconFrame icon={Send} tone="emerald" />} />
      </Surface>
    </PageShell>
  );
}
