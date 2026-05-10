import { useCallback, useEffect, useMemo, useState } from 'react';
import { Briefcase, Calendar, CheckCircle2, CreditCard, FileText, IdCard, MessageCircle, MoreHorizontal, Phone, Plus, RefreshCw, Send, UserCheck, Users, X } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import StaffIDCard from '@/components/StaffIDCard';
import type { StaffIDCardEmployee } from '@/components/StaffIDCard';
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
  notes?: string | null;
  tags?: string[] | null;
  created_at?: string;
  last_template_sent?: string | null;
};

type Employee = StaffIDCardEmployee & {
  id: string;
  email?: string | null;
};

type WhatsAppMessage = {
  id: string;
  direction: 'inbound' | 'outbound';
  message_type: string;
  template_name?: string | null;
  content: string;
  status: string;
  created_at: string;
};

const pipelineStages = [
  { id: 'new-lead', label: 'New Lead', color: '#3B82F6' },
  { id: 'new-inquiry', label: 'New Inquiry', color: '#8B5CF6' },
  { id: 'in-discussion', label: 'In Discussion', color: '#F59E0B' },
  { id: 'quotation-sent', label: 'Quotation Sent', color: '#EC4899' },
  { id: 'form-submitted', label: 'Form Submitted', color: '#14B8A6' },
  { id: 'staff-assigned', label: 'Staff Assigned', color: '#0EA5E9' },
  { id: 'deposit-pending', label: 'Deposit Pending', color: '#F97316' },
  { id: 'active-client', label: 'Active Client', color: '#00A859' },
  { id: 'monthly-billing', label: 'Monthly Billing', color: '#6366F1' },
  { id: 'closed-won', label: 'Closed Won', color: '#059669' },
];

const priorityColors: Record<string, string> = {
  'Very High': 'bg-rose-50 text-rose-700 border-rose-100',
  High: 'bg-orange-50 text-orange-700 border-orange-100',
  Medium: 'bg-amber-50 text-amber-700 border-amber-100',
  Low: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

function normalizeStage(stage?: string | null) {
  const raw = String(stage || 'new-lead').trim();
  const fromLabel = pipelineStages.find((s) => s.label.toLowerCase() === raw.toLowerCase());
  if (fromLabel) return fromLabel.id;
  const slug = raw.toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-');
  return pipelineStages.some((s) => s.id === slug) ? slug : 'new-lead';
}

function leadName(lead: Lead) {
  return lead.client_name || lead.company_name || lead.name || 'Unknown Client';
}

function leadContact(lead: Lead) {
  return lead.contact_person || leadName(lead);
}

function leadValue(lead: Lead) {
  return Number(lead.value || lead.deal_value || 0);
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
    case 'deposit_pending':
      return `Namaste ${name} ji, your deposit is pending. Once deposit is completed, we will confirm your service start.`;
    case 'monthly_billing':
      return `Namaste ${name} ji, your monthly bill is ready. Please contact SS Health Care for payment details.`;
    default:
      return `Namaste ${name} ji, this is a follow-up from SS Health Care regarding your home healthcare service.`;
  }
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

      const idCardUrl = absoluteStaffIdUrl((data as any)?.id_card_url || selected.id_card_url);
      const phone = lead.phone || '';
      const content = buildStaffAssignedMessage({
        clientName: leadContact(lead),
        staffName: selected.full_name || selected.username || 'Assigned Staff',
        staffRole: selected.job_title || selected.position || 'Care Specialist',
        idCardUrl,
      });

      if (phone) {
        await logTemplateMessage({
          leadId: lead.id,
          phone,
          templateName: 'staff_assigned',
          content,
          payload: { employee_id: selected.id, id_card_url: idCardUrl },
        });
        const waPhone = toWhatsAppPhone(phone);
        if (waPhone) window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(content)}`, '_blank');
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
            <p className="mt-1 text-sm text-slate-500">The selected staff ID card link will be included in the WhatsApp template message.</p>
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
                      {emp.photo_url ? <img src={emp.photo_url} className="h-full w-full object-cover" alt="" /> : (emp.full_name || 'S').split(' ').map((n) => n[0]).join('').slice(0,2)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-black text-slate-950">{emp.full_name}</p>
                      <p className="truncate text-xs font-bold text-teal-700">{emp.employee_code} · {emp.job_title || emp.position || 'Care Specialist'}</p>
                    </div>
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
            <UserCheck className="h-4 w-4" /> {saving ? 'Assigning…' : 'Assign Staff + Send ID Card Template'}
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
          {loading && <p className="text-sm text-slate-400">Loading conversation…</p>}
          {!loading && !messages.length && <p className="rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-400">No WhatsApp history yet. Send a template from the lead card.</p>}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm ${msg.direction === 'outbound' ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                {msg.template_name && <p className="mb-1 text-[10px] font-black uppercase tracking-widest opacity-70">{msg.template_name}</p>}
                <p className="whitespace-pre-wrap leading-6">{msg.content}</p>
                <p className="mt-2 text-[10px] font-semibold opacity-70">{new Date(msg.created_at).toLocaleString()} · {msg.status}</p>
              </div>
            </div>
          ))}
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

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [leadRes, empRes] = await Promise.all([
      supabase.from('crm_leads').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
    ]);
    setLeads((leadRes.data || []) as Lead[]);
    setEmployees((empRes.data || []) as Employee[]);
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
    pipelineStages.forEach((s) => { base[s.id] = []; });
    leads.forEach((lead) => {
      const stage = normalizeStage(lead.stage);
      if (!base[stage]) base[stage] = [];
      base[stage].push(lead);
    });
    return base;
  }, [leads]);

  const updateStage = async (lead: Lead, stage: string) => {
    await supabase.from('crm_leads').update({ stage }).eq('id', lead.id);
    fetchData();
  };

  const sendTemplate = async (lead: Lead, templateName: string) => {
    if (!lead.phone) return alert('Lead phone number is missing.');
    const content = templateText(templateName, lead);
    await logTemplateMessage({
      leadId: lead.id,
      phone: lead.phone,
      templateName,
      content,
      payload: { source: 'ai_crm_template_button' },
    });
    const waPhone = toWhatsAppPhone(lead.phone);
    if (waPhone) window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(content)}`, '_blank');
    fetchData();
  };

  const totalValue = leads.reduce((sum, lead) => sum + leadValue(lead), 0);

  return (
    <PageShell>
      {assignmentLead && <StaffAssignmentModal lead={assignmentLead} employees={employees} onClose={() => setAssignmentLead(null)} onAssigned={fetchData} />}
      {historyLead && <WhatsAppHistoryDrawer lead={historyLead} onClose={() => setHistoryLead(null)} />}

      <Surface className="bg-gradient-to-br from-white via-green-50/40 to-blue-50/60" style={{ borderColor: 'rgba(0,168,89,0.12)' }}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <SectionHeader
            eyebrow="AI-powered management"
            title="Pipeline Orchestration"
            description="Move inquiries through the full SS Healthcare operating pipeline, assign staff, and send client template messages with staff ID card links."
            action={<IconFrame icon={Briefcase} tone="cyan" />}
          />
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-2xl font-black text-slate-950">{leads.length}</p><p className="text-xs font-bold text-slate-400">Leads</p></div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-2xl font-black text-slate-950">₹{totalValue.toLocaleString()}</p><p className="text-xs font-bold text-slate-400">Pipeline</p></div>
            <div className="rounded-2xl bg-white/80 p-4 shadow-sm"><p className="text-2xl font-black text-slate-950">{employees.length}</p><p className="text-xs font-bold text-slate-400">Staff</p></div>
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
        {pipelineStages.map((stage) => (
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
                    <button className="rounded-lg p-1 text-slate-300 hover:bg-slate-50 hover:text-slate-500"><MoreHorizontal className="h-4 w-4" /></button>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <StatusBadge className={priorityColors[lead.priority || 'Medium'] || priorityColors.Medium}>{lead.priority || 'Medium'}</StatusBadge>
                    {lead.service_type && <StatusBadge className="border-teal-100 bg-teal-50 text-teal-700">{lead.service_type}</StatusBadge>}
                    {lead.assigned_staff_name && <StatusBadge className="border-blue-100 bg-blue-50 text-blue-700"><UserCheck className="h-3 w-3" /> {lead.assigned_staff_name}</StatusBadge>}
                  </div>

                  <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                    {lead.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {lead.phone}</p>}
                    <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}</p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="text-base font-black text-slate-950">₹{leadValue(lead).toLocaleString()}</span>
                    <select value={stage.id} onChange={(e) => updateStage(lead, e.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-600">
                      {pipelineStages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <button onClick={() => setAssignmentLead(lead)} className="rounded-xl border border-teal-100 bg-teal-50 px-3 py-2 text-xs font-black text-teal-700 hover:bg-teal-100"><IdCard className="mr-1 inline h-3.5 w-3.5" /> Assign Staff</button>
                    <button onClick={() => setHistoryLead(lead)} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-600 hover:bg-slate-50"><MessageCircle className="mr-1 inline h-3.5 w-3.5" /> Chat History</button>
                    <button onClick={() => sendTemplate(lead, 'quotation_sent')} className="rounded-xl border border-pink-100 bg-pink-50 px-3 py-2 text-xs font-black text-pink-700 hover:bg-pink-100"><FileText className="mr-1 inline h-3.5 w-3.5" /> Quotation</button>
                    <button onClick={() => sendTemplate(lead, 'deposit_pending')} className="rounded-xl border border-orange-100 bg-orange-50 px-3 py-2 text-xs font-black text-orange-700 hover:bg-orange-100"><CreditCard className="mr-1 inline h-3.5 w-3.5" /> Deposit</button>
                  </div>

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
