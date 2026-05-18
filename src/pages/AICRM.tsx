import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Bot, Briefcase, Calendar, CheckCircle2, ChevronDown, ChevronRight, CreditCard, FileText, IdCard, MessageCircle, Phone, PhoneCall, Plus, RefreshCw, Send, Star, UserCheck, X } from 'lucide-react';
import { IconFrame, PageShell, SectionHeader, StatusBadge, Surface } from '@/components/AppPrimitives';
import StaffIDCard from '@/components/StaffIDCard';
import type { StaffIDCardEmployee } from '@/components/StaffIDCard';
import { CRM_PIPELINE_STAGES, CRM_PIPELINE_VIEW_STAGES, CRM_CLIENT_VIEW_STAGES, CRM_STAGE_LABELS, normalizeCrmStage } from '@/config/crmStages';
import { fetchCallInquiries, markCallAsAddedToPipeline, formatCallDuration, isCallConvertible, type CallInquiry } from '@/lib/domain/callLeads';
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
  const navigate = useNavigate();
  const [crmTab, setCrmTab] = useState<'pipeline' | 'clients' | 'automations' | 'call-leads'>('pipeline');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [callInquiries, setCallInquiries] = useState<CallInquiry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignmentLead, setAssignmentLead] = useState<Lead | null>(null);
  const [historyLead, setHistoryLead] = useState<Lead | null>(null);
  const [detailsLead, setDetailsLead] = useState<Lead | null>(null);
  const [expandedStages, setExpandedStages] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    CRM_PIPELINE_STAGES.forEach((s) => { init[s.id] = true; });
    return init;
  });
  const toggleStage = (id: string) => setExpandedStages((prev) => ({ ...prev, [id]: !prev[id] }));

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [leadRes, empRes, callData] = await Promise.all([
      supabase.from('crm_leads').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      fetchCallInquiries(),
    ]);
    setLeads((leadRes.data || []) as Lead[]);
    setEmployees(((empRes.data || []) as Employee[]).filter((employee) => ['available', 'active', 'assigned'].includes(String(employee.availability_status || 'available'))));
    setCallInquiries(callData);
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
    <div className="p-4 sm:p-6 lg:p-8 h-full flex flex-col">
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

      {/* Page header – exact 99Care match */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-['Plus_Jakarta_Sans']">AI CRM Center</h1>
          <p className="text-slate-500 mt-1">Manage leads, pipelines, and WhatsApp communication workflows.</p>
        </div>

        {/* Module Tabs – 99Care: Pipeline | Clients | AI Auto | Voice AI */}
        <div className="flex items-center p-1 bg-slate-100 rounded-lg shrink-0">
          {([['pipeline','Pipeline'],['clients','Clients'],['automations','AI Auto'],['call-leads','Call Leads']] as const).map(([key, label]) => (
            <button key={key} onClick={() => setCrmTab(key)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${crmTab === key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Live sync bar + action buttons */}
      {(crmTab === 'pipeline' || crmTab === 'clients') && (
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Live Sync Active
          </div>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-sm transition-colors" style={{ background: '#00A859' }}>
              <Plus className="h-4 w-4" /> Add Lead
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
              Export CSV
            </button>
          </div>
        </div>
      )}

      {/* Tab content */}
      {(crmTab === 'pipeline' || crmTab === 'clients') && (
        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {(crmTab === 'pipeline' ? CRM_PIPELINE_VIEW_STAGES : CRM_CLIENT_VIEW_STAGES).map((stage) => {
            const stageLeads = grouped[stage.id] || [];
            const isOpen = expandedStages[stage.id];
            return (
              <div key={stage.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <button onClick={() => toggleStage(stage.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                    <h3 className="font-semibold text-slate-900">{stage.label}</h3>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-xs font-semibold text-slate-600">
                    {stageLeads.length}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-slate-100">
                    {stageLeads.length === 0 ? (
                      <div className="py-8 text-center text-sm text-slate-400">No leads in this stage</div>
                    ) : (
                      <div className="flex gap-4 p-4 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                        {stageLeads.map((lead) => (
                          <div key={lead.id} onClick={() => setDetailsLead(lead)} className="w-[300px] shrink-0 bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-bold text-slate-900 group-hover:text-[#00A859] transition-colors">{leadName(lead)}</h4>
                              <select value={normalizeCrmStage(lead.stage)} onChange={(event) => { event.stopPropagation(); updateStage(lead, event.target.value); }} onClick={(e) => e.stopPropagation()} className="text-xs bg-slate-50 border border-slate-200 text-slate-600 rounded px-1 py-0.5 outline-none focus:ring-1 focus:ring-[#00A859] cursor-pointer">
                                <optgroup label="— Pipeline —">
                                  {CRM_PIPELINE_VIEW_STAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                                </optgroup>
                                <optgroup label="— Clients —">
                                  {CRM_CLIENT_VIEW_STAGES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                                </optgroup>
                              </select>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 mb-2">
                              <span>{leadContact(lead)}</span>
                              <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-sm">₹{leadValue(lead).toLocaleString()}/mo</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border', priorityColors[lead.priority || 'Medium'] || priorityColors.Medium)}>{lead.priority || 'Medium'}</span>
                              {lead.service_type && <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border border-emerald-100 bg-emerald-50 text-emerald-700">{lead.service_type}</span>}
                            </div>
                            <div className="text-xs text-slate-500 space-y-1 mb-3">
                              {lead.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> {lead.phone}</p>}
                              <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {lead.created_at ? new Date(lead.created_at).toLocaleDateString() : '—'}</p>
                            </div>
                            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                              <button onClick={(e) => { e.stopPropagation(); setDetailsLead(lead); }} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><FileText className="mr-1 inline h-3.5 w-3.5" /> Details</button>
                              <button onClick={(e) => { e.stopPropagation(); setAssignmentLead(lead); }} className="rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100"><UserCheck className="mr-1 inline h-3.5 w-3.5" /> Staff</button>
                              <button onClick={(e) => { e.stopPropagation(); setHistoryLead(lead); }} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"><MessageCircle className="mr-1 inline h-3.5 w-3.5" /> WhatsApp</button>
                              <button onClick={(e) => { e.stopPropagation(); sendTemplate(lead, 'quotation_sent'); }} className="rounded-lg border border-amber-100 bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"><Send className="mr-1 inline h-3.5 w-3.5" /> Quote</button>
                            </div>
                            {lead.notes && <p className="mt-2 line-clamp-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">{lead.notes}</p>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {crmTab === 'clients' && (
            <div className="w-[220px] rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-sm text-slate-400 hover:border-slate-300 cursor-pointer transition-colors">
              <Plus className="h-5 w-5 mx-auto mb-2 text-slate-300" />
              + Create a new one
            </div>
          )}
        </div>
      )}

      {crmTab === 'automations' && (
        <div className="flex-1 grid lg:grid-cols-3 gap-6 pb-4">
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-lg">WhatsApp Automation Workflows</h2>
            <p className="text-sm text-slate-500">Post-inquiry automated message sequences.</p>
            {[
              { key: 'greeting', label: 'Auto-Greeting on New Lead', desc: 'Sends a welcome message when a new inquiry is received.', active: true, icon: '🌟' },
              { key: 'quotation', label: 'Auto-Quotation Follow-up', desc: 'Sends quotation link 24h after initial discussion.', active: false, icon: '📋' },
              { key: 'consent', label: 'Consent Form Dispatch', desc: 'Automatically sends consent form after quotation approval.', active: false, icon: '✅' },
            ].map((wf) => (
              <div key={wf.key} className={`p-4 rounded-lg border transition-colors ${wf.active ? 'border-emerald-300 bg-emerald-50' : 'border-slate-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{wf.icon}</span>
                    <h3 className={`font-semibold ${wf.active ? 'text-emerald-700' : 'text-slate-600'}`}>{wf.label}</h3>
                  </div>
                  <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${wf.active ? 'bg-emerald-500' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 shadow-sm transition-all ${wf.active ? 'right-0.5' : 'left-0.5'}`} />
                  </div>
                </div>
                <p className="text-sm text-slate-500">{wf.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-3"><Star className="w-5 h-5 text-amber-500" /> Recent Automations</h3>
            <div className="space-y-3">
              <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                <p className="text-sm text-slate-700">Auto-greeting sent to new lead</p>
                <p className="text-xs text-slate-400 mt-1">2 minutes ago</p>
              </div>
              <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm">
                <p className="text-sm text-slate-500 italic">No more recent activity.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {crmTab === 'call-leads' && (
        <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h2 className="font-semibold text-slate-900 flex items-center gap-2"><PhoneCall className="h-5 w-5" /> Call Leads</h2>
              <p className="text-sm text-slate-500 mt-1">Incoming call inquiries — review and convert qualified calls to CRM leads.</p>
            </div>
            <button className="px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2" style={{ background: '#00A859' }}>
              <Plus className="w-4 h-4" /> Add Manual Call
            </button>
          </div>
          {callInquiries.length === 0 ? (
            <div className="flex-1 p-8 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                <PhoneCall className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">No Call Leads Yet</h3>
              <p className="text-slate-500 max-w-sm">Call logs will appear here when received. Use "Add Manual Call" to create entries, or connect Callyzer for automated sync in Phase 2.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
              {callInquiries.map((call) => (
                <div key={call.id} className="p-5 flex items-start gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Phone className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-bold text-slate-900">{call.caller_name || 'Unknown Caller'}</h4>
                      {call.status === 'added_to_pipeline' && <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">✓ Added to CRM</span>}
                      {call.intent && <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">{call.intent}</span>}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 mb-2">
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {call.caller_phone || '—'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {call.call_date ? new Date(call.call_date).toLocaleString() : '—'}</span>
                      <span>⏱ {formatCallDuration(call.duration_seconds)}</span>
                    </div>
                    {call.summary && <p className="text-sm text-slate-600 mb-2 line-clamp-2">{call.summary}</p>}
                    {call.transcript && <p className="text-xs text-slate-400 bg-slate-50 rounded px-3 py-2 line-clamp-2 mb-2 italic">{call.transcript}</p>}
                  </div>
                  <div className="shrink-0 flex flex-col gap-2 items-end">
                    {isCallConvertible(call) ? (
                      <button
                        onClick={async () => {
                          const { data: newLead, error } = await supabase.from('crm_leads').insert([{
                            full_name: call.caller_name || 'Call Lead',
                            phone: call.caller_phone || '',
                            stage: 'new-lead',
                            source: 'call_lead',
                            notes: `Call summary: ${call.summary || 'N/A'}`,
                            priority: 'Medium',
                          }]).select().single();
                          if (!error && newLead) {
                            await markCallAsAddedToPipeline(call.id, newLead.id);
                            fetchData();
                          }
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5" style={{ background: '#00A859' }}
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to CRM
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-600 font-medium">In Pipeline ✓</span>
                    )}
                    {call.recording_url && (
                      <button className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">▶ Play</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

